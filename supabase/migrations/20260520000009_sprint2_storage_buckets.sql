-- Sprint 2: Configure storage buckets + update delete_account cleanup

-- ============================================================
-- 1. Create storage buckets
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'live-snaps',
  'live-snaps',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-items',
  'shop-items',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- ============================================================
-- 2. RLS policies for avatars bucket
-- ============================================================
drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid() = owner);

-- ============================================================
-- 3. RLS policies for live-snaps bucket (private — owner only)
-- ============================================================
drop policy if exists "live_snaps_select_own" on storage.objects;
create policy "live_snaps_select_own"
  on storage.objects for select
  using (bucket_id = 'live-snaps' and auth.uid() = owner);

drop policy if exists "live_snaps_insert_own" on storage.objects;
create policy "live_snaps_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'live-snaps' and auth.uid() = owner);

drop policy if exists "live_snaps_delete_own" on storage.objects;
create policy "live_snaps_delete_own"
  on storage.objects for delete
  using (bucket_id = 'live-snaps' and auth.uid() = owner);

-- ============================================================
-- 4. RLS policies for shop-items bucket (public read, auth write)
-- ============================================================
drop policy if exists "shop_items_select_public" on storage.objects;
create policy "shop_items_select_public"
  on storage.objects for select
  using (bucket_id = 'shop-items');

drop policy if exists "shop_items_insert_auth" on storage.objects;
create policy "shop_items_insert_auth"
  on storage.objects for insert
  with check (bucket_id = 'shop-items' and auth.role() = 'authenticated');

-- ============================================================
-- 5. Update delete_account_and_auth to clean up storage objects
-- ============================================================
create or replace function public.delete_account_and_auth()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, storage
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  -- Delete user's storage objects (avatars, live-snaps, uploaded shop items)
  delete from storage.objects where owner = v_user_id;

  -- Delete auth user (cascades to profiles and all related user data)
  delete from auth.users where id = v_user_id;

  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.delete_account_and_auth() from public;
grant execute on function public.delete_account_and_auth() to authenticated;
