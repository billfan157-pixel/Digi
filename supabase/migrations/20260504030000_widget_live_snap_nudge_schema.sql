-- =============================================================================
-- Phase 1: Widget Infrastructure + Live Snap + Nudge System
-- Date: 2026-05-04
-- =============================================================================

-- =====================================================================
-- 1. WIDGET PARTNERS TABLE
-- =====================================================================

create table if not exists public.widget_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  partner_id uuid not null references public.profiles(id) on delete cascade,
  
  -- Widget display priority (1-5, lower = higher priority)
  priority int default 1,
  
  -- Last time widget was synced
  last_synced_at timestamp with time zone default now(),
  
  -- Is this partner currently pinned to widget
  is_pinned boolean default false,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  constraint unique_widget_partner unique(user_id, partner_id),
  constraint different_users check(user_id != partner_id)
);

create index idx_widget_partners_user on public.widget_partners(user_id);
create index idx_widget_partners_partner on public.widget_partners(partner_id);

-- Enable RLS
alter table public.widget_partners enable row level security;

drop policy if exists widget_partners_select_own on public.widget_partners;
create policy widget_partners_select_own
on public.widget_partners
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists widget_partners_insert_own on public.widget_partners;
create policy widget_partners_insert_own
on public.widget_partners
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists widget_partners_update_own on public.widget_partners;
create policy widget_partners_update_own
on public.widget_partners
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists widget_partners_delete_own on public.widget_partners;
create policy widget_partners_delete_own
on public.widget_partners
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- =====================================================================
-- 2. LIVE SNAPS TABLE
-- =====================================================================

create table if not exists public.live_snaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  
  -- Image URL (stored in storage:social-media)
  image_url text not null,
  
  -- Auto-generated caption (e.g., "+500ml", "Streak 30 days")
  caption text not null,
  
  -- Amount of water added (in ml)
  water_amount_ml int,
  
  -- Snap type: 'water_intake' | 'streak_milestone' | 'challenge_win' | 'general'
  snap_type text default 'water_intake',
  
  -- Post visibility: 'public' | 'followers' | 'private'
  visibility text default 'public',
  
  -- Timestamp when snap was taken (not uploaded)
  taken_at timestamp with time zone not null,
  
  -- Is snap verified (face blur applied, no filters detected)
  is_verified boolean default false,
  
  -- Auto-blur applied to faces
  has_blur boolean default false,
  
  -- Post related stats
  like_count int default 0,
  comment_count int default 0,
  nudge_count int default 0,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_live_snaps_user on public.live_snaps(user_id);
create index idx_live_snaps_created on public.live_snaps(created_at desc);
create index idx_live_snaps_visibility on public.live_snaps(visibility);

-- Enable RLS
alter table public.live_snaps enable row level security;

drop policy if exists live_snaps_select_public on public.live_snaps;
create policy live_snaps_select_public
on public.live_snaps
for select
to authenticated
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
on public.live_snaps
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists live_snaps_update_own on public.live_snaps;
create policy live_snaps_update_own
on public.live_snaps
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists live_snaps_delete_own on public.live_snaps;
create policy live_snaps_delete_own
on public.live_snaps
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- =====================================================================
-- 3. NUDGES TABLE (Instant Nudge / Taps)
-- =====================================================================

create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  
  -- Who sent the nudge
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  
  -- Who received the nudge
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  
  -- Nudge type: 'reminder' (💧 "Nốc nước đi!") | 'cheer' (🍻 "Cấp sao!")
  nudge_type text not null default 'reminder',
  
  -- Related entity (optional): live_snap_id, hydration_battle_id
  related_entity_id uuid,
  related_entity_type text, -- 'live_snap' | 'battle' | 'streak'
  
  -- Custom message (optional, max 100 chars)
  message text,
  
  -- Is nudge read on recipient side
  is_read boolean default false,
  
  -- When read
  read_at timestamp with time zone,
  
  created_at timestamp with time zone default now(),
  
  constraint different_users_nudge check(from_user_id != to_user_id)
);

create index idx_nudges_from on public.nudges(from_user_id);
create index idx_nudges_to on public.nudges(to_user_id);
create index idx_nudges_created on public.nudges(created_at desc);
create index idx_nudges_unread on public.nudges(to_user_id, is_read) where not is_read;

-- Enable RLS
alter table public.nudges enable row level security;

drop policy if exists nudges_select_own on public.nudges;
create policy nudges_select_own
on public.nudges
for select
to authenticated
using (
  (select auth.uid()) = to_user_id
  or (select auth.uid()) = from_user_id
);

drop policy if exists nudges_insert_own on public.nudges;
create policy nudges_insert_own
on public.nudges
for insert
to authenticated
with check ((select auth.uid()) = from_user_id);

drop policy if exists nudges_update_own on public.nudges;
create policy nudges_update_own
on public.nudges
for update
to authenticated
using ((select auth.uid()) = to_user_id)
with check ((select auth.uid()) = to_user_id);

-- =====================================================================
-- 4. WIDGET CACHE TABLE (For realtime widget updates)
-- =====================================================================

create table if not exists public.widget_cache (
  id uuid primary key default gen_random_uuid(),
  
  -- Widget owner
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  
  -- Cached partner data (JSON)
  partner_data jsonb,
  
  -- Last updated
  updated_at timestamp with time zone default now(),
  
  -- Version for invalidation
  version int default 1
);

create index idx_widget_cache_user on public.widget_cache(user_id);

-- Enable RLS
alter table public.widget_cache enable row level security;

drop policy if exists widget_cache_select_own on public.widget_cache;
create policy widget_cache_select_own
on public.widget_cache
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists widget_cache_update_own on public.widget_cache;
create policy widget_cache_update_own
on public.widget_cache
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- =====================================================================
-- 5. REALTIME TRIGGERS
-- =====================================================================

-- Update widget cache when water logs change
create or replace function public.update_widget_cache_on_water_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Increment widget cache version for this user
  update widget_cache
  set version = version + 1,
      updated_at = now()
  where user_id = new.user_id;
  
  return new;
end;
$$;

-- Trigger on water_logs insert/update
drop trigger if exists trg_update_widget_cache_on_water on public.water_logs;
create trigger trg_update_widget_cache_on_water
after insert or update on public.water_logs
for each row
execute function public.update_widget_cache_on_water_log();

-- Create widget_cache entry when profile is created
create or replace function public.create_widget_cache_on_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into widget_cache(user_id, version)
  values(new.id, 1)
  on conflict(user_id) do nothing;
  
  return new;
end;
$$;

drop trigger if exists trg_create_widget_cache on public.profiles;
create trigger trg_create_widget_cache
after insert on public.profiles
for each row
execute function public.create_widget_cache_on_profile();

-- Mark nudges as read automatically when viewed
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

-- =====================================================================
-- 6. GRANT PERMISSIONS
-- =====================================================================

grant select, insert, update, delete on public.widget_partners to authenticated;
grant select, insert, update, delete on public.live_snaps to authenticated;
grant select, insert, update on public.nudges to authenticated;
grant select, update on public.widget_cache to authenticated;

grant execute on function public.update_widget_cache_on_water_log() to authenticated;
grant execute on function public.create_widget_cache_on_profile() to authenticated;
grant execute on function public.mark_nudge_as_read() to authenticated;
