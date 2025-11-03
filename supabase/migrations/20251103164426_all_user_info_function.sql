set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_full_details(p_base_user_id bigint)
 RETURNS TABLE(base_user_id bigint, created_at timestamp with time zone, name text, surname text, auth_user_id uuid, auth_email text, resident_id bigint, room integer, birth_date date, phone_number text, permissions text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        bu.id AS base_user_id,
        bu.created_at,
        bu.name,
        bu.surname,
        bu.auth AS auth_user_id,
        au.email::text AS auth_email,
        r.id AS resident_id,
        r.room::integer,
        r.birth_date::date,
        r.phone_number,
        ARRAY(
            SELECT pt.name
            FROM public.permissions p
            JOIN public.permission_types pt ON p.permission_type = pt.id
            WHERE p.user_id = bu.id
        ) AS permissions
    FROM public.base_users bu
    LEFT JOIN public.residents r ON bu.resident = r.id
    JOIN auth.users au ON au.id = bu.auth
    WHERE bu.id = p_base_user_id;
END;
$function$
;


