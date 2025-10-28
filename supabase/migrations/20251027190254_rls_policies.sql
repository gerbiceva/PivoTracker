alter table "public"."items" enable row level security;

alter table "public"."reservations" enable row level security;

alter table "public"."transactions" enable row level security;

create policy "items_manage_by_manage_items"
on "public"."items"
as permissive
for all
to authenticated
using (current_user_has_permission('MANAGE_ITEMS'::text));


create policy "items_select_for_all_authenticated"
on "public"."items"
as permissive
for select
to authenticated
using (true);


create policy "reservations_delete_own_rows"
on "public"."reservations"
as permissive
for delete
to authenticated
using ((user_id = ( SELECT base_users.id
   FROM base_users
  WHERE (base_users.auth = auth.uid()))));


create policy "reservations_insert_by_can_wash"
on "public"."reservations"
as permissive
for insert
to authenticated
with check ((current_user_has_permission('CAN_WASH'::text) AND (user_id = ( SELECT base_users.id
   FROM base_users
  WHERE (base_users.auth = auth.uid())))));


create policy "transactions_manage_by_manage_transactions"
on "public"."transactions"
as permissive
for all
to authenticated
using (current_user_has_permission('MANAGE_TRANSACTIONS'::text));



