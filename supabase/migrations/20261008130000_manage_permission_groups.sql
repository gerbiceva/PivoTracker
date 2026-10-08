-- Creating, renaming and deleting vloge (permission groups) from the Vloge
-- page. Like set_group_permissions, everything needs MANAGE_GROUPS and goes
-- through these functions (permission_groups has no write policies).
-- The admin group is dev-only and cannot be renamed or deleted; Stanovalec is
-- the default vloga ("Ponastavi na stanovalca") and cannot be deleted.

CREATE OR REPLACE FUNCTION public.create_permission_group(p_display_name text)
RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
DECLARE
    display text := btrim(p_display_name);
    base_name text;
    new_name text;
    suffix int := 1;
    new_id bigint;
BEGIN
    IF NOT public.current_user_has_permission('MANAGE_GROUPS') THEN
        RAISE EXCEPTION 'Insufficient permissions: User does not have MANAGE_GROUPS.';
    END IF;

    IF display = '' THEN
        RAISE EXCEPTION 'Ime vloge ne sme biti prazno.';
    END IF;

    -- internal name: lowercase ascii slug of the display name, made unique
    base_name := btrim(regexp_replace(lower(display), '[^a-z0-9]+', '_', 'g'), '_');
    IF base_name = '' OR base_name = 'admin' THEN
        base_name := 'vloga';
    END IF;
    new_name := base_name;
    WHILE EXISTS (SELECT 1 FROM public.permission_groups WHERE name = new_name) LOOP
        suffix := suffix + 1;
        new_name := base_name || '_' || suffix;
    END LOOP;

    INSERT INTO public.permission_groups (name, display_name)
    VALUES (new_name, display)
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rename_permission_group(
    p_group_id bigint,
    p_display_name text
) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
BEGIN
    IF NOT public.current_user_has_permission('MANAGE_GROUPS') THEN
        RAISE EXCEPTION 'Insufficient permissions: User does not have MANAGE_GROUPS.';
    END IF;

    IF btrim(p_display_name) = '' THEN
        RAISE EXCEPTION 'Ime vloge ne sme biti prazno.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.permission_groups WHERE id = p_group_id AND name = 'admin') THEN
        RAISE EXCEPTION 'The admin group cannot be modified.';
    END IF;

    -- only the shown name changes; the internal name stays stable
    UPDATE public.permission_groups
    SET display_name = btrim(p_display_name)
    WHERE id = p_group_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Permission group % does not exist.', p_group_id;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_permission_group(p_group_id bigint)
RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
DECLARE
    g public.permission_groups;
    members int;
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

    -- don't silently strip people of their vloga
    SELECT count(*) INTO members FROM public.base_users WHERE permgroup_id = p_group_id;
    IF members > 0 THEN
        RAISE EXCEPTION 'Vloga ima še % uporabnikov. Najprej jim določi drugo vlogo.', members;
    END IF;

    DELETE FROM public.permgroup_permissions WHERE group_id = p_group_id;
    DELETE FROM public.permission_groups WHERE id = p_group_id;
END;
$$;

ALTER FUNCTION public.create_permission_group(text) OWNER TO postgres;
ALTER FUNCTION public.rename_permission_group(bigint, text) OWNER TO postgres;
ALTER FUNCTION public.delete_permission_group(bigint) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.create_permission_group(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rename_permission_group(bigint, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_permission_group(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_permission_group(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rename_permission_group(bigint, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_permission_group(bigint) TO authenticated, service_role;
