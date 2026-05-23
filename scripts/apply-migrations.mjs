import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrations = [
  {
    name: 'Add bottle_auth_key to profiles',
    sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bottle_auth_key TEXT;`
  },
  {
    name: 'Add subscription_tier to profiles',
    sql: `
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD CONSTRAINT subscription_tier_check CHECK (subscription_tier IN ('free', 'plus', 'pro'));

UPDATE public.profiles SET subscription_tier = 'pro' WHERE is_premium = true;
    `
  },
  {
    name: 'Update consume_ai_usage RPC',
    sql: `
CREATE OR REPLACE FUNCTION public.consume_ai_usage(p_action TEXT)
RETURNS TABLE(allowed BOOLEAN, remaining_message_count INT, remaining_advice_count INT, remaining_scan_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier TEXT;
  v_limits JSONB;
  v_limit_key TEXT;
  v_current_counts JSONB;
  v_today_date DATE := CURRENT_DATE;
  v_allowed BOOLEAN := true;
  v_remaining_msg INT;
  v_remaining_advice INT;
  v_remaining_scan INT;
BEGIN
  SELECT subscription_tier INTO v_tier FROM public.profiles WHERE id = auth.uid();
  IF v_tier IS NULL THEN v_tier := 'free'; END IF;
  
  CASE v_tier
    WHEN 'free' THEN v_limits := '{"message": 5, "advice": 3, "scan": 2}'::JSONB;
    WHEN 'plus' THEN v_limits := '{"message": 15, "advice": 5, "scan": 10}'::JSONB;
    WHEN 'pro' THEN v_limits := '{"message": 9999, "advice": 9999, "scan": 9999}'::JSONB;
    ELSE v_limits := '{"message": 5, "advice": 3, "scan": 2}'::JSONB;
  END CASE;
  
  CASE p_action
    WHEN 'chat' THEN v_limit_key := 'message';
    WHEN 'advice' THEN v_limit_key := 'advice';
    WHEN 'scan' THEN v_limit_key := 'scan';
    ELSE v_limit_key := 'message';
  END CASE;
  
  SELECT COALESCE(jsonb_agg(jsonb_build_object('message', message_count, 'advice', advice_count, 'scan', scan_count))[1], '{"message": 0, "advice": 0, "scan": 0}'::JSONB) INTO v_current_counts
  FROM public.ai_usage WHERE user_id = auth.uid() AND date = v_today_date;
  
  IF (v_current_counts->>v_limit_key)::INT >= (v_limits->>v_limit_key)::INT THEN
    v_allowed := false;
  ELSE
    INSERT INTO public.ai_usage (user_id, date, message_count, advice_count, scan_count)
    VALUES (auth.uid(), v_today_date, 0, 0, 0)
    ON CONFLICT (user_id, date) DO UPDATE SET
      message_count = CASE WHEN p_action = 'chat' THEN ai_usage.message_count + 1 ELSE ai_usage.message_count END,
      advice_count = CASE WHEN p_action = 'advice' THEN ai_usage.advice_count + 1 ELSE ai_usage.advice_count END,
      scan_count = CASE WHEN p_action = 'scan' THEN ai_usage.scan_count + 1 ELSE ai_usage.scan_count END;
  END IF;
  
  v_remaining_msg := (v_limits->>'message')::INT - (v_current_counts->>'message')::INT;
  v_remaining_advice := (v_limits->>'advice')::INT - (v_current_counts->>'advice')::INT;
  v_remaining_scan := (v_limits->>'scan')::INT - (v_current_counts->>'scan')::INT;
  
  RETURN QUERY SELECT v_allowed, v_remaining_msg, v_remaining_advice, v_remaining_scan;
END;
$$;
    `
  },
  {
    name: 'Create hardware_waitlist table',
    sql: `
CREATE TABLE IF NOT EXISTS public.hardware_waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  tier_interest TEXT DEFAULT 'standard' CHECK (tier_interest IN ('standard', 'pro_kit')),
  quantity INT DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'fulfilled', 'cancelled'))
);

ALTER TABLE public.hardware_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own waitlist entry" ON public.hardware_waitlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own waitlist entry" ON public.hardware_waitlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own waitlist entry" ON public.hardware_waitlist FOR UPDATE USING (auth.uid() = user_id);
    `
  },
  {
    name: 'Create get_waitlist_rank RPC',
    sql: `
CREATE OR REPLACE FUNCTION public.get_waitlist_rank()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_created_at TIMESTAMPTZ;
  v_count INT;
BEGIN
  SELECT created_at INTO v_created_at FROM public.hardware_waitlist WHERE user_id = v_user_id;
  IF v_created_at is null THEN return null; END IF;
  SELECT count(*) INTO v_count FROM public.hardware_waitlist
  WHERE created_at < v_created_at or (created_at = v_created_at and id <= (select id from public.hardware_waitlist where user_id = v_user_id));
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.get_waitlist_rank() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_waitlist_rank() TO authenticated;
    `
  },
  {
    name: 'Add performance indexes',
    sql: `
CREATE INDEX IF NOT EXISTS idx_user_quests_user_assigned_date ON public.user_quests (user_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_profiles_equipped_bottle_id ON public.profiles (equipped_bottle_id) WHERE equipped_bottle_id IS NOT NULL;
    `
  }
];

async function executeSQL(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    // Fallback: use POST /rest/v1/rpc/exec_sql if available, or use direct REST API
    console.error('RPC error:', error);
    throw error;
  }
  return data;
}

// Supabase doesn't have a generic exec_sql RPC by default, so we need to use the REST API directly
async function executeViaRestAPI(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return await response.json();
}

// Since Supabase doesn't have exec_sql by default, we'll use the SQL Editor API
async function executeViaSQLEditorAPI(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'tx=commit',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return await response.json();
}

async function main() {
  console.log('🚀 Applying migrations to Supabase...');
  console.log('📡 Make sure VPN is enabled (WiFi blocks Supabase)\n');

  for (const migration of migrations) {
    console.log(`\n⏳ Applying: ${migration.name}`);
    try {
      // Try using the REST API SQL endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'tx=commit',
        },
        body: JSON.stringify({ query: migration.sql }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed: ${errorText}`);
        continue;
      }

      console.log(`✅ Success: ${migration.name}`);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n✨ Migration process complete!');
}

main().catch(console.error);
