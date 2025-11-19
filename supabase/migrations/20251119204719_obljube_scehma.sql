create or replace view "public"."top_obljube_users_sum" as  WITH user_totals AS (
         SELECT o.who,
            bu.name AS user_name,
            bu.surname AS user_surname,
            sum(o.amount) AS total_amount
           FROM (public.obljube o
             LEFT JOIN public.base_users bu ON ((o.who = bu.id)))
          GROUP BY o.who, bu.name, bu.surname
        )
 SELECT who,
    user_name,
    user_surname,
    total_amount
   FROM user_totals;



