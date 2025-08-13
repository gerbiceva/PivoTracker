CREATE OR REPLACE FUNCTION add_reservation_with_range(
    p_machine_id INT,
    p_slot_start TIMESTAMPTZ,
    p_slot_end TIMESTAMPTZ,
    p_note TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    slot_start_utc TIMESTAMPTZ;
    slot_end_utc TIMESTAMPTZ;
    current_user_uuid UUID;
    current_user_id BIGINT;
    inserted_id BIGINT;
BEGIN
    -- Get the current authenticated user's UUID from Supabase Auth
    current_user_uuid := auth.uid();

    -- Resolve the bigint user_id from gerba_user using auth_user_id
    SELECT id INTO current_user_id
    FROM gerba_user
    WHERE auth_user_id = current_user_uuid;

    -- Ensure the user exists
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found in gerba_user table';
    END IF;

    -- Quantize start to whole hour (floor)
    slot_start_utc := date_trunc('hour', p_slot_start);

    -- Quantize end to whole hour (ceil)
    IF date_trunc('hour', p_slot_end) = p_slot_end THEN
        slot_end_utc := p_slot_end;
    ELSE
        slot_end_utc := date_trunc('hour', p_slot_end) + INTERVAL '1 hour';
    END IF;

    -- Insert reservation using the bigint user_id
    INSERT INTO reservations (machine_id, user_id, slot, note)
    VALUES (p_machine_id, current_user_id, tstzrange(slot_start_utc, slot_end_utc, '[)'), p_note)
    RETURNING id INTO inserted_id;

    RETURN inserted_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;
