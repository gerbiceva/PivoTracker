-- permission_groups.tier (added in the dashboard):
--   0 = Stanovalec, the default vloga
--   1 = admin, dev-only
--   2 = shown on the Vladajoči page
--   3 = not shown (default for new vloge)
-- 0 and 1 are fixed; MANAGE_GROUPS can switch other vloge between 2 and 3.

ALTER TABLE public.permission_groups
    ADD COLUMN IF NOT EXISTS tier smallint NOT NULL DEFAULT 3;
ALTER TABLE public.permission_groups
    ALTER COLUMN tier SET DEFAULT 3;

ALTER TABLE public.permission_groups
    DROP CONSTRAINT IF EXISTS permission_groups_tier_check;
ALTER TABLE public.permission_groups
    ADD CONSTRAINT permission_groups_tier_check CHECK (tier IN (0, 1, 2, 3));

COMMENT ON COLUMN public.permission_groups.tier IS
    '0 = stanovalec, 1 = admin, 2 = shown on Vladajoči, 3 = not shown';

-- base_users / residents are not readable by normal residents, so the list
-- goes through this function and exposes only the contact fields.
-- Listed vloge with nobody in them still return one row (null user), so the
-- page can show them as vacant.
CREATE OR REPLACE FUNCTION public.get_vladajoci()
RETURNS TABLE(
    group_id bigint,
    group_name text,
    description text,
    sort_order integer,
    base_user_id bigint,
    name text,
    surname text,
    room integer,
    floor integer,
    phone_number text
)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path = ''
    AS $$
    SELECT
        g.id,
        coalesce(nullif(g.display_name, ''), g.name),
        g.description,
        g.sort_order,
        bu.id,
        bu.name,
        bu.surname,
        r.room::integer,
        (r.room / 100)::integer,
        nullif(btrim(r.phone_number), '')
    FROM public.permission_groups g
    LEFT JOIN public.base_users bu ON bu.permgroup_id = g.id
    LEFT JOIN public.residents r ON r.id = bu.resident
    WHERE g.tier = 2
      AND (SELECT auth.uid()) IS NOT NULL
    ORDER BY g.sort_order, g.id, r.room, bu.surname, bu.name;
$$;

REVOKE ALL ON FUNCTION public.get_vladajoci() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_vladajoci() TO authenticated, service_role;

-- The Vladajoči checkbox on the Vloge page.
CREATE OR REPLACE FUNCTION public.set_permission_group_tier(
    p_group_id bigint,
    p_tier smallint
) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
DECLARE
    g public.permission_groups;
BEGIN
    IF NOT public.current_user_has_permission('MANAGE_GROUPS') THEN
        RAISE EXCEPTION 'Insufficient permissions: User does not have MANAGE_GROUPS.';
    END IF;

    IF p_tier NOT IN (2, 3) THEN
        RAISE EXCEPTION 'Tier can only be set to 2 (shown) or 3 (hidden).';
    END IF;

    SELECT * INTO g FROM public.permission_groups WHERE id = p_group_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Permission group % does not exist.', p_group_id;
    END IF;

    IF g.tier = 1 OR g.name = 'admin' THEN
        RAISE EXCEPTION 'The admin group cannot be modified.';
    END IF;

    IF g.tier = 0 OR g.name = 'stanovalec' THEN
        RAISE EXCEPTION 'Vloga Stanovalec ne more biti med vladajočimi.';
    END IF;

    UPDATE public.permission_groups SET tier = p_tier WHERE id = p_group_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_permission_group_tier(bigint, smallint) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_permission_group_tier(bigint, smallint) TO authenticated, service_role;

-- How a listed vloga shows up: order and description.
CREATE OR REPLACE FUNCTION public.set_permission_group_listing(
    p_group_id bigint,
    p_sort_order integer,
    p_description text
) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
BEGIN
    IF NOT public.current_user_has_permission('MANAGE_GROUPS') THEN
        RAISE EXCEPTION 'Insufficient permissions: User does not have MANAGE_GROUPS.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.permission_groups
        WHERE id = p_group_id AND (tier = 1 OR name = 'admin')
    ) THEN
        RAISE EXCEPTION 'The admin group cannot be modified.';
    END IF;

    UPDATE public.permission_groups
    SET sort_order = p_sort_order,
        description = btrim(coalesce(p_description, ''))
    WHERE id = p_group_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Permission group % does not exist.', p_group_id;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_permission_group_listing(bigint, integer, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_permission_group_listing(bigint, integer, text) TO authenticated, service_role;
