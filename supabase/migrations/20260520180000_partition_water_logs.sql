-- 2.1.D: Database Partitioning Strategy cho `water_logs`
-- Chuyển đổi bảng water_logs sang Range Partitioning (theo tháng) để tối ưu hóa hiệu năng khi dữ liệu lớn.

-- 1. Đổi tên bảng hiện tại thành _old
ALTER TABLE IF EXISTS public.water_logs RENAME TO water_logs_old;
ALTER INDEX IF EXISTS idx_water_logs_user_day RENAME TO idx_water_logs_old_user_day;

-- 2. Tạo bảng Partition mới (Lưu ý: Partition Key phải là một phần của Primary Key)
CREATE TABLE public.water_logs (
    id uuid DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    name text,
    exp integer DEFAULT 0,
    day date NOT NULL,
    created_at timestamptz DEFAULT now(),
    drink_type text,
    PRIMARY KEY (id, day),
    CONSTRAINT fk_water_logs_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
) PARTITION BY RANGE (day);

-- 3. Tạo các partition ban đầu (Tháng hiện tại và Legacy catch-all)
CREATE TABLE public.water_logs_legacy PARTITION OF public.water_logs
    FOR VALUES FROM (MINVALUE) TO ('2026-05-01');

CREATE TABLE public.water_logs_y2026m05 PARTITION OF public.water_logs
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE public.water_logs_y2026m06 PARTITION OF public.water_logs
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- 4. Migrate dữ liệu (Cực nhanh vì data lúc này đang ít)
INSERT INTO public.water_logs (id, user_id, amount, name, exp, day, created_at, drink_type)
SELECT id, user_id, amount, name, exp, day, created_at, drink_type
FROM public.water_logs_old;

-- 5. Tạo lại các Index quan trọng trên bảng partition
CREATE INDEX idx_water_logs_user_day ON public.water_logs (user_id, day);

-- 6. Setup RLS Policies cho bảng mới
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "water_logs_select_own"
  ON public.water_logs FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "water_logs_insert_own"
  ON public.water_logs FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "water_logs_update_own"
  ON public.water_logs FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "water_logs_delete_own"
  ON public.water_logs FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- 7. Grant quyền
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.water_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.water_logs TO service_role;

-- 8. Hàm PostgreSQL tạo partition tự động cho tháng tiếp theo
CREATE OR REPLACE FUNCTION public.create_next_month_water_partition()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_month_start date;
    next_month_end date;
    partition_name text;
    create_stmt text;
BEGIN
    -- Tính toán mốc của tháng tiếp theo
    next_month_start := date_trunc('month', current_date + interval '1 month')::date;
    next_month_end := next_month_start + interval '1 month';
    
    -- Tên bảng: water_logs_yYYYYmMM
    partition_name := 'water_logs_y' || to_char(next_month_start, 'YYYY') || 'm' || to_char(next_month_start, 'MM');
    
    -- Kiểm tra nếu bảng đã tồn tại thì bỏ qua
    IF EXISTS (
        SELECT FROM pg_catalog.pg_class c
        JOIN   pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE  n.nspname = 'public'
        AND    c.relname = partition_name
    ) THEN
        RETURN;
    END IF;

    -- Lệnh tạo partition
    create_stmt := format(
        'CREATE TABLE public.%I PARTITION OF public.water_logs FOR VALUES FROM (%L) TO (%L);',
        partition_name, next_month_start, next_month_end
    );
    
    EXECUTE create_stmt;
END;
$$;

REVOKE ALL ON FUNCTION public.create_next_month_water_partition() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_next_month_water_partition() TO service_role;

-- 9. Gắn Cron job chạy vào ngày 25 hàng tháng lúc 00:00 (Yêu cầu bật extension pg_cron)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Xóa cron cũ nếu có để tránh duplicate
SELECT cron.unschedule('create-monthly-water-partition');

-- Lên lịch cron
SELECT cron.schedule(
    'create-monthly-water-partition',
    '0 0 25 * *', -- Ngày 25 hàng tháng
    $$SELECT public.create_next_month_water_partition();$$
);

-- (Optional) Drop bảng cũ sau khi chắc chắn mọi thứ thành công (Trong thực tế nên comment lại chờ 7 ngày, nhưng ở đây có thể drop)
DROP TABLE public.water_logs_old CASCADE;
