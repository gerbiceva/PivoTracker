
CREATE OR REPLACE FUNCTION get_reservations_week(p_date TIMESTAMPTZ)
RETURNS TABLE (
    reservation_id BIGINT,
    machine_id INT,
    machine_name TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ,
    name TEXT,
    surname TEXT,
    room INT,
    phone_number TEXT,
    date_of_birth DATE,
    auth_user_id UUID,
    slot_start_utc TIMESTAMP,
    slot_end_utc TIMESTAMP,
    slot_index_local INT,
    note TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.machine_id,
        wm.name as machine_name,
        gu.auth_user_id AS user_id,
        gu.created_at,
        gu.first_name,
        gu.surname,
        gu.room,
        gu.phone_number,
        gu.data_of_birth,
        gu.auth_user_id,
        lower(r.slot) AT TIME ZONE 'UTC' AS slot_start_utc,
        upper(r.slot) AT TIME ZONE 'UTC' AS slot_end_utc,
        ((date_part('hour', lower(r.slot) AT TIME ZONE 'Europe/Ljubljana')::int / 3) + 1) AS slot_index_local,
        r.note
    FROM reservations r
    JOIN washing_machines wm ON wm.id = r.machine_id
    LEFT JOIN gerba_user gu ON gu.id = r.user_id
    WHERE lower(r.slot) >= p_date
      AND lower(r.slot) < p_date + interval '7 days'
    ORDER BY lower(r.slot);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;
