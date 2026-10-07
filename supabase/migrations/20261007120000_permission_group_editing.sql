-- Editing which permissions belong to which permission group.
-- Tables permission_groups / permgroup_permissions were created in the dashboard;
-- this adds the MANAGE_GROUPS permission, read policies and a guarded write RPC.

INSERT INTO public.permission_types (name, display_name) VALUES
  ('MANAGE_GROUPS', 'Urejanje vlog')
ON CONFLICT (name) DO NOTHING;

-- everyone logged in can read groups and their permissions
ALTER TABLE public.permission_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permgroup_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "permission_groups_select_all" ON public.permission_groups;
CREATE POLICY "permission_groups_select_all" ON public.permission_groups
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "permgroup_permissions_select_all" ON public.permgroup_permissions;
CREATE POLICY "permgroup_permissions_select_all" ON public.permgroup_permissions
  FOR SELECT TO authenticated USING (true);

-- no write policies: all writes go through set_group_permissions

CREATE OR REPLACE FUNCTION public.set_group_permissions(
    p_group_id bigint,
    p_permission_type_ids bigint[]
) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
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

    DELETE FROM public.permgroup_permissions
    WHERE group_id = p_group_id
      AND permission_type <> ALL (p_permission_type_ids);

    INSERT INTO public.permgroup_permissions (group_id, permission_type)
    SELECT p_group_id, pt_id
    FROM unnest(p_permission_type_ids) AS pt_id
    ON CONFLICT DO NOTHING;
END;
$$;
ALTER FUNCTION public.set_group_permissions(bigint, bigint[]) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.set_group_permissions(bigint, bigint[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_group_permissions(bigint, bigint[]) TO authenticated, service_role;
