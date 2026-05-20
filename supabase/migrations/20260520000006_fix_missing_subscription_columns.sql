-- Add missing columns to profiles
-- stripe_customer_id was referenced by stripe-webhook and stripe-portal but never created
-- role was referenced by analytics_events RLS and adminQueries but never created

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Admin RLS for analytics_events (moved here after role column exists)
create policy analytics_events_select_admin
on public.analytics_events
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.profiles
    where id = (select auth.uid())
    and role = 'admin'
  )
);

-- Admin RLS for reports (previously in sprint14 migration, moved after role column)
create policy reports_select_own
  on public.reports for select
  to authenticated
  using (
    (select auth.uid()) = reporter_id
    or exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role = 'admin'
    )
  );

create policy reports_update_admin
  on public.reports for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid())
        and role = 'admin'
    )
  );

