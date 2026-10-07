-- Show each user's permission group in user_view and let it be changed
-- through set_user_group. Only admins can move someone into or out of the
-- admin group.

-- new column goes last so CREATE OR REPLACE VIEW can keep the existing ones
CREATE OR REPLACE VIEW public.user_view AS
    SELECT
        bu.id AS base_user_id,
        bu.created_at,
        bu.name,
        bu.surname,
        bu.auth AS auth_user_id,
        au.email AS auth_email,
        r.id AS resident_id,
        r.room,
        r.birth_date,
        r.phone_number,
        bu.permgroup_id
    FROM public.base_users bu
    LEFT JOIN public.residents r ON bu.resident = r.id
    JOIN auth.users au ON au.id = bu.auth;

CREATE OR REPLACE FUNCTION public.set_user_group(
    p_base_user_id bigint,
    p_group_id bigint
) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
DECLARE
    caller_is_admin boolean;
BEGIN
    IF NOT public.current_user_has_permission('MANAGE_USERS') THEN
        RAISE EXCEPTION 'Insufficient permissions: User does not have MANAGE_USERS.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.base_users WHERE id = p_base_user_id) THEN
        RAISE EXCEPTION 'User % does not exist.', p_base_user_id;
    END IF;

    IF p_group_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.permission_groups WHERE id = p_group_id) THEN
        RAISE EXCEPTION 'Permission group % does not exist.', p_group_id;
    END IF;

    caller_is_admin := public.is_admin_user(public.get_current_base_user_id());

    IF NOT caller_is_admin AND (
        public.is_admin_user(p_base_user_id)
        OR EXISTS (SELECT 1 FROM public.permission_groups WHERE id = p_group_id AND name = 'admin')
    ) THEN
        RAISE EXCEPTION 'Only admins can assign or remove the admin group.';
    END IF;

    UPDATE public.base_users SET permgroup_id = p_group_id WHERE id = p_base_user_id;
END;
$$;
ALTER FUNCTION public.set_user_group(bigint, bigint) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.set_user_group(bigint, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_group(bigint, bigint) TO authenticated, service_role;
