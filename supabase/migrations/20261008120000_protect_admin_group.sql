-- Only admins may put someone into or take someone out of the admin group,
-- or change an admin's row at all. set_user_group already checks this, but
-- the base_users RLS policies let MANAGE_USERS (update) and ENROLL (insert)
-- write permgroup_id directly, which skipped that check.
-- Server-side callers without a logged-in user (service role, edge
-- functions, migrations) have no auth.uid() and are not restricted.

CREATE OR REPLACE FUNCTION public.guard_admin_group() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
DECLARE
    admin_id bigint;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    IF public.is_admin_user(public.get_current_base_user_id()) THEN
        RETURN NEW;
    END IF;

    SELECT id INTO admin_id FROM public.permission_groups WHERE name = 'admin';

    IF TG_OP = 'INSERT' THEN
        IF NEW.permgroup_id IS NOT DISTINCT FROM admin_id AND admin_id IS NOT NULL THEN
            RAISE EXCEPTION 'Only admins can assign the admin group.';
        END IF;
        RETURN NEW;
    END IF;

    IF OLD.permgroup_id IS NOT DISTINCT FROM admin_id AND admin_id IS NOT NULL THEN
        RAISE EXCEPTION 'Only admins can change an admin user.';
    END IF;

    IF NEW.permgroup_id IS NOT DISTINCT FROM admin_id AND admin_id IS NOT NULL THEN
        RAISE EXCEPTION 'Only admins can assign the admin group.';
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION public.guard_admin_group() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.guard_admin_group() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_admin_group ON public.base_users;
CREATE TRIGGER guard_admin_group
    BEFORE INSERT OR UPDATE ON public.base_users
    FOR EACH ROW EXECUTE FUNCTION public.guard_admin_group();
