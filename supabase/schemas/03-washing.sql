SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pgsodium";
CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE TYPE "public"."reservation_info" AS (
	"reservation_id" bigint,
	"user_id" "uuid",
	"user_email" "text",
	"note" "text"
);
ALTER TYPE "public"."reservation_info" OWNER TO "postgres";

CREATE TYPE "public"."slot_info" AS (
	"time_start_utc" timestamp without time zone,
	"time_end_utc" timestamp without time zone,
	"is_empty" boolean,
	"reservation" "public"."reservation_info"
);
ALTER TYPE "public"."slot_info" OWNER TO "postgres";

CREATE TYPE "public"."machine_info" AS (
	"id" integer,
	"name" "text",
	"slots" "public"."slot_info"[]
);
ALTER TYPE "public"."machine_info" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."add_reservation_with_range"("p_machine_id" integer, "p_slot_start" timestamp with time zone, "p_slot_end" timestamp with time zone, "p_note" "text" DEFAULT NULL::"text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    slot_start_utc TIMESTAMPTZ;
    slot_end_utc TIMESTAMPTZ;
    current_user_uuid UUID;
    current_user_id BIGINT;
    inserted_id BIGINT;
BEGIN
    -- Get the current authenticated user's UUID from Supabase Auth
    current_user_uuid := auth.uid();

    -- Resolve the bigint user_id from base_users using auth_user_id
    SELECT id INTO current_user_id
    FROM base_users
    WHERE auth = current_user_uuid;

    -- Ensure the user exists
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found in base_users table';
    END IF;

    -- Quantize start to whole hour (floor)
    slot_start_utc := date_trunc('hour', p_slot_start);

    -- Quantize end to whole hour (ceil)
    IF date_trunc('hour', p_slot_end) = p_slot_end THEN
        slot_end_utc := p_slot_end;
    ELSE
        slot_end_utc := date_trunc('hour', p_slot_end) + INTERVAL '1 hour';
    END IF;

    -- Insert reservation using the bigint user_id
    INSERT INTO reservations (machine_id, user_id, slot, note)
    VALUES (p_machine_id, current_user_id, tstzrange(slot_start_utc, slot_end_utc, '[)'), p_note)
    RETURNING id INTO inserted_id;

    RETURN inserted_id;
END;
$$;
ALTER FUNCTION "public"."add_reservation_with_range"("p_machine_id" integer, "p_slot_start" timestamp with time zone, "p_slot_end" timestamp with time zone, "p_note" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_reservations_for_user"("p_base_user_id" bigint) RETURNS TABLE("reservation_id" bigint, "machine_id" integer, "machine_name" "text", "slot_start_utc" timestamp with time zone, "slot_end_utc" timestamp with time zone, "note" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id AS reservation_id,
        wm.id AS machine_id,
        wm.name AS machine_name,
        lower(r.slot) AS slot_start_utc,
        upper(r.slot) AS slot_end_utc,
        r.note
    FROM reservations r
    JOIN washing_machines wm ON wm.id = r.machine_id
    WHERE r.user_id = p_base_user_id
    ORDER BY lower(r.slot) ASC;
END;
$$;
ALTER FUNCTION "public"."get_reservations_for_user"("p_base_user_id" bigint) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_reservations_week"("p_date" timestamp with time zone) RETURNS TABLE("reservation_id" bigint, "machine_id" integer, "machine_name" "text", "user_id" "uuid", "created_at" timestamp with time zone, "name" "text", "surname" "text", "room" integer, "phone_number" "text", "date_of_birth" "date", "auth_user_id" "uuid", "slot_start_utc" timestamp without time zone, "slot_end_utc" timestamp without time zone, "slot_index_local" integer, "note" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.machine_id,
        wm.name as machine_name,
        bu.auth AS user_id,
        bu.created_at,
        bu.name,
        bu.surname,
        res.room::integer,
        res.phone_number,
        res.birth_date::date AS date_of_birth,
        bu.auth AS auth_user_id,
        lower(r.slot) AT TIME ZONE 'UTC' AS slot_start_utc,
        upper(r.slot) AT TIME ZONE 'UTC' AS slot_end_utc,
        ((date_part('hour', lower(r.slot) AT TIME ZONE 'Europe/Ljubljana')::int / 3) + 1) AS slot_index_local,
        r.note
    FROM reservations r
    JOIN washing_machines wm ON wm.id = r.machine_id
    LEFT JOIN base_users bu ON bu.id = r.user_id
    LEFT JOIN residents res ON bu.resident = res.id
    WHERE lower(r.slot) >= p_date
      AND lower(r.slot) < p_date + interval '7 days'
    ORDER BY lower(r.slot);
END;
$$;
ALTER FUNCTION "public"."get_reservations_week"("p_date" timestamp with time zone) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_slots_for_day"("p_date" timestamp with time zone) RETURNS TABLE("machine_id" integer, "machine_name" "text", "slot_start_utc" timestamp with time zone, "slot_end_utc" timestamp with time zone, "slot_index_local" integer, "is_empty" boolean, "reservation_id" bigint, "user_id" "uuid", "created_at" timestamp with time zone, "first_name" "text", "surname" "text", "room" integer, "phone_number" "text", "date_of_birth" "date", "auth_user_id" "uuid", "note" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH slot_definitions AS (
        SELECT generate_series(0, 7) AS slot_index_local
    ),
    machines AS (
        SELECT id, name FROM washing_machines
    ),
    slots AS (
        SELECT
            m.id AS machine_id,
            m.name AS machine_name,
            s.slot_index_local,
            -- keep TIMESTAMPTZ: cast the final value
            (
                date_trunc('day', p_date AT TIME ZONE 'Europe/Ljubljana')
                + (s.slot_index_local * INTERVAL '3 hours')
            ) AT TIME ZONE 'Europe/Ljubljana' AS slot_start_utc,
            (
                date_trunc('day', p_date AT TIME ZONE 'Europe/Ljubljana')
                + ((s.slot_index_local + 1) * INTERVAL '3 hours')
            ) AT TIME ZONE 'Europe/Ljubljana' AS slot_end_utc
        FROM slot_definitions s
        CROSS JOIN machines m
    )
    SELECT
        sl.machine_id,
        sl.machine_name,
        sl.slot_start_utc,
        sl.slot_end_utc,
        sl.slot_index_local + 1,
        r.id IS NULL,
        r.id,
        bu.auth AS user_id,
        bu.created_at,
        bu.name AS first_name,
        bu.surname,
        res.room::integer,
        res.phone_number,
        res.birth_date::date AS date_of_birth,
        bu.auth AS auth_user_id,
        r.note
    FROM slots sl
    LEFT JOIN reservations r
           ON r.machine_id = sl.machine_id
          AND lower(r.slot) = sl.slot_start_utc
    LEFT JOIN base_users bu
           ON bu.id = r.user_id
    LEFT JOIN residents res ON bu.resident = res.id
    ORDER BY sl.machine_id, sl.slot_start_utc;
END;
$$;
ALTER FUNCTION "public"."get_slots_for_day"("p_date" timestamp with time zone) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."slot_range_from_date_index"("p_date" "date", "p_slot_index" integer, "p_tz" "text" DEFAULT NULL::"text") RETURNS "tstzrange"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    start_ts TIMESTAMP;
    start_tz TIMESTAMPTZ;
    end_tz TIMESTAMPTZ;
BEGIN
    IF p_slot_index < 1 OR p_slot_index > 6 THEN
        RAISE EXCEPTION 'slot_index must be between 1 and 6';
    END IF;

    -- compute start as date + (slot_index-1)*4 hours (timestamp without tz)
    start_ts := (p_date::timestamp + ( (p_slot_index - 1) * INTERVAL '4 hours' ));

    IF p_tz IS NULL OR length(trim(p_tz)) = 0 THEN
        -- cast to timestamptz using session timezone
        start_tz := start_ts::timestamptz;
    ELSE
        -- interpret start_ts as time in p_tz, convert to timestamptz
        -- (timestamp without tz) AT TIME ZONE zone -> timestamptz
        start_tz := start_ts AT TIME ZONE p_tz;
    END IF;

    end_tz := start_tz + INTERVAL '4 hours';

    RETURN tstzrange(start_tz, end_tz, '[)');
END;
$$;
ALTER FUNCTION "public"."slot_range_from_date_index"("p_date" "date", "p_slot_index" integer, "p_tz" "text") OWNER TO "postgres";

SET default_tablespace = '';
SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."reservations" (
    "id" bigint NOT NULL,
    "machine_id" integer NOT NULL,
    "slot" "tstzrange" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "note" "text",
    "user_id" bigint
);
ALTER TABLE "public"."reservations" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."reservations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE "public"."reservations_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."reservations_id_seq" OWNED BY "public"."reservations"."id";

CREATE TABLE IF NOT EXISTS "public"."washing_machines" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "description" "text"
);
ALTER TABLE "public"."washing_machines" OWNER TO "postgres";
CREATE SEQUENCE IF NOT EXISTS "public"."washing_machines_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE "public"."washing_machines_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."washing_machines_id_seq" OWNED BY "public"."washing_machines"."id";

ALTER TABLE ONLY "public"."reservations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."reservations_id_seq"'::"regclass");
ALTER TABLE ONLY "public"."washing_machines" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."washing_machines_id_seq"'::"regclass");

ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_machine_id_slot_excl" EXCLUDE USING "gist" ("machine_id" WITH =, "slot" WITH &&);
ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."washing_machines"
    ADD CONSTRAINT "washing_machines_name_key" UNIQUE ("name");
ALTER TABLE ONLY "public"."washing_machines"
    ADD CONSTRAINT "washing_machines_pkey" PRIMARY KEY ("id");

CREATE INDEX "idx_reservations_machine_lower_slot" ON "public"."reservations" USING "btree" ("machine_id", "lower"("slot"));

ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "public"."washing_machines"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id");

ALTER TABLE "public"."washing_machines" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "washing_machines_select_authenticated" ON "public"."washing_machines" FOR SELECT TO "authenticated" USING (true);

GRANT ALL ON FUNCTION "public"."add_reservation_with_range"("p_machine_id" integer, "p_slot_start" timestamp with time zone, "p_slot_end" timestamp with time zone, "p_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_reservation_with_range"("p_machine_id" integer, "p_slot_start" timestamp with time zone, "p_slot_end" timestamp with time zone, "p_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_reservation_with_range"("p_machine_id" integer, "p_slot_start" timestamp with time zone, "p_slot_end" timestamp with time zone, "p_note" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_reservations_for_user"("p_base_user_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_reservations_for_user"("p_base_user_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_reservations_for_user"("p_base_user_id" bigint) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_reservations_week"("p_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_reservations_week"("p_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_reservations_week"("p_date" timestamp with time zone) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_slots_for_day"("p_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_slots_for_day"("p_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_slots_for_day"("p_date" timestamp with time zone) TO "service_role";

GRANT ALL ON FUNCTION "public"."slot_range_from_date_index"("p_date" "date", "p_slot_index" integer, "p_tz" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."slot_range_from_date_index"("p_date" "date", "p_slot_index" integer, "p_tz" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."slot_range_from_date_index"("p_date" "date", "p_slot_index" integer, "p_tz" "text") TO "service_role";

ALTER TABLE "public"."reservations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservations_insert_by_can_wash" ON "public"."reservations" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_permission"('CAN_WASH'::"text") AND "user_id" = (SELECT "id" FROM "public"."base_users" WHERE "auth" = auth.uid()));
CREATE POLICY "reservations_delete_own_rows" ON "public"."reservations" FOR DELETE TO "authenticated" USING ("user_id" = (SELECT "id" FROM "public"."base_users" WHERE "auth" = auth.uid()));

GRANT ALL ON TABLE "public"."reservations" TO "anon";
GRANT ALL ON TABLE "public"."reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."reservations" TO "service_role";
GRANT ALL ON SEQUENCE "public"."reservations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reservations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reservations_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."washing_machines" TO "anon";
GRANT ALL ON TABLE "public"."washing_machines" TO "authenticated";
GRANT ALL ON TABLE "public"."washing_machines" TO "service_role";
GRANT ALL ON SEQUENCE "public"."washing_machines_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."washing_machines_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."washing_machines_id_seq" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";

RESET ALL;
