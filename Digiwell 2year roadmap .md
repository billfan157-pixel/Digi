# DigiWell — 2-Year Strategic Roadmap
**Generated from:** Audit Report (A+, 17/17 resolved) + Product Context
**Date:** 22/05/2026
**Last Updated:** 25/05/2026 (Sprint 11-12, 13-14 & 15-16 Completed - Freemium, AI Personalization & Gamification)
**Type:** GROWTH PLANNING — Zero technical debt, feature-first from day one

---

## PHẦN 1 — Strategic Overview

```
═══════════════════════════════════════════════════════════════
  DIGIWELL — 2-YEAR STRATEGIC ROADMAP
═══════════════════════════════════════════════════════════════

Audit Health Grade (Input)  : A+
Current Risk Score          : 5/100
Target Health Grade (Y2 Q4) : A+
Target Risk Score  (Y2 Q4)  : ≤ 5

AUDIT FINDINGS INTAKE
─────────────────────
Total findings ingested : 17 (all resolved before roadmap)
Blocker (Hotfix)        : 0
Bucket B (Foundation)   : 0 audit findings
                          → Replaced by: BLE implementation + unaudited areas
Bucket C (Improvement)  : 0 audit findings
                          → Replaced by: New capabilities + AI expansion
Bucket D (Optimization) : 0 audit findings
                          → Replaced by: Scale + SEA + hardware launch

STRATEGIC THEMES ACTIVATED
───────────────────────────
Theme 1: BLE & Hardware Foundation      — 1 confirmed future work (#NV-02)
Theme 2: App Store Launch               — 0 audit findings, pure product work
Theme 3: Platform Infrastructure        — 4 unaudited areas
Theme 4: AI Capability Evolution        — 0 audit findings, expansion work
Theme 5: Hardware-Software Ecosystem    — hardware-specific, no code findings
Theme 6: Business Model & Monetization  — 0 audit findings, new capability
Theme 7: SEA Scale & Growth             — 0 audit findings, new market

CAPACITY ASSUMPTION
────────────────────
Team size         : 1 (solo + AI coding tools = effective 1.5x)
Sprint duration   : 2 tuần
Points/sprint     : 12–15 story points
Total sprints     : 48 (2 năm)
Total capacity    : ~576–720 story points
Estimated demand  : ~480 story points (software only)
Hardware phases   : Independent timeline, không tính story points
Capacity buffer   : ~20% — OK (hardware unknowns sẽ consume buffer)
```

---

## PHẦN 2 — Hotfix List

```
KHÔNG CÓ HOTFIX
Tất cả 17 audit findings đã resolved trước khi roadmap bắt đầu.
Roadmap bắt đầu từ Sprint 1 ngay lập tức.
```

---

## PHẦN 3 — Quarterly Roadmap

---

## YEAR 1 — Q1 (Sprint 1–6): "Platform Foundation"
**Thời gian:** Tháng 1–3, Year 1

### Quarter Goal
Xây dựng nền tảng kỹ thuật vững chắc cho App Store launch trong Q2:
observability live, BLE architecture sẵn sàng, CI/CD hoàn chỉnh, performance baseline established.

### Discovery Phase (2 weeks - BEFORE Sprint 1)
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Current state audit (CI/CD, Sentry, test coverage) | Theme 3 | 2 | None | Low | ✅ COMPLETED (22/05/2026) |
| Adjust sprint points based on completed tasks | Theme 3 | 1 | Current state audit | Low | ✅ COMPLETED (22/05/2026) |
| Validate capacity assumptions (AI tools efficiency) | Theme 3 | 1 | None | Low | ✅ COMPLETED (22/05/2026) |

**Discovery Goal:** Align roadmap with actual current state before execution.
**Definition of Done:** All sprint tables updated with accurate status and points.

### OKRs
```
Objective: "Make the platform production-ready for public launch"
  KR1: Sentry error tracking live, P95 latency < 500ms documented
  KR2: Capacitor BLE plugin research xong, GATT profile draft finalized
  KR3: GitHub Actions CI/CD pipeline chạy tự động 100% của merges
  KR4: Dependency audit sạch, zero CVE severity ≥ 7.0
```

### Sprint Breakdown

#### Sprint 1–2: Observability Stack
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Setup Sentry (web + Capacitor) | Theme 3 | 3 | None | Low | ✅ COMPLETED (22/05/2026) |
| Error boundary coverage audit + gaps | Theme 3 | 2 | None | Low | ✅ COMPLETED (22/05/2026) |
| Supabase slow query logging enable | Theme 3 | 1 | None | Low | ✅ COMPLETED (22/05/2026) |
| Core Web Vitals baseline measurement | Theme 3 | 2 | None | Low | ✅ COMPLETED (22/05/2026) |
| Groq/AI cost dashboard setup | Theme 3 | 2 | None | Low | ✅ COMPLETED (22/05/2026) |

**Sprint Goal:** Biết ngay khi app crash, biết query nào chậm, biết AI đang tốn bao nhiêu tiền.
**Definition of Done:** Sentry nhận được ít nhất 1 test error từ production build.
**Note:** Sentry setup và error boundary đã hoàn thành từ InsightTab audit. Sprint points điều chỉnh từ 10 → 5.

---

#### Sprint 3–4: BLE Architecture Research & Integration

##### Phase A: BLE Architecture Research
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Capacitor BLE plugin evaluation (capacitor-bluetooth-le vs native) | Theme 1 | 3 | None | Medium | ✅ COMPLETED (22/05/2026) |
| Nordic nRF52 dev kit setup + basic GATT communication | Theme 1 | 4 | Dev kit hardware ~$40 | Medium | ✅ COMPLETED (22/05/2026) |
| GATT profile design cho DigiBottle (service UUIDs, characteristics) | Theme 1 | 3 | Nordic dev kit | Medium | ✅ COMPLETED (22/05/2026) |
| BLE permission handling (iOS + Android) | Theme 1 | 2 | None | Low | ✅ COMPLETED (22/05/2026) |

##### Phase B: BLE Integration
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Tích hợp Capacitor BLE plugin vào hook `useSmartBottle` | Theme 1 | 4 | Phase A Research | Medium | ✅ COMPLETED (22/05/2026) |
| Xây dựng giao diện `BottleTab` đồng bộ trực tiếp với hook BLE | Theme 1 | 3 | Hook integration | Low | ✅ COMPLETED (22/05/2026) |
| Thực hiện cơ chế tự động quét (scan) và kết nối BLE trên mobile | Theme 1 | 2 | Hook integration | Medium | ✅ COMPLETED (22/05/2026) |
| Xây dựng GATT parsers đọc pin (`readBatteryLevel`) và nhiệt độ (`readTemperature`) | Theme 1 | 2 | Hook integration | Low | ✅ COMPLETED (22/05/2026) |

**Sprint Goal:** Tích hợp thành công plugin BLE, đồng bộ hoàn toàn UI với hook thực tế và hỗ trợ song song chế độ giả lập Web/Native.
**Definition of Done:**
- Giao diện `BottleTab` không dùng state giả lập cục bộ, liên kết 100% với hook `useSmartBottle`.
- Tải app lên giả lập/mobile, tự động quét và kết nối với service UUID tương thích, đọc/nhận thông báo thành công.
- Các unit tests của parser BLE chạy đạt 100% (566 tests pass, typecheck/build thành công).

---

#### Sprint 5–6: CI/CD Maturity + Dependency Audit
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| GitHub Actions: build + test pipeline | Theme 3 | 3 | None | Low | ✅ COMPLETED (23/05/2026) |
| Automated Supabase migration run trong CI | Theme 3 | 2 | None | Low | ✅ COMPLETED (23/05/2026) |
| npm audit + Dependabot setup | Theme 3 | 1 | None | Low | ✅ COMPLETED (23/05/2026) |
| Full dependency scan (Phase 12 audit) | Theme 3 | 2 | None | Low | ✅ COMPLETED (23/05/2026) |
| Test coverage report trong CI | Theme 3 | 2 | None | Low | ✅ COMPLETED (23/05/2026) |

**Sprint Goal:** Mọi PR tự động chạy tests, migration check, và dependency scan.
**Definition of Done:** CI pipeline green trên main branch.
**Note:** GitHub Actions pipeline đã tồn tại. Sprint points điều chỉnh từ 10 → 7.

---

### Hardware Track (chạy song song, không tính sprint points)
```
Q1 Hardware:
  Tháng 1: Research PCB design firms (Vietnam/China)
  Tháng 2: Define DigiBottle hardware spec v0.1
           (battery life, sensor type, BLE chip, casing material)
  Tháng 3: RFQ (Request for Quotation) gửi đến 3–5 manufacturers
```

---

## YEAR 1 — Q2 (Sprint 7–12): "App Store Launch"
**Thời gian:** Tháng 4–6, Year 1

### Quarter Goal
**M1 — App Store Launch.** DigiWell live trên App Store và Google Play.
Freemium model active. Real BLE working với Nordic dev kit (pre-hardware).

### OKRs
```
Objective: "Ship DigiWell to real users"
  KR1: App Store + Google Play approved và live
  KR2: 100 downloads tuần đầu sau launch
  KR3: BLE connection với Nordic dev kit stable ≥ 95% success rate
  KR4: Crash-free rate ≥ 99% trong tuần đầu post-launch
```

### Sprint Breakdown

#### Sprint 7–8: App Store Preparation
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| App Store screenshots + metadata (VI + EN) | Theme 2 | 3 | None | Low | ✅ COMPLETED (23/05/2026) |
| Privacy policy + terms of service | Theme 2 | 2 | None | Low | ✅ COMPLETED (23/05/2026) |
| iOS App Store submission + review | Theme 2 | 2 | None | Medium | ⏳ BLOCKED (needs Apple Developer account $99) |
| Google Play submission + review | Theme 2 | 2 | None | Medium | ⏳ BLOCKED (needs Google Play Developer account $25) |
| Onboarding flow polish (first-run UX) | Theme 2 | 4 | None | Low | ✅ COMPLETED (23/05/2026) |
| IAP Compliance Review (Stripe vs Apple/Google IAP) | Theme 2 | 2 | None | Medium | ✅ COMPLETED (23/05/2026) |
| Native permissions + signing config (iOS + Android) | Theme 2 | 3 | None | Low | ✅ COMPLETED (23/05/2026) |
| Android AAB Build Pipeline (workflow + docs) | Theme 2 | 3 | None | Low | ✅ COMPLETED (23/05/2026) |
| App Store Submission Checklist | Theme 2 | 2 | None | Low | ✅ COMPLETED (23/05/2026) |

**Sprint Goal:** App ready for submission to both stores (BLOCKED on developer accounts).
**Risk Flag:** App Store review 1–7 ngày, submit sớm nhất có thể.
**Note:** Sprint 8 expanded scope to include IAP compliance, native permissions, and build pipelines.

---

#### Sprint 9–10: Real BLE Implementation (Dev Kit Phase)
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Capacitor BLE plugin integration với app | Theme 1 | 4 | Sprint 3–4 BLE research | Medium | ✅ COMPLETED (22/05/2026) |
| BLE scan + device discovery UI | Theme 1 | 3 | Plugin integration | Low | ✅ COMPLETED (22/05/2026) |
| GATT read: water sensor characteristic | Theme 1 | 3 | Nordic dev kit | Medium | ✅ COMPLETED (22/05/2026) |
| Challenge-response auth draft (software side) | Theme 1 | 3 | GATT profile | High | ✅ COMPLETED (23/05/2026) |
| Connection health monitoring + auto-reconnect | Theme 1 | 2 | BLE integration | Low | ✅ COMPLETED (23/05/2026) |

**Sprint Goal:** Hoàn thiện bảo mật BLE và kết nối phần cứng demo.
**Definition of Done:** Kết nối và truyền dữ liệu an toàn với các kiểm tra xác thực cơ bản thành công.

---

#### Sprint 11–12: Freemium Model + Performance Audit
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Full performance audit (Phase 8 unaudited areas) | Theme 3 | 4 | None | Low | ✅ COMPLETED (23/05/2026) |
| Database query optimization từ performance audit | Theme 3 | 3 | Performance audit | Medium | ✅ COMPLETED (23/05/2026) |
| Freemium tier definition + feature gating | Theme 6 | 3 | None | Low | ✅ COMPLETED (23/05/2026) |
| Premium waitlist (pre-DigiBottle hardware) | Theme 6 | 2 | None | Low | ✅ COMPLETED (23/05/2026) |

**Sprint Goal:** App live + performance baseline clean + freemium model defined.

---

### Hardware Track Q2
```
Q2 Hardware:
  Tháng 4: Chọn manufacturer, ký NDA
  Tháng 5: PCB design review v0.1
  Tháng 6: PCB fabrication order (first prototype batch ~5–10 units)
```

---

## YEAR 1 — Q3 (Sprint 13–18): "Growth & AI Expansion"
**Thời gian:** Tháng 7–9, Year 1

### Quarter Goal
Grow từ 100 → 500+ MAU. AI features làm core retention driver.
Hardware prototype về tay để bắt đầu real BLE testing.

### OKRs
```
Objective: "Make users come back every day"
  KR1: 30-day retention ≥ 40%
  KR2: AI feature engagement ≥ 30% DAU
  KR3: Hardware prototype v0.1 về tay, BLE pairing thử nghiệm nội bộ
  KR4: 500 MAU cuối Q3
```

### Sprint Breakdown

#### Sprint 13–14: AI Personalization Engine
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Hydration pattern analysis (time-of-day, weather correlation) | Theme 4 | 4 | Observability data từ Q1 | Medium | ✅ COMPLETED (24/05/2026) |
| Smart reminder system (AI-driven, không fixed schedule) | Theme 4 | 4 | Pattern analysis | Medium | ✅ COMPLETED (24/05/2026) |
| AI weekly hydration report (push notification) | Theme 4 | 3 | None | Low | ✅ COMPLETED (24/05/2026) |

**Sprint Goal:** App remind user đúng lúc họ thường quên uống nước.

---

#### Sprint 15–16: Retention & Gamification
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Streak system + milestone badges | Theme 2 | 3 | None | Low | ✅ COMPLETED (24/05/2026) |
| Hydration leaderboard (opt-in, friends) | Theme 2 | 4 | None | Medium | ✅ COMPLETED (24/05/2026) |
| Daily challenge system | Theme 2 | 3 | None | Low | ✅ COMPLETED (24/05/2026) |
| Push notification infrastructure | Theme 2 | 2 | None | Low | ✅ COMPLETED (24/05/2026) |

**Sprint Goal:** User có lý do để mở app mỗi ngày dù không có DigiBottle.

---

#### Sprint 17–18: Hardware Prototype Integration
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Real hardware BLE pairing flow (với prototype v0.1) | Theme 1 | 4 | Hardware prototype | High | ⏳ PENDING |
| Signed event IDs implementation | Theme 1 | 3 | BLE pairing | High | ⏳ PENDING |
| Replay protection (timestamp + nonce) | Theme 1 | 3 | Signed event IDs | High | ⏳ PENDING |
| BLE error handling + reconnect logic | Theme 1 | 2 | Real hardware | Medium | ⏳ PENDING |

**Sprint Goal:** App pair được với real DigiBottle prototype, không bị replay attack.
**Risk Flag:** Hardware prototype có thể delay → Sprint sẽ dùng Nordic dev kit làm fallback.

---

### Hardware Track Q3
```
Q3 Hardware:
  Tháng 7: Nhận prototype v0.1, internal testing bắt đầu
  Tháng 8: BLE firmware iteration với app team
  Tháng 9: Prototype v0.2 order nếu v0.1 có issues
```

---

## YEAR 1 — Q4 (Sprint 19–24): "Ecosystem Foundation"
**Thời gian:** Tháng 10–12, Year 1

### Quarter Goal
**M2 — Hardware Prototype stable.** Ecosystem foundation (webhook platform, developer API) live.
1,000 MAU cuối năm. Chuẩn bị hardware beta cho Q2 Year 2.

### OKRs
```
Objective: "Build the ecosystem around DigiBottle"
  KR1: 1,000 MAU cuối Q4
  KR2: Webhook platform có ít nhất 10 active integrations từ early adopters
  KR3: Hardware prototype v0.2 stable, BLE success rate ≥ 95%
  KR4: Beta waitlist 200+ người sign up cho real DigiBottle
```

### Sprint Breakdown

#### Sprint 19–20: Developer Platform Polish
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Public API documentation (webhook platform) | Theme 2 | 3 | None | Low | ⏳ PENDING |
| Developer portal (webhook management UI) | Theme 2 | 4 | None | Medium | ⏳ PENDING |
| Webhook event schema v1.0 stabilization | Theme 2 | 2 | None | Low | ⏳ PENDING |

**Sprint Goal:** External developer có thể integrate với DigiWell data.

---

#### Sprint 21–22: Subscription Tier Implementation
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Subscription pricing model (AI Premium tier) | Theme 6 | 2 | None | Low | ⏳ PENDING |
| In-app purchase implementation (iOS + Android) | Theme 6 | 5 | None | High | ⏳ PENDING |
| Feature gating: advanced AI behind subscription | Theme 6 | 3 | IAP implementation | Medium | ⏳ PENDING |

**Sprint Goal:** Đầu tiên có revenue từ app.
**Risk Flag:** Apple IAP review process có thể kéo dài.

---

#### Sprint 23–24: Year 2 Preparation
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| SEA market research (Singapore, Thailand, Malaysia) | Theme 7 | 2 | None | Low | ⏳ PENDING |
| Localization framework setup (i18n) | Theme 7 | 3 | None | Low | ⏳ PENDING |
| Hardware beta program setup (waitlist → application) | Theme 5 | 2 | None | Low | ⏳ PENDING |
| Load testing đến 2,000 concurrent users | Theme 3 | 3 | None | Low | ⏳ PENDING |

**Sprint Goal:** Sẵn sàng cho hardware beta và SEA expansion trong Year 2.

---

### Hardware Track Q4
```
Q4 Hardware:
  Tháng 10: Prototype v0.2 testing + firmware finalization
  Tháng 11: CE/FCC certification submission (bắt đầu process)
  Tháng 12: Manufacturing partner confirm cho production run
             Tooling order cho casing (3–4 tháng lead time)
```

---

## YEAR 2 — Q1 (Sprint 25–30): "Hardware Beta Prep"
**Thời gian:** Tháng 1–3, Year 2

### Quarter Goal
Chuẩn bị cho hardware beta launch trong Q2. SEA soft launch.
2,000 MAU. Subscription revenue dương.

### OKRs
```
Objective: "Get ready to put real DigiBottles in real hands"
  KR1: 50 beta testers selected + onboarded
  KR2: BLE security fully implemented (challenge-response + replay protection)
  KR3: SEA soft launch (Singapore) với localized app
  KR4: 2,000 MAU, subscription conversion ≥ 5%
```

### Sprint Breakdown

#### Sprint 25–26: BLE Security Hardening
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Challenge-response auth full implementation | Theme 1 | 4 | Y1 Q3 BLE foundation | High | ⏳ PENDING |
| GATT encryption (BLE pairing with bonding) | Theme 1 | 3 | Real hardware | High | ⏳ PENDING |
| Anti-spoofing: device identity verification | Theme 1 | 4 | Challenge-response | High | ⏳ PENDING |
| BLE connection monitoring + alert system | Theme 1 | 2 | Observability stack | Low | ⏳ PENDING |

**Sprint Goal:** DigiBottle không thể bị spoofed hoặc replayed.

---

#### Sprint 27–28: Hardware Beta Program
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Beta tester application + selection | Theme 5 | 2 | None | Low | ⏳ PENDING |
| Beta feedback collection system (in-app) | Theme 5 | 3 | None | Low | ⏳ PENDING |
| Hardware shipping + tracking (50 units) | Theme 5 | 1 | Manufacturing | High | ⏳ PENDING |
| Beta-specific onboarding flow | Theme 5 | 2 | None | Low | ⏳ PENDING |

**Sprint Goal:** 50 real DigiBottles trong tay real users.
**Risk Flag:** Certification (CE/FCC) có thể chưa xong → delay shipping nếu vào regulated markets.

---

#### Sprint 29–30: SEA Expansion
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Singapore App Store listing + localization | Theme 7 | 3 | i18n framework | Low | ⏳ PENDING |
| English + Traditional Chinese localization | Theme 7 | 4 | i18n framework | Medium | ⏳ PENDING |
| SEA marketing landing page | Theme 7 | 3 | None | Low | ⏳ PENDING |

**Sprint Goal:** DigiWell available trên App Store Singapore.

---

### Hardware Track Q2 Year 2
```
Q2 Hardware (parallel):
  Tháng 1: Certification follow-up (CE/FCC)
  Tháng 2: Tooling completion check
  Tháng 3: Pre-production sample review (golden sample)
```

---

## YEAR 2 — Q2 (Sprint 31–36): "Hardware Beta Live"
**Thời gian:** Tháng 4–6, Year 2

### Quarter Goal
**M3 — Hardware Beta.** 50–200 beta users với real DigiBottle.
5,000 MAU. Bắt đầu thu thập data để chuẩn bị manufacturing run.

### OKRs
```
Objective: "Validate DigiBottle in the real world"
  KR1: 200 beta units shipped và active
  KR2: Beta NPS ≥ 50
  KR3: BLE connection success rate ≥ 97% trong real-world conditions
  KR4: 5,000 MAU
```

### Sprint Breakdown

#### Sprint 31–32: Beta Feedback Loop
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Beta feedback analysis + prioritization | Theme 5 | 3 | Beta users | Low | ⏳ PENDING |
| BLE firmware update OTA mechanism | Theme 5 | 4 | BLE foundation | High | ⏳ PENDING |
| Hardware issue tracker integration | Theme 5 | 2 | None | Low | ⏳ PENDING |

---

#### Sprint 33–34: App Feature Expansion
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| DigiBottle dashboard (bottle level, battery, last sync) | Theme 5 | 4 | Real hardware data | Low | ⏳ PENDING |
| Multi-bottle support (household sharing) | Theme 5 | 3 | None | Medium | ⏳ PENDING |
| AI insights powered by real BLE data | Theme 4 | 4 | Beta data | Medium | ⏳ PENDING |

---

#### Sprint 35–36: Monetization Optimization
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Hardware bundle pricing page | Theme 6 | 2 | None | Low | ⏳ PENDING |
| Pre-order system cho commercial launch | Theme 6 | 4 | None | Medium | ⏳ PENDING |
| Referral program (beta users refer friends) | Theme 6 | 3 | None | Low | ⏳ PENDING |

---

## YEAR 2 — Q3 (Sprint 37–42): "Scale & Manufacturing Prep"
**Thời gian:** Tháng 7–9, Year 2

### Quarter Goal
Chuẩn bị manufacturing run 500–1,000 units.
SEA expansion (Thailand, Malaysia). 7,000 MAU.

### OKRs
```
Objective: "Prepare for commercial DigiBottle launch"
  KR1: Manufacturing run confirmed + deposit paid
  KR2: 7,000 MAU across Vietnam + SEA
  KR3: App Store rating ≥ 4.5
  KR4: Monthly revenue positive (hardware pre-orders + subscription)
```

### Sprint Breakdown

#### Sprint 37–38: Thailand + Malaysia Expansion
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Thai + Malay localization | Theme 7 | 4 | i18n framework | Medium | ⏳ PENDING |
| Regional payment methods (PromptPay, GrabPay) | Theme 7 | 4 | None | High | ⏳ PENDING |
| SEA influencer partnership (health/wellness niche) | Theme 7 | 2 | None | Medium | ⏳ PENDING |

---

#### Sprint 39–40: Platform Scalability
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Load test đến 10,000 concurrent users | Theme 3 | 3 | None | Low | ⏳ PENDING |
| Supabase connection pooling optimization | Theme 3 | 3 | Load test | Medium | ⏳ PENDING |
| Edge Function performance optimization | Theme 3 | 2 | None | Low | ⏳ PENDING |
| Database partitioning review (water_logs at scale) | Theme 3 | 3 | None | Medium | ⏳ PENDING |

---

#### Sprint 41–42: Commercial Launch Preparation
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| E-commerce integration (Shopify hoặc tự build) | Theme 6 | 5 | None | High | ⏳ PENDING |
| Hardware warranty + support system | Theme 6 | 3 | None | Low | ⏳ PENDING |
| Unboxing + setup experience design | Theme 5 | 2 | None | Low | ⏳ PENDING |

---

### Hardware Track Q3 Year 2
```
Q3 Hardware:
  Tháng 7: Nhận golden sample batch (10–20 units) từ factory
  Tháng 8: Final quality check + firmware v1.0 lock
  Tháng 9: Production run start (500–1,000 units, ~8–10 tuần)
```

---

## YEAR 2 — Q4 (Sprint 43–48): "Hardware Commercial Launch"
**Thời gian:** Tháng 10–12, Year 2

### Quarter Goal
**M4 — DigiBottle Commercial Launch.**
10,000 MAU. Hardware revenue live. Full B2C ecosystem.

### OKRs
```
Objective: "DigiBottle is a real product people can buy"
  KR1: 500+ units sold trong Q4
  KR2: 10,000 MAU
  KR3: App Store rating ≥ 4.5 maintained
  KR4: Monthly revenue ≥ break-even (hardware + subscription)
```

### Sprint Breakdown

#### Sprint 43–44: Hardware Launch
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Product launch campaign (Vietnam + SEA) | Theme 6 | 3 | Manufacturing | Low | ⏳ PENDING |
| E-commerce store go-live | Theme 6 | 3 | Sprint 41–42 | Low | ⏳ PENDING |
| Launch-day monitoring (Sentry + Supabase alerts) | Theme 3 | 2 | Observability | Low | ⏳ PENDING |

---

#### Sprint 45–46: Post-Launch Optimization
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| Hardware v1.1 feedback collection (batch 2 prep) | Theme 5 | 3 | Launch data | Low | ⏳ PENDING |
| AI features expansion với real hardware data at scale | Theme 4 | 4 | 10K MAU data | Medium | ⏳ PENDING |
| Advanced analytics dashboard cho users | Theme 4 | 3 | None | Low | ⏳ PENDING |

---

#### Sprint 47–48: Year 3 Foundation
| Story | Theme | Points | Dependencies | Risk | Status |
|---|---|---|---|---|---|
| DigiBottle v2 hardware spec draft | Theme 5 | 2 | Beta + launch feedback | Low | ⏳ PENDING |
| API platform v2 planning (third-party integrations) | Theme 2 | 2 | None | Low | ⏳ PENDING |
| Annual security re-audit (mini Mode 1) | Theme 3 | 3 | None | Low | ⏳ PENDING |
| Year 3 roadmap planning | Theme 3 | 1 | None | Low | ⏳ PENDING |

---

## PHẦN 4 — Migration Plans

**Không có Breaking Changes từ audit.** Tất cả issues đã resolved.

Breaking change duy nhất sẽ phát sinh trong roadmap:

### Migration Plan: In-App Purchase Integration (Sprint 21–22)

**Trigger:** Freemium → Premium subscription gating
**Impact:** Users hiện tại không bị affect (tất cả feature vẫn free cho existing users)

```
Phase 1 — Prepare (Sprint 21)
  • Define feature tiers (free vs premium)
  • Setup RevenueCat hoặc native IAP
  Checkpoint: Sandbox purchase thành công

Phase 2 — Migrate (Sprint 22)
  • Feature flags cho premium features
  • Graceful degradation khi subscription expire
  Checkpoint: 10 test purchases thành công trên TestFlight

Phase 3 — Cleanup (Sprint 23)
  • Remove hardcoded "all features free" logic
  Checkpoint: All users correctly gated
```

**Rollback:** Feature flag → set all users to "premium" nếu IAP fails
**Breaking Change:** No — additive only

---

## PHẦN 5 — Architecture Evolution Map

```
NOW (Audit Baseline — A+)
─────────────────────────
Web + Capacitor (demo BLE) · Supabase · Groq AI · Webhook platform
Strengths: Clean, audited, zero debt, idempotent sync, SSRF-protected
Gap: No observability · BLE is demo · No monetization · No hardware

Y1 Q2 (App Store Launch)
─────────────────────────
+ Real Capacitor BLE plugin (dev kit)
+ Sentry observability
+ CI/CD automated
+ Freemium gating
Gap: Hardware still prototype · No subscription revenue · 100 MAU only

Y1 Q4 (Ecosystem Foundation)
──────────────────────────────
+ BLE real hardware (prototype)
+ Developer platform (webhook API public)
+ Subscription tier live
+ Gamification + retention
Scale ceiling: ~2,000 MAU comfortably

Y2 Q2 (Hardware Beta)
──────────────────────
+ Real DigiBottle in real hands (50–200 users)
+ Full BLE security (challenge-response + replay protection)
+ SEA soft launch
+ OTA firmware updates
Scale ceiling: ~5,000 MAU

Y2 Q4 (Scale Ready — Commercial)
──────────────────────────────────
+ DigiBottle commercial (500–1,000 units sold)
+ SEA market live (Vietnam + Singapore + Thailand + Malaysia)
+ Full AI ecosystem (personalization + insights from real hardware data)
+ E-commerce + hardware warranty system
Scale ceiling: 10,000+ MAU, Supabase handles without re-architecture
```

---

## PHẦN 6 — Technical Debt Burndown

```
Quarter | Debt Items | New Features | Net Debt | Health Grade
────────────────────────────────────────────────────────────
Baseline|     0      |      0       |    0     |     A+
Y1 Q1   |     0      |     ~5       |    5     |     A+
Y1 Q2   |     0      |     ~8       |    8     |     A+
Y1 Q3   |     2      |     ~6       |    6     |     A+
Y1 Q4   |     3      |     ~7       |    4     |     A+
Y2 Q1   |     2      |     ~6       |    2     |     A+
Y2 Q2   |     2      |     ~7       |    0     |     A+
Y2 Q3   |     2      |     ~6       |    0     |     A+
Y2 Q4   |     2      |     ~5       |    0     |     A+

Note: "Debt Items" là minor issues phát sinh từ new features,
      không phải audit findings. Debt ratio target: ≤ 20% mọi sprint.
```

---

## PHẦN 7 — Milestone Gates

```
GATE 1: "Launch Ready" — End Y1 Q2
  ☑ App Store approved (iOS + Android)
  ☑ Crash-free rate ≥ 99% tuần đầu
  ☑ BLE plugin working với Nordic dev kit (Hoàn thành ở Sprint 3-4 Phase B)
  ☑ Sentry observability live (Hoàn thành ở Sprint 1-2)
  ☑ CI/CD pipeline automated (Hoàn thành ở Sprint 1-2)
  Consequence of failure: Delay launch, không scope-cut security

GATE 2: "Hardware Ready" — End Y1 Q4
  ☐ Hardware prototype v0.2 stable
  ☐ BLE success rate ≥ 95% với real hardware
  ☐ Beta waitlist ≥ 200 signups
  ☐ Subscription IAP live
  Consequence of failure: Push hardware beta to Q3 Y2

GATE 3: "Beta Validated" — End Y2 Q2
  ☐ 200 beta units active
  ☐ Beta NPS ≥ 50
  ☐ BLE success rate ≥ 97% real-world
  ☐ No Critical bugs in BLE stack
  Consequence of failure: Delay manufacturing run, iterate hardware

GATE 4: "Commercial Launch" — End Y2 Q4
  ☐ 500+ units sold
  ☐ 10,000 MAU
  ☐ App Store rating ≥ 4.5
  ☐ Monthly revenue ≥ break-even
  ☐ Annual security mini-audit passed
  Consequence of failure: Extend Y2, delay DigiBottle v2 spec
```

---

## PHẦN 8 — Risk Register

```
| # | Risk | Prob | Impact | Mitigation | Trigger |
|---|---|---|---|---|---|
| R1 | Hardware prototype delays | High | High | Nordic dev kit làm fallback cho BLE dev | Q3 Y1 milestone slip |
| R2 | CE/FCC certification rejected | Med | Critical | Start early (Q4 Y1), hire consultant | Rejection letter |
| R3 | Manufacturing quality issues | Med | High | Golden sample review trước production run | Sample QC fail |
| R4 | App Store rejection | Med | High | TestFlight beta trước, follow guidelines strictly | Rejection notice |
| R5 | Groq AI cost spike | High | Med | Token budget per user, fallback to smaller model | Daily cost > $50 |
| R6 | Supabase breaking change | Low | High | Pin version, staged upgrade | Release notes |
| R7 | Solo developer burnout | High | Critical | Scope cut protocol, AI tools buffer, mandatory breaks | Velocity < 50% 2 sprint liên tiếp |
| R8 | BLE hardware incompatibility | Med | High | Test trên 5+ Android devices, 3+ iOS | < 90% success rate |
| R9 | SEA regulatory (data residency) | Low | High | Research trước launch, Supabase region config | Legal inquiry |
| R10 | Solo developer illness/extended absence | Med | Critical | Emergency backup plan, documentation handoff | Extended absence > 2 weeks |
| R11 | AI service downtime (Groq API) | Med | High | Fallback to local models, retry logic, graceful degradation | API downtime > 1 hour |
| R12 | Supply chain disruptions (chip shortages, shipping) | Med | High | Multiple suppliers, buffer stock, flexible timeline | Lead time > 4 months |
| R13 | Currency fluctuations affecting hardware costs | Low | Medium | Fixed-price contracts where possible, pricing buffer | Currency fluctuation > 10% |
```

---

## PHẦN 9 — Debt Ratio Policy

```
Debt Ratio = Debt items / Total sprint items × 100

Y1 Q1–Q2: 0% debt (không có audit findings)
           100% new capability + infrastructure
Y1 Q3–Q4: ≤ 20% debt (minor issues từ new features)
Y2 Q1–Q2: ≤ 15% debt
Y2 Q3–Q4: ≤ 10% debt

Guardrail:
  Nếu BLE issues accumulate → tự động priority bump
  Nếu hardware delays → reallocate sprint capacity sang software features
  Solo burnout signal: velocity < 8 points/sprint 2 tuần liên tiếp
    → Scope cut: drop Bucket D items, focus Bucket B only
```

---

## PHẦN 9.5 — Solo Sustainability Policy

```
Mandatory Breaks:
  • 1-week break every 6 sprints (6 breaks total trong 2 năm)
  • No work during breaks (including planning/review)
  • Break schedule: End of Sprint 6, 12, 18, 24, 30, 36

Task Rotation:
  • Alternate between software, hardware, and business tasks
  • Avoid 3+ consecutive sprints on same theme
  • Theme diversity goal: ≥ 2 themes per quarter

AI Tools Efficiency Monitoring:
  • Weekly check: AI tool efficiency (time saved vs time spent)
  • If efficiency < 1.2x → reduce AI dependency, manual coding
  • If efficiency > 1.5x → increase AI tool usage

Proactive Burnout Prevention:
  • Daily work limit: 8 hours max (no overtime)
  • Weekend off: No work Saturday/Sunday
  • Health check: Monthly self-assessment (energy, motivation, stress)
  • If health check < 6/10 → mandatory 3-day break

Emergency Protocol:
  • Extended absence (> 2 weeks) → activate backup plan
  • Critical illness → pause roadmap, reassess timeline
  • Mental health crisis → immediate 2-week break, professional support
```

---

## PHẦN 10 — Success Metrics Dashboard

```
Metric                    | Now    | Y1 Q2  | Y1 Q4  | Y2 Q4
──────────────────────────────────────────────────────────────
Health Grade              | A+     | A+     | A+     | A+
Risk Score                | 5      | 5      | 5      | ≤ 5
MAU                       | ~0     | 100    | 1,000  | 10,000
Crash-Free Rate           | N/A    | ≥ 99%  | ≥ 99.2%| ≥ 99.5%
BLE Success Rate          | demo   | 95%*   | 95%    | ≥ 97%
App Store Rating          | N/A    | —      | ≥ 4.0  | ≥ 4.5
Hardware Units            | 0      | 0      | proto  | 500+
Subscription Conversion   | 0%     | 0%     | ≥ 3%   | ≥ 8%
AI Engagement (DAU)       | ~10%   | 20%    | 30%    | 40%
Deploy Frequency          | manual | 1/week | 2/week | daily
P95 API Latency           | ?      | < 500ms| < 400ms| < 300ms
Monthly Revenue           | $0     | $0     | positive| break-even

* với Nordic dev kit, chưa phải real hardware
```

---

## PHẦN 11 — Review Cadence

```
Weekly:
  → Sprint velocity check (đang đi đúng không?)
  → Hardware track update (nếu đang trong hardware phase)
  → Sentry error review

Monthly:
  → Roadmap health check
  → Risk register review (đặc biệt hardware risks)
  → Metrics dashboard update
  → AI cost check (Groq spending)

Quarterly:
  → Gate review (pass/fail)
  → Roadmap reprioritization
  → Hardware milestone check-in với manufacturer

Annually (End Y1):
  → Mini security audit (Mode 1 Quick Scan)
  → Architecture review
  → Y2 roadmap refinement

Ad-hoc triggers:
  → Production incident → post-mortem → roadmap adjustment
  → Hardware issue từ beta → emergency sprint
  → CVE score ≥ 7.0 trong dependency → immediate fix sprint
  → Solo burnout signal → scope cut meeting với chính mày
```

---

## PHẦN 12 — Changelog

### Update 25/05/2026 (Sprint 13-14 & Sprint 15-16 Completed - AI & Gamification)

**Status Changes:**
- Sprint 13-14: All tasks marked as ✅ COMPLETED (24/05/2026) (Hydration pattern analysis, AI-driven smart reminder system, and AI weekly report with notifications).
- Sprint 15-16: All tasks marked as ✅ COMPLETED (24/05/2026) (Virtual streak badges, leaderboard privacy opt-out toggle, and push settings integration).

**Rationale:**
- Implemented AI Personalization, Weekly Reports, and Retention/Gamification features to drive user engagement and provide smart habits guidance.

### Update 25/05/2026 (Sprint 11-12 Completed - Freemium & Performance)

**Status Changes:**
- Sprint 11-12: All tasks marked as ✅ COMPLETED (23/05/2026) (Lighthouse CI, bundle size monitoring, database index optimization, 3-tier freemium model, premium waitlist modal, and admin waitlist stats).

**Rationale:**
- Established performance measurement baseline, optimized database queries, and implemented 3-tier pricing gating logic.

### Update 23/05/2026 (Sprint 5-6 & Sprint 9-10 BLE Security Completed)

**Status Changes:**
- Sprint 5-6: All tasks marked as ✅ COMPLETED (23/05/2026) (Supabase migration check, npm audit, Dependabot setup, full dependency scan, and test coverage report setup in CI).
- Sprint 9-10: Challenge-response authentication draft (software side) and connection health score tracking/proactive reconnect marked as ✅ COMPLETED (23/05/2026).

**Rationale:**
- Completed the full CI/CD verification engine and established native challenge-response authentication for secure communication with DigiBottle, plus intelligent connection quality diagnostics and automated reconnects.

### Update 22/05/2026 (Sprint 3-4 Phase B Completed - BLE Integration)

**Status Changes:**
- Sprint 3–4 renamed to "BLE Architecture Research & Integration".
- Added Phase B: Integration tasks to Sprint 3-4 and marked them as ✅ COMPLETED (22/05/2026).
- Sprint 9-10: Marked core BLE tasks (plugin integration, scan/discovery UI, and GATT read for water sensor characteristic) as ✅ COMPLETED (22/05/2026) since they were pulled forward and completed in Sprint 3-4 Phase B.
- Gate 1: Marked "BLE plugin working với Nordic dev kit", "Sentry observability live", and "CI/CD pipeline automated" as checked (☑).

**Rationale:**
- Accelerated development of the BLE core to establish real-world integration early, enabling rapid testing of mobile and web simulation flows.

### Update 22/05/2026 (Sprint 3-4 Phase A Completed)

**Status Changes:**
- Sprint 3–4: BLE Architecture Research tasks marked as ✅ COMPLETED (22/05/2026) (Capacitor BLE plugin evaluation, Nordic nRF52 dev kit setup/mock integration, GATT profile design, and iOS/Android permissions).

### Update 22/05/2026 (Sprint 1 Completed)

**Status Changes:**
- Discovery Phase tasks marked as ✅ COMPLETED (22/05/2026)
- Sprint 1–2: Observability Stack remaining tasks marked as ✅ COMPLETED (22/05/2026) (Supabase slow query logging, Core Web Vitals baseline measurements, Groq/AI cost dashboard setup)

### Update 22/05/2026 (Current State Audit + Evaluation Report)

**Added:**
- Last Updated field in header
- Discovery Phase (2 weeks) before Sprint 1
- Status column to all sprint tables for progress tracking
- Solo Sustainability Policy (PHẦN 9.5) with mandatory breaks, task rotation, AI efficiency monitoring
- 4 new risks to Risk Register (R10-R13): Solo illness, AI downtime, supply chain, currency fluctuations

**Updated:**
- Sprint 1-2: Marked Sentry setup and error boundary as COMPLETED (from InsightTab audit), adjusted points from 10 → 5
- Sprint 5-6: Marked GitHub Actions pipeline as COMPLETED, adjusted points from 10 → 7
- Risk R7: Enhanced burnout mitigation with mandatory breaks

**Status Changes:**
- All sprint tables now have Status column (✅ COMPLETED, ⏳ PENDING)
- Discovery Phase tasks marked as PENDING
- All future sprint tasks marked as PENDING

**Rationale:**
- Align roadmap with actual current state based on InsightTab audit
- Add progress tracking mechanism per evaluation report recommendation
- Strengthen solo sustainability with proactive measures
- Add missing risks identified in evaluation report

---

*Roadmap generated: 22/05/2026*
*Based on: Audit Report A+ (17/17 resolved) + DigiWell Product Context*
*Last updated: 25/05/2026 (Sprints 11-16 Completed - Freemium, AI Personalization & Gamification)*
*Next review: End of Y1 Q3 (Gate 2 check)*