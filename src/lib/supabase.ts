import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 1. LẤY BIẾN MÔI TRƯỜNG VỚI GIÁ TRỊ DỰ PHÒNG (FALLBACK)
// Nếu .env không load được trên mobile, app sẽ không bị crash mà vẫn chạy với giá trị cứng này.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://plbwqjdrivyffrhpbmvm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYndxamRyaXZ5ZmZyaHBibXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjY3NjYsImV4cCI6MjA5MDcwMjc2Nn0.nZDHmQyVdn4a99zISog9-hzOzsFQ7G8RClV8GPe7sJw';

// 2. KIỂM TRA CẤU HÌNH VÀ GHI LOG
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ LỖI NGHIÊM TRỌNG: Thiếu cấu hình Supabase URL hoặc Anon Key!');
  console.error('URL hiện tại:', supabaseUrl);
  console.error('Key hiện tại:', supabaseAnonKey ? '*** (có key nhưng có thể sai)' : 'KHÔNG CÓ KEY');
} else {
  console.log('✅ Supabase Config OK:', supabaseUrl);
}

// 3. KHỞI TẠO SINGLETON (Tránh lỗi Multiple Instances)
const globalAny = globalThis as any;

if (!globalAny.__supabaseClient) {
  globalAny.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key) => {
          try {
            return localStorage.getItem(key);
          } catch (e) {
            console.warn('Lỗi đọc localStorage:', e);
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            localStorage.setItem(key, value);
          } catch (e) {
            console.warn('Lỗi ghi localStorage:', e);
          }
        },
        removeItem: (key) => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn('Lỗi xóa localStorage:', e);
          }
        }
      }
    },
    global: {
      headers: { 
        'X-Client-Info': 'digiwell-mobile/1.0.0',
        'Content-Type': 'application/json'
      }
    }
  });
}

export const supabase: SupabaseClient = globalAny.__supabaseClient;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const checkSupabaseConfig = () => isSupabaseConfigured;