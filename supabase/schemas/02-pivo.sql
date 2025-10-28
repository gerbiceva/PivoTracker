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

SET default_tablespace = '';
SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."items" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "beer_count" bigint NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "visible" boolean DEFAULT true NOT NULL
);
ALTER TABLE "public"."items" OWNER TO "postgres";
COMMENT ON TABLE "public"."items" IS 'all sellable items';
COMMENT ON COLUMN "public"."items"."visible" IS 'if false, this item should not be selected';

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
COMMENT ON TABLE "public"."gerba_storage" IS 'Storage for beer on the Gerba level. Serves for stock management';
COMMENT ON COLUMN "public"."gerba_storage"."notes" IS 'Different notes on buying this batch of beer';

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
            ("bu"."name" || ' ' || "bu"."surname") AS "fullname",
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

ALTER TABLE "public"."transactions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."orders_id_seq"
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

ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_id_key" UNIQUE ("id");
ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."gerba_storage"
    ADD CONSTRAINT "nabava_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."gerba_storage"
    ADD CONSTRAINT "public_nabava_minister_fkey" FOREIGN KEY ("minister") REFERENCES "auth"."users"("id");
ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."base_users"("id") ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_item_fkey" FOREIGN KEY ("item") REFERENCES "public"."items"("id") ON UPDATE CASCADE ON DELETE SET NULL;

GRANT ALL ON FUNCTION "public"."get_total_summary"("datefrom" timestamp with time zone, "dateto" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_total_summary"("datefrom" timestamp with time zone, "dateto" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_total_summary"("datefrom" timestamp with time zone, "dateto" timestamp with time zone) TO "service_role";

ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "items_select_for_all_authenticated" ON "public"."items" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "items_manage_by_manage_items" ON "public"."items" FOR ALL TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_ITEMS'::"text"));

GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";

ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_manage_by_manage_transactions" ON "public"."transactions" FOR ALL TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_TRANSACTIONS'::"text"));
CREATE POLICY "transactions_viewable_by_user" ON "public"."transactions" FOR SELECT TO "authenticated" USING ("customer_id" = (SELECT "id" FROM "public"."base_users" WHERE "auth" = auth.uid()));

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

GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orders_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."total_summary" TO "anon";
GRANT ALL ON TABLE "public"."total_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."total_summary" TO "service_role";

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

RESET ALL;
