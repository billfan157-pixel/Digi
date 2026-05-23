ROADMAP CONTEXT — DIGIWELL 2-YEAR PLAN
════════════════════════════════════════════════════════

PRODUCT DIRECTION
──────────────────
B2C app với DigiBottle hardware ecosystem làm core differentiator.
Không phải wellness platform. Không phải hydration tracker thuần túy.
Moat: hardware + software integration mà competitors không có.

BUSINESS MODEL
───────────────
Freemium app (miễn phí) + DigiBottle hardware (revenue)
Long-term: subscription tier cho AI features nâng cao
Market: Vietnam trước → SEA expansion Year 2

TEAM & VELOCITY
────────────────
Solo developer + AI coding tools (Claude Code, Cursor)
Estimated velocity: 1.5x solo developer
Sprint = 2 tuần. Capacity = 12–15 story points/sprint.
Note: Hardware phases chạy song song với software, không thể accelerate bằng AI tools.

CONFIRMED FUTURE WORK (từ audit)
──────────────────────────────────
#NV-02 — Real BLE/GATT implementation
  Status: Demo-only hiện tại, confirmed safe
  Hardware target: DigiBottle real hardware (Year 2)
  Software target: Capacitor BLE plugin + dev kit testing (Year 1 Q1–Q2)
  Scope: Capacitor BLE plugin, challenge-response auth,
         signed event IDs, replay protection, GATT profile design

HARDWARE TIMELINE CONSTRAINT (non-negotiable)
──────────────────────────────────────────────
DigiBottle hardware thật cần minimum 12–18 tháng:
  PCB design: 2–3 tháng
  Prototype: 2–3 tháng
  Certification: 3–6 tháng
  Manufacturing: 2–3 tháng

→ Hardware beta: Year 2 Q1–Q2
→ Hardware launch: Year 2 Q3–Q4
→ Year 1 BLE work: Capacitor plugin + Nordic dev kit simulation

UNAUDITED AREAS (cần plan trong Bucket B/C)
────────────────────────────────────────────
- Performance audit (Phase 8 chưa deep dive)
- CI/CD pipeline maturity (Phase 10 partial)
- Observability stack (Phase 11 chưa có)
- Dependency supply chain scan (Phase 12)
- Test coverage expansion

SCALE TARGET
─────────────
Year 1 end: 500–1,000 MAU (Vietnam, early adopters)
Year 2 end: 5,000–10,000 MAU (Vietnam + SEA)
Infrastructure hiện tại (Supabase) handle được đến ~10,000 MAU
  mà không cần architecture change lớn.

STRATEGIC MILESTONES
──────────────────────
M1 — App Store Launch (Year 1 Q2)
     Freemium live, real BLE plugin working với dev kit
M2 — Hardware Prototype (Year 1 Q4)
     First real DigiBottle prototype, internal testing
M3 — Hardware Beta (Year 2 Q2)
     50–200 beta users với real hardware
M4 — Hardware Launch (Year 2 Q4)
     Manufacturing run 500–1,000 units

CAPACITY NOTE
──────────────
Bucket B/C/D phải realistic với solo + AI tools.
Overload signal: sprint demand > 15 points → flag "Needs AI tool optimization"
Hardware phases không được estimate bằng story points —
  chúng có independent timeline không phụ thuộc coding velocity.

AUDIT INPUT
────────────
Total Active Issues  : 0 (tất cả 17 findings đã resolved)
Health Grade         : A+
Risk Score           : 5/100
Roadmap type         : GROWTH PLANNING từ nền tảng sạch
                       Không có technical debt cần paydown.

─────────────────────────────────────────────────────

ROADMAP CONTEXT NOTE (đọc trước khi triage)
─────────────────────────────────────────────
Audit Report này có Total Active Issues = 0.
Tất cả 17 findings đã RESOLVED trước khi Roadmap bắt đầu.

Roadmap này KHÔNG phải debt paydown.
Roadmap này là GROWTH PLANNING từ nền tảng sạch.

Focus của 2 năm tới:

CONFIRMED FUTURE WORK (từ audit — cần planning):
  #NV-02 — Real BLE/GATT implementation
            (current code is demo-only, confirmed safe)
            Scope: Capacitor BLE plugin, challenge-response auth,
                   signed event IDs, replay protection

UNAUDITED AREAS (Mode 2 chỉ audit flagged modules):
  - Full performance audit (Phase 8 chưa deep dive)
  - CI/CD pipeline maturity (Phase 10 partial)
  - Observability stack (Phase 11 chưa có)
  - Dependency supply chain full scan (Phase 12)
  - Test coverage expansion

NEW CAPABILITIES (không có trong audit scope):
  - Cần mày define: feature nào muốn build trong 2 năm?
  - Ví dụ: social features, Apple Watch, gamification, monetization

Bucket suggestion:
  Bucket B → Real BLE implementation + unaudited areas
  Bucket C → New capabilities (mày define)
  Bucket D → Scale preparation (10,000 MAU target)

─────────────────────────────────────────────
UPDATED AUDIT REPORT (Mode 2: INPUT VALIDATION)
─────────────────────────────────────────────

Full Audit Report: docs/deep-audit-mode-2-input-validation.md

**Audit Date:** 21/05/2026
**Last Updated:** 22/05/2026
**Update Inputs:** Verification Report ✅ / Re-Scan Report ✅

**Original Quick Scan Verdict:** 🟢 EXCELLENT — No Critical (2 already fixed), 7/7 High fixed, 7/7 Medium fixed, 1/1 Low fixed
**Original Overall Health Grade:** A+ (improved from A after Sprint 3 fixes)
**Original Risk Score:** 5/100 (improved from 10/100 after #M2-09 and #NV-01 fixes)

═══════════════════════════════════════════════════════
  RESOLUTION SUMMARY
═══════════════════════════════════════════════════════
✅ RESOLVED                  : 17
✅ RESOLVED (Unconfirmed)    : 0
⚠️ PARTIALLY RESOLVED       : 0
🔴 OPEN                     : 0
⏳ DEFERRED                 : 0
🆕 NEW (Regression)         : 0
───────────────────────────────────────────
Total active (non-resolved) : 0

HEALTH GRADE UPDATE
────────────────────
Original Grade  : A+
Updated Grade   : A+
Change          : Same (All issues already resolved in original report)

---

## Executive Summary

Deep Audit xác nhận **2 Critical data corruption risks** trong hydration/profile/offline sync — **BOTH ALREADY FIXED** ✅  
- #M2-01: Server hydration counters overwrite — Fixed in useProfileSync.ts (frontend only updates local cache, refetches from server)
- #M2-02: Offline sync duplicate rewards — Fixed with migration 20260521110000_add_water_log_idempotency.sql (atomic RPC with client_event_id)

**7 High security issues fixed:** ✅
- #M2-03: Webhook URL SSRF validation — Fixed with validateWebhookUrl function in webhook-dispatcher (blocks private IPs, localhost, non-HTTPS)
- #M2-04: Webhook trigger body contract — Fixed with migration 20260522000000_restore_webhook_trigger_envelope.sql
- #M2-05: AI tool water action confirmation — Fixed with window.confirm dialog in handleWaterAction (requires explicit user confirmation)
- #M2-06: DigiBottle error handling — Fixed in useSmartBottle.ts (throw errors, destructure error handling, event source sync)
- #M2-07: OpenWeather API key exposed in client bundle — Fixed with weather-proxy Edge Function (key now server-side)
- #M2-08: AI waterAction runtime validation — Fixed in useGroqAI.ts (client-side validation + calendar anonymization for PII)
- #M2-09: AI privacy/vendor contract drift — Fixed in useGroqAI.ts (anonymize location, nickname, calendar titles before sending to AI)

**7 Medium security issues fixed (Sprint 3):** ✅
- #A-01: Offline Storage Encryption — Fixed with Web Crypto API (AES-GCM) in offlineQueue.ts
- #A-02: Conflict Resolution with updated_at — Fixed with migration 20260522000200_add_water_logs_updated_at.sql
- #A-03: AI Input Validation — Fixed with 2000 char limit in ai-gateway/index.ts
- #A-04: Webhook Reliability & Quota — Fixed with retry (3 attempts, backoff) and quota (200/day) in webhook-dispatcher
- #A-05: Integration Test — Fixed with full trigger→dispatcher test in v1-and-webhook-test.test.ts
- #A-06: Migration Linter — Fixed with destructive SQL detection in check-migrations.mjs
- #A-07: Auth Config — Fixed with minimum_password_length=8 and password_requirements in config.toml

**1 Low security issue fixed (Sprint 3):** ✅
- Auth Config (included in #A-07)

**2 Runtime config issues verified and fixed:** ✅
- #NV-03: Webhook secret alignment — Fixed by adding app_settings table fallback in webhook-dispatcher
- #NV-04: Webhook-dispatcher JWT config — Verified as correct (uses secret-based auth, not JWT)

**Systemic Bugs Fixed:** ✅
- #SB-01: Hydration profile counters two writers — Fixed by #M2-01
- #SB-02: Offline queue dedupes logs but not hydration side effects — Fixed by #M2-02
- #SB-03: Webhook trigger and dispatcher body contract drift — Fixed by #M2-04
- #SB-04: DigiBottle event source names disagree — Fixed by #M2-06
- #SB-05: AI provider/privacy contract differs from runtime — Fixed by #M2-08 + #M2-09

**Future Work (not a bug):**
- #NV-02: Real BLE/GATT implementation — Current code is demo-only, confirmed safe. This is a future implementation task.

---

## Findings Summary

| Severity | Count |
|---------|-------|
| Critical | 0 (2 Already Fixed) |
| High | 0 (7 Already Fixed) |
| Medium | 0 (7 Already Fixed) |
| Low | 0 (1 Already Fixed) |
| Systemic Bugs | 0 (5 Already Fixed) |
| Needs Verify | 0 (4 Verified/Fixed) |

---

## Roadmap Input Summary

BUCKET SUGGESTION
──────────────────────────────────────────────────────
Roadmap Prompt sẽ triage chính xác, nhưng đây là gợi ý sơ bộ:

Bucket B (Foundation — fix trong Q1-Q2):
  (None — All issues already resolved)

Bucket C (Improvement — fix trong Q3-Q4):
  (None — All issues already resolved)

Bucket D (Optimization — Năm 2):
  (None — All issues already resolved)

Regressions (xử lý như Bucket B mới):
  (None — No regressions detected in Re-Scan)

ISSUES EXCLUDED FROM ROADMAP (đã resolved):
  #M2-01, #M2-02, #M2-03, #M2-04, #M2-05, #M2-06, #M2-07, #M2-08, #M2-09, #NV-01, #NV-03, #NV-04, #A-01, #A-02, #A-03, #A-04, #A-05, #A-06, #A-07
  #SB-01, #SB-02, #SB-03, #SB-04, #SB-05 (Systemic bugs resolved by root cause fixes)

UPDATED HEALTH GRADE : A+
TOTAL ACTIVE ISSUES  : 0
READY FOR ROADMAP    : YES
  Note: All Mode 2 Input Validation issues have been resolved. Roadmap can focus on Mode 1 (Auth), Mode 3 (Privacy), Mode 4 (Performance), or new features.

---

*Deep Audit Mode 2 completed. Document generated: 21/05/2026*
*Updated: 22/05/2026 with Verification + Re-Scan results*
