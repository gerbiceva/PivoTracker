-- Vloga (permission group) becomes a preset: assigning it copies the group's
-- permissions to the user, after which they can be freely edited per user.
-- The permissions table is now the user's full permission set; groups no
-- longer grant anything live. The admin group still implies every permission.

-- 1. copy what users currently get from their group, so nobody loses access
INSERT INTO public.permissions (user_id, permission_type, permission_creator)
SELECT bu.id, gp.permission_type, NULL
FROM public.base_users bu
JOIN public.permission_groups g ON g.id = bu.permgroup_id
JOIN public.permgroup_permissions gp ON gp.group_id = g.id
WHERE g.name <> 'admin'
ON CONFLICT (user_id, permission_type) DO NOTHING;

-- permissions used to be deleted together with whoever granted them; now that
-- a vloga change writes them, deleting that admin would strip everyone they
-- ever assigned a vloga to
ALTER TABLE public.permissions
    DROP CONSTRAINT permissions_permission_creator_fkey,
    ADD CONSTRAINT permissions_permission_creator_fkey
        FOREIGN KEY (permission_creator) REFERENCES public.base_users(id)
        ON UPDATE CASCADE ON DELETE SET NULL;

-- 2. permission names a user has: everything for admins, else their own list
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
        );
$$;

-- replaces a user's permissions with exactly the given list (internal helper)
CREATE OR REPLACE FUNCTION public.replace_user_permissions(
    p_base_user_id bigint,
    p_permission_type_ids bigint[]
) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
BEGIN
    DELETE FROM public.permissions
    WHERE user_id = p_base_user_id
      AND permission_type <> ALL (p_permission_type_ids);

    INSERT INTO public.permissions (user_id, permission_type, permission_creator)
    SELECT p_base_user_id, pt_id, public.get_current_base_user_id()
    FROM unnest(p_permission_type_ids) AS pt_id
    ON CONFLICT (user_id, permission_type) DO NOTHING;
END;
$$;
ALTER FUNCTION public.replace_user_permissions(bigint, bigint[]) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.replace_user_permissions(bigint, bigint[]) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.group_preset(p_group_id bigint) RETURNS bigint[]
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path = ''
    AS $$
  SELECT coalesce(array_agg(permission_type ORDER BY permission_type), '{}')
  FROM public.permgroup_permissions
  WHERE group_id = p_group_id;
$$;
ALTER FUNCTION public.group_preset(bigint) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.group_preset(bigint) FROM PUBLIC, anon, authenticated;

-- 3. assigning a vloga also sets the permissions: the given list (edited in
-- the drawer) or, when omitted, the vloga's preset. Admin / no vloga leave
-- permissions as they are.
DROP FUNCTION IF EXISTS public.set_user_group(bigint, bigint);
CREATE OR REPLACE FUNCTION public.set_user_group(
    p_base_user_id bigint,
    p_group_id bigint,
    p_permission_type_ids bigint[] DEFAULT NULL
) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
DECLARE
    caller_is_admin boolean;
    group_is_admin boolean;
BEGIN
    IF NOT public.current_user_has_permission('MANAGE_USERS') THEN
        RAISE EXCEPTION 'Insufficient permissions: User does not have MANAGE_USERS.';
    END IF;

    IF NOT public.current_user_has_permission('MANAGE_PERMISSIONS') THEN
        RAISE EXCEPTION 'Insufficient permissions: User does not have MANAGE_PERMISSIONS.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.base_users WHERE id = p_base_user_id) THEN
        RAISE EXCEPTION 'User % does not exist.', p_base_user_id;
    END IF;

    IF p_group_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.permission_groups WHERE id = p_group_id) THEN
        RAISE EXCEPTION 'Permission group % does not exist.', p_group_id;
    END IF;

    caller_is_admin := public.is_admin_user(public.get_current_base_user_id());
    group_is_admin := EXISTS (
        SELECT 1 FROM public.permission_groups WHERE id = p_group_id AND name = 'admin'
    );

    IF NOT caller_is_admin AND (public.is_admin_user(p_base_user_id) OR group_is_admin) THEN
        RAISE EXCEPTION 'Only admins can assign or remove the admin group.';
    END IF;

    UPDATE public.base_users SET permgroup_id = p_group_id WHERE id = p_base_user_id;

    IF p_permission_type_ids IS NOT NULL THEN
        PERFORM public.replace_user_permissions(p_base_user_id, p_permission_type_ids);
    ELSIF p_group_id IS NOT NULL AND NOT group_is_admin THEN
        PERFORM public.replace_user_permissions(p_base_user_id, public.group_preset(p_group_id));
    END IF;
END;
$$;
ALTER FUNCTION public.set_user_group(bigint, bigint, bigint[]) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.set_user_group(bigint, bigint, bigint[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_group(bigint, bigint, bigint[]) TO authenticated, service_role;

-- new users (enroll / invite) get their default vloga's preset
CREATE OR REPLACE FUNCTION public.apply_group_preset_on_insert() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
BEGIN
    IF NEW.permgroup_id IS NOT NULL AND NOT public.is_admin_user(NEW.id) THEN
        INSERT INTO public.permissions (user_id, permission_type, permission_creator)
        SELECT NEW.id, gp.permission_type, NULL
        FROM public.permgroup_permissions gp
        WHERE gp.group_id = NEW.permgroup_id
        ON CONFLICT (user_id, permission_type) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;
ALTER FUNCTION public.apply_group_preset_on_insert() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.apply_group_preset_on_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS apply_group_preset_on_insert ON public.base_users;
CREATE TRIGGER apply_group_preset_on_insert
    AFTER INSERT ON public.base_users
    FOR EACH ROW EXECUTE FUNCTION public.apply_group_preset_on_insert();

-- 4. editing a preset can optionally push the change to current members:
-- they gain what was added and lose what was removed, other per-user
-- changes stay
DROP FUNCTION IF EXISTS public.set_group_permissions(bigint, bigint[]);
CREATE OR REPLACE FUNCTION public.set_group_permissions(
    p_group_id bigint,
    p_permission_type_ids bigint[],
    p_propagate boolean DEFAULT false
) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
DECLARE
    old_preset bigint[];
BEGIN
    IF NOT public.current_user_has_permission('MANAGE_GROUPS') THEN
        RAISE EXCEPTION 'Insufficient permissions: User does not have MANAGE_GROUPS.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.permission_groups WHERE id = p_group_id) THEN
        RAISE EXCEPTION 'Permission group % does not exist.', p_group_id;
    END IF;

    -- the admin group is managed by the devs only
    IF EXISTS (SELECT 1 FROM public.permission_groups WHERE id = p_group_id AND name = 'admin') THEN
        RAISE EXCEPTION 'The admin group cannot be modified.';
    END IF;

    -- ADMIN can never be handed out through a group
    IF EXISTS (
        SELECT 1 FROM public.permission_types
        WHERE name = 'ADMIN' AND id = ANY (p_permission_type_ids)
    ) THEN
        RAISE EXCEPTION 'The ADMIN permission cannot be added to a group.';
    END IF;

    IF p_propagate AND NOT public.current_user_has_permission('MANAGE_PERMISSIONS') THEN
        RAISE EXCEPTION 'Insufficient permissions: User does not have MANAGE_PERMISSIONS.';
    END IF;

    old_preset := public.group_preset(p_group_id);

    DELETE FROM public.permgroup_permissions
    WHERE group_id = p_group_id
      AND permission_type <> ALL (p_permission_type_ids);

    INSERT INTO public.permgroup_permissions (group_id, permission_type)
    SELECT p_group_id, pt_id
    FROM unnest(p_permission_type_ids) AS pt_id
    ON CONFLICT DO NOTHING;

    IF p_propagate THEN
        DELETE FROM public.permissions p
        USING public.base_users bu
        WHERE bu.id = p.user_id
          AND bu.permgroup_id = p_group_id
          AND p.permission_type = ANY (old_preset)
          AND p.permission_type <> ALL (p_permission_type_ids);

        INSERT INTO public.permissions (user_id, permission_type, permission_creator)
        SELECT bu.id, pt_id, public.get_current_base_user_id()
        FROM public.base_users bu
        CROSS JOIN unnest(p_permission_type_ids) AS pt_id
        WHERE bu.permgroup_id = p_group_id
          AND pt_id <> ALL (old_preset)
        ON CONFLICT (user_id, permission_type) DO NOTHING;
    END IF;
END;
$$;
ALTER FUNCTION public.set_group_permissions(bigint, bigint[], boolean) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.set_group_permissions(bigint, bigint[], boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_group_permissions(bigint, bigint[], boolean) TO authenticated, service_role;
