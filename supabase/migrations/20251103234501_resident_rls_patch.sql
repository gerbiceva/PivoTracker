drop policy "residents_select_own" on "public"."residents";


  create policy "residents_select_own"
  on "public"."residents"
  as permissive
  for select
  to authenticated
using ((public.current_user_has_permission('ENROLL_RESIDENT'::text) OR ((( SELECT auth.uid() AS uid) IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.base_users bu
  WHERE ((bu.resident = residents.id) AND (bu.auth = ( SELECT auth.uid() AS uid))))))));



