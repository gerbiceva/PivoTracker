-- Vladajoči: the dom's government (predsednik, namestnik, ministri) listed as
-- a contact list for every logged-in user. Which vloge are listed is decided
-- by permission_groups.tier (see 20261014120000_permission_group_tiers.sql);
-- this adds how a listed vloga is shown. Values are set on the Vloge page.

ALTER TABLE public.permission_groups
    ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 100,
    ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
