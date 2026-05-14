import React, { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Target } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeProvider';
import { queryClient } from '@/lib/queryClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function MissingConfigScreen() {
  return (
    <div className="w-full max-w-md mx-auto min-h-screen p-8 font-sans flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white relative shadow-2xl sm:border-x sm:border-slate-300 dark:sm:border-slate-800 overflow-x-hidden">
      <div className="w-full p-8 rounded-[2rem] border border-slate-300 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl">
        <div className="w-14 h-14 bg-red-500/10 dark:bg-red-500/20 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 dark:border-red-500/30">
          <Target size={28} className="text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Thiếu cấu hình</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Không tìm thấy kết nối Cloud. Tạo file <span className="text-cyan-600 dark:text-cyan-400 font-mono bg-slate-200 dark:bg-slate-900 px-2 py-1 rounded-md">.env</span> tại thư mục gốc:
        </p>
        <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl p-5 text-xs font-mono text-cyan-600 dark:text-cyan-400 whitespace-pre-wrap border border-slate-300 dark:border-slate-900">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...`}
        </div>
        <p className="text-xs text-slate-500 mt-6 border-t border-slate-700 pt-5 font-bold uppercase tracking-widest">
          Restart: npm run dev
        </p>
      </div>
    </div>
  );
}

function AppChrome({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <div className="bg-[#0a0a0a] min-h-screen w-full flex justify-center items-start overflow-hidden">
      <div className="w-full max-w-md min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white relative shadow-[0_0_60px_rgba(6,182,212,0.15)] sm:border-x sm:border-slate-300 dark:sm:border-slate-800 overflow-x-hidden transform translate-x-0">
        <Toaster
          position="top-center"
          theme={theme as 'light' | 'dark'}
          richColors
          closeButton
          toastOptions={{
            style: {
              background: theme === 'dark' ? '#0f172a' : '#ffffff',
              border: '1px solid',
              borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
              color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
            },
          }}
        />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default function AppBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // ── XỬ LÝ DEEP LINK TRÊN NATIVE (FIX CALENDAR SYNC) ──
    if (Capacitor.isNativePlatform()) {
      const setupDeepLinks = async () => {
        // Lắng nghe khi App được mở bằng URL (digiwell://...)
        await App.addListener('appUrlOpen', async (data) => {
          const url = new URL(data.url);
          
          // Kiểm tra nếu là callback của login/calendar
          if (url.host === 'login-callback' || url.pathname.includes('login-callback')) {
            // Đóng trình duyệt Safari nội bộ
            await Browser.close();
            
            // Trích xuất các tham số (access_token, refresh_token, ...)
            // Supabase handle oauth callback qua URL fragment (#access_token=...)
            const hash = url.hash.substring(1);
            if (hash) {
              const params = new URLSearchParams(hash);
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              const providerToken = params.get('provider_token');
              const providerRefreshToken = params.get('provider_refresh_token');

              if (accessToken && refreshToken) {
                // Store provider tokens in sessionStorage (not localStorage for security)
                // Note: These tokens are passed to calendar-proxy Edge Function server-side
                if (providerToken) sessionStorage.setItem('digiwell_provider_token', providerToken);
                if (providerRefreshToken) sessionStorage.setItem('digiwell_google_refresh_token', providerRefreshToken);

                // Nạp session vào Supabase Client của App
                const { error } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
                
                if (!error) {
                  // Bắn event để useCalendarSync biết mà chạy lại
                  window.dispatchEvent(new CustomEvent('digiwell:google-provider-token-updated'));
                }
              }
            }
          }
        });
      };
      setupDeepLinks();
    }
  }, []);

  if (!isSupabaseConfigured || !supabase) {
    return <MissingConfigScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppChrome>{children}</AppChrome>
    </QueryClientProvider>
  );
}
