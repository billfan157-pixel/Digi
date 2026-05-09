-- Create the ai_usage table required by consume_ai_usage RPC function.
-- This table was referenced in consume_ai_usage but never created by a prior migration.

create table if not exists public.ai_usage (
  user_id    uuid    not null references auth.users(id) on delete cascade,
  date       date    not null default current_date,
  message_count integer not null default 0,
  advice_count  integer not null default 0,
  scan_count    integer not null default 0,
  primary key (user_id, date)
);

alter table public.ai_usage enable row level security;

-- Users can only read their own usage rows (the RPC writes via security definer)
drop policy if exists ai_usage_select_own on public.ai_usage;
create policy ai_usage_select_own
  on public.ai_usage
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- No direct insert/update/delete from client — all writes go through consume_ai_usage (security definer)
revoke insert, update, delete on public.ai_usage from authenticated, anon;
