create or replace view "public"."user_permissions_view" as  SELECT p.id AS permission_id,
    p.user_id,
    p.created_at,
    p.permission_creator,
    pt.id AS permission_type_id,
    pt.name AS permission_name,
    pt.display_name AS permission_display_name
   FROM (permissions p
     JOIN permission_types pt ON ((p.permission_type = pt.id)));



