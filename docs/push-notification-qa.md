# Push Notification QA Checklist - Sprint 4

Baseline date: 2026-05-19

## Scope

Manual QA cho Web Push production path:

- browser permission
- service worker `/push-sw.js`
- subscription save vào `push_subscriptions`
- Edge Function `send-push-notification`
- expired subscription cleanup

## Setup

1. Deploy `send-push-notification`.
2. Set Edge Function secrets:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Mở app bằng HTTPS hoặc localhost.
4. Đăng nhập bằng user thật.

## Cases

### Subscribe And Save

1. Vào `Cài đặt` -> `Thông báo`.
2. Bấm `Gửi thông báo thử`.
3. Chấp nhận browser permission.
4. Kỳ vọng: row mới xuất hiện trong `push_subscriptions` với `user_id = auth.uid()`.

### Edge Send

1. Bấm `Gửi thông báo thử` lần nữa.
2. Kỳ vọng: Edge Function trả `sent > 0`.
3. Kỳ vọng: browser nhận notification từ service worker, không phải notification local giả lập.

### Click Behavior

1. Click notification.
2. Kỳ vọng: app focus tab đang mở hoặc mở `/`.

### Expired Subscription Cleanup

1. Revoke browser notification permission hoặc unsubscribe trong DevTools.
2. Gửi test push.
3. Kỳ vọng: Edge Function không crash; expired endpoint trả `expired: true` và row bị xóa nếu push service trả 404/410.

## Pass Criteria

- Không lưu subscription thiếu `p256dh` hoặc `auth`.
- Test push dùng Edge Function thật.
- `/push-sw.js` là JavaScript thuần và load được trực tiếp.
- `deno check supabase/functions/send-push-notification/index.ts` pass.
- `npm run test -- src/lib/pushNotification.test.ts` pass.
