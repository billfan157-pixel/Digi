# Sprint 8: App Store Submission Pipeline & Store Metadata

**Sprint Goal:** App sẵn sàng submit lên App Store và Google Play. Build signed hoàn chỉnh, metadata đầy đủ, checklist rõ ràng.

**Thời gian:** 2 tuần

---

## Current State (Post-Sprint 7)

| Mục | Trạng thái |
|-----|-----------|
| Privacy Policy + ToS | `public/privacy-policy.html` + `terms-of-service.html` |
| Onboarding i18n | `OnboardingModal.tsx` + `FirstSessionChecklistModal.tsx` |
| ESLint clean | 0 errors, 0 warnings |
| Build + Size + Smoke | Pass |
| iOS Unsigned Build | `build-ios.yml` workflow có sẵn (unsigned IPA) |
| Deep Link (Stripe) | `AppBootstrap.tsx` — `appUrlOpen` listener |
| App Icons / Splash | Chưa generate — chỉ có `public/icons.svg` |
| Signed Build Pipeline | Chưa có signing cert / keystore |
| Store Metadata | Chưa có screenshots, descriptions, keywords |
| Submission Checklist | Chưa có |
| Fastlane / Equivalent | Chưa có |

---

## Story Breakdown

### 1. Capacitor Assets (App Icons + Splash Screens)
**Points:** 3 | **Theme:** Store Prep | **Risk:** Low

- Generate iOS app icons (`AppIcon.appiconset`) — tất cả required sizes (20pt–1024pt)
- Generate Android adaptive icons (foreground + background layers)
- Generate splash screens cho iOS và Android (light + dark mode)
- Verify trong Xcode và Android Studio
- **Command:** `npx capacitor-assets generate` (sau khi đặt source images vào `assets/`)

**Acceptance Criteria:**
- `ios/App/App/Assets.xcassets/AppIcon.appiconset` chứa đầy đủ icon sizes
- `android/app/src/main/res/mipmap-*/` chứa adaptive icons
- Splash screen hiển thị đúng trên cả 2 nền tảng, không bị stretch/crop

---

### 2. iOS Signed Build Pipeline
**Points:** 5 | **Theme:** Store Prep | **Risk:** Medium

- Cập nhật `build-ios.yml` để support **signed build**:
  - Import Apple Developer signing certificate (GitHub Secret: `IOS_DIST_CERTIFICATE_BASE64`, `IOS_DIST_CERTIFICATE_PASSWORD`)
  - Import provisioning profile (GitHub Secret: `IOS_PROVISIONING_PROFILE_BASE64`)
  - Set `CODE_SIGN_IDENTITY`, `PROVISIONING_PROFILE_SPECIFIER`
  - Build **Archive** thay vì plain `xcodebuild build`
  - Export `.ipa` signed hoặc upload lên **TestFlight** qua `xcodebuild -exportArchive`
- **Hoặc** nếu chưa có Apple Developer account: để lại docs hướng dẫn manual signing
- Tạo `docs/ios-signing-setup.md` ghi rõ:
  - Cách tạo Distribution certificate
  - Cách tạo Provisioning profile (App Store)
  - Cách encode base64 để đưa vào GitHub Secrets

**Acceptance Criteria:**
- Workflow có thể tạo signed IPA hoặc docs rõ ràng để làm manual
- IPA pass validation cơ bản (`altool --validate-app`)

---

### 3. Android AAB Build Pipeline
**Points:** 3 | **Theme:** Store Prep | **Risk:** Low

- Tạo keystore cho Android release (`jarsigner` / `keytool`)
- Cấu hình `android/app/build.gradle` signing config:
  - `storeFile`, `storePassword`, `keyAlias`, `keyPassword` từ env/secrets
- Cập nhật workflow `ci.yml` hoặc tạo `build-android.yml`:
  - `npm run build`
  - `npx cap sync android`
  - `./gradlew bundleRelease`
  - Upload `.aab` artifact
- Tạo `docs/android-signing-setup.md`

**Acceptance Criteria:**
- `.aab` file tạo được từ CI
- AAB pass Google Play upload validation

---

### 4. App Store Metadata (VI + EN)
**Points:** 3 | **Theme:** Store Prep | **Risk:** Low

Tạo `metadata/app-store/` với:
- `title.txt` — DigiWell (30 chars)
- `subtitle.txt` — Uống nước thông minh (30 chars)
- `description.txt` — Mô tả đầy đủ (4000 chars max)
- `keywords.txt` — `uống nước, sức khỏe, hydration, reminder, wellness` (100 chars)
- `promotional_text.txt` — Tagline ngắn (170 chars)
- `release_notes.txt` — "Initial release"
- `support_url.txt` — `https://digiwell.app/support` (placeholder)
- `marketing_url.txt` — `https://digiwell.app` (placeholder)
- `privacy_url.txt` — `https://digiwell.app/privacy-policy.html`
- `screenshots/` — iPhone 6.5" + 5.5" + iPad Pro (12.9") — **VI + EN**

Tương tự `metadata/app-store-en/` hoặc dùng cấu trúc Fastlane `metadata/en-US/`, `metadata/vi/`.

**Acceptance Criteria:**
- Mọi text file trong giới hạn ký tự Apple
- Screenshots đúng kích thước required

---

### 5. Google Play Metadata (VI + EN)
**Points:** 3 | **Theme:** Store Prep | **Risk:** Low

Tạo `metadata/google-play/` với:
- `short_description.txt` — 80 chars
- `full_description.txt` — 4000 chars
- `feature_graphic.png` — 1024x500
- `phone_screenshots/` — 2–8 screenshots
- `tablet_screenshots/` — optional
- `title.txt` — 50 chars
- `video.txt` — optional (YouTube trailer URL)

**Acceptance Criteria:**
- Feature graphic đúng tỷ lệ 1024x500
- Screenshots không chứa status bar / sensitive UI

---

### 6. App Store Submission Checklist
**Points:** 2 | **Theme:** Store Prep | **Risk:** Low

Tạo `docs/app-store-submission-checklist.md` gồm:
- [ ] Apple Developer Program ($99/year) — **người dùng cần đăng ký**
- [ ] Google Play Developer ($25 one-time) — **người dùng cần đăng ký**
- [ ] App ID (`com.vlu.digiwell`) registered trong App Store Connect
- [ ] Privacy Nutrition Label (Apple) — điền đúng data types
- [ ] Data safety section (Google Play) — tương tự privacy label
- [ ] In-App Purchase products configured (nếu có Premium)
- [ ] TestFlight Internal Testing group + testers
- [ ] Closed testing track (Google Play)
- [ ] Review guidelines check:
  - [ ] Không dùng private API
  - [ ] Không có placeholder text / unfinished UI
  - [ ] Sign-in with Apple nếu có other third-party login
  - [ ] App không crash on launch
  - [ ] Deep link hoạt động
  - [ ] Push notification permission request đúng context

**Acceptance Criteria:**
- Checklist đầy đủ, actionable, có owner rõ ràng

---

### 7. In-App Purchase Compliance Review
**Points:** 2 | **Theme:** Store Prep | **Risk:** Medium

- Review `usePremiumGamification.ts` và payment flow:
  - Apple yêu cầu **In-App Purchase (IAP)** cho digital goods — không được dùng Stripe/ PayOS trực tiếp trên iOS
  - Google Play cũng yêu cầu **Google Play Billing** cho digital goods
- **Nếu Premium là physical goods / services:** có thể dùng Stripe (nhưng phải docs rõ)
- **Nếu Premium là digital goods (exp boost, coins, premium features):**
  - Cần integrate `cordova-plugin-purchase` hoặc `revenuecat`
  - Hoặc tạm thời **disable Premium purchase trên mobile**, chỉ cho phép qua Web
- Tạo `docs/iap-compliance-review.md` ghi rõ quyết định và action items

**Acceptance Criteria:**
- Rõ ràng: app sẽ dùng IAP hay Stripe / sẽ disable purchase trên mobile
- Không có lỗi rejection rủi ro cao

---

### 8. Review Guidelines Pre-Check
**Points:** 2 | **Theme:** Store Prep | **Risk:** Medium

- Kiểm tra tất cả native permission requests:
  - BLE — `NSBluetoothAlwaysUsageDescription` trong `Info.plist`
  - Camera — `NSCameraUsageDescription` (nếu QuickDropCamera dùng native camera)
  - Photo Library — `NSPhotoLibraryUsageDescription` (nếu có)
  - Location — `NSLocationWhenInUseUsageDescription`
  - Health — `NSHealthShareUsageDescription` (nếu sync Apple Health)
  - Notifications — `UNUserNotificationCenter`
- Kiểm tra `Info.plist` và `AndroidManifest.xml` không thiếu permission descriptions
- Đảm bảo không có `server.url` hay debug config trong production build
- Đảm bảo `version` và `build number` được bump đúng

**Acceptance Criteria:**
- Tất cả permission descriptions có trong native config
- Không có debug/live reload config trong production

---

## Sprint Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Chưa có Apple Developer account | **Blocker iOS** | Người dùng cần đăng ký ASAP ($99). Pipeline vẫn build unsigned để test. |
| IAP vs Stripe compliance | **Rejection risk** | Review ngay đầu sprint. Quyết định disable purchase on mobile nếu cần. |
| Screenshot generation tốn thời gian | Medium | Dùng mock data + browser dev tools device emulation. Không cần real device. |
| Android signing keystore lost | **Blocker** | Lưu keystore trong GitHub Secrets + backup ngoài. |

---

## Definition of Done

1. Signed iOS IPA hoặc TestFlight upload thành công (hoặc docs rõ ràng cho manual step)
2. Signed Android AAB tạo được từ CI
3. Metadata đầy đủ cho cả App Store và Google Play (VI + EN)
4. Submission checklist hoàn chỉnh, actionable
5. IAP compliance quyết định rõ ràng, không còn rejection risk cao
6. Permission descriptions đầy đủ trong native config
7. App icons + splash screens generate và verify OK

---

## Sprint 8 → Sprint 9 Handoff

Sprint 9 sẽ là **Real BLE Implementation (Dev Kit Phase)**. Để handoff sạch:
- App phải đã **submitted hoặc ready for submission**
- Không còn blocker nào cho store review
- Beta testing track đã mở (TestFlight / Google Play Closed Testing)
