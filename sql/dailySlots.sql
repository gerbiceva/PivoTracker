
DROP FUNCTION IF EXISTS get_slots_for_day(TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_slots_for_day(p_date TIMESTAMPTZ)
RETURNS TABLE (
    machine_id     INT,
    machine_name   TEXT,
    slot_start_utc TIMESTAMPTZ,
    slot_end_utc   TIMESTAMPTZ,
    slot_index_local INT,
    is_empty       BOOLEAN,
    reservation_id BIGINT,
    user_id        UUID,
    created_at     TIMESTAMPTZ,
    first_name     TEXT,
    surname        TEXT,
    room           INT,
    phone_number   TEXT,
    date_of_birth  DATE,
    auth_user_id   UUID,
    note           TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH slot_definitions AS (
        SELECT generate_series(0, 7) AS slot_index_local
    ),
    machines AS (
        SELECT id, name FROM washing_machines
    ),
    slots AS (
        SELECT
            m.id AS machine_id,
            m.name AS machine_name,
            s.slot_index_local,
            -- keep TIMESTAMPTZ: cast the final value
            (
                date_trunc('day', p_date AT TIME ZONE 'Europe/Ljubljana')
                + (s.slot_index_local * INTERVAL '3 hours')
            ) AT TIME ZONE 'Europe/Ljubljana' AS slot_start_utc,
            (
                date_trunc('day', p_date AT TIME ZONE 'Europe/Ljubljana')
                + ((s.slot_index_local + 1) * INTERVAL '3 hours')
            ) AT TIME ZONE 'Europe/Ljubljana' AS slot_end_utc
        FROM slot_definitions s
        CROSS JOIN machines m
    )
    SELECT
        sl.machine_id,
        sl.machine_name,
        sl.slot_start_utc,
        sl.slot_end_utc,
        sl.slot_index_local + 1,
        r.id IS NULL,
        r.id,
        gu.auth_user_id,
        gu.created_at,
        gu.first_name,
        gu.surname,
        gu.room,
        gu.phone_number,
        gu.data_of_birth,   -- fixed typo
        gu.auth_user_id,
        r.note
    FROM slots sl
    LEFT JOIN reservations r
           ON r.machine_id = sl.machine_id
          AND lower(r.slot) = sl.slot_start_utc
    LEFT JOIN gerba_user gu
           ON gu.id = r.user_id
    ORDER BY sl.machine_id, sl.slot_start_utc;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;
