-- ============================================================
-- DigiWell Migration: Fix Duplicate Quests
-- 1. Cleanup existing duplicates
-- 2. Add Unique Constraints to prevent future race conditions
-- ============================================================

-- 1. Dọn dẹp dữ liệu trùng lặp hiện có (Giữ lại bản ghi có tiến độ tốt nhất)
with duplicates as (
  select id,
         row_number() over (
           partition by user_id, quest_id, coalesce(reset_date, '0001-01-01'::date)
           order by progress desc,
                    completed_at desc nulls last,
                    claimed_at desc nulls last,
                    id asc
         ) as rn
  from public.user_quests
)
delete from public.user_quests
where id in (select id from duplicates where rn > 1);

-- 2. Thêm ràng buộc UNIQUE (chỉ áp dụng cho daily/weekly có reset_date)
-- Xóa ràng buộc cũ nếu có (đề phòng)
alter table public.user_quests drop constraint if exists unique_user_quest_reset;

alter table public.user_quests 
add constraint unique_user_quest_reset 
unique (user_id, quest_id, reset_date);

-- 3. Tạo Index Unique cho nhiệm vụ theo Level (reset_date IS NULL)
-- Vì standard UNIQUE constraint trong Postgres cho phép nhiều dòng NULL
drop index if exists idx_unique_user_level_quest;
create unique index idx_unique_user_level_quest 
on public.user_quests (user_id, quest_id) 
where reset_date is null;
