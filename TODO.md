# Sprint 10A — Performance Pass (Feed render window)

- [ ] Inspect QueryClient usage (useQueryClient) trong FeedTab (đảm bảo reset queries đúng key)
- [ ] Update `FeedPostList` để hỗ trợ render window (giới hạn số item render)
- [ ] Update `FeedTab`:
  - [ ] Add `visibleCount` state
  - [ ] Increase `visibleCount` khi gần footer (intersection)
  - [ ] Only call `loadMore` khi `visibleCount` đã đủ hiển thị hết trong window hiện tại
  - [ ] Reset `visibleCount` khi thay đổi mode/filter/search hoặc khi posts thay đổi theo người dùng
  - [ ] Reset React Query cache theo `appQueryKeys.feed(profile.id, closeCircleIds)`
- [ ] Manual verification checklist:
  - [ ] Feed scroll: không giật, loadMore đúng thời điểm
  - [ ] Đổi filter/mode/search: list reset đúng, không “khoảng trống”
  - [ ] Like/comment: không lỗi theo post
- [ ] Run `npm run test` và `npm run build` sau khi edit
- [ ] Fix any build/test/TS errors nếu có
