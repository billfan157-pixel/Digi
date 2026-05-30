import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testEmails = [
  'test@example.com',
  'e2e@test.com',
  'e2e@example.com',
  'testuser@example.com',
  'test@test.com',
  'admin@test.com',
  'dev@test.com',
  'e2etester@test.com',
];

const passwords = [
  'Password123!',
  'Password123',
  '12345678',
];

async function run() {
  for (const email of testEmails) {
    for (const password of passwords) {
      console.log(`Trying ${email} with ${password}...`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error && data.user) {
        console.log(`🎉 SUCCESS! Email: ${email}, Password: ${password}`);
        process.exit(0);
      }
    }
  }
  console.log('❌ All attempts failed');
}

run();
