# Android Signing Setup Guide

**Mục tiêu:** Tạo keystore và cấu hình signing để build Android App Bundle (AAB) có thể upload lên Google Play.

---

## 1. Tạo Keystore

Chạy lệnh sau trong terminal (yêu cầu JDK đã cài đặt):

```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Bạn sẽ được hỏi:
- **Keystore password:** Nhập mật khẩu mạnh (lưu lại!)
- **Key password:** Có thể để trùng với keystore password
- **Thông tin cá nhân/tổ chức:** Điền tên, tổ chức, thành phố, quốc gia

File `release.keystore` sẽ được tạo trong thư mục hiện tại.

---

## 2. Đặt Keystore vào Dự án

```bash
mv release.keystore android/app/
```

**⚠️ QUAN TRỌNG:** Không commit keystore lên Git! File này đã được thêm vào `.gitignore`:

```gitignore
# Android signing
android/app/release.keystore
```

---

## 3. Cấu hình GitHub Secrets (cho CI build)

Vào **GitHub Repository → Settings → Secrets and variables → Actions → New repository secret**:

| Secret Name | Value | Cách lấy |
|-------------|-------|----------|
| `ANDROID_KEYSTORE_BASE64` | Base64 của file keystore | `base64 -w 0 android/app/release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Mật khẩu keystore | Mật khẩu bạn đặt ở bước 1 |
| `ANDROID_KEY_ALIAS` | `release` | Alias bạn đặt ở bước 1 |
| `ANDROID_KEY_PASSWORD` | Mật khẩu key | Thường giống keystore password |

### Lệnh tạo Base64 (PowerShell trên Windows):
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("android/app/release.keystore"))
```

### Lệnh tạo Base64 (macOS/Linux):
```bash
base64 -w 0 android/app/release.keystore | pbcopy
```

---

## 4. Build AAB Local (kiểm tra)

```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

AAB sẽ xuất hiện tại:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## 5. Upload lên Google Play

1. Vào [Google Play Console](https://play.google.com/console)
2. Chọn ứng dụng DigiWell
3. **Production → Create new release**
4. Upload file `.aab`
5. Điền release notes
6. Review và submit

---

## 6. Backup Keystore

**KEystore là TÀI SẢN QUAN TRỌNG NHẤT.** Nếu mất keystore, bạn không thể update app trên Google Play nữa.

- Lưu bản sao ngoài máy tính (USB, cloud storage encrypted)
- Lưu password trong password manager
- Không chia sẻ keystore qua email/chat

---

## Troubleshooting

### `Could not read keystore` trong CI
- Kiểm tra `ANDROID_KEYSTORE_BASE64` đã được set đúng chưa
- Kiểm tra xem base64 có bị truncate không (phải là 1 dòng duy nhất)

### `Wrong password` khi build
- Đảm bảo password khớp với keystore đã tạo
- Kiểm tra xem có khoảng trắng thừa trong secret không

### `Minification failed` (ProGuard)
- Kiểm tra `android/app/proguard-rules.pro` đã có Capacitor rules chưa
- Xem log lỗi để tìm class bị obfuscate sai
