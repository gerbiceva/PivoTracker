set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_current_base_user_id()
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$
DECLARE
        user_base_id bigint;
    BEGIN
        SELECT bu.id INTO user_base_id
        FROM public.base_users bu
        WHERE bu.auth = (SELECT auth.uid())
        LIMIT 1;
        
        RETURN user_base_id;
    END;
$function$
;


