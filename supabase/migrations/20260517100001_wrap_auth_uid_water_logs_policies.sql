-- Wrap auth.uid() in subquery for water_logs RLS policies (InitPlan fix)
-- These 4 policies were missed by 20260517030000_fix_rls_auth_initplan.sql

drop policy if exists "water_logs_select_own" on public.water_logs;
create policy "water_logs_select_own"
  on public.water_logs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "water_logs_insert_own" on public.water_logs;
create policy "water_logs_insert_own"
  on public.water_logs
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "water_logs_update_own" on public.water_logs;
create policy "water_logs_update_own"
  on public.water_logs
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "water_logs_delete_own" on public.water_logs;
create policy "water_logs_delete_own"
  on public.water_logs
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
