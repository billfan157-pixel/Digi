# DigiWell - Consolidated Full-Stack Audit & Development Roadmap

**Date:** 2026-05-27  
**Version:** 1.0  
**Status:** Unified Reference Document  

---

## Executive Summary

DigiWell is a smart hydration and wellness platform built on a React 19 + TypeScript + Supabase + Capacitor mobile stack. Following a thorough full-stack audit across components, edge functions, database schema, security structures, and accessibility, this document serves as the **single source of truth** for all findings, completed items, and the remaining engineering roadmap.

---

## 1. Technical Audit Summary & Findings

### 1.1 Frontend Architecture & Performance
* **Stack:** React 19.2.4, Vite 8.0.1, Zustand 5.0.12 (state), TanStack React Query 5.99.2, Tailwind CSS 3.4.19, Sentry React 10.53.1.
* **Size & Complexity:** ~500+ files, 64 custom hooks, and 200+ components. 
* **Key Components Audit:**
  * `useSmartBottle.ts` (1114 lines) - Critical size, needs future modular splitting.
  * `HourlyHeatmap.tsx` (538 lines) - High resource usage.
* **Performance Action:** Code splitting and lazy loading have been implemented for `InsightTab`'s heavy sub-sections (`AnalyticsSection`, `SystemSection`, `SelectedDateModal`). This successfully reduced the initial `InsightTab` bundle size from **109.71 kB** down to **20.86 kB** (an 80%+ optimization).

### 1.2 Backend (Supabase Edge Functions)
* **Status:** 15 active Edge Functions deployed. Shared modules handle CORS, rate-limiting, authentication, and logging.
* **AI Gateway:** Deployed `ai-gateway` routing and processing engine. Supports multi-model switching (Groq & OpenAI gpt-4o).
* **Security & Hardening:**
  * Context validation implemented for all actions (`advice`, `nudge`, `chat`, `agentic`) to validate and reject out-of-bounds inputs (e.g., negative or excessively large water goals).
  * Output validation restricts `suggestedAmount`, `nextBestAction.ml`, and `waterAction.amount` to a safe operational range `[0, 2000]`.

### 1.3 Database & PostgreSQL Schema
* **Structure:** ~40+ tables, custom partition schemas for high-volume logs (`water_logs` partitioned dynamically by month).
* **Vulnerability Mitigation:**
  * Added RLS protection to historical partition tables and configured `create_next_month_webhook_partition()` and `create_next_month_water_partition()` to automatically execute `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` upon partition creation.
  * Restructured `SECURITY DEFINER` public-facing functions to set explicit `search_path = public` and revoked `EXECUTE` privileges from `public` and `anon` roles.
  * Cleaned up duplicate and redundant indexes, and created indexes for all unindexed foreign keys to optimize query planning.

### 1.4 Security, Privacy & PII
* **Opt-in & Storage:** Local Google Calendar synchronization handles event title processing locally within the client (no synchronization to remote databases).
* **Sanitization & Redaction:** Implemented calendar title sanitization (removing template strings and control characters) and standard/strict PII anonymization to redact names, phone numbers, and addresses.
* **Storage Buckets:** Restricted public storage bucket listing permissions for the `avatars` and `shop_items` buckets to authenticated users only.

### 1.5 Accessibility (a11y)
* **Focus Trap:** Deployed focus trap logic and escape key handling in `SelectedDateModal` to support screen readers and keyboard navigation.
* **Live Regions:** Integrated `aria-live` polite regions, `aria-busy`, and role attributes for all dynamically updating views and error prompts.

---

## 2. AI Safety & Quota Architecture

To protect server capacity and prevent daily API abuse, DigiWell implements a strict, decoupled Quota and Safety policy:

```
[Client App] ─── (Read-Only Check via RPC) ───► [check_ai_usage] (No SQL mutation)
      │
      ├─── (In-App Confirmation) ───► [confirmDialog] (User approves AI action)
      │
      └─── (Secure Request with JWT) ───► [AI Gateway EF] ─── (Mutates Quota) ───► [consume_ai_usage]
```

1. **Decoupled Quota Consumption (Mutation):** Quota increments (mutations) occur **exclusively** on the server side inside the Supabase Edge Function using the `consume_ai_usage` RPC. The client has no permission to write to or directly increment daily usage.
2. **Purely Read-Only Client Quota Verification:** The client checks usage limits via the read-only `check_ai_usage` RPC. This function returns quotas, limits, and allowed flags without making any writes (`INSERT` or `UPDATE`) to the database. If the RPC is missing or fails, the client falls back safely to reading `ai_usage` and `profiles` tables directly.
3. **Consolidated AI Hydration Consent:** Any hydration recommendation originating from the AI (e.g. chat messages triggering a `recordWaterIntake` tool call or nudges) requires explicit user confirmation via the custom, premium `confirmDialog` modal before executing the record write.
4. **Safety Boundaries & Clamping:** All intake amounts (`suggestedAmount`, `waterAction.amount`, `nextBestAction.ml`) are strictly clamped to `[0, 2000]` ml. Payload parameters beyond logical operational boundaries (e.g., `waterIntake > 50000` or `temp > 60`) are rejected at the Edge Function gateway with HTTP 400.

---

## 3. Development Roadmap & Implementation Timeline

### Phase 1: Security, Optimization & Polish (Completed)
* **Security & RLS Hardening:** applied RLS to partition tables, hardened security definer functions, restricted bucket listings, and cleaned indexes.
* **Bundle Optimization:** Lazy loaded all sub-sections of `InsightTab` using `Suspense` and dynamic chunking.
* **AI Safety Refactoring:** Implemented pure read-only RPC limits check, server-side bounds validation, and custom consent modal dialogues.
* **Accessibility Integration:** Integrated modal focus traps, `aria-label` updates, and live regions.

### Phase 2: Functional Expansion & Mobile Testing (Sprint 29-32)
* **Sprint 29: Voice Input & Chat Realtime**
  * Integrate Speech Recognition (Web Speech API / Capacitor Voice) with Vietnamese NLP.
  * Upgrade private messaging modules and realtime chat routing via Supabase realtime channels.
* **Sprint 30: Multi-wearable Integrations**
  * Expand Apple Watch integration to support deep HealthKit heart rate and sleep synchronization.
  * Integrate Garmin Connect IQ OAuth and Fitbit sync flows.
* **Sprint 31: Gamification & Group Challenges**
  * Implement multiplayer group challenges and weekly team battles.
  * Deploy story reactions and seasonal event badge unlock engines.
* **Sprint 32: WAF & Penetration Testing**
  * Finalize Cloudflare WAF configuration.
  * Conduct a third-party penetration audit on public Edge Function endpoints.

### Phase 3: Scaling & Analytics (Sprint 33-36)
* **Sprint 33: A/B Testing Framework**
  * Deploy internal cohort segmentation and A/B test routing variables.
* **Sprint 34: Data Archiving & Scaling**
  * Implement partition archiving scripts for historical water logs.
  * Set up database connection pooling optimization.
* **Sprint 35: Public API & SDK Release**
  * Publish OpenAPI specification for Developer Portal.
  * Release a lightweight client-side SDK for smart integration partners.
* **Sprint 36: Launch Preparation**
  * Complete full Capacitor mobile packaging and submit store-ready bundles.

---

## 4. Consolidated Success Metrics

* **Performance:** Lighthouse Performance Score `> 90`, bundle chunks under budget, LCP `< 2.0s`.
* **Testing:** 100% pass rate on 616 unit tests, and comprehensive E2E test execution.
* **Security:** 100% compliance with Supabase Security Guidelines (strict RLS, no service role keys on client, zero public/anon executive privilege on mutators).
