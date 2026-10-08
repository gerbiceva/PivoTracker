-- Only admins may delete an admin user. guard_admin_group covers INSERT and
-- UPDATE only, so the base_users delete policy (MANAGE_USERS) let anyone with
-- that permission remove admins directly. The delete-user edge function runs
-- as service role and does its own check.

CREATE OR REPLACE FUNCTION public.guard_admin_delete() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN OLD;
    END IF;

    IF public.is_admin_user(OLD.id)
       AND NOT public.is_admin_user(public.get_current_base_user_id()) THEN
        RAISE EXCEPTION 'Only admins can delete an admin user.';
    END IF;

    RETURN OLD;
END;
$$;

ALTER FUNCTION public.guard_admin_delete() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.guard_admin_delete() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_admin_delete ON public.base_users;
CREATE TRIGGER guard_admin_delete
    BEFORE DELETE ON public.base_users
    FOR EACH ROW EXECUTE FUNCTION public.guard_admin_delete();
