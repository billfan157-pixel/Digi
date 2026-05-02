-- 1. Validate and Enforce RLS on water_logs
alter table public.water_logs enable row level security;

drop policy if exists "water_logs_select_own" on public.water_logs;
create policy "water_logs_select_own"
on public.water_logs
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "water_logs_insert_own" on public.water_logs;
create policy "water_logs_insert_own"
on public.water_logs
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "water_logs_update_own" on public.water_logs;
create policy "water_logs_update_own"
on public.water_logs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "water_logs_delete_own" on public.water_logs;
create policy "water_logs_delete_own"
on public.water_logs
for delete
to authenticated
using (auth.uid() = user_id);

-- 2. Add Trigger to Keep social_posts.like_count in sync with social_post_likes
create or replace function public.update_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.social_posts
    set like_count = like_count + 1
    where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.social_posts
    set like_count = greatest(like_count - 1, 0)
    where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_like_change on public.social_post_likes;
create trigger on_like_change
after insert or delete on public.social_post_likes
for each row execute function public.update_post_like_count();
