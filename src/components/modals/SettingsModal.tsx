import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Activity, Droplets, Heart, Bell, BellRing,
  MoonStar, Send, Smartphone, Ruler, CloudUpload, Fingerprint,
  FileText, LogOut, Trash2, ChevronLeft, ChevronRight, X, Loader2, Sparkles,
  Crown, ExternalLink, CloudSun, Skull, AlertTriangle, Code, Cpu, Trophy, Languages
} from 'lucide-react';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { useSettings } from '../../hooks/useSettings';
import { useVolumeFormat } from '../../hooks/useVolumeFormat';
import { useBiometric } from '../../hooks/useBiometric';
import { useDeleteAccount } from '../../hooks/useDeleteAccount';
import type { DeleteOption } from '../../hooks/useDeleteAccount';
import { Capacitor } from '@capacitor/core';
import Cropper from 'react-easy-crop';
import AdminDashboardModal from './AdminDashboardModal';

import type { AppProfile } from '@/services/profile.service';
import { AppStorage } from '@/lib/storage';
import { useWeatherSync } from '@/hooks/useWeatherSync';
import { requestHealthReadStepsAndHeartRate } from '@/lib/healthIntegration';
import { profileSchema, formatZodErrors } from '@/lib/validations';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNativePush } from '@/hooks/useNativePush';
import { usePremiumStatus } from '@/hooks/useIsPremium';
import { supabase } from '@/lib/supabase';
import { WidgetPlugin } from '@/lib/widgetService';

// ================= BUTTON VARIANTS =================
const btnIcon = "p-2 rounded-full hover:bg-slate-300 dark:hover:bg-white/10 active:scale-95 transition-all text-slate-700 dark:text-white/80";

// ================= TRÙM CUỐI ĐÃ BỊ LÔI RA NGOÀI =================
const BottomSheetWrapper = ({ children, title, onClose }: { children: React.ReactNode, title: string, onClose: () => void }) => (
  <motion.div 
    className="fixed inset-0 z-[100] flex flex-col justify-end"
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  >
    <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
    <motion.div
      initial={{ y: "100%" }} 
      animate={{ y: 0 }} 
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      drag="y" 
      dragConstraints={{ top: 0 }} 
      dragElastic={0.2}
      onDragEnd={(_, { offset, velocity }) => { if (offset.y > 100 || velocity.y > 500) onClose() }}
      className="relative w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 rounded-t-3xl p-6 pb-10 shadow-2xl flex flex-col custom-scrollbar"
    >
      <div className="w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mb-6" />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-slate-900 dark:text-white font-black text-xl">{title}</h2>
        <button onClick={onClose} className={btnIcon}><X size={20} /></button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

// ================= HÀM HỖ TRỢ CẮT ẢNH =================
const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // Ép kích thước chuẩn 400x400 cho Avatar vuông/tròn để nhẹ và đều nhau
  canvas.width = 400;
  canvas.height = 400;

  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 400, 400);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

export default function SettingsModal() {
  const { t, i18n } = useTranslation();
  const isOpen = useUIStore(s => s.showProfileSettings);
  const onClose = () => useUIStore.getState().setShowProfileSettings(false);
  const profile = useAppStore(s => s.profile);
  const setProfile = (newProfile: typeof profile) => useAppStore.getState().setAppState({ profile: newProfile });
  const handleLogout = useAppStore(s => s.actions.handleLogout);

  const { settings, updateSettings, isSaving, lastSync, triggerHaptic } = useSettings(profile);
  const { formatVolume: formatVol } = useVolumeFormat();
  const [activeSheet, setActiveSheet] = useState<'none' | 'personal' | 'quiet' | 'privacy' | 'delete' | 'name' | 'widget' | 'wellness'>('none');
  const [widgetSize, setWidgetSize] = useState<'small' | 'medium'>('small');
  const [showAdmin, setShowAdmin] = useState(false);
  
  // ================= ĐÃ ĐỒNG BỘ TOÀN BỘ BIẾN VÀO ĐÂY =================
  // FIX: Khởi tạo state với giá trị mặc định hợp lệ (chuẩn tiếng Anh)
  const [formData, setFormData] = useState({
    nickname: '', gender: 'Nam', age: 25, height: 170, weight: 60, activity: 'moderate', climate: 'temperate', goal: 'Sức khỏe tổng quát'
  });

  const [draftQuiet, setDraftQuiet] = useState({ start: '22:00', end: '07:00' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ================= STATES CHO CROPPER =================
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // ================= STATES XÓA TÀI KHOẢN =================
  const [deleteStep, setDeleteStep] = useState<'select' | 'confirm' | null>(null);
  const [selectedOption, setSelectedOption] = useState<DeleteOption>('data-only');
  const [password, setPassword] = useState('');
  const { performDelete, isDeleting, error: deleteError } = useDeleteAccount();

  // BIOMETRIC HOOK
  const { registerBiometric, disableBiometric, isRegistering } = useBiometric();
  const { syncWeather, isSyncing: isWeatherSyncing } = useWeatherSync();

  const handleToggleBiometric = async () => {
    if (!profile?.id) return;
    triggerHaptic();
    if (settings.biometricEnabled) {
      disableBiometric(profile.id);
      setProfile({ ...profile }); // Ép render lại giao diện
    } else {
      const success = await registerBiometric(profile.id);
      if (success) setProfile({ ...profile });
    }
  };

  const closeSheet = () => {
    triggerHaptic();
    setActiveSheet('none');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setCropImage(reader.result as string);
    };
    e.target.value = ''; // Reset input để có thể chọn lại cùng 1 file
  };

  const handleCropConfirm = async () => {
    if (!cropImage || !croppedAreaPixels || !profile?.id) return;
    
    const toastId = toast.loading(t('settings.uploading_avatar'));
    try {
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
      if (!croppedBlob) throw new Error(t('common.crop_image_error'));
      
      const filePath = `${profile.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, croppedBlob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const newAvatarUrl = data.publicUrl;

      // FIX: Trực tiếp cập nhật vào database và đợi hoàn tất
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', profile.id);
      if (dbError) throw dbError;

      setProfile({ ...profile, avatar_url: newAvatarUrl });
      
      toast.success(t('settings.avatar_updated'), { id: toastId });
      setCropImage(null);
      triggerHaptic();
    } catch (err: unknown) {
      toast.error(t('settings.avatar_load_error', { error: err instanceof Error ? err.message : String(err) }), { id: toastId });
    }
  };

  const { sendTestNotification, isSendingTest, isSubscribed, subscribe, unsubscribe, isRegistering: isPushRegistering } = usePushNotifications(profile?.id);
  const nativePush = useNativePush(profile?.id);

  const testNotification = async () => {
    triggerHaptic();
    try {
      const result = await sendTestNotification();
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.warning(result.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('settings.test_notification_failed'));
    }
  };

  const premiumStatus = usePremiumStatus();

  const openStripePortal = async () => {
    triggerHaptic();
    try {
      const { data, error } = await supabase.functions.invoke('stripe-portal');
      if (error) throw new Error(error.message);
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error(t('settings.stripe_portal_failed'));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('settings.stripe_connect_error'));
    }
  };

  // Cập nhật lên Supabase khi Save
  const handleSaveProfile = async () => {
    triggerHaptic();
    if (!profile?.id) return;

    const parsed = profileSchema.safeParse(formData);
    if (!parsed.success) {
      toast.error(formatZodErrors(parsed.error));
      return;
    }
    
    const data = parsed.data;
    const toastId = toast.loading(t('settings.updating_profile'));
    try {
      const { error } = await supabase.from('profiles').update({
        nickname: data.nickname,
        gender: data.gender,
        age: data.age,
        height: data.height,
        weight: data.weight,
        activity: data.activity,
        climate: data.climate,
        goal: data.goal
      }).eq('id', profile.id);

      if (error) throw error;
      
      setProfile({ ...profile, ...data } as AppProfile);
      updateSettings({
        displayName: data.nickname,
        weight: data.weight,
        height: data.height,
        age: data.age,
        gender: data.gender,
        activity: data.activity,
        climate: data.climate
      });
      
      toast.success(t('settings.profile_updated'), { id: toastId });
      closeSheet();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err) || t('settings.profile_update_error'), { id: toastId });
    }
  };

  const handleSyncAppleHealth = async () => {
    const granted = await requestHealthReadStepsAndHeartRate();
    if (granted) {
      toast.success(t('settings.health_connected'));
    }
    return granted;
  };

  return (
    <React.Fragment>
      <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="settings-modal-overlay"
          initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-[80] bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center gap-4 px-4 pt-12 pb-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5">
            <button onClick={() => { triggerHaptic(); onClose(); }} className={btnIcon}><ChevronLeft size={24} /></button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex-1">{t('settings.title')}</h1>
            {isSaving && <Loader2 size={18} className="text-cyan-400 animate-spin mr-2" />}
          </div>

          <div className="p-4 space-y-8 pb-20">
            {/* SECTION A: PROFILE & BIOMETRICS */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-4">{t('settings.profile_biometrics')}</h3>
              <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden mb-6 shadow-sm">
                
                <button onClick={() => { triggerHaptic(); fileInputRef.current?.click(); }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 active:bg-slate-200 dark:active:bg-white/10 transition-colors border-b border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 overflow-hidden shadow-inner">
                      {profile?.avatar_url || settings.avatarUrl ? (
                        <img src={profile?.avatar_url || settings.avatarUrl} alt={t('common.avatar_alt')} className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={18} />
                      )}
                    </div>
                    <span className="text-slate-800 dark:text-white font-medium">{t('settings.change_avatar')}</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 dark:text-white/40" />
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                </button>

                {/* NÚT MỞ BOTTOM SHEET CÁ NHÂN */}
                <button onClick={() => { 
                  triggerHaptic(); 
                  setFormData({ 
                    // FIX: Luôn lấy dữ liệu từ `profile` làm nguồn tin cậy duy nhất.
                    nickname: profile?.nickname || '',
                    gender: profile?.gender || 'Nam',
                    age: profile?.age || 25,
                    height: profile?.height || 170,
                    weight: profile?.weight || 60,
                    activity: profile?.activity || 'moderate',
                    climate: profile?.climate || 'temperate',
                    goal: profile?.goal || 'Sức khỏe tổng quát'
                  }); 
                  setActiveSheet('personal'); 
                }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><Activity size={18} /></div>
                    <span className="text-white font-medium">{t('settings.personal_info')}</span>
                  </div>
                  <ChevronRight size={18} className="text-white/40" />
                </button>



                {/* NÚT BẬT TẮT SINH TRẮC HỌC / FACE ID */}
                <button disabled={isRegistering} onClick={handleToggleBiometric} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5 disabled:opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center"><Fingerprint size={18} /></div>
                    <div className="text-left">
                      <span className="text-white font-medium block">{t('settings.biometric_login')}</span>
                      <span className="text-[10px] text-slate-500">{t('settings.biometric_login_desc')}</span>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.biometricEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.biometricEnabled ? 'translate-x-4' : ''}`} />
                  </div>
                </button>

                <button onClick={async () => { 
                  triggerHaptic(); 
                  if (settings.syncHealth) {
                    updateSettings({ syncHealth: false });
                    return;
                  }

                  if (!settings.syncHealth) {
                    const granted = await handleSyncAppleHealth();
                    if (!granted) return;
                  }
                  updateSettings({ syncHealth: true });
                }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center"><Heart size={18} /></div>
                    <span className="text-white font-medium">{t('settings.sync_health')}</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.syncHealth ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.syncHealth ? 'translate-x-4' : ''}`} />
                   </div>
                 </button>

                  {/* WELLNESS LEADERBOARD PRIVACY */}
                  <button 
                    onClick={async () => {
                      triggerHaptic();
                      const currentOptIn = profile?.leaderboard_opt_in !== false;
                      const nextOptIn = !currentOptIn;
                      const toastId = toast.loading(nextOptIn ? t('settings.enabling_share_leaderboard') : t('settings.disabling_share_leaderboard'));
                      try {
                        const { error } = await supabase
                          .from('profiles')
                          .update({ leaderboard_opt_in: nextOptIn })
                          .eq('id', profile?.id);
                        if (error) throw error;

                        if (profile) {
                          setProfile({ ...profile, leaderboard_opt_in: nextOptIn });
                        }
                        toast.success(nextOptIn ? t('settings.share_leaderboard_enabled') : t('settings.share_leaderboard_disabled'), { id: toastId });
                      } catch {
                        toast.error(t('settings.leaderboard_update_failed'), { id: toastId });
                      }
                    }} 
                    className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center"><Trophy size={18} /></div>
                      <div className="text-left">
                        <span className="text-white font-medium block">{t('settings.share_leaderboard')}</span>
                        <span className="text-[10px] text-slate-500">{t('settings.share_leaderboard_desc')}</span>
                      </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${profile?.leaderboard_opt_in !== false ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${profile?.leaderboard_opt_in !== false ? 'translate-x-4' : ''}`} />
                    </div>
                  </button>

                 {/* WELLNESS SETTINGS BUTTON */}
                 <button
                   onClick={() => {
                     triggerHaptic();
                     setActiveSheet('wellness');
                   }}
                   className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5"
                 >
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 flex items-center justify-center">
                       <Sparkles size={18} />
                     </div>
                     <div className="text-left">
                       <span className="text-white font-medium block">{t('common.wellness_overview')}</span>
                       <span className="text-[10px] text-slate-500">Sleep, Mood, Activity insights</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 text-white/40">
                     <span className="text-xs font-bold uppercase tracking-wider text-emerald-400/70">
                       {settings.syncWellnessData ? t('common.enabled') : t('common.active')}
                     </span>
                     <ChevronRight size={18} />
                   </div>
                 </button>

                  {/* --- THÊM NÚT MỚI NÀY VÀO ĐÂY --- */}
                 <div className="mt-4">
                    <button
                      disabled={isWeatherSyncing}
                      onClick={() => { triggerHaptic(); void syncWeather({ force: true }); }}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-60 disabled:active:scale-100"
                    >
                     <div className="flex items-center gap-3">
                       <CloudSun size={24} className="text-blue-400" />
                       <div className="text-left">
                         <p className="font-bold text-sm">{t('settings.weather_update')}</p>
                         <p className="text-xs opacity-80">{isWeatherSyncing ? t('common.syncing') : t('common.adjust_goal_automatically')}</p>
                       </div>
                     </div>
                     {isWeatherSyncing ? (
                       <Loader2 size={18} className="animate-spin opacity-70" />
                     ) : (
                       <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                     )}
                   </button>
                </div>
                {/* ---------------------------------- */}

              </div>
            </section>

            {/* SECTION B: NOTIFICATIONS */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-4">{t('settings.notifications')}</h3>
              <div className="bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden mb-6 shadow-sm">
                <button onClick={() => { triggerHaptic(); updateSettings({ smartReminders: !settings.smartReminders }); }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center"><Bell size={18} /></div>
                    <span className="text-white font-medium">{t('settings.smart_reminders')}</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.smartReminders ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.smartReminders ? 'translate-x-4' : ''}`} />
                  </div>
                </button>

                <button 
                  disabled={isPushRegistering} 
                  onClick={async () => {
                    triggerHaptic();
                    if (Capacitor.isNativePlatform()) {
                      if (nativePush.isRegistered) {
                        await nativePush.unregister();
                        toast.success(t('common.push_disabled'));
                      } else {
                        toast.success(t('common.push_enable_instructions'));
                      }
                    } else if (isSubscribed) {
                      await unsubscribe();
                      toast.success(t('common.push_disabled'));
                    } else {
                      const ok = await subscribe();
                      if (ok) {
                        toast.success(t('common.push_enabled'));
                      } else {
                        toast.error(t('common.push_enable_error'));
                      }
                    }
                  }} 
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5 disabled:opacity-50"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      {isPushRegistering ? <Loader2 size={18} className="animate-spin" /> : <BellRing size={18} />}
                    </div>
                    <div>
                      <span className="text-white font-medium block">{t('settings.device_push')}</span>
                      <span className="text-[10px] text-slate-400 block">{t('settings.device_push_desc')}</span>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${(isSubscribed || nativePush.isRegistered) ? 'bg-cyan-500' : 'bg-slate-700'} shrink-0`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${(isSubscribed || nativePush.isRegistered) ? 'translate-x-4' : ''}`} />
                  </div>
                </button>


                <button disabled={!settings.smartReminders} onClick={() => { triggerHaptic(); setDraftQuiet({ start: settings.quietHoursStart, end: settings.quietHoursEnd }); setActiveSheet('quiet'); }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5 disabled:opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center"><MoonStar size={18} /></div>
                    <span className="text-white font-medium">{t('settings.quiet_hours')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/40">
                    <span className="text-sm">{settings.quietHoursStart} - {settings.quietHoursEnd}</span>
                    <ChevronRight size={18} />
                  </div>
                </button>

                <button disabled={isSendingTest} onClick={testNotification} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors disabled:opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-500/20 text-slate-400 flex items-center justify-center">
                      {isSendingTest ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </div>
                    <span className="text-white font-medium">{t('settings.send_test')}</span>
                  </div>
                  <span className="text-sm font-semibold text-cyan-400">{isSendingTest ? t('common.sending') : t('common.try_now')}</span>
                </button>
              </div>
            </section>

            {/* SECTION C: PREFERENCES & UI */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-4">{t('settings.ui_utilities')}</h3>
              <div className="bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden mb-6 shadow-sm">
                <button onClick={() => { triggerHaptic(); updateSettings({ hapticsEnabled: !settings.hapticsEnabled }); }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center"><Smartphone size={18} /></div>
                    <span className="text-white font-medium">{t('settings.haptic_feedback')}</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.hapticsEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.hapticsEnabled ? 'translate-x-4' : ''}`} />
                  </div>
                </button>



                <div className="w-full flex items-center justify-between p-4 bg-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center"><Ruler size={18} /></div>
                    <span className="text-white font-medium">{t('settings.unit')}</span>
                  </div>
                  <div className="flex bg-slate-800 rounded-lg p-1">
                    <button onClick={() => { triggerHaptic(); updateSettings({ unit: 'ml' }); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${settings.unit === 'ml' ? 'bg-white/10 text-white' : 'text-white/40'}`}>ml</button>
                    <button onClick={() => { triggerHaptic(); updateSettings({ unit: 'oz' }); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${settings.unit === 'oz' ? 'bg-white/10 text-white' : 'text-white/40'}`}>oz</button>
                  </div>
                </div>

                <div className="w-full flex items-center justify-between p-4 bg-transparent border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center"><Languages size={18} /></div>
                    <span className="text-white font-medium">{t('settings.language')}</span>
                  </div>
                  <div className="flex bg-slate-800 rounded-lg p-1">
                    {(['vi', 'en'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          triggerHaptic();
                          i18n.changeLanguage(lang);
                          AppStorage.setItem('digiwell_language', lang);
                        }}
                        className={`px-2 py-1 text-xs font-bold rounded-md transition-all uppercase ${
                          i18n.language === lang ? 'bg-white/10 text-white' : 'text-white/40'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION D: PREMIUM SUBSCRIPTION */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2 ml-4">{t('settings.premium')}</h3>
              <div className="bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden mb-6 shadow-sm">
                <div className="w-full flex items-center justify-between p-4 bg-transparent border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${premiumStatus !== 'none' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>
                      <Crown size={18} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-white font-medium">
                        {premiumStatus === 'active' ? t('settings.digiwell_pro') :
                         premiumStatus === 'grace' ? t('settings.digiwell_pro_grace') :
                         premiumStatus === 'expired' ? t('settings.pro_expired') :
                         t('settings.digiwell_free')}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {premiumStatus === 'active' && profile?.subscription_end
                          ? t('settings.subscription_expires', { date: new Date(profile.subscription_end).toLocaleDateString() })
                          : premiumStatus === 'grace'
                          ? t('settings.grace_period_expires', { date: profile?.grace_period_end ? new Date(profile.grace_period_end).toLocaleDateString() : '' })
                          : premiumStatus === 'expired'
                          ? t('settings.renew_pro')
                          : t('settings.upgrade_unlock')}
                      </span>
                    </div>
                  </div>
                  {premiumStatus !== 'none' ? (
                    <button onClick={openStripePortal} className="flex items-center gap-1 text-sm font-semibold text-amber-400 p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <ExternalLink size={14} />
                      {t('settings.manage')}
                    </button>
                  ) : (
                    <button onClick={() => useUIStore.getState().setShowPremiumModal(true)} className="text-sm font-semibold text-cyan-400 p-2 hover:bg-white/5 rounded-lg transition-colors">
                      {t('settings.upgrade')}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION E: ACCOUNT & LEGAL */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-4">{t('settings.account_legal')}</h3>
              <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden mb-6 shadow-sm">
                <div className="w-full flex items-center justify-between p-4 bg-transparent border-b border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center"><CloudUpload size={18} /></div>
                    <div className="flex flex-col text-left">
                      <span className="text-slate-800 dark:text-white font-medium">{t('settings.cloud_sync')}</span>
                      <span className="text-xs text-slate-500 dark:text-white/40">{lastSync ? t('settings.synced_at', { time: lastSync.toLocaleTimeString() }) : t('settings.not_synced')}</span>
                    </div>
                  </div>
                  <button onClick={() => { triggerHaptic(); updateSettings({}); }} className="text-sm font-semibold text-cyan-500 dark:text-cyan-400 p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">{t('settings.sync_now')}</button>
                </div>

                <div className="w-full flex items-center justify-between p-4 bg-transparent border-b border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center"><Calendar size={18} /></div>
                    <div className="flex flex-col text-left">
                      <span className="text-slate-800 dark:text-white font-medium">{t('settings.share_calendar')}</span>
                      <span className="text-xs text-slate-500 dark:text-white/40">{t('settings.share_calendar_desc')}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      triggerHaptic();
                      const newShareCalendarStatus = !settings.shareCalendarStatus;
                      await updateSettings({ shareCalendarStatus: newShareCalendarStatus });
                      // Update public_profiles.is_calendar_synced in database
                      if (profile?.id) {
                        const { supabase } = await import('@/lib/supabase');
                        await supabase
                          .from('public_profiles')
                          .update({ is_calendar_synced: newShareCalendarStatus })
                          .eq('id', profile.id);
                      }
                    }}
                    className={`w-12 h-7 rounded-full p-1 transition-colors ${settings.shareCalendarStatus ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${settings.shareCalendarStatus ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <button 
                  onClick={() => { 
                    triggerHaptic(); 
                    useUIStore.getState().setShowProfileSettings(false);
                    useUIStore.getState().setShowHardwareWaitlist(true);
                  }} 
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 active:bg-slate-200 dark:active:bg-white/10 transition-colors border-b border-slate-200 dark:border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Cpu size={18} />
                    </div>
                    <span className="text-slate-800 dark:text-white font-medium">{t('settings.digibottle_waitlist')}</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 dark:text-white/40" />
                </button>

                <button onClick={() => { triggerHaptic(); setActiveSheet('privacy'); }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 active:bg-slate-200 dark:active:bg-white/10 transition-colors border-b border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-500/20 text-slate-400 flex items-center justify-center"><FileText size={18} /></div>
                    <span className="text-slate-800 dark:text-white font-medium">{t('settings.terms_privacy')}</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 dark:text-white/40" />
                </button>

                <button onClick={async () => { triggerHaptic(); const { confirmDialog } = await import('@/store/useConfirmDialog'); const ok = await confirmDialog({ title: t('settings.logout'), message: t('settings.logout_confirm') || 'Are you sure you want to logout?', confirmLabel: t('settings.logout'), variant: 'danger' }); if (ok) handleLogout(); }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 active:bg-slate-200 dark:active:bg-white/10 transition-colors border-b border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center"><LogOut size={18} /></div>
                    <span className="text-yellow-400 font-bold">{t('settings.logout')}</span>
                  </div>
                </button>

                <button onClick={() => { triggerHaptic(); setPassword(''); setDeleteStep('select'); }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 active:bg-red-100 dark:active:bg-red-500/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center"><Trash2 size={18} /></div>
                    <span className="text-red-500 font-bold">{t('settings.delete_account')}</span>
                  </div>
                </button>
              </div>
            </section>

            {/* SECTION F: DEVELOPER PORTAL */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-4">{t('settings.for_developers')}</h3>
              <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden mb-6 shadow-sm">
                <button
                  onClick={() => {
                    triggerHaptic();
                    useUIStore.getState().setShowDeveloperPortal(true);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 active:bg-slate-200 dark:active:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Code size={18} />
                    </div>
                    <div className="text-left">
                      <span className="text-slate-800 dark:text-white font-medium block">{t('settings.api_webhooks')}</span>
                      <span className="text-[10px] text-slate-500">Smart device integration & Webhook</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 dark:text-white/40" />
                </button>
              </div>
            </section>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ================= SUB-MODALS (BOTTOM SHEETS) ================= */}
      <AnimatePresence>
        {activeSheet === 'name' && (
          <BottomSheetWrapper key="section-name" title={t('settings.edit_display_name')} onClose={closeSheet}>
            <input type="text" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-lg font-semibold outline-none focus:border-cyan-500 transition-colors mb-6" placeholder={t('settings.enter_new_name')} />
            <button onClick={handleSaveProfile} className="w-full py-3 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors">{t('settings.save_changes')}</button>
          </BottomSheetWrapper>
        )}

        {/* BOTTOM SHEET CÁ NHÂN ĐÃ ĐƯỢC FIX LẠI BIẾN */}
        {activeSheet === 'personal' && (
          <BottomSheetWrapper key="section-personal" title={t('settings.personal_info')} onClose={closeSheet}>
            <div className="flex items-center gap-4 mb-6 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-300 dark:border-white/5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
                {profile?.avatar_url || settings.avatarUrl ? (
                  <img src={profile?.avatar_url || settings.avatarUrl} alt={t('common.avatar_alt')} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-white dark:text-white">{(profile?.nickname || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <input type="text" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} className="w-full bg-transparent text-slate-900 dark:text-white font-bold text-lg border-b border-slate-300 dark:border-white/20 focus:border-cyan-500 dark:focus:border-cyan-400 outline-none pb-1" placeholder={t('settings.enter_new_name')} />
                <p className="text-cyan-600 dark:text-cyan-400 text-sm font-semibold mt-1">{t('settings.goal_per_day', { goal: formatVol(settings.waterGoal) })}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">{t('settings.age_label')}</label>
                  <input type="number" value={formData.age || ''} onChange={e => setFormData({...formData, age: Number(e.target.value)})} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-lg font-semibold outline-none focus:border-cyan-500" />
                  {(formData.age < 5 || formData.age > 120) && <p className="text-red-400 text-xs mt-1">{t('settings.error_age')}</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">{t('settings.height_label')}</label>
                  <input type="number" value={formData.height || ''} onChange={e => setFormData({...formData, height: Number(e.target.value)})} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-lg font-semibold outline-none focus:border-cyan-500" />
                  {(formData.height < 50 || formData.height > 250) && <p className="text-red-400 text-xs mt-1">{t('settings.error_height')}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">{t('settings.gender_label')}</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:border-cyan-500 appearance-none">
                    <option className="bg-white dark:bg-slate-900" value="Nam">{t('settings.male')}</option>
                    <option className="bg-white dark:bg-slate-900" value="Nữ">{t('settings.female')}</option>
                    <option className="bg-white dark:bg-slate-900" value="Khác">{t('settings.other')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">{t('settings.weight_label')}</label>
                  <input type="number" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-lg font-semibold outline-none focus:border-cyan-500" />
                  {(formData.weight < 20 || formData.weight > 300) && <p className="text-red-400 text-xs mt-1">{t('settings.error_weight')}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">{t('settings.activity_level_label')}</label>
                <select value={formData.activity} onChange={e => setFormData({...formData, activity: e.target.value})} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:border-cyan-500 appearance-none">
                  <option className="bg-white dark:bg-slate-900" value="sedentary">{t('settings.sedentary')}</option>
                  <option className="bg-white dark:bg-slate-900" value="light">{t('settings.light')}</option>
                  <option className="bg-white dark:bg-slate-900" value="moderate">{t('settings.moderate')}</option>
                  <option className="bg-white dark:bg-slate-900" value="high">{t('settings.high')}</option>
                  <option className="bg-white dark:bg-slate-900" value="athlete">{t('settings.athlete')}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">{t('settings.climate_label')}</label>
                <select value={formData.climate} onChange={e => setFormData({...formData, climate: e.target.value})} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:border-cyan-500 appearance-none">
                  <option className="bg-white dark:bg-slate-900" value="temperate">{t('settings.temperate')}</option>
                  <option className="bg-white dark:bg-slate-900" value="warm">{t('settings.warm')}</option>
                  <option className="bg-white dark:bg-slate-900" value="hot">{t('settings.hot')}</option>
                  <option className="bg-white dark:bg-slate-900" value="tropical">{t('settings.tropical')}</option>
                  <option className="bg-white dark:bg-slate-900" value="cold">{t('settings.cold')}</option>
                </select>
              </div>
            </div>
            {/* Đã chuyển hàm Save để đồng bộ luôn lên DB */}
            <button onClick={handleSaveProfile} className="w-full py-3 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors">{t('settings.save_changes')}</button>
          </BottomSheetWrapper>
        )}


        {activeSheet === 'quiet' && (
          <BottomSheetWrapper key="section-quiet" title={t('settings.quiet_hours')} onClose={closeSheet}>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">{t('settings.start')}</label>
                <input type="time" value={draftQuiet.start} onChange={e => setDraftQuiet(p => ({...p, start: e.target.value}))} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-lg font-semibold outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">{t('settings.end')}</label>
                <input type="time" value={draftQuiet.end} onChange={e => setDraftQuiet(p => ({...p, end: e.target.value}))} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-lg font-semibold outline-none focus:border-purple-500" />
              </div>
            </div>
            <button onClick={() => { triggerHaptic(); updateSettings({ quietHoursStart: draftQuiet.start, quietHoursEnd: draftQuiet.end }); closeSheet(); }} className="w-full py-3 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors">{t('settings.save_settings')}</button>
          </BottomSheetWrapper>
        )}

        {activeSheet === 'privacy' && (
          <BottomSheetWrapper key="section-privacy" title={t('settings.terms_privacy')} onClose={closeSheet}>
            <div className="text-slate-400 text-sm leading-relaxed space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <h4 className="text-white font-bold text-sm mb-2">{t('settings.data_we_collect')}</h4>
                <ul className="space-y-1.5 pl-4 text-xs list-disc marker:text-cyan-500/50">
                  <li><strong className="text-white/80">{t('settings.profile_info')}</strong> {t('settings.nickname_age_height')}</li>
                  <li><strong className="text-white/80">{t('settings.water_log')}</strong> {t('settings.water_log_desc')}</li>
                  <li><strong className="text-white/80">{t('settings.optional_health')}</strong> {t('settings.heart_rate_steps')}</li>
                  <li><strong className="text-white/80">{t('settings.social_content')}</strong> {t('settings.posts_comments')}</li>
                  <li><strong className="text-white/80">{t('settings.payment_data')}</strong> {t('settings.stripe_history')}</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-2">{t('settings.how_we_use')}</h4>
                <ul className="space-y-1.5 pl-4 text-xs list-disc marker:text-cyan-500/50">
                  <li>{t('settings.calc_personalize')}</li>
                  <li>{t('settings.ai_analysis')}</li>
                  <li>{t('settings.display_leaderboard')}</li>
                  <li>{t('settings.improve_product')}</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-2">{t('settings.data_sharing')}</h4>
                <p className="text-xs">{t('settings.never_sell')}</p>
                <ul className="space-y-1.5 pl-4 mt-1.5 text-xs list-disc marker:text-cyan-500/50">
                  <li><strong className="text-white/80">Supabase</strong> {t('settings.supabase_db')}</li>
                  <li><strong className="text-white/80">Stripe</strong> {t('settings.stripe_payments')}</li>
                  <li><strong className="text-white/80">Groq Cloud</strong> {t('settings.groq_ai')}</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-2">{t('settings.your_rights')}</h4>
                <ul className="space-y-1.5 pl-4 text-xs list-disc marker:text-cyan-500/50">
                  <li>{t('settings.export_data')}</li>
                  <li>{t('settings.delete_data')}</li>
                  <li>{t('settings.edit_data')}</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-2">{t('settings.contact')}</h4>
                <p className="text-xs">{t('settings.privacy_email')} <span className="text-cyan-400">privacy@digiwell.app</span>.</p>
                <p className="text-[10px] text-slate-500 mt-1">{t('settings.last_updated')}</p>
              </div>
            </div>
            <button onClick={closeSheet} className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors">{t('settings.understood')}</button>
          </BottomSheetWrapper>
        )}

        {activeSheet === 'widget' && (
          <BottomSheetWrapper key="section-widget" title={t('settings.widget_settings')} onClose={closeSheet}>
            <div className="space-y-4 mb-6">
              {/* Size + Theme selector */}
              <div className="flex items-center justify-between">
                <p className="text-white font-bold text-sm">{t('settings.size')}</p>
                <div className="flex gap-2">
                  {['small', 'medium'].map(s => (
                    <button key={s} onClick={() => setWidgetSize(s as typeof widgetSize)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${widgetSize === s ? 'bg-white/10 text-white' : 'text-white/40'}`}>
                      {s === 'small' ? '1x1' : '2x1'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Widget Preview Mockup */}
              <div className={`mx-auto rounded-[2rem] bg-slate-900 border border-white/10 p-4 relative overflow-hidden shadow-2xl flex flex-col justify-between ${widgetSize === 'small' ? 'w-full max-w-[160px] aspect-square' : 'w-full max-w-[280px] aspect-[2/1]'}`} style={{ borderColor: `${settings.themeColor}50` }}>
                <div className="absolute top-0 right-0 w-24 h-24 blur-2xl rounded-full pointer-events-none" style={{ backgroundColor: `${settings.themeColor}30` }} />
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-[10px] font-bold" style={{ color: settings.themeColor }}>{t('settings.today')}</p>
                    <p className="text-xl font-black text-white leading-none">{(profile?.water_today || 0)}</p>
                    <p className="text-[8px] text-slate-400">/ {settings.waterGoal || 2000} ml</p>
                  </div>
                  <Droplets size={widgetSize === 'small' ? 16 : 20} style={{ color: settings.themeColor }} />
                </div>
                
                {widgetSize === 'medium' && (
                  <p className="text-[9px] text-slate-500 mt-1 relative z-10">
                    {Math.min(((profile?.water_today || 0) / (settings.waterGoal || 2000)) * 100, 100).toFixed(0)}{t('settings.of_goal')}
                  </p>
                )}

                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-auto mb-3 relative z-10">
                  <div className="h-full transition-all" style={{ width: `${Math.min(((profile?.water_today || 0) / (settings.waterGoal || 2000)) * 100, 100)}%`, backgroundColor: settings.themeColor }} />
                </div>

                {widgetSize === 'medium' && (
                  <div className="flex gap-1.5 relative z-10">
                    <div className="flex-1 py-1.5 rounded-lg bg-white/10 text-center text-[9px] font-bold text-white">+100</div>
                    <div className="flex-1 py-1.5 rounded-lg text-center text-[9px] font-bold text-slate-900 shadow-lg" style={{ backgroundColor: settings.themeColor }}>+250</div>
                  </div>
                )}
              </div>

              {/* Theme Color Picker */}
              <div>
                <p className="text-white/60 text-xs mb-2">{t('settings.color')}</p>
                <div className="flex gap-2 flex-wrap">
                  {['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6', '#84cc16'].map(color => (
                    <button key={color} onClick={() => { triggerHaptic(); updateSettings({ themeColor: color }); }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${settings.themeColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <h4 className="text-cyan-400 font-bold text-sm mb-2 flex items-center gap-2"><Smartphone size={16} /> {t('settings.add_widget_guide')}</h4>
                <ul className="text-slate-300 text-xs space-y-2 list-decimal pl-4">
                  <li>{t('settings.step_1')}</li>
                  <li>{t('settings.step_2')}</li>
                  <li>Chọn <strong>{t('settings.step_3')}</strong></li>
                  <li>{t('settings.step_4')}</li>
                </ul>
              </div>

              <button onClick={async () => { 
                triggerHaptic(); 
                AppStorage.setItem('digiwell_widget_sync', JSON.stringify({
                  water_today: profile?.water_today,
                  water_goal: settings.waterGoal,
                  themeColor: settings.themeColor
                }));
                
                if (Capacitor.isNativePlatform()) {
                  try {
                    await WidgetPlugin?.syncData({
                      water_today: Number(profile?.water_today) || 0,
                      water_goal: settings.waterGoal || 2000,
                      themeColor: settings.themeColor || '#06b6d4'
                    });
                  } catch { console.log('Bỏ qua vì không chạy trên iOS Native'); }
                } else {
                  const { updateWidgetCache } = await import('@/lib/widgetService');
                  if (profile?.id) updateWidgetCache(profile.id).catch(() => {});
                }

                 toast.success(t('settings.widget_synced')); 
                 closeSheet(); 
               }} className="w-full py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-colors" style={{ backgroundColor: settings.themeColor }}>
                 {t('settings.sync_now_widget')}
               </button>
             </div>
           </BottomSheetWrapper>
         )}

         {/* WELLNESS SETTINGS BOTTOM SHEET */}
         {activeSheet === 'wellness' && (
           <BottomSheetWrapper key="section-wellness" title={t('settings.wellness_settings')} onClose={closeSheet}>
             <div className="space-y-6">
               {/* Sleep Section */}
               <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                     <MoonStar size={20} />
                   </div>
                   <div>
                     <h4 className="text-slate-900 dark:text-white font-bold">{t('settings.sleep_goal')}</h4>
                     <p className="text-xs text-slate-500">{t('settings.sleep_target')}</p>
                   </div>
                 </div>

                 <div className="space-y-4">
                   <div>
                     <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-2">
                       {t('settings.sleep_target_label', { hours: settings.sleepHours })}
                     </label>
                     <input
                       type="range"
                       min="5"
                       max="12"
                       value={settings.sleepHours}
                       onChange={(e) => {
                         triggerHaptic();
                         updateSettings({ sleepHours: Number(e.target.value) });
                       }}
                       className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                     />
                     <div className="flex justify-between text-xs text-slate-500 mt-1">
                       <span>5h</span>
                       <span>8h</span>
                       <span>12h</span>
                     </div>
                   </div>

                   <div>
                     <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-2">
                       {t('settings.sleep_quality_label', { quality: settings.sleepQuality })}
                     </label>
                     <input
                       type="range"
                       min="1"
                       max="10"
                       value={settings.sleepQuality}
                       onChange={(e) => {
                         triggerHaptic();
                         updateSettings({ sleepQuality: Number(e.target.value) });
                       }}
                       className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                     />
                     <div className="flex justify-between text-xs text-slate-500 mt-1">
                       <span>{t('settings.quality_very_poor')}</span>
                       <span>{t('settings.quality_good')}</span>
                       <span>{t('settings.quality_excellent')}</span>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Mood & Energy Tracking */}
               <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                     <Sparkles size={20} />
                   </div>
                   <div>
                     <h4 className="text-slate-900 dark:text-white font-bold">{t('settings.mood_tracking')}</h4>
                     <p className="text-xs text-slate-500">{t('settings.sleep_insights')}</p>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                         😊
                       </div>
                       <div>
                         <p className="text-slate-900 dark:text-white font-medium text-sm">{t('settings.daily_mood_check')}</p>
                         <p className="text-xs text-slate-500">{t('settings.daily_mood_desc')}</p>
                       </div>
                     </div>
                     <input
                       type="checkbox"
                       checked={settings.moodTracking}
                       onChange={(e) => {
                         triggerHaptic();
                         updateSettings({ moodTracking: e.target.checked });
                       }}
                       className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                     />
                   </label>

                   <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                         ⚡
                       </div>
                       <div>
                         <p className="text-slate-900 dark:text-white font-medium text-sm">{t('settings.energy_tracking')}</p>
                         <p className="text-xs text-slate-500">{t('settings.daily_energy')}</p>
                       </div>
                     </div>
                     <input
                       type="checkbox"
                       checked={settings.energyTracking}
                       onChange={(e) => {
                         triggerHaptic();
                         updateSettings({ energyTracking: e.target.checked });
                       }}
                       className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                     />
                   </label>
                 </div>
               </div>

               {/* Health Sync */}
               <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                       📊
                     </div>
                     <div>
                       <h4 className="text-slate-900 dark:text-white font-bold">{t('settings.sync_health_data')}</h4>
                       <p className="text-xs text-slate-500">{t('settings.connect_health')}</p>
                     </div>
                   </div>
                   <div
                     className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                       settings.syncWellnessData ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
                     }`}
                     onClick={() => {
                       triggerHaptic();
                       updateSettings({ syncWellnessData: !settings.syncWellnessData });
                     }}
                   >
                     <div
                       className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                         settings.syncWellnessData ? 'translate-x-5' : 'translate-x-1'
                       }`}
                     />
                   </div>
                 </div>
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                   {t('settings.sync_health_desc')}
                 </p>
               </div>

               {/* Info Card */}
               <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl">

                 <p className="text-xs text-emerald-300 leading-relaxed">
                   {t('settings.wellness_score_info')}
                 </p>
               </div>
             </div>
           </BottomSheetWrapper>
         )}

      </AnimatePresence>

      {showAdmin && <AdminDashboardModal onClose={() => setShowAdmin(false)} />}

      {/* Version tap for admin */}
      <p
        className="text-center text-[10px] text-slate-600 dark:text-white/10 pb-4 select-none cursor-default"
        onDoubleClick={() => setShowAdmin(true)}
      >
        DigiWell v1.0
      </p>

      {/* ================= MODAL CROP ẢNH (CROPPER) ================= */}
      <AnimatePresence>
        {cropImage && (
          <motion.div
            key="cropper-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[300] bg-slate-950 flex flex-col"
          >
            <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-white/10 z-10 pt-10">
              <button onClick={() => setCropImage(null)} className="text-slate-400 hover:text-white px-4 py-2 font-bold">{t('common.cancel')}</button>
              <h3 className="text-white font-bold">{t('settings.crop_image')}</h3>
              <button onClick={handleCropConfirm} className="text-cyan-400 hover:text-cyan-300 font-bold px-4 py-2">{t('common.done')}</button>
            </div>
            <div className="flex-1 relative bg-black">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-8 bg-slate-900 border-t border-white/10 z-10 pb-12 flex items-center gap-4">
              <span className="text-slate-400 text-sm font-bold">{t('settings.zoom')}</span>
              <input type="range" value={zoom} min={1} max={3} step={0.05} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-cyan-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {deleteStep && (
        <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 border border-white/10">
            {/* HEADER */}
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
              {deleteStep === 'select' ? t('settings.what_do_you_want') : t('settings.confirm_security')}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {deleteStep === 'select' 
                ? t('settings.action_cannot_undo') 
                : t('settings.enter_password_confirm')}
            </p>

            {/* BƯỚC 1: CHỌN TÙY CHỌN */}
            {deleteStep === 'select' && (
              <div className="space-y-3">
                <button
                  onClick={() => { setSelectedOption('data-only'); setDeleteStep('confirm'); }}
                  className="w-full p-4 text-left border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 transition-all group"
                >
                  <div className="font-semibold text-slate-900 dark:text-white group-hover:text-orange-600"><Trash2 size={16} className="inline mr-1.5" />{t('settings.delete_data_only')}</div>
                  <div className="text-xs text-slate-500 mt-1">{t('settings.delete_data_desc')}</div>
                </button>

                <button
                  onClick={() => { setSelectedOption('account-full'); setDeleteStep('confirm'); }}
                  className="w-full p-4 text-left border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all group"
                >
                  <div className="font-semibold text-red-600 dark:text-red-400"><Skull size={16} className="inline mr-1.5" />{t('settings.delete_account_permanent')}</div>
                  <div className="text-xs text-red-500/80 mt-1">{t('settings.delete_account_desc')}</div>
                </button>

                <button 
                  onClick={() => setDeleteStep(null)}
                  className="w-full py-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                >
                  {t('settings.cancel_action')}
                </button>
              </div>
            )}

            {/* BƯỚC 2: NHẬP MẬT KHẨU */}
            {deleteStep === 'confirm' && (
              <div className="space-y-4">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-xs text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle size={16} className="inline mr-1 text-amber-500" /> {t('settings.warning_delete')} <b>{selectedOption === 'account-full' ? t('settings.delete_account_permanent') : t('settings.delete_data_only')}</b>.
                </div>

                <input
                  type="password"
                  placeholder={t('common.password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                  autoFocus
                />

                {deleteError && (
                  <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">{deleteError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setDeleteStep('select'); setPassword(''); }}
                    disabled={isDeleting}
                    className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    {t('settings.back')}
                  </button>
                  <button
                    onClick={async () => {
                      const result = await performDelete(password, selectedOption);
                      if (result.success) {
                        setDeleteStep(null);
                        window.location.href = '/';
                        toast.success(t('settings.deleted'));
                      }
                    }}
                    disabled={isDeleting || !password}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-red-500/30 transition-all"
                  >
                    {isDeleting ? t('settings.processing') : t('settings.confirm_delete')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
