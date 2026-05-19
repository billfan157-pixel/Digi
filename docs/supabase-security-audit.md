# Supabase Security Audit - Sprint 2

Baseline date: 2026-05-19

## Scope

This audit covers the local Supabase project files:

- Edge Functions in `supabase/functions/`
- RLS evidence in `supabase/migrations/`
- frontend/server key exposure search across the repo
- RPC execute grants visible in migrations

No database schema was changed in this sprint. Live production RLS must still be confirmed in the Supabase SQL editor because migrations can drift from the deployed database.

## Edge Function Status

| Function | Auth model | Privileged key use | Rate limit | Notes |
|----------|------------|--------------------|------------|-------|
| `ai-gateway` | Requires user JWT via anon client | No service role | `RATE_LIMITS.aiGateway` + `consume_ai_usage` RPC | Shared limiter protects function capacity; DB usage limiter protects daily AI quotas. |
| `calendar-proxy` | Requires user JWT via anon client | Optional service role only for resolving stored Google refresh token | `RATE_LIMITS.calendarProxy` | Google token refresh is server-side; user auth is checked before calls. |
| `create-stripe-checkout` | Requires user JWT via anon client | Stripe secret only | `RATE_LIMITS.stripeCheckout` | Uses authenticated user id for Stripe metadata. |
| `stripe-portal` | Requires user JWT via anon client | Stripe secret only | `RATE_LIMITS.stripePortal` | Reads customer id from caller's own `profiles` row. |
| `stripe-webhook` | Stripe signature verification | Supabase service role for subscription writes | `RATE_LIMITS.stripeWebhook` by client IP headers | Signature is verified before mutating data. |
| `delete-account` | Requires user JWT via anon client | Requires service role env to be configured, but account deletion happens through authenticated RPC | `RATE_LIMITS.deleteAccount` | RPC authorization must remain strict. |
| `send-push-notification` | Requires user JWT via anon client | No service role | `RATE_LIMITS.pushNotification` | Target user is forced to `auth.uid()`; callers cannot choose another user id. |

## Rate Limiting

Shared limiter: `supabase/functions/_shared/rateLimit.ts`.

Presets currently used:

| Preset | Limit |
|--------|-------|
| `aiGateway` | 60 requests / 60s |
| `stripeCheckout` | 5 requests / 60s |
| `stripePortal` | 5 requests / 60s |
| `stripeWebhook` | 120 requests / 60s |
| `deleteAccount` | 1 request / 3600s |
| `calendarProxy` | 30 requests / 60s |
| `pushNotification` | 30 requests / 60s |

Implementation uses Deno KV when available and falls back to in-memory storage per isolate. The fallback is acceptable as a safety net, but production-grade abuse protection should also use Supabase platform/WAF limits if traffic grows.

## RLS Evidence From Migrations

Confirmed by local migration search:

- `water_logs`: RLS enabled and own-row policies exist, later optimized with `select auth.uid()` wrapper.
- `profiles`: duplicate policies cleaned up; own-row select/update/delete policies exist.
- `public_profiles`: separate public profile table exists with restricted grants and authenticated select.
- `ai_usage`: RLS enabled; direct write revoked; writes go through `consume_ai_usage`.
- `ai_conversations` and `ai_messages`: RLS enabled with owner policies.
- `push_subscriptions`: RLS enabled with own select/insert/delete policies.
- `widget_partners`, `live_snaps`, `nudges`, `widget_cache`: RLS enabled in widget/live snap migration.
- Several social/economy tables have explicit policies in `20260502101200_add_missing_rls_policies.sql` and related social migrations.

Live SQL editor verification still needed:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Expected: every user-data table in exposed schema has `rowsecurity = true`. Static config tables can be readable to authenticated users, but should still have RLS enabled where exposed.

## RPC Execute Grants

Visible hardened grants/revokes in migrations include:

| RPC | Expected role |
|-----|---------------|
| `purchase_item(uuid, text)` | `authenticated` |
| `claim_quest_reward(uuid, uuid)` | `authenticated` |
| `process_hydration_event(uuid, integer, numeric, integer, boolean)` | `authenticated` |
| `consume_ai_usage(text)` | `authenticated` |
| `join_club(uuid, uuid)` | `authenticated` |
| `accept_battle(uuid, uuid)` | `authenticated` |
| `get_profile_stats(uuid)` | `authenticated` |
| `assign_daily_quests(uuid)` | `authenticated`, `service_role` |
| `drop_water_to_post(uuid, uuid, uuid, integer)` | `authenticated`, `service_role` |
| `increment_club_member_intake(uuid, uuid, integer)` | `authenticated`, `service_role` |
| `delete_account_and_auth()` | `authenticated` |

Live SQL editor verification:

```sql
select n.nspname as schema,
       p.proname as function,
       pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef as security_definer,
       p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
order by n.nspname, p.proname;
```

Review any `security_definer = true` function and confirm it either lives in a non-exposed schema or has strict execute grants plus internal `auth.uid()` authorization checks.

## Key Exposure Audit

Repo search found:

- Frontend Supabase config only reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- No `SUPABASE_SERVICE_ROLE_KEY` usage under `src/`.
- Service role usage is limited to edge functions/migrations/docs.
- Stripe and VAPID secrets are read only through `Deno.env` in edge functions or documented as environment secrets.

Current acceptable public env vars:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN`

Never add `SUPABASE_SERVICE_ROLE_KEY`, Stripe secret keys, VAPID private key, Google client secret, or Supabase PAT to any `VITE_*` variable.

## Residual Risks

- Several functions still use wildcard CORS (`*`). This is not sufficient as an auth boundary, but tightening it requires testing web, localhost, and Capacitor origins together.
- `send-push-notification` currently sends only to the authenticated caller. Social/admin push fan-out should be a separate server-side/internal path with explicit authorization.
- Some migrations grant `service_role` execute on RPCs. That is normal for server jobs, but live grants should be reviewed after every migration batch.
- Deno KV rate limiting fallback is per-isolate. For serious abuse protection, add platform-level rate limits.

## Next Actions

1. Run the live SQL snippets above in Supabase SQL editor and save results in this document.
2. Tighten CORS with a shared origin helper once web + Capacitor origins are confirmed.
3. Add CI `deno check` for all edge functions after dependency caching is reliable.
4. Add Supabase advisor output review to release checklist.
