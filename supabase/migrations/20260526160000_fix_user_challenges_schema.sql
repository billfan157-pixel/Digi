-- Fix lỗi join_challenge: thêm cột progress_days và các cột còn thiếu

ALTER TABLE user_challenges
  ADD COLUMN IF NOT EXISTS progress_days INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS stake_wp INTEGER NOT NULL DEFAULT 0;
