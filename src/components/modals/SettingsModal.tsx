import React, { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Activity, Droplets, Heart, Bell, BellRing,
  MoonStar, Send, Smartphone, Ruler, CloudUpload, Fingerprint,
  FileText, LogOut, Trash2, ChevronLeft, ChevronRight, X, Loader2, Sparkles,
  Crown, ExternalLink, CloudSun, Skull, AlertTriangle, Key, Code, Copy, Check,
  Globe, Clock, DollarSign, Gauge, Cpu, Trophy
} from 'lucide-react';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { useSettings } from '../../hooks/useSettings';
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
import { usePremiumStatus } from '@/hooks/useIsPremium';
import { supabase } from '@/lib/supabase';
import { WidgetPlugin } from '@/lib/widgetService';
import { getSlowQueries } from '@/lib/supabase';
import { initWebVitals, getWebVitals, getMetricStatus } from '@/lib/webVitals';
import { getDailyAIUsage, calculateEstimatedCosts, getCostDisclaimer } from '@/lib/aiUsageQueries';

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

interface PublicApiKey {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
  last_used_at: string | null;
}

interface WebhookSubscription {
  id: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  subscription_id?: string;
  event_type: string;
  payload?: Record<string, unknown>;
  response_status: number | null;
  response_body?: string | null;
  error_message: string | null;
  delivered_at: string;
}

export default function SettingsModal() {
  const { t } = useTranslation();
  const isOpen = useUIStore(s => s.showProfileSettings);
  const onClose = () => useUIStore.getState().setShowProfileSettings(false);
  const profile = useAppStore(s => s.profile);
  const setProfile = (newProfile: typeof profile) => useAppStore.getState().setAppState({ profile: newProfile });
  const handleLogout = useAppStore(s => s.actions.handleLogout);

  const { settings, updateSettings, isSaving, lastSync, triggerHaptic } = useSettings(profile);
  const [activeSheet, setActiveSheet] = useState<'none' | 'personal' | 'quiet' | 'privacy' | 'delete' | 'name' | 'widget' | 'wellness' | 'developer'>('none');
  const [widgetSize, setWidgetSize] = useState<'small' | 'medium'>('small');
  const [showAdmin, setShowAdmin] = useState(false);
  
  // ================= ĐÃ ĐỒNG BỘ TOÀN BỘ BIẾN VÀO ĐÂY =================
  // FIX: Khởi tạo state với giá trị mặc định hợp lệ (chuẩn tiếng Anh)
  const [formData, setFormData] = useState({
    nickname: '', gender: 'Nam', age: 25, height: 170, weight: 60, activity: 'moderate', climate: 'temperate', goal: 'Sức khỏe tổng quát'
  });

  const [draftQuiet, setDraftQuiet] = useState({ start: '22:00', end: '07:00' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ================= DEVELOPER PORTAL STATES & METHODS =================
  const [apiKeys, setApiKeys] = useState<PublicApiKey[]>([]);
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['*']);
  const [isLoadingDevData, setIsLoadingDevData] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Sprint 1: Web Vitals and AI Cost states
  const [webVitals, setWebVitals] = useState<ReturnType<typeof getWebVitals>>({
    fcp: null,
    lcp: null,
    cls: null,
    fid: null,
    ttfb: null
  });
  const [slowQueries, setSlowQueries] = useState<ReturnType<typeof getSlowQueries>>([]);
  const [aiCostData, setAiCostData] = useState<ReturnType<typeof calculateEstimatedCosts> | null>(null);
  const [isLoadingAiCost, setIsLoadingAiCost] = useState(false);

  const loadDeveloperData = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoadingDevData(true);
    try {
      // 1. Fetch API Keys
      const { data: keys } = await supabase
        .from('public_api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      setApiKeys(keys || []);

      // 2. Fetch Webhook Subscriptions
      const { data: subs } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      setSubscriptions(subs || []);

      // 3. Fetch Webhook Deliveries
      const { data: dels } = await supabase
        .from('webhook_deliveries')
        .select(`
          id,
          event_type,
          response_status,
          error_message,
          delivered_at
        `)
        .order('delivered_at', { ascending: false })
        .limit(10);
      setDeliveries(dels || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu nhà phát triển:', err);
    } finally {
      setIsLoadingDevData(false);
    }
  }, [profile?.id]);

  React.useEffect(() => {
    if (activeSheet === 'developer') {
      loadDeveloperData();
      // Sprint 1: Load Web Vitals and slow queries
      initWebVitals();
      setWebVitals(getWebVitals());
      setSlowQueries(getSlowQueries());
      
      // Sprint 1: Load AI cost data
      if (profile?.id) {
        setIsLoadingAiCost(true);
        getDailyAIUsage(profile.id, 30).then(usage => {
          const costs = calculateEstimatedCosts(usage);
          setAiCostData(costs);
          setIsLoadingAiCost(false);
        }).catch(err => {
          console.error('Error loading AI cost data:', err);
          setIsLoadingAiCost(false);
        });
      }
    }
  }, [activeSheet, loadDeveloperData, profile?.id]);

  const handleCreateApiKey = async () => {
    triggerHaptic();
    if (!newKeyName.trim()) {
      toast.error(t('settings.api_key_name_required'));
      return;
    }
    const toastId = toast.loading(t('settings.creating_api_key'));
    try {
      const { data: newKey, error } = await supabase.rpc('create_api_key', {
        p_name: newKeyName.trim()
      });

      if (error) throw error;
      
      setGeneratedKey(newKey);
      setNewKeyName('');
      toast.success(t('settings.api_key_created'), { id: toastId });
      loadDeveloperData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('settings.api_key_create_failed'), { id: toastId });
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    triggerHaptic();
    const { confirmDialog } = await import('@/store/useConfirmDialog');
    const ok = await confirmDialog({
      title: 'Thu hồi Khóa API',
      message: 'Bạn chắc chắn muốn thu hồi khóa API này? Tất cả các thiết bị đang sử dụng khóa này sẽ mất quyền truy cập ngay lập tức.',
      confirmLabel: 'Thu hồi',
      variant: 'danger'
    });
    
    if (!ok) return;
    
    const toastId = toast.loading(t('settings.revoking'));
    try {
      const { error } = await supabase
        .from('public_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;
      
      toast.success(t('settings.api_key_revoked'), { id: toastId });
      setGeneratedKey(null);
      loadDeveloperData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('settings.api_key_revoke_failed'), { id: toastId });
    }
  };

  const handleCreateSubscription = async () => {
    triggerHaptic();
    if (!newWebhookUrl.trim()) {
      toast.error(t('settings.webhook_url_required'));
      return;
    }
    
    try {
      new URL(newWebhookUrl);
    } catch {
      toast.error(t('settings.webhook_invalid_url'));
      return;
    }

    const toastId = toast.loading(t('settings.registering_webhook'));
    try {
      const { error } = await supabase
        .from('webhook_subscriptions')
        .insert({
          user_id: profile?.id,
          url: newWebhookUrl.trim(),
          events: webhookEvents,
          is_active: true
        });

      if (error) throw error;

      setNewWebhookUrl('');
      setWebhookEvents(['*']);
      toast.success(t('settings.webhook_registered'), { id: toastId });
      loadDeveloperData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('settings.webhook_register_failed'), { id: toastId });
    }
  };

  const handleDeleteSubscription = async (subId: string) => {
    triggerHaptic();
    const { confirmDialog } = await import('@/store/useConfirmDialog');
    const ok = await confirmDialog({
      title: 'Xóa đăng ký Webhook',
      message: 'Bạn chắc chắn muốn xóa webhook này? DigiWell sẽ dừng gửi dữ liệu sự kiện đến URL này.',
      confirmLabel: 'Xóa',
      variant: 'danger'
    });

    if (!ok) return;

    const toastId = toast.loading(t('settings.deleting'));
    try {
      const { error } = await supabase
        .from('webhook_subscriptions')
        .delete()
        .eq('id', subId);

      if (error) throw error;

      toast.success(t('settings.webhook_deleted'), { id: toastId });
      loadDeveloperData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('settings.webhook_delete_failed'), { id: toastId });
    }
  };

  const handleCopy = (text: string, id: string) => {
    triggerHaptic();
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    toast.success(t('settings.copied'));
    setTimeout(() => setCopiedKeyId(null), 2000);
  };


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
      if (!croppedBlob) throw new Error('Không thể cắt ảnh');
      
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

  const formatVol = (ml: number) => settings.unit === 'oz' ? `${(ml * 0.033814).toFixed(1)} oz` : `${ml} ml`;

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
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex-1">Cài đặt</h1>
            {isSaving && <Loader2 size={18} className="text-cyan-400 animate-spin mr-2" />}
          </div>

          <div className="p-4 space-y-8 pb-20">
            {/* SECTION A: PROFILE & BIOMETRICS */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-4">Hồ sơ & Sinh trắc</h3>
              <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden mb-6 shadow-sm">
                
                <button onClick={() => { triggerHaptic(); fileInputRef.current?.click(); }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 active:bg-slate-200 dark:active:bg-white/10 transition-colors border-b border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 overflow-hidden shadow-inner">
                      {profile?.avatar_url || settings.avatarUrl ? (
                        <img src={profile?.avatar_url || settings.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={18} />
                      )}
                    </div>
                    <span className="text-slate-800 dark:text-white font-medium">Đổi ảnh đại diện</span>
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
                    <span className="text-white font-medium">Thông tin cá nhân</span>
                  </div>
                  <ChevronRight size={18} className="text-white/40" />
                </button>



                {/* NÚT BẬT TẮT SINH TRẮC HỌC / FACE ID */}
                <button disabled={isRegistering} onClick={handleToggleBiometric} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5 disabled:opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center"><Fingerprint size={18} /></div>
                    <div className="text-left">
                      <span className="text-white font-medium block">Đăng nhập Sinh trắc học</span>
                      <span className="text-[10px] text-slate-500">Face ID / Touch ID</span>
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
                    <span className="text-white font-medium">Đồng bộ Apple/Google Health</span>
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
                      const toastId = toast.loading(nextOptIn ? 'Đang bật chia sẻ xếp hạng...' : 'Đang tắt chia sẻ xếp hạng...');
                      try {
                        const { error } = await supabase
                          .from('profiles')
                          .update({ leaderboard_opt_in: nextOptIn })
                          .eq('id', profile?.id);
                        if (error) throw error;
                        
                        if (profile) {
                          setProfile({ ...profile, leaderboard_opt_in: nextOptIn });
                        }
                        toast.success(nextOptIn ? 'Đã bật chia sẻ xếp hạng' : 'Đã tắt chia sẻ xếp hạng', { id: toastId });
                      } catch {
                        toast.error('Không thể cập nhật cấu hình xếp hạng', { id: toastId });
                      }
                    }} 
                    className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center"><Trophy size={18} /></div>
                      <div className="text-left">
                        <span className="text-white font-medium block">Chia sẻ xếp hạng (Leaderboard)</span>
                        <span className="text-[10px] text-slate-500">Hiển thị tiến trình trên Bảng xếp hạng</span>
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
                       <span className="text-white font-medium block">Sức khỏe tổng hợp</span>
                       <span className="text-[10px] text-slate-500">Sleep, Mood, Activity insights</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 text-white/40">
                     <span className="text-xs font-bold uppercase tracking-wider text-emerald-400/70">
                       {settings.syncWellnessData ? 'Đã bật' : 'Thiết lập'}
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
                         <p className="font-bold text-sm">Cập nhật theo thời tiết</p>
                         <p className="text-xs opacity-80">{isWeatherSyncing ? 'Đang đồng bộ...' : 'Điều chỉnh mục tiêu nước tự động'}</p>
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
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-4">Thông báo</h3>
              <div className="bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden mb-6 shadow-sm">
                <button onClick={() => { triggerHaptic(); updateSettings({ smartReminders: !settings.smartReminders }); }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center"><Bell size={18} /></div>
                    <span className="text-white font-medium">Nhắc nhở thông minh</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.smartReminders ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.smartReminders ? 'translate-x-4' : ''}`} />
                  </div>
                </button>

                <button 
                  disabled={isPushRegistering} 
                  onClick={async () => {
                    triggerHaptic();
                    if (isSubscribed) {
                      await unsubscribe();
                      toast.success('Đã tắt thông báo đẩy.');
                    } else {
                      const ok = await subscribe();
                      if (ok) {
                        toast.success('Đã bật thông báo đẩy thành công!');
                      } else {
                        toast.error('Không thể kích hoạt thông báo đẩy. Vui lòng cấp quyền thông báo.');
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
                      <span className="text-white font-medium block">Thông báo đẩy thiết bị</span>
                      <span className="text-[10px] text-slate-400 block">Nhận nhắc nhở uống nước tức thì</span>
                    </div>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isSubscribed ? 'bg-cyan-500' : 'bg-slate-700'} shrink-0`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isSubscribed ? 'translate-x-4' : ''}`} />
                  </div>
                </button>


                <button disabled={!settings.smartReminders} onClick={() => { triggerHaptic(); setDraftQuiet({ start: settings.quietHoursStart, end: settings.quietHoursEnd }); setActiveSheet('quiet'); }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5 disabled:opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center"><MoonStar size={18} /></div>
                    <span className="text-white font-medium">Giờ yên tĩnh</span>
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
                    <span className="text-white font-medium">Gửi thông báo thử</span>
                  </div>
                  <span className="text-sm font-semibold text-cyan-400">{isSendingTest ? 'Đang gửi' : 'Thử ngay'}</span>
                </button>
              </div>
            </section>

            {/* SECTION C: PREFERENCES & UI */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-4">Giao diện & Tiện ích</h3>
              <div className="bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden mb-6 shadow-sm">
                <button onClick={() => { triggerHaptic(); updateSettings({ hapticsEnabled: !settings.hapticsEnabled }); }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center"><Smartphone size={18} /></div>
                    <span className="text-white font-medium">Rung phản hồi (Haptics)</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.hapticsEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.hapticsEnabled ? 'translate-x-4' : ''}`} />
                  </div>
                </button>



                <div className="w-full flex items-center justify-between p-4 bg-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center"><Ruler size={18} /></div>
                    <span className="text-white font-medium">Đơn vị đo</span>
                  </div>
                  <div className="flex bg-slate-800 rounded-lg p-1">
                    <button onClick={() => { triggerHaptic(); updateSettings({ unit: 'ml' }); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${settings.unit === 'ml' ? 'bg-white/10 text-white' : 'text-white/40'}`}>ml</button>
                    <button onClick={() => { triggerHaptic(); updateSettings({ unit: 'oz' }); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${settings.unit === 'oz' ? 'bg-white/10 text-white' : 'text-white/40'}`}>oz</button>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION D: PREMIUM SUBSCRIPTION */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2 ml-4">Gói thành viên</h3>
              <div className="bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden mb-6 shadow-sm">
                <div className="w-full flex items-center justify-between p-4 bg-transparent border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${premiumStatus !== 'none' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>
                      <Crown size={18} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-white font-medium">
                        {premiumStatus === 'active' ? 'DigiWell PRO' :
                         premiumStatus === 'grace' ? 'DigiWell PRO (Ân hạn)' :
                         premiumStatus === 'expired' ? 'PRO đã hết hạn' :
                         'DigiWell Miễn phí'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {premiumStatus === 'active' && profile?.subscription_end
                          ? `Đến ${new Date(profile.subscription_end).toLocaleDateString('vi-VN')}`
                          : premiumStatus === 'grace'
                          ? `Ân hạn đến ${profile?.grace_period_end ? new Date(profile.grace_period_end).toLocaleDateString('vi-VN') : ''}`
                          : premiumStatus === 'expired'
                          ? 'Gia hạn để tiếp tục dùng PRO'
                          : 'Nâng cấp để mở khóa toàn bộ tính năng'}
                      </span>
                    </div>
                  </div>
                  {premiumStatus !== 'none' ? (
                    <button onClick={openStripePortal} className="flex items-center gap-1 text-sm font-semibold text-amber-400 p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <ExternalLink size={14} />
                      Quản lý
                    </button>
                  ) : (
                    <button onClick={() => useUIStore.getState().setShowPremiumModal(true)} className="text-sm font-semibold text-cyan-400 p-2 hover:bg-white/5 rounded-lg transition-colors">
                      Nâng cấp
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION E: ACCOUNT & LEGAL */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-4">Tài khoản & Pháp lý</h3>
              <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden mb-6 shadow-sm">
                <div className="w-full flex items-center justify-between p-4 bg-transparent border-b border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center"><CloudUpload size={18} /></div>
                    <div className="flex flex-col text-left">
                      <span className="text-slate-800 dark:text-white font-medium">Đồng bộ Cloud</span>
                      <span className="text-xs text-slate-500 dark:text-white/40">{lastSync ? `Đã đồng bộ ${lastSync.toLocaleTimeString()}` : 'Chưa đồng bộ'}</span>
                    </div>
                  </div>
                  <button onClick={() => { triggerHaptic(); updateSettings({}); }} className="text-sm font-semibold text-cyan-500 dark:text-cyan-400 p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">Đồng bộ ngay</button>
                </div>

                <div className="w-full flex items-center justify-between p-4 bg-transparent border-b border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center"><Calendar size={18} /></div>
                    <div className="flex flex-col text-left">
                      <span className="text-slate-800 dark:text-white font-medium">Chia sẻ trạng thái lịch</span>
                      <span className="text-xs text-slate-500 dark:text-white/40">Cho phép AI phân tích lịch trình</span>
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
                    <span className="text-slate-800 dark:text-white font-medium">Danh sách chờ DigiBottle</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 dark:text-white/40" />
                </button>

                <button onClick={() => { triggerHaptic(); setActiveSheet('privacy'); }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 active:bg-slate-200 dark:active:bg-white/10 transition-colors border-b border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-500/20 text-slate-400 flex items-center justify-center"><FileText size={18} /></div>
                    <span className="text-slate-800 dark:text-white font-medium">Điều khoản & Bảo mật</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 dark:text-white/40" />
                </button>

                <button onClick={async () => { triggerHaptic(); const { confirmDialog } = await import('@/store/useConfirmDialog'); const ok = await confirmDialog({ title: 'Đăng xuất', message: 'Bạn chắc chắn muốn đăng xuất?', confirmLabel: 'Đăng xuất', variant: 'danger' }); if (ok) handleLogout(); }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 active:bg-slate-200 dark:active:bg-white/10 transition-colors border-b border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center"><LogOut size={18} /></div>
                    <span className="text-yellow-400 font-bold">Đăng xuất</span>
                  </div>
                </button>

                <button onClick={() => { triggerHaptic(); setPassword(''); setDeleteStep('select'); }} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 active:bg-red-100 dark:active:bg-red-500/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center"><Trash2 size={18} /></div>
                    <span className="text-red-500 font-bold">Xóa tài khoản</span>
                  </div>
                </button>
              </div>
            </section>

            {/* SECTION F: DEVELOPER PORTAL */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-4">Dành cho Nhà phát triển</h3>
              <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden mb-6 shadow-sm">
                <button 
                  onClick={() => { 
                    triggerHaptic(); 
                    setActiveSheet('developer'); 
                  }} 
                  className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 active:bg-slate-200 dark:active:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Code size={18} />
                    </div>
                    <div className="text-left">
                      <span className="text-slate-800 dark:text-white font-medium block">Cổng nhà phát triển (API & Webhooks)</span>
                      <span className="text-[10px] text-slate-500">Tích hợp thiết bị thông minh & Webhook</span>
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
          <BottomSheetWrapper key="section-name" title="Đổi tên hiển thị" onClose={closeSheet}>
            <input type="text" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-lg font-semibold outline-none focus:border-cyan-500 transition-colors mb-6" placeholder="Nhập tên mới..." />
            <button onClick={handleSaveProfile} className="w-full py-3 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors">Lưu thay đổi</button>
          </BottomSheetWrapper>
        )}

        {/* BOTTOM SHEET CÁ NHÂN ĐÃ ĐƯỢC FIX LẠI BIẾN */}
        {activeSheet === 'personal' && (
          <BottomSheetWrapper key="section-personal" title="Thông tin cá nhân" onClose={closeSheet}>
            <div className="flex items-center gap-4 mb-6 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-2xl border border-slate-300 dark:border-white/5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
                {profile?.avatar_url || settings.avatarUrl ? (
                  <img src={profile?.avatar_url || settings.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-white dark:text-white">{(profile?.nickname || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <input type="text" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} className="w-full bg-transparent text-slate-900 dark:text-white font-bold text-lg border-b border-slate-300 dark:border-white/20 focus:border-cyan-500 dark:focus:border-cyan-400 outline-none pb-1" placeholder="Tên hiển thị..." />
                <p className="text-cyan-600 dark:text-cyan-400 text-sm font-semibold mt-1">Mục tiêu: {formatVol(settings.waterGoal)}/ngày</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">Tuổi</label>
                  <input type="number" value={formData.age || ''} onChange={e => setFormData({...formData, age: Number(e.target.value)})} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-lg font-semibold outline-none focus:border-cyan-500" />
                  {(formData.age < 5 || formData.age > 120) && <p className="text-red-400 text-xs mt-1">Lỗi: 5-120t</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">Chiều cao (cm)</label>
                  <input type="number" value={formData.height || ''} onChange={e => setFormData({...formData, height: Number(e.target.value)})} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-lg font-semibold outline-none focus:border-cyan-500" />
                  {(formData.height < 50 || formData.height > 250) && <p className="text-red-400 text-xs mt-1">Lỗi: 50-250cm</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">Giới tính</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:border-cyan-500 appearance-none">
                    <option className="bg-white dark:bg-slate-900" value="Nam">Nam</option>
                    <option className="bg-white dark:bg-slate-900" value="Nữ">Nữ</option>
                    <option className="bg-white dark:bg-slate-900" value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">Cân nặng (kg)</label>
                  <input type="number" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-lg font-semibold outline-none focus:border-cyan-500" />
                  {(formData.weight < 20 || formData.weight > 300) && <p className="text-red-400 text-xs mt-1">Lỗi: 20-300kg</p>}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">Mức độ vận động</label>
                <select value={formData.activity} onChange={e => setFormData({...formData, activity: e.target.value})} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:border-cyan-500 appearance-none">
                  <option className="bg-white dark:bg-slate-900" value="sedentary">Ít vận động (Văn phòng)</option>
                  <option className="bg-white dark:bg-slate-900" value="light">Vận động nhẹ (Đi bộ)</option>
                  <option className="bg-white dark:bg-slate-900" value="moderate">Vận động vừa (3-5 buổi/tuần)</option>
                  <option className="bg-white dark:bg-slate-900" value="high">Vận động cao (Hàng ngày)</option>
                  <option className="bg-white dark:bg-slate-900" value="athlete">Vận động viên</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">Khí hậu</label>
                <select value={formData.climate} onChange={e => setFormData({...formData, climate: e.target.value})} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:border-cyan-500 appearance-none">
                  <option className="bg-white dark:bg-slate-900" value="temperate">Mát mẻ (20-26°C)</option>
                  <option className="bg-white dark:bg-slate-900" value="warm">Nóng ấm (26-32°C)</option>
                  <option className="bg-white dark:bg-slate-900" value="hot">Rất nóng (32-38°C)</option>
                  <option className="bg-white dark:bg-slate-900" value="tropical">Nhiệt đới ẩm</option>
                  <option className="bg-white dark:bg-slate-900" value="cold">Lạnh (&lt; 20°C)</option>
                </select>
              </div>
            </div>
            {/* Đã chuyển hàm Save để đồng bộ luôn lên DB */}
            <button onClick={handleSaveProfile} className="w-full py-3 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors">Lưu Thay Đổi</button>
          </BottomSheetWrapper>
        )}


        {activeSheet === 'quiet' && (
          <BottomSheetWrapper key="section-quiet" title="Giờ yên tĩnh" onClose={closeSheet}>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">Bắt đầu</label>
                <input type="time" value={draftQuiet.start} onChange={e => setDraftQuiet(p => ({...p, start: e.target.value}))} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-lg font-semibold outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-white/50 mb-2 block uppercase tracking-widest">Kết thúc</label>
                <input type="time" value={draftQuiet.end} onChange={e => setDraftQuiet(p => ({...p, end: e.target.value}))} className="w-full p-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-lg font-semibold outline-none focus:border-purple-500" />
              </div>
            </div>
            <button onClick={() => { triggerHaptic(); updateSettings({ quietHoursStart: draftQuiet.start, quietHoursEnd: draftQuiet.end }); closeSheet(); }} className="w-full py-3 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors">Lưu cài đặt</button>
          </BottomSheetWrapper>
        )}

        {activeSheet === 'privacy' && (
          <BottomSheetWrapper key="section-privacy" title="Điều khoản & Bảo mật" onClose={closeSheet}>
            <div className="text-slate-400 text-sm leading-relaxed space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <h4 className="text-white font-bold text-sm mb-2">1. Dữ liệu chúng tôi thu thập</h4>
                <ul className="space-y-1.5 pl-4 text-xs list-disc marker:text-cyan-500/50">
                  <li><strong className="text-white/80">Thông tin hồ sơ:</strong> biệt danh, tuổi, chiều cao, cân nặng, giới tính, mức vận động — để cá nhân hóa mục tiêu nước.</li>
                  <li><strong className="text-white/80">Nhật ký nước:</strong> lượng nước uống, thời gian, loại đồ uống — để theo dõi tiến độ.</li>
                  <li><strong className="text-white/80">Dữ liệu sức khỏe tùy chọn:</strong> nhịp tim, số bước (khi kết nối đồng hồ) — để phân tích tương quan.</li>
                  <li><strong className="text-white/80">Nội dung xã hội:</strong> bài viết, bình luận, tin nhắn bang hội — bạn chủ động đăng.</li>
                  <li><strong className="text-white/80">Dữ liệu thanh toán:</strong> lịch sử giao dịch Premium (qua Stripe) — không lưu thông tin thẻ.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-2">2. Cách chúng tôi sử dụng dữ liệu</h4>
                <ul className="space-y-1.5 pl-4 text-xs list-disc marker:text-cyan-500/50">
                  <li>Tính toán mục tiêu nước cá nhân hóa và đưa ra khuyến nghị theo thời gian thực.</li>
                  <li>Phân tích AI (qua Groq Cloud) để tạo báo cáo tuần và lời khuyên — dữ liệu được ẩn danh hóa.</li>
                  <li>Hiển thị bảng xếp hạng và tính năng xã hội (league, club, feed).</li>
                  <li>Cải thiện sản phẩm dựa trên phân tích tổng hợp, không nhận dạng cá nhân.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-2">3. Chia sẻ dữ liệu</h4>
                <p className="text-xs">Chúng tôi <strong className="text-emerald-400">không bao giờ</strong> bán dữ liệu sức khỏe của bạn. Dữ liệu được chia sẻ với các bên xử lý sau:</p>
                <ul className="space-y-1.5 pl-4 mt-1.5 text-xs list-disc marker:text-cyan-500/50">
                  <li><strong className="text-white/80">Supabase</strong> (cơ sở dữ liệu) — lưu trữ mã hóa, tuân thủ SOC 2.</li>
                  <li><strong className="text-white/80">Stripe</strong> (thanh toán) — chỉ xử lý giao dịch, không nhận dữ liệu sức khỏe.</li>
                  <li><strong className="text-white/80">Groq Cloud</strong> (AI) — phản hồi tạm thời, không huấn luyện mô hình từ dữ liệu của bạn.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-2">4. Quyền của bạn</h4>
                <ul className="space-y-1.5 pl-4 text-xs list-disc marker:text-cyan-500/50">
                  <li><strong className="text-white/80">Xuất dữ liệu:</strong> bạn có thể tải toàn bộ dữ liệu cá nhân ở định dạng JSON từ mục Phân tích → Xuất.</li>
                  <li><strong className="text-white/80">Xóa dữ liệu:</strong> bạn có thể xóa toàn bộ dữ liệu hoặc xóa vĩnh viễn tài khoản trong Cài đặt → Tài khoản & Pháp lý.</li>
                  <li><strong className="text-white/80">Chỉnh sửa:</strong> bạn có thể cập nhật thông tin hồ sơ bất kỳ lúc nào.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-2">5. Liên hệ</h4>
                <p className="text-xs">Mọi thắc mắc về quyền riêng tư, vui lòng gửi email đến <span className="text-cyan-400">privacy@digiwell.app</span>.</p>
                <p className="text-[10px] text-slate-500 mt-1">Cập nhật lần cuối: 20/05/2026</p>
              </div>
            </div>
            <button onClick={closeSheet} className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors">Đã hiểu</button>
          </BottomSheetWrapper>
        )}

        {activeSheet === 'widget' && (
          <BottomSheetWrapper key="section-widget" title="Widget Màn hình chính" onClose={closeSheet}>
            <div className="space-y-4 mb-6">
              {/* Size + Theme selector */}
              <div className="flex items-center justify-between">
                <p className="text-white font-bold text-sm">Kích thước</p>
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
                    <p className="text-[10px] font-bold" style={{ color: settings.themeColor }}>Hôm nay</p>
                    <p className="text-xl font-black text-white leading-none">{(profile?.water_today || 0)}</p>
                    <p className="text-[8px] text-slate-400">/ {settings.waterGoal || 2000} ml</p>
                  </div>
                  <Droplets size={widgetSize === 'small' ? 16 : 20} style={{ color: settings.themeColor }} />
                </div>
                
                {widgetSize === 'medium' && (
                  <p className="text-[9px] text-slate-500 mt-1 relative z-10">
                    {Math.min(((profile?.water_today || 0) / (settings.waterGoal || 2000)) * 100, 100).toFixed(0)}% mục tiêu
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
                <p className="text-white/60 text-xs mb-2">Màu sắc</p>
                <div className="flex gap-2 flex-wrap">
                  {['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6', '#84cc16'].map(color => (
                    <button key={color} onClick={() => { triggerHaptic(); updateSettings({ themeColor: color }); }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${settings.themeColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <h4 className="text-cyan-400 font-bold text-sm mb-2 flex items-center gap-2"><Smartphone size={16} /> Hướng dẫn thêm Widget</h4>
                <ul className="text-slate-300 text-xs space-y-2 list-decimal pl-4">
                  <li>Thoát ra màn hình chính điện thoại (Home Screen)</li>
                  <li>Nhấn giữ vào vùng trống bất kỳ trên màn hình</li>
                  <li>Chọn <strong>Thêm Widget (Dấu +)</strong> ở góc trái</li>
                  <li>Tìm <strong>DigiWell</strong> và chọn kích thước bạn thích</li>
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
                 Đồng bộ ngay ra Widget
               </button>
             </div>
           </BottomSheetWrapper>
         )}

         {/* WELLNESS SETTINGS BOTTOM SHEET */}
         {activeSheet === 'wellness' && (
           <BottomSheetWrapper key="section-wellness" title="Sức khỏe tổng hợp" onClose={closeSheet}>
             <div className="space-y-6">
               {/* Sleep Section */}
               <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                     <MoonStar size={20} />
                   </div>
                   <div>
                     <h4 className="text-slate-900 dark:text-white font-bold">Giấc ngủ</h4>
                     <p className="text-xs text-slate-500">Mục tiêu giấc ngủ hàng đêm</p>
                   </div>
                 </div>

                 <div className="space-y-4">
                   <div>
                     <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-2">
                       Mục tiêu giấc ngủ: {settings.sleepHours} giờ
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
                       Chất lượng giấc ngủ: {settings.sleepQuality}/10
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
                       <span>Rất kém</span>
                       <span>Tốt</span>
                       <span>Xuất sắc</span>
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
                     <h4 className="text-slate-900 dark:text-white font-bold">Theo dõi tâm trạng</h4>
                     <p className="text-xs text-slate-500">Cải thiện nhận thức về cảm xúc</p>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                         😊
                       </div>
                       <div>
                         <p className="text-slate-900 dark:text-white font-medium text-sm">Kiểm tra tâm trạng hàng ngày</p>
                         <p className="text-xs text-slate-500">Đánh giá tâm trạng mỗi buổi tối</p>
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
                         <p className="text-slate-900 dark:text-white font-medium text-sm">Theo dõi mức năng lượng</p>
                         <p className="text-xs text-slate-500">Ghi nhận năng lượng hàng ngày (1-10)</p>
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
                       <h4 className="text-slate-900 dark:text-white font-bold">Đồng bộ dữ liệu sức khỏe</h4>
                       <p className="text-xs text-slate-500">Kết nối Apple Health / Google Fit</p>
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
                   Kết nối để tự động lấy dữ liệu giấc ngủ, bước chân và nhịp tim. Dữ liệu được xử lý cục bộ và không được chia sẻ.
                 </p>
               </div>

               {/* Info Card */}
               <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl">

                 <p className="text-xs text-emerald-300 leading-relaxed">
                   <strong>Wellness Score</strong> sẽ kết hợp Hydration + Sleep + Activity + Mood để tạo điểm số sức khỏe tổng hợp. Xem biểu đồ chi tiết ở tab Huấn luyện thông minh.
                 </p>
               </div>
             </div>
           </BottomSheetWrapper>
         )}

         {activeSheet === 'developer' && (
           <BottomSheetWrapper key="section-developer" title="Cài đặt Nhà phát triển" onClose={closeSheet}>
             <div className="space-y-8 text-slate-800 dark:text-white">
               
               {/* 1. API Documentation Link */}
               <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl flex items-center justify-between">
                 <div>
                   <h4 className="font-semibold text-sm">Tài liệu API công khai</h4>
                   <p className="text-xs text-slate-500 dark:text-white/40">Xem đặc tả OpenAPI của các cổng kết nối dữ liệu</p>
                 </div>
                 <button 
                   onClick={() => {
                     triggerHaptic();
                     const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
                     window.open(`${supabaseUrl}/functions/v1/v1/openapi.json`, '_blank');
                   }}
                   className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold transition-colors"
                 >
                   <span>Mở Spec</span>
                   <ExternalLink size={12} />
                 </button>
               </div>

               {/* 2. Public API Keys Section */}
               <div className="space-y-4">
                 <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
                   <Key className="text-cyan-500" size={18} />
                   <h3 className="font-bold text-sm uppercase tracking-wider">Khóa API công khai</h3>
                 </div>

                 {/* Generated API key display (Once) */}
                 {generatedKey && (
                   <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2 relative overflow-hidden">
                     <div className="absolute top-0 right-0 bg-emerald-505 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl-lg">
                       Mới tạo
                     </div>
                     <span className="text-xs text-emerald-400 font-bold block">Hãy sao chép khóa API bên dưới:</span>
                     <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-300 dark:border-white/5 select-all font-mono text-xs overflow-x-auto">
                       <span className="flex-1 break-all select-all">{generatedKey}</span>
                       <button 
                         onClick={() => handleCopy(generatedKey, 'gen-key')} 
                         className="p-1.5 rounded-md hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-white/80 active:scale-95 transition-all flex-shrink-0"
                         title="Sao chép khóa API"
                       >
                         {copiedKeyId === 'gen-key' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                       </button>
                     </div>
                     <p className="text-[10px] text-yellow-400/80 leading-relaxed">
                       ⚠️ <strong>Lưu ý quan trọng:</strong> Vì lý do bảo mật, khóa này sẽ chỉ được hiển thị một lần duy nhất. Hãy chắc chắn sao lưu nó trước khi đóng bảng cài đặt này.
                     </p>
                   </div>
                 )}

                 {/* Create API Key Form */}
                 <div className="flex gap-2">
                   <input 
                     type="text" 
                     value={newKeyName} 
                     onChange={e => setNewKeyName(e.target.value)} 
                     className="flex-1 p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-sm outline-none focus:border-cyan-500 transition-colors bg-white dark:bg-slate-800" 
                     placeholder="Tên khóa API, ví dụ: Smart Bottle..." 
                   />
                   <button 
                     onClick={handleCreateApiKey} 
                     className="px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-sm transition-colors flex-shrink-0"
                   >
                     Tạo Khóa
                   </button>
                 </div>

                 {/* Existing API Keys List */}
                 <div className="space-y-2">
                   {isLoadingDevData ? (
                     <div className="flex justify-center p-4"><Loader2 className="animate-spin text-cyan-400" size={20} /></div>
                   ) : apiKeys.length === 0 ? (
                     <p className="text-center text-xs text-slate-500 dark:text-white/30 py-4">Chưa có khóa API nào được tạo.</p>
                   ) : (
                     apiKeys.map(key => (
                       <div key={key.id} className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-between gap-4">
                         <div className="min-w-0">
                           <span className="font-semibold text-sm block truncate">{key.name}</span>
                           <span className="text-[10px] text-slate-500 block">Tạo: {new Date(key.created_at).toLocaleDateString()}</span>
                           <span className="text-[10px] text-slate-500 block">Sử dụng cuối: {key.last_used_at ? new Date(key.last_used_at).toLocaleTimeString() : 'Chưa dùng'}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="font-mono text-[10px] text-slate-400 dark:text-white/30 bg-slate-200 dark:bg-slate-900 px-2 py-1 rounded">
                             {key.api_key.substring(0, 12)}...
                           </div>
                           <button 
                             onClick={() => handleDeleteApiKey(key.id)} 
                             className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 active:scale-95 transition-all"
                             title="Thu hồi khóa"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               </div>

               {/* 3. Webhook Subscriptions Section */}
               <div className="space-y-4">
                 <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
                   <Globe className="text-cyan-500" size={18} />
                   <h3 className="font-bold text-sm uppercase tracking-wider">Đăng ký Webhooks</h3>
                 </div>

                 {/* Create Webhook Form */}
                 <div className="space-y-3">
                   <input 
                     type="text" 
                     value={newWebhookUrl} 
                     onChange={e => setNewWebhookUrl(e.target.value)} 
                     className="w-full p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-sm outline-none focus:border-cyan-500 transition-colors bg-white dark:bg-slate-800" 
                     placeholder="Webhook URL (bắt đầu bằng http:// hoặc https://)..." 
                   />
                   
                   {/* Events Choice */}
                   <div className="flex flex-col gap-2">
                     <span className="text-xs font-semibold text-slate-500">Sự kiện gửi:</span>
                     <div className="flex flex-wrap gap-2">
                       {[
                         { label: 'Tất cả (*)', value: '*' },
                         { label: 'Uống nước mới', value: 'water_log.created' },
                         { label: 'Sửa lượng nước', value: 'water_log.updated' },
                         { label: 'Xóa uống nước', value: 'water_log.deleted' }
                       ].map(evt => (
                         <button
                           key={evt.value}
                           type="button"
                           onClick={() => {
                             triggerHaptic();
                             if (evt.value === '*') {
                               setWebhookEvents(['*']);
                             } else {
                               const newEvts = webhookEvents.filter(x => x !== '*');
                               if (newEvts.includes(evt.value)) {
                                 const updated = newEvts.filter(x => x !== evt.value);
                                 setWebhookEvents(updated.length === 0 ? ['*'] : updated);
                               } else {
                                 setWebhookEvents([...newEvts, evt.value]);
                               }
                             }
                           }}
                           className={`px-3 py-1 rounded-full text-xs transition-colors border ${
                             webhookEvents.includes(evt.value) 
                               ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
                               : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 bg-white dark:bg-slate-800'
                           }`}
                         >
                           {evt.label}
                         </button>
                       ))}
                     </div>
                   </div>

                   <button 
                     onClick={handleCreateSubscription} 
                     className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-sm transition-colors"
                   >
                     Đăng Ký Webhook
                   </button>
                 </div>

                 {/* Webhooks list */}
                 <div className="space-y-2">
                   {isLoadingDevData ? (
                     <div className="flex justify-center p-4"><Loader2 className="animate-spin text-cyan-400" size={20} /></div>
                   ) : subscriptions.length === 0 ? (
                     <p className="text-center text-xs text-slate-500 dark:text-white/30 py-4">Chưa đăng ký webhook nào.</p>
                   ) : (
                     subscriptions.map(sub => (
                       <div key={sub.id} className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl space-y-2">
                         <div className="flex items-center justify-between gap-4">
                           <div className="min-w-0 flex-1">
                             <span className="font-semibold text-sm block truncate text-cyan-400">{sub.url}</span>
                             <span className="text-[10px] text-slate-500 block">Sự kiện: {sub.events.join(', ')}</span>
                           </div>
                           <button 
                             onClick={() => handleDeleteSubscription(sub.id)} 
                             className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 active:scale-95 transition-all"
                             title="Xóa webhook"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                         <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-900/60 p-2 rounded border border-slate-300 dark:border-white/5 text-[10px] font-mono">
                           <span className="text-slate-500 flex-shrink-0">Secret:</span>
                           <span className="flex-1 truncate">{sub.secret}</span>
                           <button 
                             onClick={() => handleCopy(sub.secret, sub.id)} 
                             className="p-1 rounded hover:bg-slate-300 dark:hover:bg-white/10 text-slate-600 dark:text-white/50 active:scale-95 transition-all"
                             title="Sao chép Secret"
                           >
                             {copiedKeyId === sub.id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                           </button>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               </div>

               {/* 4. Webhook Delivery Logs Section */}
               <div className="space-y-4">
                 <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                   <div className="flex items-center gap-2">
                     <Clock className="text-cyan-500" size={18} />
                     <h3 className="font-bold text-sm uppercase tracking-wider">Nhật ký Webhooks</h3>
                   </div>
                   <button 
                     onClick={() => { triggerHaptic(); loadDeveloperData(); }} 
                     className="text-xs text-cyan-500 dark:text-cyan-400 hover:underline"
                   >
                     Làm mới
                   </button>
                 </div>

                 <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                   {deliveries.length === 0 ? (
                     <p className="text-center text-xs text-slate-500 dark:text-white/30 py-4">Chưa có giao dịch webhook nào.</p>
                   ) : (
                     deliveries.map(del => {
                       const isSuccess = del.response_status && del.response_status >= 200 && del.response_status < 300;
                       return (
                         <div key={del.id} className="p-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl flex items-start justify-between gap-3 text-xs">
                           <div className="min-w-0">
                             <div className="flex items-center gap-1.5 flex-wrap">
                               <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`} />
                               <span className="font-semibold">{del.event_type}</span>
                               <span className="text-[10px] text-slate-500">{new Date(del.delivered_at).toLocaleTimeString()}</span>
                             </div>
                             {del.error_message && (
                               <p className="text-[10px] text-red-400 mt-1">{del.error_message}</p>
                             )}
                           </div>
                           <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                             isSuccess 
                               ? 'bg-emerald-500/10 text-emerald-400' 
                               : 'bg-red-500/10 text-red-400'
                           }`}>
                             {del.response_status || 'ERR'}
                           </div>
                         </div>
                       );
                     })
                   )}
                 </div>
               </div>

               {/* 5. Giám sát Hiệu năng (Performance Monitoring) - Sprint 1 */}
               <div className="space-y-4">
                 <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
                   <Gauge className="text-cyan-500" size={18} />
                   <h3 className="font-bold text-sm uppercase tracking-wider">Giám sát Hiệu năng</h3>
                 </div>

                 {/* Web Vitals */}
                 <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl space-y-3">
                   <h4 className="font-semibold text-sm">Core Web Vitals</h4>
                   <div className="grid grid-cols-2 gap-2">
                     {[
                      { label: 'FCP', value: webVitals.fcp, unit: 'ms', metric: 'fcp' as const },
                      { label: 'LCP', value: webVitals.lcp, unit: 'ms', metric: 'lcp' as const },
                      { label: 'CLS', value: webVitals.cls, unit: '', metric: 'cls' as const },
                      { label: 'FID', value: webVitals.fid, unit: 'ms', metric: 'fid' as const },
                      { label: 'TTFB', value: webVitals.ttfb, unit: 'ms', metric: 'ttfb' as const },
                     ].map(vital => {
                      const status = getMetricStatus(vital.metric, vital.value);
                      return (
                        <div key={vital.label} className="p-2 bg-slate-200 dark:bg-slate-900/60 rounded-lg">
                          <div className="text-[10px] text-slate-500 dark:text-white/40 mb-1">{vital.label}</div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {vital.value !== null && vital.value !== undefined ? `${vital.metric === 'cls' ? vital.value.toFixed(3) : vital.value.toFixed(0)}${vital.unit}` : 'N/A'}
                          </div>
                          <div className={`text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block ${status.color} ${status.bg}`}>
                            {status.label}
                          </div>
                        </div>
                      );
                     })}
                   </div>
                 </div>

                 {/* Slow Queries */}
                 <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl space-y-3">
                   <div className="flex items-center justify-between">
                     <h4 className="font-semibold text-sm">Truy vấn chậm ({'>'}200ms)</h4>
                     <span className="text-[10px] text-slate-500 dark:text-white/40">{slowQueries.length} bản ghi</span>
                   </div>
                   <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                     {slowQueries.length === 0 ? (
                       <p className="text-center text-xs text-slate-500 dark:text-white/30 py-4">Không có truy vấn chạm nào.</p>
                     ) : (
                       slowQueries.map((query, idx) => (
                         <div key={idx} className="p-2 bg-slate-200 dark:bg-slate-900/60 rounded-lg text-xs">
                           <div className="flex items-center justify-between gap-2">
                             <span className="font-mono text-slate-700 dark:text-white/80 truncate flex-1">{query.query}</span>
                             <span className="text-amber-400 font-bold whitespace-nowrap">{query.duration.toFixed(0)}ms</span>
                           </div>
                           <div className="text-[10px] text-slate-500 dark:text-white/30 mt-1">
                             {new Date(query.timestamp).toLocaleString()}
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               </div>

               {/* 6. Bảng phân tích Chi phí AI (AI Cost Dashboard) - Sprint 1 */}
               <div className="space-y-4">
                 <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
                   <DollarSign className="text-cyan-500" size={18} />
                   <h3 className="font-bold text-sm uppercase tracking-wider">Phân tích Chi phí AI</h3>
                 </div>

                 {isLoadingAiCost ? (
                   <div className="flex justify-center p-4"><Loader2 className="animate-spin text-cyan-400" size={20} /></div>
                 ) : aiCostData ? (
                   <div className="space-y-3">
                     {/* Summary Card */}
                     <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl space-y-2">
                       <h4 className="font-semibold text-sm">Tổng chi phí 30 ngày</h4>
                       <div className="flex items-baseline gap-2">
                         <span className="text-2xl font-black text-cyan-400">${aiCostData.totalCostUSD.toFixed(6)}</span>
                         <span className="text-sm text-slate-500 dark:text-white/40">(~{aiCostData.totalCostVND.toFixed(0)}đ VND)</span>
                       </div>
                       <div className="flex gap-4 text-xs text-slate-500 dark:text-white/60">
                         <span>{aiCostData.totalMessages} tin nhắn</span>
                         <span>{aiCostData.totalAdvice} lời khuyên</span>
                         <span>{aiCostData.totalScans} quét</span>
                       </div>
                     </div>

                     {/* Daily Breakdown */}
                     <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl space-y-2">
                       <h4 className="font-semibold text-sm">Lịch sử sử dụng hàng ngày</h4>
                       <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                         {aiCostData.dailyBreakdown.map(day => (
                           <div key={day.date} className="p-2 bg-slate-200 dark:bg-slate-900/60 rounded-lg flex items-center justify-between text-xs">
                             <div className="flex items-center gap-2">
                               <span className="text-slate-500 dark:text-white/40 w-20">{day.date}</span>
                               <span className="text-slate-700 dark:text-white/80">
                                 {day.messages} msg, {day.advice} advice, {day.scans} scan
                               </span>
                             </div>
                             <span className="text-cyan-400 font-bold">${day.costUSD.toFixed(6)}</span>
                           </div>
                         ))}
                       </div>
                     </div>

                     {/* Disclaimer */}
                     <p className="text-[10px] text-yellow-400/80 leading-relaxed p-2 bg-yellow-500/5 border border-yellow-500/10 rounded-lg">
                       ⚠️ {getCostDisclaimer()}
                     </p>
                   </div>
                 ) : (
                   <p className="text-center text-xs text-slate-500 dark:text-white/30 py-4">Không có dữ liệu sử dụng AI.</p>
                 )}
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
              <button onClick={() => setCropImage(null)} className="text-slate-400 hover:text-white px-4 py-2 font-bold">Hủy</button>
              <h3 className="text-white font-bold">Chỉnh sửa Avatar</h3>
              <button onClick={handleCropConfirm} className="text-cyan-400 hover:text-cyan-300 font-bold px-4 py-2">Xong</button>
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
              <span className="text-slate-400 text-sm font-bold">Thu phóng</span>
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
              {deleteStep === 'select' ? 'Bạn muốn làm gì?' : 'Xác nhận bảo mật'}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {deleteStep === 'select' 
                ? 'Hành động này không thể hoàn tác. Hãy chọn kỹ.' 
                : 'Vui lòng nhập mật khẩu để xác nhận việc xóa.'}
            </p>

            {/* BƯỚC 1: CHỌN TÙY CHỌN */}
            {deleteStep === 'select' && (
              <div className="space-y-3">
                <button
                  onClick={() => { setSelectedOption('data-only'); setDeleteStep('confirm'); }}
                  className="w-full p-4 text-left border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 transition-all group"
                >
                  <div className="font-semibold text-slate-900 dark:text-white group-hover:text-orange-600"><Trash2 size={16} className="inline mr-1.5" />Xóa dữ liệu</div>
                  <div className="text-xs text-slate-500 mt-1">Giữ lại tài khoản, xóa sạch bài viết, lịch sử...</div>
                </button>

                <button
                  onClick={() => { setSelectedOption('account-full'); setDeleteStep('confirm'); }}
                  className="w-full p-4 text-left border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all group"
                >
                  <div className="font-semibold text-red-600 dark:text-red-400"><Skull size={16} className="inline mr-1.5" />Xóa vĩnh viễn tài khoản</div>
                  <div className="text-xs text-red-500/80 mt-1">Mất tài khoản, mất dữ liệu, không thể đăng nhập lại.</div>
                </button>

                <button 
                  onClick={() => setDeleteStep(null)}
                  className="w-full py-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                >
                  Hủy bỏ
                </button>
              </div>
            )}

            {/* BƯỚC 2: NHẬP MẬT KHẨU */}
            {deleteStep === 'confirm' && (
              <div className="space-y-4">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-xs text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle size={16} className="inline mr-1 text-amber-500" /> Cảnh báo: Bạn đang chọn <b>{selectedOption === 'account-full' ? 'XÓA VĨNH VIỄN TÀI KHOẢN' : 'XÓA TOÀN BỘ DỮ LIỆU'}</b>.
                </div>

                <input
                  type="password"
                  placeholder="Nhập mật khẩu của bạn"
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
                    Quay lại
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
                    {isDeleting ? 'Đang xử lý...' : 'Xác nhận xóa'}
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
