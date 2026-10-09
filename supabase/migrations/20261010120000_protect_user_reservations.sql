-- get_reservations_for_user is SECURITY DEFINER and didn't check the caller,
-- so anyone (even anon) could read any user's reservation history. Now only
-- the user themselves or someone with MANAGE_USERS may read it.

CREATE OR REPLACE FUNCTION public.get_reservations_for_user(p_base_user_id bigint)
    RETURNS TABLE(reservation_id bigint, machine_id integer, machine_name text, slot_start_utc timestamp with time zone, slot_end_utc timestamp with time zone, note text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
BEGIN
    IF p_base_user_id IS DISTINCT FROM public.get_current_base_user_id()
       AND NOT public.current_user_has_permission('MANAGE_USERS') THEN
        RAISE EXCEPTION 'Insufficient permissions: can only read own reservations.';
    END IF;

    RETURN QUERY
    SELECT
        r.id AS reservation_id,
        wm.id AS machine_id,
        wm.name AS machine_name,
        lower(r.slot) AS slot_start_utc,
        upper(r.slot) AS slot_end_utc,
        r.note
    FROM public.reservations r
    JOIN public.washing_machines wm ON wm.id = r.machine_id
    WHERE r.user_id = p_base_user_id
    ORDER BY lower(r.slot) ASC;
END;
$$;

ALTER FUNCTION public.get_reservations_for_user(bigint) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_reservations_for_user(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_reservations_for_user(bigint) TO authenticated, service_role;
