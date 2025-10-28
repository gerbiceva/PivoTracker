revoke delete on table "public"."customers" from "anon";

revoke insert on table "public"."customers" from "anon";

revoke references on table "public"."customers" from "anon";

revoke select on table "public"."customers" from "anon";

revoke trigger on table "public"."customers" from "anon";

revoke truncate on table "public"."customers" from "anon";

revoke update on table "public"."customers" from "anon";

revoke delete on table "public"."customers" from "authenticated";

revoke insert on table "public"."customers" from "authenticated";

revoke references on table "public"."customers" from "authenticated";

revoke select on table "public"."customers" from "authenticated";

revoke trigger on table "public"."customers" from "authenticated";

revoke truncate on table "public"."customers" from "authenticated";

revoke update on table "public"."customers" from "authenticated";

revoke delete on table "public"."customers" from "service_role";

revoke insert on table "public"."customers" from "service_role";

revoke references on table "public"."customers" from "service_role";

revoke select on table "public"."customers" from "service_role";

revoke trigger on table "public"."customers" from "service_role";

revoke truncate on table "public"."customers" from "service_role";

revoke update on table "public"."customers" from "service_role";

alter table "public"."customers" drop constraint "customers_user_link_fkey";

drop view if exists "public"."named_transactions";

alter table "public"."customers" drop constraint "customers_pkey";

drop index if exists "public"."customers_pkey";

drop table "public"."customers";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.current_user_has_permission(permission_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.permissions p
    JOIN public.permission_types pt ON pt.id = p.permission_type
    JOIN public.base_users bu ON bu.id = p.user_id
    WHERE bu.auth = (SELECT auth.uid())
      AND pt.name = permission_name
  );
$function$
;

create or replace view "public"."named_transactions" as  WITH all_transactions AS (
         SELECT t.id,
            t.customer_id,
            t.ordered_at,
            t.ordered,
            t.paid,
            ((bu.name || ' '::text) || bu.surname) AS fullname,
            i.name AS item_name,
            i.price AS item_price,
            i.beer_count AS item_beer_count,
            (i.price * (t.ordered)::numeric) AS value,
            ((i.price * (t.ordered)::numeric) - (t.paid)::numeric) AS owed
           FROM ((transactions t
             LEFT JOIN base_users bu ON ((t.customer_id = bu.id)))
             LEFT JOIN items i ON ((t.item = i.id)))
        )
 SELECT id,
    fullname,
    customer_id,
    ordered_at,
    ordered,
    paid,
    item_name,
    item_price,
    item_beer_count,
    value,
    owed
   FROM all_transactions;



