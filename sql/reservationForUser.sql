CREATE OR REPLACE FUNCTION get_reservations_for_user(
    p_gerba_user_id BIGINT
)
RETURNS TABLE (
    reservation_id BIGINT,
    machine_id INT,
    machine_name TEXT,
    slot_start_utc TIMESTAMPTZ,
    slot_end_utc TIMESTAMPTZ,
    note TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id AS reservation_id,
        wm.id AS machine_id,
        wm.name AS machine_name,
        lower(r.slot) AT TIME ZONE 'UTC' AS slot_start_utc,
        upper(r.slot) AT TIME ZONE 'UTC' AS slot_end_utc,
        r.note
    FROM reservations r
    JOIN washing_machines wm ON wm.id = r.machine_id
    WHERE r.user_id = p_gerba_user_id
    ORDER BY lower(r.slot) ASC;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;
