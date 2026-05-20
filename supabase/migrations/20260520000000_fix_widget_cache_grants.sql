-- =============================================================================
-- Fix widget_cache: add INSERT grant + backfill rows for existing profiles
-- Sprint 11 — Widget Productionization
-- =============================================================================

-- 1. Grant INSERT on widget_cache (currently only select, update)
grant insert on public.widget_cache to authenticated;

-- 2. Backfill widget_cache rows for existing profiles that don't have one
-- (trigger only fires on new profile inserts, so existing users are missing rows)
insert into public.widget_cache (user_id)
select id from public.profiles
where id not in (select user_id from public.widget_cache)
on conflict (user_id) do nothing;
