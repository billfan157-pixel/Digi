# Offline Sync QA Checklist - Sprint 3

Baseline date: 2026-05-19

## Scope

Manual QA cho luồng uống nước offline:

- add water khi offline
- edit/delete khi request cloud fail
- replay khi online lại
- pending sync indicator
- duplicate prevention sau retry

## Test Setup

1. Đăng nhập bằng user thật.
2. Mở tab Home và ghi nhận tổng ml hiện tại.
3. Mở DevTools Network và bật offline hoặc throttling chậm.
4. Không xóa localStorage trong lúc test.

## Cases

### Add Offline

1. Bật offline.
2. Thêm 250ml.
3. Kỳ vọng: app hiện thông báo đã lưu offline, pending sync indicator hiển thị số thao tác chờ.
4. Bật online lại.
5. Kỳ vọng: queue tự replay, indicator biến mất, log chỉ xuất hiện một lần sau refetch.

### Retry Without Duplicate

1. Bật online nhưng chặn tạm RPC `process_hydration_event`.
2. Thêm nước để insert log có thể thành công nhưng progression fail.
3. Bật lại RPC rồi sync.
4. Kỳ vọng: không sinh thêm log duplicate cho cùng `created_at`.

### Edit Offline

1. Có sẵn một water log từ server.
2. Bật offline hoặc chặn update request.
3. Sửa amount.
4. Kỳ vọng: queue có một edit pending.
5. Sửa lại cùng log lần nữa.
6. Kỳ vọng: queue giữ edit cuối cùng, không replay nhiều bản edit cũ.

### Delete Offline

1. Có sẵn một water log từ server.
2. Bật offline hoặc chặn delete request.
3. Xóa log.
4. Kỳ vọng: queue có delete pending.
5. Nếu có edit pending trước đó cho cùng log, delete phải supersede edit.

### Max Retry

1. Giữ request cloud fail liên tục.
2. Bấm đồng bộ hoặc online lại đủ 3 lần retry.
3. Kỳ vọng: item lỗi bị drop sau giới hạn retry, không nhân đôi trong queue.

## Pass Criteria

- Không mất thao tác add/edit/delete.
- Không có log nước duplicate sau replay.
- Pending indicator phản ánh đúng trạng thái queue.
- App không tự retry khi đang offline.
- `npm run test -- src/lib/offlineQueue.test.ts` pass.
