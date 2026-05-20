-- =============================================================================
-- Sprint 12: Product Analytics — analytics_events table
-- =============================================================================

create table if not exists public.analytics_events (
  id bigint primary key generated always as identity,
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  properties jsonb default '{}'::jsonb,
  session_id text,
  created_at timestamptz not null default now()
);

create index idx_analytics_events_name on public.analytics_events(event_name);
create index idx_analytics_events_user on public.analytics_events(user_id);
create index idx_analytics_events_created on public.analytics_events(created_at desc);
create index idx_analytics_events_name_created on public.analytics_events(event_name, created_at desc);

alter table public.analytics_events enable row level security;

-- Admins can read all events
drop policy if exists analytics_events_select_admin on public.analytics_events;

-- Authenticated users can insert events
drop policy if exists analytics_events_insert on public.analytics_events;
create policy analytics_events_insert
on public.analytics_events
for insert
to authenticated
with check (true);

grant select, insert on public.analytics_events to authenticated;
grant usage on sequence analytics_events_id_seq to authenticated;
