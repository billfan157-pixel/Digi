# Sprint 9–10: BLE Security + CI/CD Maturity

**Sprint Goal:** App có bảo mật BLE cơ bản (challenge-response) và pipeline CI/CD hoàn thiện (migration + coverage + dependency audit).

**Thời gian:** 2 tuần

---

## Current State (Post-Sprint 8)

| Mục | Trạng thái |
|-----|-----------|
| BLE scan / connect / disconnect | `src/lib/ble.ts` — hoạt động trên native |
| GATT hydration packet parser | `parseHydrationPacket` — có checksum XOR |
| Battery + temperature read | `readBatteryLevel`, `readTemperature` — GATT read |
| Reconnect logic | `useSmartBottle.ts` — exponential backoff, 5 lần retry |
| Connection state machine | idle → connecting → connected → reconnecting → error |
| App Store metadata | `metadata/` — VI + EN, sẵn sàng |
| Native build pipeline | Android AAB workflow có sẵn; iOS blocked |
| Challenge-response auth | Chưa có |
| Connection health monitoring | Chỉ có signalStrength mock |
| CI: Supabase migration check | Chưa có |
| CI: Test coverage report | Chưa có |
| CI: Dependency audit / Dependabot | Chưa có |

---

## Story Breakdown

### 1. BLE Challenge-Response Authentication (Software Side)
**Points:** 4 | **Theme:** BLE Security | **Risk:** High

DigiBottle phải chứng minh danh tính trước khi app tin tưởng dữ liệu hydration. App gửi challenge ngẫu nhiên, DigiBottle trả về response được ký/HMAC.

#### Tasks
1. **Định nghĩa auth protocol v0.1**
   - Challenge: 16 bytes random (crypto.getRandomValues)
   - Response: HMAC-SHA256(challenge, sharedSecret) — 32 bytes
   - Shared secret: hardcoded trong firmware v0.1, app lưu trong `profiles.bottle_auth_key`
   - GATT characteristic mới: `AUTH_CHAR_UUID = d3b00002-...` (9-byte response packet)

2. **Implement `authenticateDevice()` trong `src/lib/ble.ts`**
   ```typescript
   export async function authenticateDevice(
     deviceId: string,
     sharedSecret: string
   ): Promise<boolean>
   ```
   - Gửi challenge qua GATT write
   - Đọc response qua GATT read (hoặc notification)
   - Verify HMAC-SHA256 locally
   - Return `true` nếu match, `false` nếu không

3. **Tích hợp vào `useSmartBottle.ts`**
   - Sau `bleConnectDevice`, gọi `authenticateDevice`
   - Nếu auth fail: disconnect + toast lỗi + set state `error`
   - Nếu auth success: tiếp tục `subscribeToHydration`
   - Thêm `authRequired` flag (default `true` cho native, `false` cho web demo)

4. **Unit tests**
   - Test HMAC calculation (known vectors)
   - Test `authenticateDevice` với mock response đúng/sai
   - Test integration trong `useSmartBottle`: auth fail dừng flow

#### Acceptance Criteria
- [ ] `authenticateDevice` verify HMAC-SHA256 đúng với known test vectors
- [ ] Auth fail ngăn không cho `subscribeToHydration` chạy
- [ ] Web demo mode bỏ qua auth (không có real BLE device)
- [ ] Unit tests pass (coverage auth functions ≥ 90%)
- [ ] GATT characteristic UUID được document trong `src/lib/ble.ts`

#### Files Modified
- `src/lib/ble.ts` — thêm `authenticateDevice`, `AUTH_CHAR_UUID`
- `src/hooks/useSmartBottle.ts` — tích hợp auth vào connect flow
- `src/lib/ble.test.ts` — unit tests (tạo mới nếu chưa có)

---

### 2. BLE Connection Health & Reconnect Intelligence
**Points:** 3 | **Theme:** BLE Reliability | **Risk:** Medium

Reconnect hiện tại chỉ dựa trên disconnect event. Cần thêm monitoring để phát hiện connection unstable trước khi disconnect.

#### Tasks
1. **Connection health score**
   - Theo dõi: RSSI (signal strength), packet latency, missed notifications
   - Health score: 0–100 (exponential moving average)
   - Hiển thị trong `BottleTab` dạng chip màu (green/yellow/red)

2. **RSSI polling**
   - Thêm `readRssi(deviceId)` trong `src/lib/ble.ts`
   - Polling mỗi 10s khi connected (không đụng telemetry 30s)
   - Cập nhật `metrics.signalStrength` = RSSI map (-30dBm = 100%, -90dBm = 0%)

3. **Proactive reconnect**
   - Nếu health score < 30 trong 3 lần liên tiếp → trigger reconnect sớm
   - Tránh reconnect khi user đang actively drink (suppress trong 5s sau hydration event)

4. **UI improvements**
   - BottleTab hiển thị "Tín hiệu yếu" toast nếu health < 30
   - DiagnosticsPanel thêm section "Kết nối BLE" với RSSI, latency, health score

#### Acceptance Criteria
- [ ] `signalStrength` = thực RSSI (native) thay vì fixed 100
- [ ] Health score cập nhật real-time trong UI
- [ ] Proactive reconnect chỉ trigger khi không có active hydration event
- [ ] Web demo: RSSI mock giảm dần theo thời gian để test UI

#### Files Modified
- `src/lib/ble.ts` — thêm `readRssi`
- `src/hooks/useSmartBottle.ts` — health score tracking, proactive reconnect
- `src/tabs/BottleTab.tsx` — hiển thị health score trong DiagnosticsPanel

---

### 3. CI/CD: Supabase Migration + Test Coverage Automation
**Points:** 3 | **Theme:** Platform Infrastructure | **Risk:** Low

Sprint 5–6 còn pending. Hoàn thiện pipeline để mỗi PR được verify migration và test coverage.

#### Tasks
1. **Supabase migration check trong CI**
   - Workflow mới hoặc bước trong `ci.yml`:
     - Chạy `supabase migration list` (nếu CLI available)
     - Hoặc: script kiểm tra tất cả `.sql` files trong `supabase/migrations/` có chạy được không
     - Block PR nếu migration bị conflict hoặc thiếu down script (nếu cần)

2. **Test coverage report trong CI**
   - Thêm `npm run test -- --coverage` vào CI workflow
   - Upload coverage report làm artifact
   - Fail CI nếu coverage giảm > 5% so với main (hoặc threshold ≥ 50%)
   - (Optional) Integrate Codecov hoặc Coveralls

3. **Coverage badge**
   - Thêm badge vào README.md
   - Hoặc: artifact HTML report có thể xem trong Actions tab

#### Acceptance Criteria
- [ ] Mỗi PR chạy tests + coverage tự động
- [ ] Coverage report upload thành artifact
- [ ] CI fail nếu tests fail hoặc coverage drop > 5%
- [ ] README có coverage badge hoặc link đến report

#### Files Modified
- `.github/workflows/ci.yml` — thêm coverage step
- `README.md` — badge (optional)
- `package.json` — script `test:coverage` nếu chưa có

---

### 4. CI/CD: Dependabot + Dependency Security Audit
**Points:** 2 | **Theme:** Platform Infrastructure | **Risk:** Low

Tự động phát hiện lỗ hổng dependencies và tạo PR update.

#### Tasks
1. **Enable Dependabot**
   - Tạo `.github/dependabot.yml` cho npm updates (weekly)
   - Tách security updates (daily) và version updates (weekly)
   - Giới hạn: max 5 open PRs, ignore patch updates (chỉ minor/major)

2. **npm audit trong CI**
   - Thêm `npm audit --audit-level=high` vào CI workflow
   - Allowlist cho known acceptable warnings (nếu có)
   - Fail CI nếu có CVE severity ≥ high

3. **Dependency scan report**
   - Chạy `npm audit` định kỳ và lưu kết quả vào artifact
   - Hoặc dùng GitHub Security tab (tự động khi Dependabot enabled)

#### Acceptance Criteria
- [ ] Dependabot tạo PR cho npm updates (weekly)
- [ ] CI chạy `npm audit` và fail với high/critical CVE
- [ ] Không có CVE severity ≥ high trong `npm audit` hiện tại
- [ ] `package-lock.json` không bị lỗi outdated dependencies nghiêm trọng

#### Files Modified
- `.github/dependabot.yml` — tạo mới
- `.github/workflows/ci.yml` — thêm audit step
- `package.json` — update dependencies nếu audit phát hiện lỗ hổng

---

## Dependencies & Blockers

| # | Dependency | Owner | Risk | Mitigation |
|---|-----------|-------|------|------------|
| 1 | HMAC-SHA256 implementation | Dev | Low | Dùng Web Crypto API (`crypto.subtle`) hoặc `crypto.createHmac` trong Edge Function nếu cần server-side |
| 2 | `crypto.getRandomValues` trong native Capacitor | Dev | Low | Đã có trong WebView, không cần plugin |
| 3 | BLE plugin hỗ trợ GATT write | Dev | Low | `@capacitor-community/bluetooth-le` hỗ trợ `write()` — verify trước implement |
| 4 | Supabase CLI trong GitHub Actions | Dev | Low | Cài `supabase/cli` qua `npm install supabase --global` hoặc Docker |

---

## Hardware Track (Q2 — song song)

```
Tháng 4 (Sprint 9–10):
  • Chọn manufacturer, ký NDA (owner: người dùng)
  • Finalize DigiBottle hardware spec v0.1:
    - BLE chip: Nordic nRF52840 (đề xuất) hoặc ESP32-C3
    - Battery: 500mAh Li-Po, target 7 ngày
    - Sensor: load cell / capacitive water level
    - Casing: BPA-free plastic, IP67
  • Confirm firmware team có thể implement HMAC-SHA256 trên BLE chip

Tháng 5 (Sprint 11–12):
  • PCB design review v0.1
```

---

## Verification Checklist

### BLE Auth
- [ ] Unit test: HMAC-SHA256("hello", "secret") = known value
- [ ] Integration test: auth fail → disconnect → error state
- [ ] Manual test (simulator): mock response đúng/sai

### Connection Health
- [ ] Unit test: RSSI → signalStrength mapping (-30=100, -90=0)
- [ ] Unit test: health score decay/growth
- [ ] Manual test: proactive reconnect trigger đúng

### CI/CD
- [ ] PR tạo ra chạy tests + coverage
- [ ] `npm audit` pass trong CI
- [ ] Dependabot tạo PR (sau khi merge)

---

## Definition of Done (Sprint 9–10)

```
☑ Challenge-response auth hoạt động trên native (mock dev kit OK)
☑ Connection health score hiển thị trong BottleTab
☑ CI chạy tests + coverage + audit trên mỗi PR
☑ Dependabot enabled cho npm dependencies
☑ Tất cả tests pass, typecheck pass, build pass
☑ Không có CVE severity ≥ high trong npm audit
☑ Sprint demo: kết nối BLE → auth success → nhận hydration event
```
