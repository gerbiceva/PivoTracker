set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_reservations_week(p_date timestamp with time zone)
 RETURNS TABLE(reservation_id bigint, machine_id integer, machine_name text, user_id uuid, created_at timestamp with time zone, name text, surname text, room integer, phone_number text, date_of_birth date, auth_user_id uuid, slot_start_utc timestamp without time zone, slot_end_utc timestamp without time zone, slot_index_local integer, note text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.machine_id,
        wm.name as machine_name,
        bu.auth AS user_id,
        bu.created_at,
        bu.name,
        bu.surname,
        res.room::integer,
        res.phone_number,
        res.birth_date AS date_of_birth,
        bu.auth AS auth_user_id,
        lower(r.slot) AT TIME ZONE 'UTC' AS slot_start_utc,
        upper(r.slot) AT TIME ZONE 'UTC' AS slot_end_utc,
        ((date_part('hour', lower(r.slot) AT TIME ZONE 'Europe/Ljubljana')::int / 3) + 1) AS slot_index_local,
        r.note
    FROM reservations r
    JOIN washing_machines wm ON wm.id = r.machine_id
    LEFT JOIN base_users bu ON bu.id = r.user_id
    LEFT JOIN residents res ON bu.resident = res.id
    WHERE lower(r.slot) >= p_date
      AND lower(r.slot) < p_date + interval '7 days'
    ORDER BY lower(r.slot);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_expanded(p_base_user_id bigint)
 RETURNS TABLE(base_user_id bigint, created_at timestamp with time zone, name text, surname text, room integer, phone_number text, date_of_birth date, auth_user_id uuid, auth_email text)
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
        r.room::integer,
        r.phone_number,
        r.birth_date,
        bu.auth AS auth_user_id,
        au.email::text AS auth_email
    FROM base_users bu
    LEFT JOIN residents r ON bu.resident = r.id
    JOIN auth.users au ON au.id = bu.auth
    WHERE bu.id = p_base_user_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_expanded_from_auth()
 RETURNS TABLE(auth_user_id uuid, auth_email text, auth_created_at timestamp with time zone, base_user_id bigint, base_name text, base_surname text, base_room integer, base_phone_number text, base_data_of_birth date)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        au.id AS auth_user_id,
        au.email::text AS auth_email,
        au.created_at::timestamptz AS auth_created_at,
        bu.id AS base_user_id,
        bu.name AS base_name,
        bu.surname AS base_surname,
        r.room::integer AS base_room,
        r.phone_number AS base_phone_number,
        r.birth_date AS base_data_of_birth
    FROM auth.users au
    JOIN base_users bu ON bu.auth = au.id
    LEFT JOIN residents r ON bu.resident = r.id
    WHERE au.id = auth.uid();
END;
$function$
;


