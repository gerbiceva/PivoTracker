alter table "public"."base_users" add column "invited_by" bigint;

alter table "public"."base_users" add constraint "base_users_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES public.base_users(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."base_users" validate constraint "base_users_invited_by_fkey";

alter table "public"."permissions" add constraint "permissions_permission_creator_fkey" FOREIGN KEY (permission_creator) REFERENCES public.base_users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."permissions" validate constraint "permissions_permission_creator_fkey";

alter table "public"."permissions" add constraint "permissions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.base_users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."permissions" validate constraint "permissions_user_id_fkey";

create or replace view "public"."user_permissions_view" as  SELECT p.id AS permission_id,
    p.user_id,
    p.created_at,
    p.permission_creator,
    pt.id AS permission_type_id,
    pt.name AS permission_name,
    pt.display_name AS permission_display_name
   FROM (public.permissions p
     JOIN public.permission_types pt ON ((p.permission_type = pt.id)));



