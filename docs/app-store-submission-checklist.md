# App Store Submission Checklist — DigiWell

**Mục tiêu:** Đảm bảo app pass review lần đầu trên cả App Store và Google Play.

**Cập nhật:** 23/05/2026

---

## Phase 1: Tài khoản & Identifiers

### Apple App Store Connect
- [ ] Đăng ký Apple Developer Program ($99/năm) — **Owner: người dùng**
- [ ] Tạo App ID: `com.vlu.digiwell` trong Certificates, Identifiers & Profiles
- [ ] Tạo App record trong App Store Connect
- [ ] Bundle ID khớp với `capacitor.config.ts`: `com.vlu.digiwell`
- [ ] Điền **App Name**, **Subtitle**, **Primary/Secondary Category** (Health & Fitness)
- [ ] Điền **Content Rights** nếu có

### Google Play Console
- [ ] Đăng ký Google Play Developer ($25 một lần) — **Owner: người dùng**
- [ ] Tạo ứng dụng với package name: `com.vlu.digiwell`
- [ ] Chọn category: Health & Fitness
- [ ] Điền **Contact Details** (email, website)

---

## Phase 2: Build & Signing

### iOS
- [ ] `ios/App/App.xcodeproj` build thành công (Release scheme)
- [ ] Tạo Distribution Certificate (App Store and Ad Hoc)
- [ ] Tạo Provisioning Profile (App Store)
- [ ] Build **Archive** và **Validate App** (`altool --validate-app`)
- [ ] Upload lên App Store Connect (TestFlight)
- [ ] TestFlight Internal Testing với ít nhất 1 tester

### Android
- [ ] `android/app/build.gradle` có `signingConfigs.release`
- [ ] Tạo keystore (`release.keystore`) và lưu an toàn
- [ ] `./gradlew bundleRelease` tạo `.aab` thành công
- [ ] AAB pass Google Play upload validation
- [ ] Internal Testing track upload thành công

---

## Phase 3: Native Configuration

### Info.plist (iOS) — `ios/App/App/Info.plist`
- [x] `CFBundleDisplayName` = "DigiWell"
- [x] `CFBundleIdentifier` = `$(PRODUCT_BUNDLE_IDENTIFIER)` (match app ID)
- [x] `ITSAppUsesNonExemptEncryption` = `false`
- [x] `NSFaceIDUsageDescription` — đã có
- [x] `NSHealthShareUsageDescription` — đã có
- [x] `NSHealthUpdateUsageDescription` — đã có
- [x] `NSCalendarsFullAccessUsageDescription` — đã có
- [x] `NSCalendarsUsageDescription` — đã có
- [x] `NSLocationWhenInUseUsageDescription` — đã có
- [x] `NSCameraUsageDescription` — đã có
- [x] `NSPhotoLibraryUsageDescription` — đã có
- [x] `NSUserNotificationsUsageDescription` — đã có
- [x] `NSBluetoothAlwaysUsageDescription` — đã có
- [x] `NSBluetoothPeripheralUsageDescription` — đã có
- [x] `CFBundleURLSchemes` (`digiwell`, `com.vlu.digiwell`) — deep links
- [ ] `CFBundleShortVersionString` / `CFBundleVersion` được bump đúng

### AndroidManifest.xml
- [x] `package="com.vlu.digiwell"`
- [x] `android:usesCleartextTraffic="true"` — review xem có cần không
- [x] Camera permission (`CAMERA`) — đã thêm
- [x] Photo permission (`READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE`) — đã thêm
- [x] BLE permissions (`BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`)
- [x] Location permissions (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`)
- [x] Health Connect permissions (`health.READ_STEPS`, `health.READ_HEART_RATE`, `health.WRITE_STEPS`)
- [x] Notification permission (`POST_NOTIFICATIONS`)
- [x] Deep link intent-filter (`http`, `https`, `capacitor`)
- [ ] `versionCode` / `versionName` được bump đúng trong `build.gradle`

---

## Phase 4: App Store Metadata

### Text Metadata (VI + EN)
- [ ] `metadata/app-store/title.txt` — "DigiWell" (30 chars)
- [ ] `metadata/app-store/subtitle.txt` — "Uống nước thông minh" (30 chars)
- [ ] `metadata/app-store/description.txt` — mô tả đầy đủ (4000 chars)
- [ ] `metadata/app-store/keywords.txt` — `uống nước,sức khỏe,hydration,reminder,wellness` (100 chars)
- [ ] `metadata/app-store/promotional_text.txt` — tagline ngắn (170 chars)
- [ ] `metadata/app-store/release_notes.txt` — "Initial release"
- [ ] `metadata/app-store/support_url.txt` — `https://digiwell.app/support` (placeholder)
- [ ] `metadata/app-store/privacy_url.txt` — `https://digiwell.app/privacy-policy.html`

### Screenshots (iOS)
- [ ] iPhone 6.5" Display (1290x2796) — 3-10 screenshots
- [ ] iPhone 5.5" Display (1242x2208) — 3-10 screenshots
- [ ] iPad Pro 12.9" (2048x2732) — optional nhưng nên có
- [ ] Mỗi screenshot KHÔNG có status bar, transparency, hoặc sensitive data
- [ ] Screenshot #1 là "hero image" — hiển thị tính năng chính

---

## Phase 5: Google Play Metadata

### Text Metadata
- [ ] `metadata/google-play/title.txt` — "DigiWell" (50 chars)
- [ ] `metadata/google-play/short_description.txt` — 80 chars
- [ ] `metadata/google-play/full_description.txt` — 4000 chars

### Graphics
- [ ] Feature Graphic (1024x500) — không có transparency
- [ ] Phone Screenshots (2-8) — 16:9 hoặc 9:16
- [ ] Tablet Screenshots — optional
- [ ] App Icon (512x512) — PNG, không có transparency

---

## Phase 6: Compliance & Review Readiness

### Privacy
- [x] Privacy Policy: `public/privacy-policy.html` — covers data types collected
- [x] Terms of Service: `public/terms-of-service.html`
- [ ] **Apple Privacy Nutrition Label** — điền trong App Store Connect:
  - Contact Info (email, name)
  - Health & Fitness (water intake, steps, heart rate)
  - Location (coarse)
  - User Content (photos, posts)
  - Identifiers (user ID)
  - Usage Data (analytics)
  - Diagnostics (crash data)
- [ ] **Google Play Data Safety Section** — tương tự Apple Privacy Nutrition

### Payments / IAP
- [x] Stripe checkout disabled trên native (`UpgradeModal.tsx` guard)
- [ ] Apple IAP products configured (nếu enable Premium trên iOS) — **follow-up Sprint 9+**
- [ ] Google Play Billing products configured (nếu enable Premium trên Android) — **follow-up Sprint 9+**

### Accessibility
- [ ] App hỗ trợ Dynamic Type / font scaling
- [ ] Có `contentDescription` cho các icon/button quan trọng trong Android
- [ ] Có `accessibilityLabel` cho các element quan trọng trong iOS

### Sign-in with Apple
- [ ] Nếu app có Google Sign-In hoặc other third-party login, **Apple yêu cầu Sign in with Apple**
- [ ] Kiểm tra `src/screens/Auth/WelcomeScreen.tsx` — có Apple login button?

### Review Guidelines Check
- [ ] App không crash on launch (first-time user)
- [ ] App không crash khi từ chối permission
- [ ] Không có placeholder text, unfinished UI, hoặc Lorem Ipsum
- [ ] Không có `server.url` hay live reload trong production build
- [ ] Không dùng private API
- [ ] Deep link hoạt động (`digiwell://checkout-success`)
- [ ] App không chứa malware, spyware, hoặc code độc hại
- [ ] Content phù hợp 4+ (App Store) / Everyone (Google Play)

---

## Phase 7: Beta Testing

### TestFlight (iOS)
- [ ] Upload build lên TestFlight
- [ ] Mời ít nhất 1 internal tester
- [ ] Test on real device (không chỉ simulator)
- [ ] Verify: launch → login → log water → view insight → open feed → settings

### Google Play Internal Testing
- [ ] Upload AAB lên Internal Testing track
- [ ] Thêm testers
- [ ] Test on real device
- [ ] Verify cùng critical flows

---

## Phase 8: Submission

### Apple
- [ ] Chọn build từ TestFlight
- [ ] Điền đầy đủ metadata
- [ ] Chọn pricing (Free)
- [ ] Chọn availability (Vietnam + other markets)
- [ ] Submit for Review
- [ ] **Expected review time:** 1-7 business days

### Google Play
- [ ] Chọn AAB bundle
- [ ] Điền đầy đủ store listing
- [ ] Chọn countries (Vietnam + ASEAN + US)
- [ ] Content rating questionnaire
- [ ] Data safety form
- [ ] Submit for review
- [ ] **Expected review time:** 1-3 business days (sometimes instant)

---

## Known Blockers & Follow-ups

| # | Blocker | Owner | Sprint | Resolution |
|---|---------|-------|--------|------------|
| 1 | Apple Developer Account ($99) | Người dùng | — | Cần đăng ký trước khi submit |
| 2 | Google Play Developer ($25) | Người dùng | — | Cần đăng ký trước khi submit |
| 3 | App Icons + Splash Screens | Designer | S8 | Dùng `@capacitor/assets` generate |
| 4 | Real IAP (Apple/Google) | Dev | S9+ | RevenueCat hoặc native IAP |
| 5 | Screenshots (device frames) | Designer | S8 | Dùng real device hoặc mockup |
| 6 | Feature Graphic (Google Play) | Designer | S8 | 1024x500 PNG |

---

## Quick Verification Commands

```bash
# iOS build (unsigned, local)
npx cap sync ios
cd ios/App && xcodebuild -scheme App -configuration Release build

# Android build (unsigned, local)
npx cap sync android
cd android && ./gradlew bundleRelease

# Full web build
npm run build && npm run smoke

# Lint + Typecheck
npm run lint && npm run typecheck
```
