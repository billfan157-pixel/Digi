import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Activity, Droplets, Heart, Bell,
  MoonStar, Send, Smartphone, Ruler, CloudUpload, Fingerprint,
  FileText, LogOut, Trash2, ChevronLeft, ChevronRight, X, Loader2, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { useSettings } from '../../hooks/useSettings';
import { useBiometric } from '../../hooks/useBiometric';
import { useDeleteAccount } from '../../hooks/useDeleteAccount';
import type { DeleteOption } from '../../hooks/useDeleteAccount';
import type { Profile } from '../../models';
import { LocalNotifications } from '@capacitor/local-notifications';
import { registerPlugin } from '@capacitor/core';
import Cropper from 'react-easy-crop';

import type { AppProfile } from '@/services/profile.service';
import { AppStorage } from '@/lib/storage';
import { useWeatherSync } from '@/hooks/useWeatherSync';
import { requestHealthReadStepsAndHeartRate } from '@/lib/healthIntegration';

// Khai báo Plugin tự chế
const WidgetPlugin = registerPlugin<Record<string, unknown>>('WidgetPlugin');

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
      onDragEnd={(e, { offset, velocity }) => { if (offset.y > 100 || velocity.y > 500) onClose() }}
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
  const isOpen = useUIStore(s => s.showProfileSettings);
  const onClose = () => useUIStore.getState().setShowProfileSettings(false);
  const profile = useAppStore(s => s.profile);
  const setProfile = (newProfile: typeof profile) => useAppStore.getState().setAppState({ profile: newProfile });
  const handleLogout = useAppStore(s => s.actions.handleLogout);

  const { settings, updateSettings, isSaving, lastSync, triggerHaptic } = useSettings(profile);
  const [activeSheet, setActiveSheet] = useState<'none' | 'personal' | 'quiet' | 'privacy' | 'delete' | 'name' | 'widget' | 'wellness'>('none');
  
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
    
    const toastId = toast.loading('Đang cắt và tải ảnh lên...');
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
      
      toast.success('Đã cập nhật ảnh đại diện', { id: toastId });
      setCropImage(null);
      triggerHaptic();
    } catch (err: unknown) {
      toast.error('Lỗi tải ảnh: ' + (err instanceof Error ? err.message : String(err)), { id: toastId });
    }
  };

  const testNotification = async () => {
    triggerHaptic();
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display === 'granted') {
      await LocalNotifications.schedule({
        notifications: [{
          title: '💧 DigiWell',
          body: 'Đến giờ uống nước rồi sếp ơi!',
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 2000) } // Sẽ nổ thông báo sau 2 giây
        }]
      });
      toast.success('Đã lên lịch thông báo sau 2 giây!');
    } else {
      toast.warning('Hãy cấp quyền thông báo trong hệ thống điện thoại.');
    }
  };

  // Cập nhật lên Supabase khi Save
  const handleSaveProfile = async () => {
    triggerHaptic();
    if (!profile?.id) return;
    if (!formData.nickname.trim()) { toast.error('Vui lòng nhập tên hiển thị!'); return; }
    if (formData.weight < 20 || formData.weight > 300 || formData.height < 50 || formData.height > 250 || formData.age < 5 || formData.age > 120) {
      toast.error('Vui lòng kiểm tra lại các thông số không hợp lệ!'); return;
    }
    
    const toastId = toast.loading('Đang cập nhật hồ sơ...');
    try {
      const { error } = await supabase.from('profiles').update({
        nickname: formData.nickname.trim(),
        gender: formData.gender,
        age: formData.age,
        height: formData.height,
        weight: formData.weight,
        activity: formData.activity,
        climate: formData.climate,
        goal: formData.goal
      }).eq('id', profile.id);

      if (error) throw error;
      
      setProfile({ ...profile, ...formData, nickname: formData.nickname.trim() } as AppProfile);
      updateSettings({
        displayName: formData.nickname.trim(),
        weight: formData.weight,
        height: formData.height,
        age: formData.age,
        gender: formData.gender,
        activity: formData.activity,
        climate: formData.climate
      });
      
      toast.success('Cập nhật hồ sơ thành công!', { id: toastId });
      closeSheet();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err) || 'Lỗi cập nhật hồ sơ', { id: toastId });
    }
  };

  const handleSyncAppleHealth = async () => {
    const granted = await requestHealthReadStepsAndHeartRate();
    if (granted) {
      toast.success('Đã kết nối Apple Health / Health Connect.');
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
                      onClick={() => { triggerHaptic(); void syncWeather(); }}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-60 disabled:active:scale-100"
                    >
                     <div className="flex items-center gap-3">
                       <span className="text-2xl">🌤️</span>
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

                <button onClick={testNotification} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-500/20 text-slate-400 flex items-center justify-center"><Send size={18} /></div>
                    <span className="text-white font-medium">Gửi thông báo thử</span>
                  </div>
                  <span className="text-sm font-semibold text-cyan-400">Thử ngay</span>
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

            {/* SECTION D: ACCOUNT & LEGAL */}
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
            <div className="text-slate-600 dark:text-white/70 text-sm leading-relaxed space-y-4 mb-6">
              <p>DigiWell thu thập và lưu trữ các thông tin sinh trắc cơ bản (cân nặng, chiều cao) nhằm cá nhân hóa mục tiêu nước.</p>
              <p>Dữ liệu được mã hóa và đồng bộ bảo mật lên máy chủ Supabase. Chúng tôi cam kết không bán dữ liệu sức khỏe của bạn cho bên thứ ba.</p>
              <p>Các tính năng phân tích AI thông qua Google Gemini không sử dụng dữ liệu định danh trực tiếp của bạn để huấn luyện mô hình.</p>
            </div>
            <button onClick={closeSheet} className="w-full py-3 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white font-semibold hover:bg-slate-300 dark:hover:bg-white/20 transition-colors">Đã hiểu</button>
          </BottomSheetWrapper>
        )}

        {activeSheet === 'widget' && (
          <BottomSheetWrapper key="section-widget" title="Widget Màn hình chính" onClose={closeSheet}>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-white/5 mb-6">
              <p className="text-slate-900 dark:text-white font-bold mb-4">Xem trước Widget (1x1)</p>
              
              {/* Widget Preview Mockup */}
              <div className="w-full max-w-[160px] mx-auto aspect-square rounded-[2rem] bg-slate-900 border border-white/10 p-4 relative overflow-hidden shadow-2xl flex flex-col justify-between" style={{ borderColor: `${settings.themeColor}50` }}>
                <div className="absolute top-0 right-0 w-24 h-24 blur-2xl rounded-full pointer-events-none" style={{ backgroundColor: `${settings.themeColor}30` }} />
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className="text-[10px] font-bold" style={{ color: settings.themeColor }}>Hôm nay</p>
                    <p className="text-xl font-black text-white leading-none">{(profile?.water_today || 0)}</p>
                    <p className="text-[8px] text-slate-400">/ {settings.waterGoal || 2000} ml</p>
                  </div>
                  <Droplets size={16} style={{ color: settings.themeColor }} />
                </div>
                
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-auto mb-3 relative z-10">
                  <div className="h-full transition-all" style={{ width: `${Math.min(((profile?.water_today || 0) / (settings.waterGoal || 2000)) * 100, 100)}%`, backgroundColor: settings.themeColor }} />
                </div>
                
                {/* Quick Add Buttons */}
                <div className="flex gap-1.5 relative z-10">
                  <div className="flex-1 py-1.5 rounded-lg bg-white/10 text-center text-[9px] font-bold text-white">+100</div>
                  <div className="flex-1 py-1.5 rounded-lg text-center text-[9px] font-bold text-slate-900 shadow-lg" style={{ backgroundColor: settings.themeColor }}>+250</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
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
                
                // Đẩy dữ liệu xuyên qua màng Native iOS
                try {
                  const widgetPlugin = WidgetPlugin as unknown as Record<string, (data: unknown) => Promise<void>>;
                  await widgetPlugin.syncData({
                    water_today: Number(profile?.water_today) || 0,
                    water_goal: settings.waterGoal || 2000,
                    themeColor: settings.themeColor || '#06b6d4'
                  });
                } catch { console.log('Bỏ qua vì không chạy trên iOS Native'); }

                 toast.success('Đã đồng bộ giao diện và dữ liệu ra Widget!'); 
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
      </AnimatePresence>

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
                  <div className="font-semibold text-slate-900 dark:text-white group-hover:text-orange-600">🗑️ Xóa dữ liệu</div>
                  <div className="text-xs text-slate-500 mt-1">Giữ lại tài khoản, xóa sạch bài viết, lịch sử...</div>
                </button>

                <button
                  onClick={() => { setSelectedOption('account-full'); setDeleteStep('confirm'); }}
                  className="w-full p-4 text-left border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all group"
                >
                  <div className="font-semibold text-red-600 dark:text-red-400">☠️ Xóa vĩnh viễn tài khoản</div>
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
                  ⚠️ Cảnh báo: Bạn đang chọn <b>{selectedOption === 'account-full' ? 'XÓA VĨNH VIỄN TÀI KHOẢN' : 'XÓA TOÀN BỘ DỮ LIỆU'}</b>.
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
                        toast.success('Đã xóa thành công.');
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
