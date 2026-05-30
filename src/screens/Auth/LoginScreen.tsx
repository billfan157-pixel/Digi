import { useState, useCallback, type FormEvent } from 'react';
import { ChevronLeft, Lock, ScanFace } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/lib/supabase';
import { useBiometric } from '@/hooks/useBiometric';
import { getBiometricEnabled } from '@/lib/sessionSecurity';
import { useTranslation } from 'react-i18next';

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

interface LoginScreenProps {
  onBack: () => void;
  initialEmail?: string;
  onBiometricUnlock?: () => void;
}

export default function LoginScreen({ onBack, initialEmail = '', onBiometricUnlock }: LoginScreenProps) {
  const { t } = useTranslation();
  const [loginEmail, setLoginEmail] = useState(initialEmail);
  const [loginPass, setLoginPass] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const { authenticateBiometric, isAuthenticating } = useBiometric();
  const [isCheckingBiometric, setIsCheckingBiometric] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);

  const isLockedOut = lockoutUntil ? Date.now() < lockoutUntil : false;

  const handleBiometricUnlock = useCallback(async () => {
    if (!onBiometricUnlock) return;
    
    // Check session first — need a logged-in user
    const { data: sessionRes } = await supabase!.auth.getSession();
    const userId = sessionRes?.session?.user?.id;
    if (!userId) {
      toast.error(t('auth.biometric_required'));
      return;
    }

    setIsCheckingBiometric(true);
    const isEnabled = await getBiometricEnabled(userId);
    if (!isEnabled) {
      toast.error(t('auth.biometric_not_enabled'));
      setIsCheckingBiometric(false);
      return;
    }

    const success = await authenticateBiometric(userId);
    if (success) {
      onBiometricUnlock();
    }
    setIsCheckingBiometric(false);
  }, [onBiometricUnlock, authenticateBiometric, t]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmittingLogin) return;
    
    // Check lockout
    if (isLockedOut) {
      const remainingSec = Math.ceil((lockoutUntil! - Date.now()) / 1000);
      toast.error(t('auth.temp_locked_msg', { seconds: remainingSec }));
      return;
    }
    
    if (!loginEmail || !loginPass) { toast.error(t('auth.email_required')); return; }
    setIsSubmittingLogin(true);
    const toastId = toast.loading(t('auth.login_loading'));
    try {
      const { error } = await supabase!.auth.signInWithPassword({ email: loginEmail.toLowerCase().trim(), password: loginPass });
      if (error) {
        // Rate limiting: track failed attempts
        const now = Date.now();
        const attempts = now - lastAttemptTime < 300000 ? loginAttempts + 1 : 1; // 5 min window
        setLoginAttempts(attempts);
        setLastAttemptTime(now);
        
        if (attempts >= 5) {
          setLockoutUntil(now + 300000);
          toast.error(t('auth.too_many_attempts'), { id: toastId });
        } else {
          toast.error(error.message === 'Invalid login credentials' ? t('auth.wrong_credentials') : error.message, { id: toastId });
        }
        throw error;
      }
      // Reset on success
      setLoginAttempts(0);
      toast.success(t('auth.login_success'), { id: toastId });
    } catch {
      // Already handled above
    } finally { setIsSubmittingLogin(false); }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase!.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Capacitor.isNativePlatform() ? 'digiwell://login-callback' : window.location.origin,
          skipBrowserRedirect: Capacitor.isNativePlatform(),
          scopes: GOOGLE_CALENDAR_SCOPE,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true',
          },
        }
      });
      if (error) throw error;
      if (data?.url && Capacitor.isNativePlatform()) await Browser.open({ url: data.url });
    } catch (err: unknown) {
      toast.error(t('auth.google_error') + (err as Error).message);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const { data, error } = await supabase!.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: Capacitor.isNativePlatform() ? 'digiwell://login-callback' : window.location.origin,
          skipBrowserRedirect: Capacitor.isNativePlatform()
        }
      });
      if (error) throw error;
      if (data?.url && Capacitor.isNativePlatform()) await Browser.open({ url: data.url });
    } catch (err: unknown) {
      toast.error(t('auth.apple_error') + (err as Error).message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto font-sans bg-slate-950">
      <Toaster position="top-center" theme="dark" richColors />
      <div className="p-6 pt-14">
        <button onClick={onBack} aria-label={t('common.back')} className="mb-10 p-2 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-white/5 text-slate-400 inline-flex active:scale-95 transition-all duration-200 ease-out hover:text-white">
          <ChevronLeft size={20} />
        </button>

        <h2 className="text-3xl font-black text-white mb-8">{t('auth.login_title')}</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">{t('auth.email')}</label>
            <input type="email" aria-label={t('auth.email')} placeholder={t('auth.email_placeholder')} value={loginEmail} onChange={e => setLoginEmail(e.target.value)} disabled={isSubmittingLogin} className="w-full p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/5 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out disabled:opacity-50 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">{t('auth.password')}</label>
            <div className="relative">
              <input type="password" aria-label={t('auth.password')} placeholder={t('auth.password_placeholder')} value={loginPass} onChange={e => setLoginPass(e.target.value)} disabled={isSubmittingLogin} className="w-full p-4 pl-12 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/5 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-200 ease-out disabled:opacity-50 text-sm" />
              <Lock className="w-4 h-4 absolute left-4 top-4 text-slate-500" />
            </div>
          </div>
<button type="submit" aria-label={t('auth.login_btn')} disabled={isSubmittingLogin || isLockedOut} className="w-full py-4 rounded-xl font-semibold text-slate-950 text-sm mt-2 disabled:opacity-50 active:scale-95 transition-all duration-200 ease-out shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]" style={{ background: isSubmittingLogin ? '#334155' : '#06b6d4' }}>
           {isSubmittingLogin ? <span className="animate-pulse">{t('auth.login_loading')}</span> : isLockedOut ? t('auth.login_temp_locked') : t('auth.login_btn')}
          </button>
        </form>

        <button
          onClick={handleBiometricUnlock}
          aria-label={t('auth.biometric_unlock')}
          disabled={isCheckingBiometric || isAuthenticating}
          className="w-full py-4 rounded-xl font-bold text-white text-sm mt-4 border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-xl hover:bg-cyan-500/20 active:scale-95 transition-all duration-200 ease-out flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ScanFace size={20} />
          {isCheckingBiometric || isAuthenticating ? t('auth.biometric_authenticating') : t('auth.biometric_unlock')}
        </button>

        <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
          <hr className="w-full border-slate-700" /><span className="px-3 font-bold tracking-widest">{t('auth.or')}</span><hr className="w-full border-slate-700" />
        </div>

        <button onClick={handleGoogleLogin} aria-label={t('auth.google_login')} className="w-full py-4 rounded-xl font-bold text-white text-sm mt-6 border border-white/5 bg-slate-900/60 backdrop-blur-xl hover:bg-slate-800/80 active:scale-95 transition-all duration-200 ease-out flex items-center justify-center gap-2">
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
          {t('auth.google_login')}
        </button>
        
        <button onClick={handleAppleLogin} aria-label={t('auth.apple_login')} className="w-full py-4 rounded-xl font-bold text-white text-sm mt-3 border border-white/5 bg-slate-900/60 backdrop-blur-xl hover:bg-slate-800/80 active:scale-95 transition-all duration-200 ease-out flex items-center justify-center gap-2">
          <img src="/apple-icon.svg" alt="Apple" className="w-5 h-5" style={{ filter: 'invert(1)' }} />
          {t('auth.apple_login')}
        </button>
      </div>
    </div>
  );
}
