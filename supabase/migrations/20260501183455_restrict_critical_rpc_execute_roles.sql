-- Defense in depth: only signed-in users may execute client-facing privileged RPCs.
-- The functions still enforce auth.uid() ownership internally.

revoke all on function public.purchase_item(uuid, text) from public, anon;
revoke all on function public.claim_quest_reward(uuid, uuid) from public, anon;
revoke all on function public.process_hydration_event(uuid, integer, numeric, integer, boolean) from public, anon;

grant execute on function public.purchase_item(uuid, text) to authenticated;
grant execute on function public.claim_quest_reward(uuid, uuid) to authenticated;
grant execute on function public.process_hydration_event(uuid, integer, numeric, integer, boolean) to authenticated;
