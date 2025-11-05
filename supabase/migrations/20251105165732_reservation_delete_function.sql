set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.delete_reservation_by_id(p_reservation_id bigint)
 RETURNS TABLE(deleted_count bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Perform the delete operation
    -- Use a subquery to get the count of deleted rows
    RETURN QUERY
    WITH deleted AS (
        DELETE FROM public.reservations
        WHERE id = p_reservation_id
        AND "user_id" = (SELECT "id" FROM "public"."base_users" WHERE "auth" = auth.uid()) -- Re-implement RLS logic here
        RETURNING *
    )
    SELECT count(*)::BIGINT FROM deleted;

END;
$function$
;


