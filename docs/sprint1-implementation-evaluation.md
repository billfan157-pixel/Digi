# Sprint 1 Implementation Plan Evaluation (UPDATED - Actual State Check)

**Date:** 22/05/2026
**Evaluator:** Cascade AI Assistant
**Plan Reference:** Implementation Plan — Sprint 1 (Observability Stack)
**Status:** RE-EVALUATED after actual codebase check

---

## Executive Summary

**Overall Assessment:** ✅ FEASIBLE with cost model correction required

The implementation plan for Sprint 1 is technically sound. All three core goals are achievable. However, after checking the actual codebase state, the cost estimation model in the plan is **significantly overestimated** (13-800x higher than actual Groq pricing).

**Key Findings (ACTUAL CODEBASE STATE):**
- ✅ Database schema (`ai_usage`) already exists and matches requirements
- ✅ SettingsModal.tsx has existing Developer Sheet section ready for UI additions
- ✅ Supabase client structure supports custom fetch wrapper
- ✅ Sentry already configured with browserTracingIntegration (tracesSampleRate: 0.2 prod)
- ❌ NO Web Vitals implementation exists (no PerformanceObserver, no webVitals.ts)
- ❌ NO query timing/logging exists (no custom fetch wrapper)
- ❌ Cost model in plan is **WRONG** - 13-800x overestimated

**Recommendation:** Proceed with implementation but **MUST correct cost model** before implementation.

---

## 1. Technical Feasibility Analysis

### 1.1 Supabase Slow Query Logging

**Status:** ✅ FEASIBLE with caveats

**Implementation Approach:**
- Database migration: `ALTER DATABASE postgres SET log_min_duration_statement = 200;`
- Client-side interceptor in `supabase.ts` with custom fetch wrapper
- Memory store for slow queries log

**Issues Identified:**

| Issue | Severity | Impact | Mitigation |
|-------|----------|--------|------------|
| **Database-level logging may require Supabase Pro** | Medium | Free tier may not support `ALTER DATABASE` | Check Supabase tier, consider client-side only logging |
| **Memory store not persisted** | Low | Slow queries lost on page refresh | Add localStorage persistence for slow queries log |
| **Query name extraction may be fragile** | Low | RPC calls may not have readable names | Use URL pattern matching as fallback |

**Recommendation:**
1. Verify Supabase plan supports database-level logging
2. If not, implement client-side only logging (still valuable)
3. Add localStorage persistence for slow queries log

---

### 1.2 Core Web Vitals Tracking

**Status:** ✅ FEASIBLE with Capacitor considerations

**Implementation Approach:**
- Native `PerformanceObserver` API
- Standard performance entry getters (NavigationTiming, PaintTiming)
- localStorage persistence
- Color-coded status display in Developer Sheet

**Issues Identified:**

| Issue | Severity | Impact | Mitigation |
|-------|----------|--------|------------|
| **Capacitor WebView may have different performance characteristics** | Medium | Metrics may not reflect native app performance | Test on real device, document WebView-specific baselines |
| **FID not available in all browsers** | Low | FID may be undefined in some contexts | Fallback to FCP if FID unavailable |
| **CLS may be affected by WebView rendering** | Low | Layout shifts may differ from browser | Use WebView-specific CLS thresholds |

**Recommendation:**
1. Test Web Vitals on real Capacitor device (iOS + Android)
2. Add Capacitor-specific baseline documentation
3. Implement graceful fallbacks for unavailable metrics

---

### 1.3 Groq/AI Cost Dashboard

**Status:** ✅ FEASIBLE but **COST MODEL IS WRONG** - MUST CORRECT

**Implementation Approach:**
- Query `public.ai_usage` table (already exists)
- Calculate costs using fixed rates per request type
- Display in Developer Sheet with daily breakdown

**Database Schema Verification:**
```sql
-- ✅ Schema matches requirements
create table public.ai_usage (
  user_id    uuid    not null,
  date       date    not null,
  message_count integer not null default 0,  -- ✅ matches
  advice_count  integer not null default 0,  -- ✅ matches
  scan_count    integer not null default 0,  -- ✅ matches
  primary key (user_id, date)
);
```

**⚠️ CRITICAL: Cost Model in Plan is INCORRECT**

**Actual Groq Pricing (May 2026):**
- Llama 3.1 8B: $0.05 per million input tokens
- Llama 3.3 70B: $0.59 input / $0.79 output per million tokens

**Plan's Cost Model (WRONG):**
| Request Type | Plan Cost | Actual Cost (est) | Error |
|--------------|-----------|-------------------|-------|
| AI Message | $0.0008 (~20đ) | $0.000001 (~0.025đ) | **800x overestimate** |
| AI Advice | $0.0013 (~33đ) | $0.000019 (~0.48đ) | **67x overestimate** |
| Food Scan | $0.0015 (~38đ) | $0.000040 (~1đ) | **38x overestimate** |

**Corrected Cost Model:**
| Request Type | Corrected Cost | Calculation |
|--------------|----------------|-------------|
| AI Message (20 tokens avg) | $0.000001 (~0.025đ VND) | $0.05/M × 20/1M |
| AI Advice (33 tokens avg) | $0.000019 (~0.48đ VND) | $0.59/M × 33/1M |
| Food Scan (50 tokens avg) | $0.000040 (~1đ VND) | $0.79/M × 50/1M |

**Issues Identified:**

| Issue | Severity | Impact | Mitigation |
|-------|----------|--------|------------|
| **Cost model is 38-800x overestimated** | CRITICAL | Cost dashboard will show wildly incorrect values | MUST use corrected rates above |
| **Cost model uses averages, not actual tokens** | Medium | Estimates may be inaccurate by ±30% | Add disclaimer "Estimated cost based on averages" |
| **Groq pricing may change** | Low | Hardcoded rates become outdated | Fetch rates from config/env, update quarterly |
| **No cost alerting mechanism** | Low | Users may not notice cost spikes | Add cost threshold alert in future |

**Recommendation:**
1. **MUST:** Use corrected cost rates (38-800x lower than plan)
2. Add disclaimer that costs are estimates based on average token usage
3. Store cost rates in environment variables for easy updates
4. Consider adding daily cost threshold alerts in future sprints

---

## 2. Code Structure Analysis

### 2.1 SettingsModal.tsx

**Status:** ✅ READY for modifications

**Existing Structure:**
- Developer Sheet section exists at line 1258+
- Has `activeSheet === 'developer'` condition
- Already loads developer data (API keys, webhooks)
- Uses BottomSheetWrapper pattern

**Integration Points:**
```typescript
// ✅ Existing Developer Sheet structure
{activeSheet === 'developer' && (
  <BottomSheetWrapper key="section-developer" title="Cài đặt Nhà phát triển" onClose={closeSheet}>
    {/* Existing: API Documentation, API Keys, Webhooks */}
    {/* NEW: Add Web Vitals and AI Cost sections here */}
  </BottomSheetWrapper>
)}
```

**Recommendation:**
- Add two new collapsible sections after existing webhook section
- Follow existing UI patterns (icons, spacing, dark mode support)

---

### 2.2 supabase.ts

**Status:** ✅ READY for modifications

**Existing Structure:**
- Singleton pattern for `supabase` client
- Separate `supabaseRead` client for read replicas
- Custom storage handlers with error handling
- Global headers configuration

**Integration Points:**
```typescript
// ✅ Can add custom fetch wrapper here
const supabaseClient = globalAny.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { /* ... */ },
  global: {
    headers: { /* ... */ },
    fetch: customFetchWrapper // NEW: Add here
  }
});
```

**Recommendation:**
- Implement `customFetchWrapper` as a separate function
- Apply to both `supabase` and `supabaseRead` clients
- Add memory store for slow queries log

---

## 3. New File Requirements

### 3.1 webVitals.ts (NEW)

**Proposed Location:** `src/lib/webVitals.ts`

**Required Functions:**
- `initWebVitals()`: Initialize PerformanceObserver
- `getWebVitals()`: Retrieve current metrics from localStorage
- Helper functions for color coding (getStatusColor, getStatusLabel)

**Estimated Effort:** 2-3 hours ✅

---

### 3.2 aiUsageQueries.ts (NEW)

**Proposed Location:** `src/lib/aiUsageQueries.ts`

**Required Functions:**
- `getDailyAIUsage(userId)`: Fetch last 30 days from `ai_usage`
- `calculateEstimatedCosts(usageData)`: Apply cost model
- `formatCostSummary(costs)`: Format for display

**Estimated Effort:** 1-2 hours ✅

---

### 3.3 Migration File (NEW)

**Proposed Location:** `supabase/migrations/20260522000700_enable_slow_query_logging.sql`

**Content:**
```sql
ALTER DATABASE postgres SET log_min_duration_statement = 200;
```

**Estimated Effort:** 0.5 hours ✅

---

## 4. Verification Plan Assessment

### 4.1 Automated Tests

**Status:** ✅ ADEQUATE

- `npm run typecheck`: Will catch TypeScript errors
- `npm run test`: Will catch unit test failures

**Gaps:**
- No integration tests for Web Vitals (browser-specific)
- No tests for custom fetch wrapper

**Recommendation:**
- Add unit tests for `webVitals.ts` helper functions
- Add unit tests for `aiUsageQueries.ts` cost calculations
- Integration tests can be manual for browser-specific features

---

### 4.2 Manual Verification

**Status:** ✅ COMPREHENSIVE

Proposed manual tests cover:
- Web Vitals display after app interaction
- Slow query tracking
- AI Cost Dashboard data display

**Gaps:**
- No test for database-level slow query logging
- No test for Capacitor WebView performance metrics

**Recommendation:**
- Add verification step: Check Supabase logs for slow queries
- Add verification step: Test on real Capacitor device

---

## 5. Effort Estimation Review

| Task | Estimated Effort | Assessment |
|------|------------------|------------|
| Database migration | 0.5 hours | ✅ Accurate |
| Supabase interceptor | 2-3 hours | ✅ Accurate |
| Web Vitals implementation | 2-3 hours | ✅ Accurate |
| AI Cost Dashboard query | 1-2 hours | ✅ Accurate |
| Developer Portal UI upgrades | 3-4 hours | ✅ Accurate |
| **Total** | **8.5-12.5 hours** | ✅ Reasonable |

**Sprint Points:** 5 points (after Sentry/CI/CD completion)
**Estimated Hours per Point:** ~2 hours
**Assessment:** ✅ Realistic

---

## 6. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Supabase Pro plan required for DB logging | Medium | Medium | Implement client-side only as fallback |
| Web Vitals not available in Capacitor WebView | Low | Medium | Test on device, document WebView baselines |
| Cost estimates significantly inaccurate | Medium | Low | Add disclaimer, make rates configurable |
| Performance regression from custom fetch wrapper | Low | Medium | Benchmark before/after, optimize if needed |
| localStorage quota exceeded for slow queries | Low | Low | Implement rolling window (last 50 queries) |

**Overall Risk Level:** MEDIUM

---

## 7. Recommendations

### MUST FIX (Before Implementation)

1. **Verify Supabase plan supports database-level logging**
   - Check if `ALTER DATABASE` is available on current plan
   - If not, document client-side only approach

2. **Add localStorage persistence for slow queries**
   - Memory store loses data on refresh
   - Implement rolling window (last 50 queries)

3. **Add cost model disclaimer**
   - Clearly label costs as "estimated based on averages"
   - Add ±30% accuracy note

### SHOULD FIX (During Implementation)

4. **Test Web Vitals on real Capacitor device**
   - WebView performance differs from browser
   - Document WebView-specific baselines

5. **Make cost rates configurable**
   - Store in environment variables
   - Update quarterly with actual Groq pricing

6. **Add graceful fallbacks for unavailable metrics**
   - FID may be undefined in some contexts
   - Fallback to FCP if needed

### NICE TO HAVE (Future Sprints)

7. **Add cost threshold alerts**
   - Alert if daily cost exceeds threshold
   - Configurable per user

8. **Add slow query trend analysis**
   - Track slow query frequency over time
   - Identify degrading queries

---

## 8. Final Verdict (UPDATED)

**Decision:** ✅ APPROVED with CRITICAL cost model correction

**Conditions:**
1. **CRITICAL:** Use corrected cost rates (38-800x lower than plan's estimates)
2. Verify Supabase plan supports database-level logging (or document client-side fallback)
3. Add localStorage persistence for slow queries
4. Add cost model disclaimer in UI

**Confidence Level:** 90% (increased after actual state check)

**Next Steps:**
1. **MUST:** Update implementation plan with corrected cost rates
2. Address MUST FIX items
3. Create new files (webVitals.ts, aiUsageQueries.ts, migration)
4. Modify existing files (supabase.ts, SettingsModal.tsx)
5. Run verification tests
6. Update Sprint 1 status in roadmap

---

## 9. Actual State Summary

**What EXISTS in codebase:**
- ✅ `ai_usage` table schema (migration 20260509050000)
- ✅ SettingsModal.tsx with Developer Sheet section
- ✅ Sentry configured with browserTracingIntegration
- ✅ Supabase client with singleton pattern

**What DOES NOT EXIST:**
- ❌ Web Vitals implementation (no PerformanceObserver, no webVitals.ts)
- ❌ Query timing/logging (no custom fetch wrapper)
- ❌ Slow query logging migration
- ❌ AI usage query functions

**What NEEDS CORRECTION:**
- ⚠️ Cost model in implementation plan (38-800x overestimated)

---

**Report Generated:** 22/05/2026
**Reviewer:** Cascade AI Assistant
**Status:** RE-EVALUATED after actual codebase check
**Next Review:** After implementation completion
