-- MANAGE_WASHING lets a user remove anyone's washing reservation. The delete
-- uses RETURNING, so the row must also be visible to them (even without CAN_WASH).

CREATE POLICY "reservations_delete_manage_washing" ON "public"."reservations" FOR DELETE TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_WASHING'::"text"));
CREATE POLICY "reservations_select_manage_washing" ON "public"."reservations" FOR SELECT TO "authenticated" USING ("public"."current_user_has_permission"('MANAGE_WASHING'::"text"));

-- Nobody (owner or MANAGE_WASHING) may delete a reservation that has already ended.
CREATE POLICY "reservations_delete_not_past" ON "public"."reservations" AS RESTRICTIVE FOR DELETE TO "authenticated" USING (upper("slot") > now());
