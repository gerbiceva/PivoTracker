set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_user_permissions(p_base_user_id bigint, p_permission_type_ids bigint[])
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    current_user_id bigint;
BEGIN
    -- Get the base_user_id of the user executing this function
    SELECT public.get_current_base_user_id() INTO current_user_id;

    -- Check if the current user has 'MANAGE_PERMISSIONS' permission
    IF NOT public.current_user_has_permission('MANAGE_PERMISSIONS') THEN
        RAISE EXCEPTION 'Insufficient permissions: User does not have MANAGE_PERMISSIONS.';
    END IF;

    -- Delete existing permissions that are not in the provided list
    DELETE FROM public.permissions
    WHERE user_id = p_base_user_id
      AND permission_type NOT IN (SELECT unnest(p_permission_type_ids));

    -- Insert new permissions from the provided list that do not already exist
    INSERT INTO public.permissions (user_id, permission_type, permission_creator)
    SELECT p_base_user_id, pt_id, current_user_id
    FROM unnest(p_permission_type_ids) AS pt_id
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.permissions
        WHERE user_id = p_base_user_id AND permission_type = pt_id
    );
END;
$function$
;


