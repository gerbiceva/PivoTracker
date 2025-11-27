create or replace view "public"."obljube_with_user_info" as  SELECT o.id,
    o.created_at,
    o.who,
    o.minister,
    o.amount,
    o.reason,
    bu_who.id AS user_id,
    bu_who.created_at AS user_created_at,
    bu_who.name AS user_name,
    bu_who.surname AS user_surname,
    bu_who.auth AS user_auth_id,
    bu_who.resident AS user_resident_id,
    bu_who.invited_by AS user_invited_by,
    bu_minister.id AS minister_id,
    bu_minister.name AS minister_name
   FROM ((public.obljube o
     LEFT JOIN public.base_users bu_who ON ((o.who = bu_who.id)))
     LEFT JOIN public.base_users bu_minister ON ((o.minister = bu_minister.id)));



