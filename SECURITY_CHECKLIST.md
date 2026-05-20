# Manual Penetration Checklist — DigiWell

> Sprint 16: Security/Compliance  
> Cập nhật: 20/05/2026

## 1. Authentication

- [x] Password re-auth required before account deletion
- [x] Rate limiting on delete account (1 attempt/hour via edge function)
- [ ] Session timeout / token refresh behavior
- [ ] Biometric unlock cannot bypass server auth

## 2. SQL/RPC Security

- [x] All 11 client-facing RPCs with user_id parameter verify `auth.uid()`
- [x] `increment_club_member_intake` — **FIXED** (was missing auth check, Sprint 16)
- [x] `delete_account_and_auth` uses `auth.uid()` only, no user_id parameter
- [x] `delete_all_user_data_secure` uses `auth.uid()` only — **CREATED** (was missing, Sprint 16)
- [x] All RPCs are `SECURITY DEFINER` — intentional for cross-table operations
- [x] `pulse_post` is a no-op — low risk, consider revoking EXECUTE

## 3. Row Level Security (RLS)

- [x] 49 policies reviewed — all use `auth.uid()` correctly
- [x] `water_logs`, `social_posts`, `ai_conversations`, `notifications`: owner-scoped
- [x] `analytics_events`: insert any auth user, select own + admin
- [x] `public_profiles`: SELECT for all authenticated (required for social features)
- [x] `reports`: SELECT own + admin, UPDATE admin only

## 4. Edge Functions

- [x] `delete-account`: rate limited, requires auth, uses service_role
- [x] `stripe-webhook`: webhook secret signed, no user auth required (intentional)
- [x] `ai-gateway`: requires auth, no hardcoded secrets
- [x] No functions expose `service_role` key to client

## 5. Client-Side Security

- [x] No hardcoded API keys/secrets in frontend code
- [x] Only Supabase anon key in frontend
- [x] Input sanitization: `sanitizeHtml()`, `sanitizeInput()` used in comments/posts
- [x] CSP headers configured in index.html
- [ ] Verify no sensitive data in localStorage/sessionStorage
- [ ] Verify no data leakage via Sentry error logs

## 6. Data Deletion & Privacy

- [x] Account deletion: two options (data-only, full account)
- [x] Data-only path (`delete_all_user_data_secure`): **CREATED** (was missing, Sprint 16)
- [x] Full account path: edge function with rate limit + cascade from auth.users
- [x] Audit logging: `audit_logs` table + `log_audit_event` RPC — **CREATED** (Sprint 16)
- [x] Privacy policy content updated in Settings (Sprint 16)
- [x] Data export covers all categories (JSON v2, Sprint 16)
- [ ] Verify storage bucket cleanup on account deletion (avatars, post images, snaps)

## 7. Known Gaps (Future Work)

| Issue | Severity | Notes |
|-------|----------|-------|
| `analytics_events` ON DELETE SET NULL | Low | Orphaned rows with no user_id, acceptable |
| `pulse_post` is no-op but still grantable | Low | Remove EXECUTE grant from authenticated |
| No secondary email verification for delete | Medium | Add confirmation email before irreversible delete |
| Google/Apple OAuth tokens stored in `profiles` | Medium | Consider encryption at rest |
| Storage bucket cleanup not in deletion flow | Medium | `live_snaps` image URLs orphaned on delete |
