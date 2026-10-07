-- Being in the 'admin' permission group grants every permission.
-- Everyone else gets their group's permissions plus their own extra
-- permissions (the permissions table).
-- Signatures are unchanged, so every RLS policy, RPC and edge function that
-- calls current_user_has_permission / get_user_full_details picks this up.

CREATE OR REPLACE FUNCTION public.is_admin_user(p_base_user_id bigint) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path = ''
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.base_users bu
    JOIN public.permission_groups g ON g.id = bu.permgroup_id
    WHERE bu.id = p_base_user_id
      AND g.name = 'admin'
  );
$$;
ALTER FUNCTION public.is_admin_user(bigint) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_admin_user(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user(bigint) TO authenticated, service_role;

-- permission names a user has: group permissions ∪ extra permissions
CREATE OR REPLACE FUNCTION public.user_permission_names(p_base_user_id bigint) RETURNS SETOF text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path = ''
    AS $$
  SELECT pt.name
  FROM public.permission_types pt
  WHERE public.is_admin_user(p_base_user_id)
     OR EXISTS (
          SELECT 1 FROM public.permissions p
          WHERE p.user_id = p_base_user_id AND p.permission_type = pt.id
        )
     OR EXISTS (
          SELECT 1
          FROM public.base_users bu
          JOIN public.permgroup_permissions gp ON gp.group_id = bu.permgroup_id
          WHERE bu.id = p_base_user_id AND gp.permission_type = pt.id
        );
$$;
ALTER FUNCTION public.user_permission_names(bigint) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.user_permission_names(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_permission_names(bigint) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.current_user_has_permission(permission_name text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path = ''
    AS $$
  WITH me AS (
    SELECT bu.id FROM public.base_users bu WHERE bu.auth = (SELECT auth.uid())
  )
  SELECT EXISTS (SELECT 1 FROM me WHERE public.is_admin_user(me.id))
      OR EXISTS (
           SELECT 1 FROM me
           WHERE permission_name IN (SELECT public.user_permission_names(me.id))
         );
$$;
ALTER FUNCTION public.current_user_has_permission(text) OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.get_user_full_details(p_base_user_id bigint DEFAULT NULL) RETURNS TABLE(
    base_user_id bigint,
    created_at timestamp with time zone,
    name text,
    surname text,
    auth_user_id uuid,
    auth_email text,
    resident_id bigint,
    room integer,
    birth_date date,
    phone_number text,
    permissions text[]
)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
DECLARE
    target_user_id bigint;
BEGIN
    IF p_base_user_id IS NULL THEN
        SELECT bu.id INTO target_user_id
        FROM public.base_users bu
        WHERE bu.auth = auth.uid();
    ELSE
        target_user_id := p_base_user_id;
    END IF;

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
        -- admins get every permission name, so frontend checks need no special case
        ARRAY(SELECT public.user_permission_names(bu.id) ORDER BY 1) AS permissions
    FROM public.base_users bu
    LEFT JOIN public.residents r ON bu.resident = r.id
    JOIN auth.users au ON au.id = bu.auth
    WHERE bu.id = target_user_id;
END;
$$;
ALTER FUNCTION public.get_user_full_details(bigint) OWNER TO postgres;
