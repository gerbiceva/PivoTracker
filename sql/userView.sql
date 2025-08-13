CREATE OR REPLACE FUNCTION get_user_expanded(
    p_gerba_user_id BIGINT
)
RETURNS TABLE (
    gerba_user_id BIGINT,
    created_at TIMESTAMPTZ,
    name TEXT,
    surname TEXT,
    room INT,
    phone_number TEXT,
    date_of_birth DATE,
    auth_user_id UUID,
    auth_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        gu.id AS gerba_user_id,
        gu.created_at,
        gu.name,
        gu.surname,
        gu.room,
        gu.phone_number,
        gu.data_of_birth,
        gu.auth_user_id,
        au.email::text AS auth_email
    FROM gerba_user gu
    JOIN auth.users au ON au.id = gu.auth_user_id
    WHERE gu.id = p_gerba_user_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;
