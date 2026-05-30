-- ============================================
-- Sprint 26: Scale Infrastructure
-- Migration 1: pgmq extension + partitioning
-- ============================================

-- 1. Enable pgmq extension for message queue
CREATE EXTENSION IF NOT EXISTS pgmq;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create webhook_deliveries monthly partitioning (like water_logs)
ALTER TABLE webhook_deliveries RENAME TO webhook_deliveries_old;

CREATE TABLE webhook_deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES webhook_subscriptions(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  response_status integer,
  response_body text,
  error_message text,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, delivered_at)
) PARTITION BY RANGE (delivered_at);

-- Legacy partition (before partitioning was introduced)
CREATE TABLE webhook_deliveries_legacy PARTITION OF webhook_deliveries
  FOR VALUES FROM ('1900-01-01') TO ('2026-06-01');

-- Current month partition
CREATE TABLE webhook_deliveries_y2026m06 PARTITION OF webhook_deliveries
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- Indexes on partitioned table
CREATE INDEX idx_webhook_deliveries_user_id ON webhook_deliveries (user_id, delivered_at DESC);
CREATE INDEX idx_webhook_deliveries_subscription_id ON webhook_deliveries (subscription_id, delivered_at DESC);

-- Migrate old data
INSERT INTO webhook_deliveries (
  id,
  user_id,
  subscription_id,
  event_type,
  payload,
  response_status,
  response_body,
  error_message,
  delivered_at
)
SELECT 
  old.id,
  COALESCE(
    s.user_id, 
    (old.payload->>'user_id')::uuid, 
    '00000000-0000-0000-0000-000000000000'::uuid
  ) AS user_id,
  old.subscription_id,
  old.event_type,
  old.payload,
  old.response_status,
  old.response_body,
  old.error_message,
  old.delivered_at
FROM webhook_deliveries_old old
LEFT JOIN webhook_subscriptions s ON old.subscription_id = s.id;

DROP TABLE webhook_deliveries_old;

-- Auto-create next month's partition (runs on 25th of each month)
CREATE OR REPLACE FUNCTION create_next_month_webhook_partition()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  next_month date;
  partition_name text;
  start_date text;
  end_date text;
BEGIN
  next_month := date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
  partition_name := 'webhook_deliveries_y' || to_char(next_month, 'YYYY') || 'm' || to_char(next_month, 'MM');
  start_date := to_char(next_month, 'YYYY-MM-DD');
  end_date := to_char(next_month + INTERVAL '1 month', 'YYYY-MM-DD');

  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = partition_name
  ) THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF webhook_deliveries FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
    EXECUTE format(
      'ALTER TABLE %I ENABLE ROW LEVEL SECURITY',
      partition_name
    );
  END IF;
END;
$$;

SELECT cron.schedule(
  'create-monthly-webhook-partition',
  '0 0 25 * *',
  $$SELECT create_next_month_webhook_partition()$$
);

-- 3. Create pgmq queue tables for async processing
SELECT pgmq.create('webhook_dispatch_queue');
SELECT pgmq.create('push_notification_queue');
SELECT pgmq.create('cron_job_queue');

-- Queue metrics view
CREATE OR REPLACE VIEW queue_metrics AS
SELECT
  q.queue_name,
  COALESCE(m.queue_length, 0) AS queue_length,
  COALESCE(m.newest_msg_age_sec, 0) AS newest_msg_age_sec,
  COALESCE(m.oldest_msg_age_sec, 0) AS oldest_msg_age_sec,
  COALESCE(m.total_messages, 0) AS total_messages
FROM (
  VALUES 
    ('webhook_dispatch_queue'), 
    ('push_notification_queue'), 
    ('cron_job_queue')
) AS q(queue_name)
LEFT JOIN LATERAL pgmq.metrics(q.queue_name) m ON true;

-- 4. Create dead letter table for failed async jobs
CREATE TABLE dead_letter_queue (
  id bigint PRIMARY KEY,
  queue_name text NOT NULL,
  message jsonb NOT NULL,
  error_message text,
  failed_at timestamptz NOT NULL DEFAULT now(),
  retry_count integer DEFAULT 0
);
