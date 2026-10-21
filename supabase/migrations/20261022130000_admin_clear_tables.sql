-- Admin-only "clear everything" for obljube, transakcije and dogodki.
-- obljube_poplacila points at both obljube and transactions, so it is
-- cleared together with either of them.

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path = ''
    AS $$
  SELECT public.is_admin_user(public.get_current_base_user_id());
$$;

ALTER FUNCTION public.current_user_is_admin() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_clear_table(p_table text)
RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = ''
    AS $$
BEGIN
    IF NOT public.current_user_is_admin() THEN
        RAISE EXCEPTION 'Only admins can clear tables.';
    END IF;

    CASE p_table
        WHEN 'obljube' THEN
            TRUNCATE public.obljube, public.obljube_poplacila RESTART IDENTITY;
        WHEN 'transactions' THEN
            TRUNCATE public.transactions, public.obljube_poplacila RESTART IDENTITY;
        WHEN 'events' THEN
            TRUNCATE public.events RESTART IDENTITY;
        ELSE
            RAISE EXCEPTION 'Table % cannot be cleared.', p_table;
    END CASE;
END;
$$;

ALTER FUNCTION public.admin_clear_table(text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.admin_clear_table(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_clear_table(text) TO authenticated, service_role;
