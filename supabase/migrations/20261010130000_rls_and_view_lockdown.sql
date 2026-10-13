-- Close gaps found in the RLS audit:
--   1. zelje had policies but RLS was off, so they were ignored
--   2. gerba_storage had no RLS at all
--   3. views run as their owner (postgres) unless security_invoker is set, so
--      they skip the underlying tables' RLS, and anon could read all of them
--      (user_view exposed everyone's email, phone and birth date)

-- 1. zelje: turn on RLS so the existing (authenticated-only) policies apply.
-- add_zelje_song / react_to_zelje are SECURITY INVOKER, so they keep working
-- for logged-in users through the same policies.
ALTER TABLE public.zelje ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.zelje FROM anon;

-- 2. gerba_storage (nabava): only people managing transactions.
ALTER TABLE public.gerba_storage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.gerba_storage FROM anon;
CREATE POLICY gerba_storage_manage_transactions ON public.gerba_storage
    FOR ALL TO authenticated
    USING (public.current_user_has_permission('MANAGE_TRANSACTIONS'))
    WITH CHECK (public.current_user_has_permission('MANAGE_TRANSACTIONS'));

-- 3a. No view is meant for logged-out visitors.
REVOKE ALL ON TABLE
    public.user_view,
    public.user_permissions_view,
    public.named_transactions,
    public.obljube_with_user_info,
    public.top_obljube_users_sum,
    public.monthly_summary,
    public.weekly_summary,
    public.total_summary,
    public.everything,
    public.everything_sum
FROM anon;

-- 3b. Views are read-only; drop the write grants that came with GRANT ALL.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE
    public.user_view,
    public.user_permissions_view,
    public.named_transactions,
    public.obljube_with_user_info,
    public.top_obljube_users_sum,
    public.monthly_summary,
    public.weekly_summary,
    public.total_summary,
    public.everything,
    public.everything_sum
FROM authenticated;

-- 3c. Respect the caller's RLS where it changes nothing for the app: the
-- obljube tables and base_users are readable by every logged-in user, and the
-- monthly/total summaries aren't used anywhere.
ALTER VIEW public.obljube_with_user_info SET (security_invoker = on);
ALTER VIEW public.top_obljube_users_sum SET (security_invoker = on);
ALTER VIEW public.monthly_summary SET (security_invoker = on);
ALTER VIEW public.total_summary SET (security_invoker = on);

-- Deliberately still owner-rights (would break with security_invoker):
--   user_view             reads auth.users for the email
--   user_permissions_view every user loads their own permissions through it,
--                         but permissions is only readable with MANAGE_PERMISSIONS
--   named_transactions,   the /pivo dashboard shows everyone's transactions to
--   weekly_summary        every logged-in user; transactions RLS only allows own
