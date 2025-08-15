CREATE OR REPLACE FUNCTION get_user_expanded_from_auth()
RETURNS TABLE (
    auth_user_id UUID,
    auth_email TEXT,
    auth_created_at TIMESTAMPTZ,
    gerba_user_id BIGINT,
    gerba_name TEXT,
    gerba_surname TEXT,
    gerba_room INT,
    gerba_phone_number TEXT,
    gerba_date_of_birth DATE,
    gerba_created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        au.id AS auth_user_id,
        au.email::text AS auth_email,
        au.created_at::timestamptz AS auth_created_at,
        gu.id AS gerba_user_id,
        gu.name AS gerba_name,
        gu.surname AS gerba_surname,
        gu.room AS gerba_room,
        gu.phone_number AS gerba_phone_number,
        gu.data_of_birth AS gerba_date_of_birth,
        gu.created_at::timestamptz AS gerba_created_at
    FROM auth.users au
    JOIN gerba_user gu ON gu.auth_user_id = au.id
    WHERE au.id = auth.uid();
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;
