-- =============================================================================
-- Fix: 3 tables from migrate 20260504030000 that never got created on remote
-- Tables: widget_partners, live_snaps, nudges
-- =============================================================================

-- 1. WIDGET PARTNERS
create table if not exists public.widget_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  partner_id uuid not null references public.profiles(id) on delete cascade,
  priority int default 1,
  last_synced_at timestamp with time zone default now(),
  is_pinned boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint unique_widget_partner unique(user_id, partner_id),
  constraint different_users check(user_id != partner_id)
);

create index if not exists idx_widget_partners_user on public.widget_partners(user_id);
create index if not exists idx_widget_partners_partner on public.widget_partners(partner_id);

alter table public.widget_partners enable row level security;

drop policy if exists widget_partners_select_own on public.widget_partners;
create policy widget_partners_select_own
  on public.widget_partners for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists widget_partners_insert_own on public.widget_partners;
create policy widget_partners_insert_own
  on public.widget_partners for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists widget_partners_update_own on public.widget_partners;
create policy widget_partners_update_own
  on public.widget_partners for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists widget_partners_delete_own on public.widget_partners;
create policy widget_partners_delete_own
  on public.widget_partners for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 2. LIVE SNAPS
create table if not exists public.live_snaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text not null,
  water_amount_ml int,
  snap_type text default 'water_intake',
  visibility text default 'public',
  taken_at timestamp with time zone not null,
  is_verified boolean default false,
  has_blur boolean default false,
  like_count int default 0,
  comment_count int default 0,
  nudge_count int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_live_snaps_user on public.live_snaps(user_id);
create index if not exists idx_live_snaps_created on public.live_snaps(created_at desc);
create index if not exists idx_live_snaps_visibility on public.live_snaps(visibility);

alter table public.live_snaps enable row level security;

drop policy if exists live_snaps_select_public on public.live_snaps;
create policy live_snaps_select_public
  on public.live_snaps for select to authenticated
  using (
    visibility = 'public'
    or (select auth.uid()) = user_id
    or visibility = 'followers' and exists (
      select 1 from public.social_follows
      where follower_id = (select auth.uid())
        and following_id = live_snaps.user_id
    )
  );

drop policy if exists live_snaps_insert_own on public.live_snaps;
create policy live_snaps_insert_own
  on public.live_snaps for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists live_snaps_update_own on public.live_snaps;
create policy live_snaps_update_own
  on public.live_snaps for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists live_snaps_delete_own on public.live_snaps;
create policy live_snaps_delete_own
  on public.live_snaps for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 3. NUDGES
create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  nudge_type text not null default 'reminder',
  related_entity_id uuid,
  related_entity_type text,
  message text,
  is_read boolean default false,
  read_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  constraint different_users_nudge check(from_user_id != to_user_id)
);

create index if not exists idx_nudges_from on public.nudges(from_user_id);
create index if not exists idx_nudges_to on public.nudges(to_user_id);
create index if not exists idx_nudges_created on public.nudges(created_at desc);
create index if not exists idx_nudges_unread on public.nudges(to_user_id, is_read) where not is_read;

alter table public.nudges enable row level security;

drop policy if exists nudges_select_own on public.nudges;
create policy nudges_select_own
  on public.nudges for select to authenticated
  using (
    (select auth.uid()) = to_user_id
    or (select auth.uid()) = from_user_id
  );

drop policy if exists nudges_insert_own on public.nudges;
create policy nudges_insert_own
  on public.nudges for insert to authenticated
  with check ((select auth.uid()) = from_user_id);

drop policy if exists nudges_update_own on public.nudges;
create policy nudges_update_own
  on public.nudges for update to authenticated
  using ((select auth.uid()) = to_user_id)
  with check ((select auth.uid()) = to_user_id);

-- 4. NUDGE AUTO-READ TRIGGER
create or replace function public.mark_nudge_as_read()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_read and old.is_read is false then
    new.read_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_mark_nudge_read on public.nudges;
create trigger trg_mark_nudge_read
  before update on public.nudges
  for each row
  execute function public.mark_nudge_as_read();

-- 5. GRANTS
grant select, insert, update, delete on public.widget_partners to authenticated;
grant select, insert, update, delete on public.live_snaps to authenticated;
grant select, insert, update on public.nudges to authenticated;
grant execute on function public.mark_nudge_as_read() to authenticated;
