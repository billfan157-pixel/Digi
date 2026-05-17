-- Create delete_account_and_auth RPC
-- Deletes the authenticated user's account:
-- 1. Deletes from auth.users (cascades to profiles via FK, cascades to all user data)
-- 2. Storage orphan cleanup can be handled separately

create or replace function public.delete_account_and_auth()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  -- Delete auth user → cascades to profiles → cascades to all related tables
  delete from auth.users where id = auth.uid();

  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.delete_account_and_auth() from public;
grant execute on function public.delete_account_and_auth() to authenticated;
