CREATE UNIQUE INDEX unique_user_permission ON public.permissions USING btree (user_id, permission_type);

alter table "public"."permissions" add constraint "unique_user_permission" UNIQUE using index "unique_user_permission";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_and_link_resident(p_base_user_id bigint, p_room bigint, p_phone_number text DEFAULT NULL::text, p_birth_date date DEFAULT NULL::date)
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$
DECLARE
    resident_id bigint;
    existing_resident_id bigint;
BEGIN
    -- Check if the base_user exists
    IF NOT EXISTS (SELECT 1 FROM public.base_users WHERE id = p_base_user_id) THEN
        RAISE EXCEPTION 'Base user with ID % does not exist.', p_base_user_id;
    END IF;

    -- Check if the base_user already has a resident linked
    SELECT resident INTO existing_resident_id FROM public.base_users WHERE id = p_base_user_id;
    IF existing_resident_id IS NOT NULL THEN
        RAISE EXCEPTION 'Base user with ID % already has a resident linked (ID: %).', p_base_user_id, existing_resident_id;
    END IF;

    -- Insert new resident record
    INSERT INTO public.residents (room, phone_number, birth_date, created_at)
    VALUES (p_room, p_phone_number, p_birth_date, now())
    RETURNING id INTO resident_id;

    -- Link the new resident to the base_user
    UPDATE public.base_users
    SET resident = resident_id
    WHERE id = p_base_user_id;

    RETURN resident_id;
END;
$function$
;


