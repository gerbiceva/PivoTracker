-- Deleting a vloga no longer requires it to be empty: its members are moved
-- to Stanovalec and their permissions replaced with Stanovalec's preset, the
-- same as set_user_group would do one by one.

CREATE OR REPLACE FUNCTION public.delete_permission_group(p_group_id bigint)
RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
DECLARE
    g public.permission_groups;
    resident_id bigint;
    resident_preset bigint[];
    member_ids bigint[];
    member_id bigint;
BEGIN
    IF NOT public.current_user_has_permission('MANAGE_GROUPS') THEN
        RAISE EXCEPTION 'Insufficient permissions: User does not have MANAGE_GROUPS.';
    END IF;

    SELECT * INTO g FROM public.permission_groups WHERE id = p_group_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Permission group % does not exist.', p_group_id;
    END IF;

    IF g.name = 'admin' THEN
        RAISE EXCEPTION 'The admin group cannot be deleted.';
    END IF;

    IF lower(g.name) = 'stanovalec' OR lower(g.display_name) = 'stanovalec' THEN
        RAISE EXCEPTION 'Vloge Stanovalec ni mogoče izbrisati.';
    END IF;

    SELECT array_agg(id) INTO member_ids
    FROM public.base_users WHERE permgroup_id = p_group_id;

    IF member_ids IS NOT NULL THEN
        -- moving members changes their permissions, which set_user_group
        -- also guards with these
        IF NOT public.current_user_has_permission('MANAGE_USERS')
           OR NOT public.current_user_has_permission('MANAGE_PERMISSIONS') THEN
            RAISE EXCEPTION 'Vloga ima še % uporabnikov. Za premik v Stanovalec potrebuješ MANAGE_USERS in MANAGE_PERMISSIONS.', cardinality(member_ids);
        END IF;

        IF NOT public.is_admin_user(public.get_current_base_user_id())
           AND EXISTS (SELECT 1 FROM unnest(member_ids) m WHERE public.is_admin_user(m)) THEN
            RAISE EXCEPTION 'Only admins can change the vloga of an admin.';
        END IF;

        SELECT id INTO resident_id FROM public.permission_groups
        WHERE lower(name) = 'stanovalec' OR lower(display_name) = 'stanovalec'
        ORDER BY id LIMIT 1;
        IF resident_id IS NULL THEN
            RAISE EXCEPTION 'Vloga Stanovalec ne obstaja.';
        END IF;

        resident_preset := public.group_preset(resident_id);
        UPDATE public.base_users SET permgroup_id = resident_id
        WHERE id = ANY (member_ids);
        FOREACH member_id IN ARRAY member_ids LOOP
            PERFORM public.replace_user_permissions(member_id, resident_preset);
        END LOOP;
    END IF;

    DELETE FROM public.permgroup_permissions WHERE group_id = p_group_id;
    DELETE FROM public.permission_groups WHERE id = p_group_id;
END;
$$;

ALTER FUNCTION public.delete_permission_group(bigint) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.delete_permission_group(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_permission_group(bigint) TO authenticated, service_role;
