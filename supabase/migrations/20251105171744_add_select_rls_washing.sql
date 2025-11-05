
  create policy "reservations_select_by_can_wash"
  on "public"."reservations"
  as permissive
  for select
  to authenticated
using (public.current_user_has_permission('CAN_WASH'::text));



