drop view if exists "public"."everything";

drop view if exists "public"."everything_sum";

drop view if exists "public"."monthly_summary";

drop view if exists "public"."named_transactions";

drop view if exists "public"."total_summary";

drop view if exists "public"."weekly_summary";

alter table "public"."items" alter column "price" set data type numeric(10,2) using "price"::numeric(10,2);

alter table "public"."transactions" alter column "paid" set data type numeric(10,2) using "paid"::numeric(10,2);

create or replace view "public"."user_view" as  SELECT bu.id AS base_user_id,
    bu.created_at,
    bu.name,
    bu.surname,
    bu.auth AS auth_user_id,
    au.email AS auth_email,
    r.id AS resident_id,
    r.room,
    r.birth_date,
    r.phone_number
   FROM ((public.base_users bu
     LEFT JOIN public.residents r ON ((bu.resident = r.id)))
     JOIN auth.users au ON ((au.id = bu.auth)));


create or replace view "public"."everything" as  SELECT bu.id AS user_id,
    (COALESCE(NULLIF(bu.name, ''::text), ''::text) ||
        CASE
            WHEN ((bu.surname IS NOT NULL) AND (bu.surname <> ''::text)) THEN (' '::text || bu.surname)
            ELSE ''::text
        END) AS fullname,
    t.ordered_at,
    t.ordered,
    t.paid,
    i.name AS item_name,
    i.price AS item_price
   FROM ((public.base_users bu
     LEFT JOIN public.transactions t ON ((bu.id = t.customer_id)))
     LEFT JOIN public.items i ON ((t.item = i.id)));


create or replace view "public"."everything_sum" as  WITH customer_totals AS (
         SELECT b.id,
            b.name,
            b.surname,
            sum((i.beer_count * t.ordered)) AS total_ordered,
            sum(t.paid) AS total_paid,
            sum((i.price * (t.ordered)::numeric)) AS total_value
           FROM ((public.base_users b
             LEFT JOIN public.transactions t ON ((b.id = t.customer_id)))
             LEFT JOIN public.items i ON ((t.item = i.id)))
          GROUP BY b.id, b.name, b.surname
        )
 SELECT id,
    name,
    surname,
    total_ordered,
    total_paid,
    total_value,
    (total_value - total_paid) AS total_difference
   FROM customer_totals;


create or replace view "public"."monthly_summary" as  WITH all_months AS (
         SELECT date_trunc('month'::text, t.ordered_at) AS month_start,
            COALESCE(sum((t.ordered * i.beer_count)), (0)::numeric) AS total_ordered,
            COALESCE(sum(t.paid), (0)::numeric) AS total_paid,
            COALESCE(sum((i.price * (t.ordered)::numeric)), (0)::numeric) AS total_value
           FROM (public.transactions t
             LEFT JOIN public.items i ON ((t.item = i.id)))
          GROUP BY (date_trunc('month'::text, t.ordered_at))
        )
 SELECT month_start,
    total_ordered,
    total_paid,
    total_value
   FROM all_months;


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
           FROM ((public.transactions t
             LEFT JOIN public.base_users bu ON ((t.customer_id = bu.id)))
             LEFT JOIN public.items i ON ((t.item = i.id)))
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


create or replace view "public"."total_summary" as  WITH total_data AS (
         SELECT COALESCE(sum(t.ordered), (0)::numeric) AS total_ordered,
            COALESCE(sum(t.paid), (0)::numeric) AS total_paid,
            COALESCE(sum((i.price * (t.ordered)::numeric)), (0)::numeric) AS total_value,
            COALESCE((sum((i.price * (t.ordered)::numeric)) - sum(t.paid)), (0)::numeric) AS total_debt,
            COALESCE(sum((i.beer_count * t.ordered)), ((0)::bigint)::numeric) AS total_beer_count
           FROM (public.transactions t
             LEFT JOIN public.items i ON ((t.item = i.id)))
        )
 SELECT total_ordered,
    total_paid,
    total_value,
    total_debt,
    total_beer_count
   FROM total_data;


create or replace view "public"."weekly_summary" as  WITH all_weeks AS (
         SELECT date_trunc('week'::text, t.ordered_at) AS week_start,
            COALESCE(sum((t.ordered * i.beer_count)), (0)::numeric) AS total_ordered,
            COALESCE(sum(t.paid), (0)::numeric) AS total_paid,
            COALESCE(sum((i.price * (t.ordered)::numeric)), (0)::numeric) AS total_value
           FROM (public.transactions t
             LEFT JOIN public.items i ON ((t.item = i.id)))
          GROUP BY (date_trunc('week'::text, t.ordered_at))
        )
 SELECT week_start,
    total_ordered,
    total_paid,
    total_value
   FROM all_weeks;



  create policy "transactions_viewable_by_user"
  on "public"."transactions"
  as permissive
  for select
  to authenticated
using ((customer_id = ( SELECT base_users.id
   FROM public.base_users
  WHERE (base_users.auth = auth.uid()))));



