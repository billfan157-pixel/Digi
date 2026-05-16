revoke all on table public.conversations from public, anon, authenticated;

revoke all on function public.increment_ai_usage(uuid, text) from public, anon, authenticated;
revoke all on function public.is_premium(uuid) from public, anon, authenticated;
