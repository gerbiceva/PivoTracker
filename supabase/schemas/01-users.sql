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

CREATE OR REPLACE FUNCTION "public"."get_current_base_user_id"() RETURNS bigint
    LANGUAGE "plpgsql" SECURITY INVOKER
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

GRANT ALL ON FUNCTION "public"."get_current_base_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_base_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_base_user_id"() TO "service_role";

CREATE OR REPLACE FUNCTION "public"."get_user_full_details"("p_base_user_id" bigint) RETURNS TABLE(
    "base_user_id" bigint,
    "created_at" timestamp with time zone,
    "name" text,
    "surname" text,
    "auth_user_id" uuid,
    "auth_email" text,
    "resident_id" bigint,
    "room" integer,
    "birth_date" date,
    "phone_number" text,
    "permissions" text[]
)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
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
    WHERE bu.id = p_base_user_id;
END;
$$;
ALTER FUNCTION "public"."get_user_full_details"("p_base_user_id" bigint) OWNER TO "postgres";

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
COMMENT ON TABLE "public"."base_users" IS 'Basic authenticated user, where all users are stored.';
ALTER TABLE "public"."base_users" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."base_user_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

-- The gerba_user table is being removed as per the task.
-- CREATE TABLE IF NOT EXISTS "public"."gerba_user" (
--     "id" bigint NOT NULL,
--     "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
--     "first_name" "text" NOT NULL,
--     "surname" "text" NOT NULL,
--     "room" integer NOT NULL,
--     "phone_number" "text",
--     "date_of_birth" "date",
--     "auth_user_id" "uuid"
-- );
-- ALTER TABLE "public"."gerba_user" OWNER TO "postgres";
-- COMMENT ON TABLE "public"."gerba_user" IS 'User that is a resident in gerbiceva. holds additional gerba specific info';
-- ALTER TABLE "public"."gerba_user" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
--     SEQUENCE NAME "public"."gerba_user_id_seq"
--     START WITH 1
--     INCREMENT BY 1
--     NO MINVALUE
--     NO MAXVALUE
--     CACHE 1
-- );

CREATE TABLE IF NOT EXISTS "public"."permission_types" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" DEFAULT ''::"text" NOT NULL
);
ALTER TABLE "public"."permission_types" OWNER TO "postgres";
COMMENT ON TABLE "public"."permission_types" IS 'Types of permissions a user can have.';
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

ALTER TABLE ONLY "public"."base_users"
    ADD CONSTRAINT "base_user_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."permission_types"
    ADD CONSTRAINT "permission_types_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."residents"
    ADD CONSTRAINT "residents_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."base_users"
    ADD CONSTRAINT "base_user_auth_fkey" FOREIGN KEY ("auth") REFERENCES "auth"."users"("id") ON UPDATE CASCADE;
ALTER TABLE ONLY "public"."base_users"
    ADD CONSTRAINT "base_users_resident_fkey" FOREIGN KEY ("resident") REFERENCES "public"."residents"("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY "public"."base_users"
    ADD CONSTRAINT "base_users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."base_users"("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_permission_type_fkey" FOREIGN KEY ("permission_type") REFERENCES "public"."permission_types"("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."base_users"("id") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_permission_creator_fkey" FOREIGN KEY ("permission_creator") REFERENCES "public"."base_users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "public"."base_users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "base_users_delete_manage_users" ON "public"."base_users" FOR DELETE TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_USERS'::"text"));
CREATE POLICY "base_users_insert_enroll" ON "public"."base_users" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_permission"('ENROLL'::"text"));
CREATE POLICY "base_users_select_manage_users" ON "public"."base_users" FOR SELECT TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_USERS'::"text"));
CREATE POLICY "base_users_select_own" ON "public"."base_users" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND ("auth" = ( SELECT "auth"."uid"() AS "uid"))));
CREATE POLICY "base_users_update_manage_users" ON "public"."base_users" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_USERS'::"text")) WITH CHECK ("public"."current_user_has_permission"('MANAGE_USERS'::"text"));

ALTER TABLE "public"."permission_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permissions_delete_managers" ON "public"."permissions" FOR DELETE TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_PERMISSIONS'::"text"));
CREATE POLICY "permissions_insert_managers" ON "public"."permissions" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_permission"('MANAGE_PERMISSIONS'::"text"));
CREATE POLICY "permissions_select_managers" ON "public"."permissions" FOR SELECT TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_PERMISSIONS'::"text"));

ALTER TABLE "public"."residents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "residents_delete_manage_users" ON "public"."residents" FOR DELETE TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_USERS'::"text"));
CREATE POLICY "residents_insert_enroll_resident" ON "public"."residents" FOR INSERT TO "authenticated" WITH CHECK ("public"."current_user_has_permission"('ENROLL_RESIDENT'::"text"));
CREATE POLICY "residents_select_own" ON "public"."residents" FOR SELECT TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."base_users" "bu"
  WHERE (("bu"."resident" = "residents"."id") AND ("bu"."auth" = ( SELECT "auth"."uid"() AS "uid")))))));
CREATE POLICY "residents_update_manage_users" ON "public"."residents" FOR UPDATE TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_USERS'::"text")) WITH CHECK ("public"."current_user_has_permission"('MANAGE_USERS'::"text"));

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."current_user_has_permission"("permission_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_has_permission"("permission_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_has_permission"("permission_name" "text") TO "service_role";

GRANT ALL ON FUNCTION "public"."get_user_expanded"("p_gerba_user_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_expanded"("p_gerba_user_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_expanded"("p_base_user_id" bigint) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_user_full_details"("p_base_user_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_full_details"("p_base_user_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_full_details"("p_base_user_id" bigint) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_user_expanded_from_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_expanded_from_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_expanded_from_auth"() TO "service_role";

GRANT ALL ON TABLE "public"."base_users" TO "anon";
GRANT ALL ON TABLE "public"."base_users" TO "authenticated";
GRANT ALL ON TABLE "public"."base_users" TO "service_role";
GRANT ALL ON SEQUENCE "public"."base_user_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."base_user_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."base_user_id_seq" TO "service_role";


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

GRANT ALL ON TABLE "public"."residents" TO "anon";
GRANT ALL ON TABLE "public"."residents" TO "authenticated";
GRANT ALL ON TABLE "public"."residents" TO "service_role";
GRANT ALL ON SEQUENCE "public"."residents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."residents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."residents_id_seq" TO "service_role";

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

CREATE OR REPLACE VIEW "public"."user_view" AS
    SELECT 
        bu.id AS base_user_id,
        bu.created_at,
        bu.name,
        bu.surname,
        bu.auth AS auth_user_id,
        au.email AS auth_email,
        r.id AS resident_id,
        r.room,
        r.birth_date,
        r.phone_number
    FROM public.base_users bu
    LEFT JOIN public.residents r ON bu.resident = r.id
    JOIN auth.users au ON au.id = bu.auth;

ALTER VIEW "public"."user_view" OWNER TO "postgres";

GRANT ALL ON TABLE "public"."user_view" TO "anon";
GRANT ALL ON TABLE "public"."user_view" TO "authenticated";
GRANT ALL ON TABLE "public"."user_view" TO "service_role";

CREATE OR REPLACE VIEW "public"."user_permissions_view" AS
    SELECT
        p.id as permission_id,
        p.user_id,
        p.created_at,
        p.permission_creator,
        pt.id as permission_type_id,
        pt.name as permission_name,
        pt.display_name as permission_display_name
    FROM public.permissions p
    JOIN public.permission_types pt ON p.permission_type = pt.id;

ALTER VIEW "public"."user_permissions_view" OWNER TO "postgres";

GRANT ALL ON TABLE "public"."user_permissions_view" TO "anon";
GRANT ALL ON TABLE "public"."user_permissions_view" TO "authenticated";
GRANT ALL ON TABLE "public"."user_permissions_view" TO "service_role";

RESET ALL;
