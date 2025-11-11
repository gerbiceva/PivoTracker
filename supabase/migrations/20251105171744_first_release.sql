

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


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






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


CREATE OR REPLACE FUNCTION "public"."create_and_link_resident"("p_base_user_id" bigint, "p_room" bigint, "p_phone_number" "text" DEFAULT NULL::"text", "p_birth_date" "date" DEFAULT NULL::"date") RETURNS bigint
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    resident_id bigint;
    existing_resident_id bigint;
BEGIN
    -- Check if the base_user exists
    IF NOT EXISTS (SELECT 1 FROM public.base_users WHERE id = p_base_user_id) THEN
        RAISE EXCEPTION 'Base user with ID % does not exist.', p_base_user_id;
    END IF;

    -- Check if the base_user already has a resident linked
    SELECT resident INTO existing_resident_id FROM public.base_users WHERE id = p_base_user_id;
    IF existing_resident_id IS NOT NULL THEN
        RAISE EXCEPTION 'Base user with ID % already has a resident linked (ID: %).', p_base_user_id, existing_resident_id;
    END IF;

    -- Insert new resident record
    INSERT INTO public.residents (room, phone_number, birth_date, created_at)
    VALUES (p_room, p_phone_number, p_birth_date, now())
    RETURNING id INTO resident_id;

    -- Link the new resident to the base_user
    UPDATE public.base_users
    SET resident = resident_id
    WHERE id = p_base_user_id;

    RETURN resident_id;
END;
$$;


ALTER FUNCTION "public"."create_and_link_resident"("p_base_user_id" bigint, "p_room" bigint, "p_phone_number" "text", "p_birth_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_has_permission"("permission_name" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.permissions p
    JOIN public.permission_types pt ON pt.id = p.permission_type
    JOIN public.base_users bu ON bu.id = p.user_id
    WHERE bu.auth = (SELECT auth.uid())
      AND pt.name = permission_name
  );
$$;


ALTER FUNCTION "public"."current_user_has_permission"("permission_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_reservation_by_id"("p_reservation_id" bigint) RETURNS TABLE("deleted_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Perform the delete operation
    -- Use a subquery to get the count of deleted rows
    RETURN QUERY
    WITH deleted AS (
        DELETE FROM public.reservations
        WHERE id = p_reservation_id
        AND "user_id" = (SELECT "id" FROM "public"."base_users" WHERE "auth" = auth.uid()) -- Re-implement RLS logic here
        RETURNING *
    )
    SELECT count(*)::BIGINT FROM deleted;

END;
$$;


ALTER FUNCTION "public"."delete_reservation_by_id"("p_reservation_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_base_user_id"() RETURNS bigint
    LANGUAGE "plpgsql"
    AS $$
DECLARE
        user_base_id bigint;
    BEGIN
        SELECT bu.id INTO user_base_id
        FROM public.base_users bu
        WHERE bu.auth = (SELECT auth.uid())
        LIMIT 1;
        
        RETURN user_base_id;
    END;
$$;


ALTER FUNCTION "public"."get_current_base_user_id"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_total_summary"("datefrom" timestamp with time zone, "dateto" timestamp with time zone) RETURNS TABLE("total_ordered" numeric, "total_paid" numeric, "total_value" numeric, "total_debt" numeric, "total_beer_count" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH total_data AS (
        SELECT 
            COALESCE(SUM(t.ordered), 0::NUMERIC) AS total_ordered,
            COALESCE(SUM(t.paid), 0::NUMERIC) AS total_paid,
            COALESCE(SUM(i.price * t.ordered::NUMERIC), 0::NUMERIC) AS total_value,
            COALESCE(
                SUM(i.price * t.ordered::NUMERIC) - SUM(t.paid),
                0::NUMERIC
            ) AS total_debt,
            COALESCE(SUM(i.beer_count * t.ordered), 0::BIGINT::NUMERIC) AS total_beer_count
        FROM 
            transactions t
            LEFT JOIN items i ON t.item = i.id
        WHERE 
            t.ordered_at BETWEEN dateFrom AND dateTo
    )
    SELECT 
        total_data.total_ordered,
        total_data.total_paid,
        total_data.total_value,
        total_data.total_debt,
        total_data.total_beer_count 
    FROM 
        total_data;
END;
$$;


ALTER FUNCTION "public"."get_total_summary"("datefrom" timestamp with time zone, "dateto" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_expanded"("p_base_user_id" bigint) RETURNS TABLE("base_user_id" bigint, "created_at" timestamp with time zone, "name" "text", "surname" "text", "room" integer, "phone_number" "text", "date_of_birth" "date", "auth_user_id" "uuid", "auth_email" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        bu.id AS base_user_id,
        bu.created_at,
        bu.name,
        bu.surname,
        r.room::integer,
        r.phone_number,
        r.birth_date::date,
        bu.auth AS auth_user_id,
        au.email::text AS auth_email
    FROM base_users bu
    LEFT JOIN residents r ON bu.resident = r.id
    JOIN auth.users au ON au.id = bu.auth
    WHERE bu.id = p_base_user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_expanded"("p_base_user_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_expanded_from_auth"() RETURNS TABLE("auth_user_id" "uuid", "auth_email" "text", "auth_created_at" timestamp with time zone, "base_user_id" bigint, "base_name" "text", "base_surname" "text", "base_room" integer, "base_phone_number" "text", "base_data_of_birth" "date")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        au.id AS auth_user_id,
        au.email::text AS auth_email,
        au.created_at::timestamptz AS auth_created_at,
        bu.id AS base_user_id,
        bu.name AS base_name,
        bu.surname AS base_surname,
        r.room::integer AS base_room,
        r.phone_number AS base_phone_number,
        r.birth_date::date AS base_data_of_birth
    FROM auth.users au
    JOIN base_users bu ON bu.auth = au.id
    LEFT JOIN residents r ON bu.resident = r.id
    WHERE au.id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."get_user_expanded_from_auth"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_full_details"("p_base_user_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("base_user_id" bigint, "created_at" timestamp with time zone, "name" "text", "surname" "text", "auth_user_id" "uuid", "auth_email" "text", "resident_id" bigint, "room" integer, "birth_date" "date", "phone_number" "text", "permissions" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    target_user_id bigint;
BEGIN
    IF p_base_user_id IS NULL THEN
        SELECT bu.id INTO target_user_id
        FROM public.base_users bu
        WHERE bu.auth = auth.uid();
    ELSE
        target_user_id := p_base_user_id;
    END IF;

    RETURN QUERY
    SELECT
        bu.id AS base_user_id,
        bu.created_at,
        bu.name,
        bu.surname,
        bu.auth AS auth_user_id,
        au.email::text AS auth_email,
        r.id AS resident_id,
        r.room::integer,
        r.birth_date::date,
        r.phone_number,
        ARRAY(
            SELECT pt.name
            FROM public.permissions p
            JOIN public.permission_types pt ON p.permission_type = pt.id
            WHERE p.user_id = bu.id
        ) AS permissions
    FROM public.base_users bu
    LEFT JOIN public.residents r ON bu.resident = r.id
    JOIN auth.users au ON au.id = bu.auth
    WHERE bu.id = target_user_id;
END;
$$;


ALTER FUNCTION "public"."get_user_full_details"("p_base_user_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_permissions"("p_base_user_id" bigint, "p_permission_type_ids" bigint[]) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_user_id bigint;
BEGIN
    -- Get the base_user_id of the user executing this function
    SELECT public.get_current_base_user_id() INTO current_user_id;

    -- Check if the current user has 'MANAGE_PERMISSIONS' permission
    IF NOT public.current_user_has_permission('MANAGE_PERMISSIONS') THEN
        RAISE EXCEPTION 'Insufficient permissions: User does not have MANAGE_PERMISSIONS.';
    END IF;

    -- Delete existing permissions that are not in the provided list
    DELETE FROM public.permissions
    WHERE user_id = p_base_user_id
      AND permission_type NOT IN (SELECT unnest(p_permission_type_ids));

    -- Insert new permissions from the provided list that do not already exist
    INSERT INTO public.permissions (user_id, permission_type, permission_creator)
    SELECT p_base_user_id, pt_id, current_user_id
    FROM unnest(p_permission_type_ids) AS pt_id
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.permissions
        WHERE user_id = p_base_user_id AND permission_type = pt_id
    );
END;
$$;


ALTER FUNCTION "public"."set_user_permissions"("p_base_user_id" bigint, "p_permission_type_ids" bigint[]) OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."base_users" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "surname" "text",
    "auth" "uuid",
    "resident" bigint,
    "invited_by" bigint
);


ALTER TABLE "public"."base_users" OWNER TO "postgres";


ALTER TABLE "public"."base_users" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."base_users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."items" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "beer_count" bigint NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "visible" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" bigint NOT NULL,
    "customer_id" bigint NOT NULL,
    "ordered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ordered" bigint DEFAULT '0'::bigint NOT NULL,
    "paid" numeric(10,2) NOT NULL,
    "minister" "uuid" NOT NULL,
    "item" "uuid"
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."everything" AS
 SELECT "bu"."id" AS "user_id",
    (COALESCE(NULLIF("bu"."name", ''::"text"), ''::"text") ||
        CASE
            WHEN (("bu"."surname" IS NOT NULL) AND ("bu"."surname" <> ''::"text")) THEN (' '::"text" || "bu"."surname")
            ELSE ''::"text"
        END) AS "fullname",
    "t"."ordered_at",
    "t"."ordered",
    "t"."paid",
    "i"."name" AS "item_name",
    "i"."price" AS "item_price"
   FROM (("public"."base_users" "bu"
     LEFT JOIN "public"."transactions" "t" ON (("bu"."id" = "t"."customer_id")))
     LEFT JOIN "public"."items" "i" ON (("t"."item" = "i"."id")));


ALTER VIEW "public"."everything" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."everything_sum" AS
 WITH "customer_totals" AS (
         SELECT "b"."id",
            "b"."name",
            "b"."surname",
            "sum"(("i"."beer_count" * "t"."ordered")) AS "total_ordered",
            "sum"("t"."paid") AS "total_paid",
            "sum"(("i"."price" * ("t"."ordered")::numeric)) AS "total_value"
           FROM (("public"."base_users" "b"
             LEFT JOIN "public"."transactions" "t" ON (("b"."id" = "t"."customer_id")))
             LEFT JOIN "public"."items" "i" ON (("t"."item" = "i"."id")))
          GROUP BY "b"."id", "b"."name", "b"."surname"
        )
 SELECT "id",
    "name",
    "surname",
    "total_ordered",
    "total_paid",
    "total_value",
    ("total_value" - "total_paid") AS "total_difference"
   FROM "customer_totals";


ALTER VIEW "public"."everything_sum" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gerba_storage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "minister" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "beer_count" bigint NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."gerba_storage" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."monthly_summary" AS
 WITH "all_months" AS (
         SELECT "date_trunc"('month'::"text", "t"."ordered_at") AS "month_start",
            COALESCE("sum"(("t"."ordered" * "i"."beer_count")), (0)::numeric) AS "total_ordered",
            COALESCE("sum"("t"."paid"), (0)::numeric) AS "total_paid",
            COALESCE("sum"(("i"."price" * ("t"."ordered")::numeric)), (0)::numeric) AS "total_value"
           FROM ("public"."transactions" "t"
             LEFT JOIN "public"."items" "i" ON (("t"."item" = "i"."id")))
          GROUP BY ("date_trunc"('month'::"text", "t"."ordered_at"))
        )
 SELECT "month_start",
    "total_ordered",
    "total_paid",
    "total_value"
   FROM "all_months";


ALTER VIEW "public"."monthly_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."named_transactions" AS
 WITH "all_transactions" AS (
         SELECT "t"."id",
            "t"."customer_id",
            "t"."ordered_at",
            "t"."ordered",
            "t"."paid",
            (("bu"."name" || ' '::"text") || "bu"."surname") AS "fullname",
            "i"."name" AS "item_name",
            "i"."price" AS "item_price",
            "i"."beer_count" AS "item_beer_count",
            ("i"."price" * ("t"."ordered")::numeric) AS "value",
            (("i"."price" * ("t"."ordered")::numeric) - ("t"."paid")::numeric) AS "owed"
           FROM (("public"."transactions" "t"
             LEFT JOIN "public"."base_users" "bu" ON (("t"."customer_id" = "bu"."id")))
             LEFT JOIN "public"."items" "i" ON (("t"."item" = "i"."id")))
        )
 SELECT "id",
    "fullname",
    "customer_id",
    "ordered_at",
    "ordered",
    "paid",
    "item_name",
    "item_price",
    "item_beer_count",
    "value",
    "owed"
   FROM "all_transactions";


ALTER VIEW "public"."named_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permission_types" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."permission_types" OWNER TO "postgres";


ALTER TABLE "public"."permission_types" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."permission_types_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" bigint,
    "permission_type" bigint,
    "permission_creator" bigint
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


ALTER TABLE "public"."permissions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."permissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



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



CREATE TABLE IF NOT EXISTS "public"."residents" (
    "id" bigint NOT NULL,
    "room" bigint NOT NULL,
    "birth_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "phone_number" "text",
    CONSTRAINT "residents_phone_number_check" CHECK (("length"("phone_number") < 20))
);


ALTER TABLE "public"."residents" OWNER TO "postgres";


ALTER TABLE "public"."residents" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."residents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."total_summary" AS
 WITH "total_data" AS (
         SELECT COALESCE("sum"("t"."ordered"), (0)::numeric) AS "total_ordered",
            COALESCE("sum"("t"."paid"), (0)::numeric) AS "total_paid",
            COALESCE("sum"(("i"."price" * ("t"."ordered")::numeric)), (0)::numeric) AS "total_value",
            COALESCE(("sum"(("i"."price" * ("t"."ordered")::numeric)) - "sum"("t"."paid")), (0)::numeric) AS "total_debt",
            COALESCE("sum"(("i"."beer_count" * "t"."ordered")), ((0)::bigint)::numeric) AS "total_beer_count"
           FROM ("public"."transactions" "t"
             LEFT JOIN "public"."items" "i" ON (("t"."item" = "i"."id")))
        )
 SELECT "total_ordered",
    "total_paid",
    "total_value",
    "total_debt",
    "total_beer_count"
   FROM "total_data";


ALTER VIEW "public"."total_summary" OWNER TO "postgres";


ALTER TABLE "public"."transactions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."transactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."user_permissions_view" AS
 SELECT "p"."id" AS "permission_id",
    "p"."user_id",
    "p"."created_at",
    "p"."permission_creator",
    "pt"."id" AS "permission_type_id",
    "pt"."name" AS "permission_name",
    "pt"."display_name" AS "permission_display_name"
   FROM ("public"."permissions" "p"
     JOIN "public"."permission_types" "pt" ON (("p"."permission_type" = "pt"."id")));


ALTER VIEW "public"."user_permissions_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_view" AS
 SELECT "bu"."id" AS "base_user_id",
    "bu"."created_at",
    "bu"."name",
    "bu"."surname",
    "bu"."auth" AS "auth_user_id",
    "au"."email" AS "auth_email",
    "r"."id" AS "resident_id",
    "r"."room",
    "r"."birth_date",
    "r"."phone_number"
   FROM (("public"."base_users" "bu"
     LEFT JOIN "public"."residents" "r" ON (("bu"."resident" = "r"."id")))
     JOIN "auth"."users" "au" ON (("au"."id" = "bu"."auth")));


ALTER VIEW "public"."user_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."washing_machines" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."washing_machines" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."washing_machines_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."washing_machines_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."washing_machines_id_seq" OWNED BY "public"."washing_machines"."id";



CREATE OR REPLACE VIEW "public"."weekly_summary" AS
 WITH "all_weeks" AS (
         SELECT "date_trunc"('week'::"text", "t"."ordered_at") AS "week_start",
            COALESCE("sum"(("t"."ordered" * "i"."beer_count")), (0)::numeric) AS "total_ordered",
            COALESCE("sum"("t"."paid"), (0)::numeric) AS "total_paid",
            COALESCE("sum"(("i"."price" * ("t"."ordered")::numeric)), (0)::numeric) AS "total_value"
           FROM ("public"."transactions" "t"
             LEFT JOIN "public"."items" "i" ON (("t"."item" = "i"."id")))
          GROUP BY ("date_trunc"('week'::"text", "t"."ordered_at"))
        )
 SELECT "week_start",
    "total_ordered",
    "total_paid",
    "total_value"
   FROM "all_weeks";


ALTER VIEW "public"."weekly_summary" OWNER TO "postgres";


ALTER TABLE ONLY "public"."reservations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."reservations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."washing_machines" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."washing_machines_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."base_users"
    ADD CONSTRAINT "base_user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gerba_storage"
    ADD CONSTRAINT "nabava_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permission_types"
    ADD CONSTRAINT "permission_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_machine_id_slot_excl" EXCLUDE USING "gist" ("machine_id" WITH =, "slot" WITH &&);



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."residents"
    ADD CONSTRAINT "residents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "unique_user_permission" UNIQUE ("user_id", "permission_type");



ALTER TABLE ONLY "public"."washing_machines"
    ADD CONSTRAINT "washing_machines_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."washing_machines"
    ADD CONSTRAINT "washing_machines_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_reservations_machine_lower_slot" ON "public"."reservations" USING "btree" ("machine_id", "lower"("slot"));



ALTER TABLE ONLY "public"."base_users"
    ADD CONSTRAINT "base_user_auth_fkey" FOREIGN KEY ("auth") REFERENCES "auth"."users"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."base_users"
    ADD CONSTRAINT "base_users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."base_users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."base_users"
    ADD CONSTRAINT "base_users_resident_fkey" FOREIGN KEY ("resident") REFERENCES "public"."residents"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_permission_creator_fkey" FOREIGN KEY ("permission_creator") REFERENCES "public"."base_users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_permission_type_fkey" FOREIGN KEY ("permission_type") REFERENCES "public"."permission_types"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gerba_storage"
    ADD CONSTRAINT "public_nabava_minister_fkey" FOREIGN KEY ("minister") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "public"."washing_machines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."base_users"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_item_fkey" FOREIGN KEY ("item") REFERENCES "public"."items"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE "public"."base_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "base_users_delete_manage_users" ON "public"."base_users" FOR DELETE TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_USERS'::"text"));



CREATE POLICY "base_users_insert_enroll" ON "public"."base_users" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_permission"('ENROLL'::"text"));



CREATE POLICY "base_users_select_manage_users" ON "public"."base_users" FOR SELECT TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_USERS'::"text"));



CREATE POLICY "base_users_select_own" ON "public"."base_users" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND ("auth" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "base_users_update_manage_users" ON "public"."base_users" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_USERS'::"text")) WITH CHECK ("public"."current_user_has_permission"('MANAGE_USERS'::"text"));



ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "items_manage_by_manage_items" ON "public"."items" TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_ITEMS'::"text"));



CREATE POLICY "items_select_for_all_authenticated" ON "public"."items" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."permission_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "permissions_delete_managers" ON "public"."permissions" FOR DELETE TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_PERMISSIONS'::"text"));



CREATE POLICY "permissions_insert_managers" ON "public"."permissions" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_permission"('MANAGE_PERMISSIONS'::"text"));



CREATE POLICY "permissions_select_managers" ON "public"."permissions" FOR SELECT TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_PERMISSIONS'::"text"));



ALTER TABLE "public"."reservations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reservations_delete_own_rows" ON "public"."reservations" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "base_users"."id"
   FROM "public"."base_users"
  WHERE ("base_users"."auth" = "auth"."uid"()))));



CREATE POLICY "reservations_insert_by_can_wash" ON "public"."reservations" FOR INSERT TO "authenticated" WITH CHECK (("public"."current_user_has_permission"('CAN_WASH'::"text") AND ("user_id" = ( SELECT "base_users"."id"
   FROM "public"."base_users"
  WHERE ("base_users"."auth" = "auth"."uid"())))));



CREATE POLICY "reservations_select_by_can_wash" ON "public"."reservations" FOR SELECT TO "authenticated" USING ("public"."current_user_has_permission"('CAN_WASH'::"text"));



ALTER TABLE "public"."residents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "residents_delete_manage_users" ON "public"."residents" FOR DELETE TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_USERS'::"text"));



CREATE POLICY "residents_insert_enroll_resident" ON "public"."residents" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_permission"('ENROLL_RESIDENT'::"text"));



CREATE POLICY "residents_select_own" ON "public"."residents" FOR SELECT TO "authenticated" USING (("public"."current_user_has_permission"('ENROLL_RESIDENT'::"text") OR ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."base_users" "bu"
  WHERE (("bu"."resident" = "residents"."id") AND ("bu"."auth" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "residents_update_manage_users" ON "public"."residents" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_USERS'::"text")) WITH CHECK ("public"."current_user_has_permission"('MANAGE_USERS'::"text"));



ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transactions_manage_by_manage_transactions" ON "public"."transactions" TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_TRANSACTIONS'::"text"));



CREATE POLICY "transactions_viewable_by_user" ON "public"."transactions" FOR SELECT TO "authenticated" USING (("customer_id" = ( SELECT "base_users"."id"
   FROM "public"."base_users"
  WHERE ("base_users"."auth" = "auth"."uid"()))));



ALTER TABLE "public"."washing_machines" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "washing_machines_select_authenticated" ON "public"."washing_machines" FOR SELECT TO "authenticated" USING (true);


ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."add_reservation_with_range"("p_machine_id" integer, "p_slot_start" timestamp with time zone, "p_slot_end" timestamp with time zone, "p_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_reservation_with_range"("p_machine_id" integer, "p_slot_start" timestamp with time zone, "p_slot_end" timestamp with time zone, "p_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_reservation_with_range"("p_machine_id" integer, "p_slot_start" timestamp with time zone, "p_slot_end" timestamp with time zone, "p_note" "text") TO "service_role";


GRANT ALL ON FUNCTION "public"."create_and_link_resident"("p_base_user_id" bigint, "p_room" bigint, "p_phone_number" "text", "p_birth_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."create_and_link_resident"("p_base_user_id" bigint, "p_room" bigint, "p_phone_number" "text", "p_birth_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_and_link_resident"("p_base_user_id" bigint, "p_room" bigint, "p_phone_number" "text", "p_birth_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_has_permission"("permission_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_has_permission"("permission_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_has_permission"("permission_name" "text") TO "service_role";


GRANT ALL ON FUNCTION "public"."delete_reservation_by_id"("p_reservation_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."delete_reservation_by_id"("p_reservation_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_reservation_by_id"("p_reservation_id" bigint) TO "service_role";


GRANT ALL ON FUNCTION "public"."get_current_base_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_base_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_base_user_id"() TO "service_role";


GRANT ALL ON FUNCTION "public"."get_reservations_for_user"("p_base_user_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_reservations_for_user"("p_base_user_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_reservations_for_user"("p_base_user_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_reservations_week"("p_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_reservations_week"("p_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_reservations_week"("p_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_slots_for_day"("p_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_slots_for_day"("p_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_slots_for_day"("p_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_total_summary"("datefrom" timestamp with time zone, "dateto" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_total_summary"("datefrom" timestamp with time zone, "dateto" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_total_summary"("datefrom" timestamp with time zone, "dateto" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_expanded"("p_base_user_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_expanded"("p_base_user_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_expanded"("p_base_user_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_expanded_from_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_expanded_from_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_expanded_from_auth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_full_details"("p_base_user_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_full_details"("p_base_user_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_full_details"("p_base_user_id" bigint) TO "service_role";


GRANT ALL ON FUNCTION "public"."set_user_permissions"("p_base_user_id" bigint, "p_permission_type_ids" bigint[]) TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_permissions"("p_base_user_id" bigint, "p_permission_type_ids" bigint[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_permissions"("p_base_user_id" bigint, "p_permission_type_ids" bigint[]) TO "service_role";


GRANT ALL ON FUNCTION "public"."slot_range_from_date_index"("p_date" "date", "p_slot_index" integer, "p_tz" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."slot_range_from_date_index"("p_date" "date", "p_slot_index" integer, "p_tz" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."slot_range_from_date_index"("p_date" "date", "p_slot_index" integer, "p_tz" "text") TO "service_role";


GRANT ALL ON TABLE "public"."base_users" TO "anon";
GRANT ALL ON TABLE "public"."base_users" TO "authenticated";
GRANT ALL ON TABLE "public"."base_users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."base_users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."base_users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."base_users_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."everything" TO "anon";
GRANT ALL ON TABLE "public"."everything" TO "authenticated";
GRANT ALL ON TABLE "public"."everything" TO "service_role";



GRANT ALL ON TABLE "public"."everything_sum" TO "anon";
GRANT ALL ON TABLE "public"."everything_sum" TO "authenticated";
GRANT ALL ON TABLE "public"."everything_sum" TO "service_role";



GRANT ALL ON TABLE "public"."gerba_storage" TO "anon";
GRANT ALL ON TABLE "public"."gerba_storage" TO "authenticated";
GRANT ALL ON TABLE "public"."gerba_storage" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_summary" TO "anon";
GRANT ALL ON TABLE "public"."monthly_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_summary" TO "service_role";



GRANT ALL ON TABLE "public"."named_transactions" TO "anon";
GRANT ALL ON TABLE "public"."named_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."named_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."permission_types" TO "anon";
GRANT ALL ON TABLE "public"."permission_types" TO "authenticated";
GRANT ALL ON TABLE "public"."permission_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."permission_types_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."permission_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."permission_types_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."permissions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."reservations" TO "anon";
GRANT ALL ON TABLE "public"."reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."reservations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."reservations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reservations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reservations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."residents" TO "anon";
GRANT ALL ON TABLE "public"."residents" TO "authenticated";
GRANT ALL ON TABLE "public"."residents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."residents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."residents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."residents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."total_summary" TO "anon";
GRANT ALL ON TABLE "public"."total_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."total_summary" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_permissions_view" TO "anon";
GRANT ALL ON TABLE "public"."user_permissions_view" TO "authenticated";
GRANT ALL ON TABLE "public"."user_permissions_view" TO "service_role";



GRANT ALL ON TABLE "public"."user_view" TO "anon";
GRANT ALL ON TABLE "public"."user_view" TO "authenticated";
GRANT ALL ON TABLE "public"."user_view" TO "service_role";



GRANT ALL ON TABLE "public"."washing_machines" TO "anon";
GRANT ALL ON TABLE "public"."washing_machines" TO "authenticated";
GRANT ALL ON TABLE "public"."washing_machines" TO "service_role";



GRANT ALL ON SEQUENCE "public"."washing_machines_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."washing_machines_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."washing_machines_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_summary" TO "anon";
GRANT ALL ON TABLE "public"."weekly_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_summary" TO "service_role";









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































--
-- Dumped schema changes for auth and storage
--

