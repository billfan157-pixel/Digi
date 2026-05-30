import React, { useEffect, useState, useRef } from 'react';




import { X, ShoppingBag, Check, Palette, Frame, Droplets, Coins, Loader2, Package, Music, Box, ShoppingCart, Gem, Shield, Lock, Zap, Crown, Eye, Sparkles, Volume2, Share2, ArrowUpDown, Filter, Gift } from 'lucide-react';




import { motion, AnimatePresence } from 'framer-motion';




import { getFrameConfig } from '../../config/avatarFrames';




import { getThemeConfigSync } from '@/services/theme.service';




import type { ThemeConfig, ThemeEffect } from '@/config/themes';




import { writeAppPreferences } from '@/services/appPreferences.service';




import { useTranslation } from 'react-i18next';




import { toast } from 'sonner';




import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';




import CountUp from '../CountUp';




import GachaMachine from '../GachaMachine';




import type { AppProfile } from '@/services/profile.service';




import type { Profile, ShopItem } from '../../models';




import { appQueryKeys } from '@/lib/queryKeys';




import { fetchProfileById } from '@/services/profile.service';




import { useUIStore } from '@/store/useUIStore';




import { useAppStore } from '@/store/useAppStore';




import { useModalStore } from '@/store/useModalStore';




import { useAiSocial } from '@/context/AiSocialContext';




import { playNotificationSound } from '@/lib/audio';




import { buildPurchaseShareText } from '@/lib/social';




import {




  canAccessPremiumItem,




  equipShopItem,




  fetchShopData,




  getRequiredLevel,




  getRequiredTier,




  getSoundValue,




  getThemeColor,




  parseItemMeta,




  purchaseShopItem,




  redeemGiftCode,




} from '@/services/shop.service';









const TIER_LABELS: Record<string, string> = { plus: 'Plus', pro: 'Pro' };









const rarityConfig = {




  common: { 




    border: 'border-emerald-500/20', 




    bg: 'bg-emerald-500/5',




    glow: 'rgba(52,211,153,0.1)', 




    label: 'Thường', 




    icon: Box, 




    color: '#34d399',




    text: 'text-emerald-400'




  },




  rare: { 




    border: 'border-sky-500/30', 




    bg: 'bg-sky-500/5',




    glow: 'rgba(56,189,248,0.2)', 




    label: 'Rare', 




    icon: Gem, 




    color: '#38bdf8',




    text: 'text-sky-400'




  },




  epic: { 




    border: 'border-violet-500/40', 




    bg: 'bg-violet-500/10',




    glow: 'rgba(139,92,246,0.3)', 




    label: 'Sử thi', 




    icon: Shield, 




    color: '#a78bfa',




    text: 'text-violet-400'




  },




  legendary: { 




    border: 'border-amber-500/50', 




    bg: 'bg-amber-500/10',




    glow: 'rgba(245,158,11,0.4)', 




    label: 'Legendary', 




    icon: Crown, 




    color: '#fbbf24',




    text: 'text-amber-400'




  },




  mythic: { 




    border: 'border-rose-500/60', 




    bg: 'bg-rose-500/15',




    glow: 'rgba(244,63,94,0.5)', 




    label: 'Mythical', 




    icon: Zap, 




    color: '#f43f5e',




    text: 'text-rose-400'




  },




} as const;









const SoundPreviewDetail: React.FC<{




  item: ShopItem;




  onClose: () => void;




  onPlay: () => void;




}> = ({ item, onClose, onPlay }) => {




  const { t } = useTranslation();




  const soundName = getSoundValue(item);




  const rarity = rarityConfig[item.rarity as keyof typeof rarityConfig] || rarityConfig.common;









  return (




    <motion.div




      initial={{ opacity: 0, scale: 0.95 }}




      animate={{ opacity: 1, scale: 1 }}




      exit={{ opacity: 0, scale: 0.95 }}




      className="absolute inset-0 z-20 flex items-center justify-center p-4"




      style={{ background: 'rgba(2,6,23,0.85)' }}




    >




      <div className="w-full max-w-xs rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900/90 backdrop-blur-2xl">




        {/* Visual bar */}




        <div className="h-24 relative overflow-hidden flex items-center justify-center"




          style={{ background: `radial-gradient(circle at 50% 50%, ${rarity.color}20, transparent)` }}>




          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl cursor-pointer active:scale-90 transition-transform"




            style={{ background: `linear-gradient(135deg, ${rarity.color}, ${rarity.color}80)`, boxShadow: `0 0 30px ${rarity.color}60` }}




            onClick={onPlay}




          >




            <Volume2 size={28} className="text-white drop-shadow-lg" />




          </div>




        </div>









        <div className="p-5 space-y-4">




          <div className="text-center">




            <h3 className="text-white font-black text-lg">{item.name}</h3>




            <p className="text-slate-400 text-[10px] mt-1">{item.description}</p>




          </div>









          {/* Rarity + Info */}




          <div className="flex items-center justify-center gap-4">




            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-xl border ${rarity.text}`}




              style={{ backgroundColor: `${rarity.color}10`, borderColor: `${rarity.color}20` }}>




              {t('shop.rarity_' + item.rarity)}




            </div>




            <div className="text-slate-500 text-[9px] font-mono">🔊 {soundName}</div>




          </div>









          {/* Play button */}




          <button onClick={onPlay}




            className="w-full py-4 rounded-2xl text-white text-sm font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-3"




            style={{ background: `linear-gradient(135deg, ${rarity.color}, ${rarity.color}88)`, boxShadow: `0 0 25px ${rarity.color}40` }}>




            <Volume2 size={20} />




            {t('shop.play_sound')}




          </button>









          {/* Close */}




          <button onClick={onClose}




            className="w-full py-3 rounded-xl border border-white/10 text-slate-400 text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all hover:bg-white/5">




            {t('common.close')}




          </button>




        </div>




      </div>




    </motion.div>




  );




};









const effectLabels: Record<ThemeEffect, string> = {




  'none': 'None', 'cyber-grid': 'Cyber Grid', 'aurora-waves': 'Aurora', 'space-stars': 'Space',




  'floating-particles': 'Floating Particles', 'fire-embers': 'Fire Embers', 'water-ripples': 'Water Ripples', 'golden-rays': 'Golden Rays',




  'pearl-shimmer': 'Pearl Shimmer', 'silk-sweep': 'Silk Sweep', 'canvas-texture': 'Canvas', 'depth-breathe': 'Deep Breath',




};









function extractThemeConfig(item: ShopItem): Partial<ThemeConfig> | null {




  if (item.category !== 'theme') return null;




  const meta = parseItemMeta(item);




  if (!meta || Object.keys(meta).length === 0) return null;




  return meta as Partial<ThemeConfig>;




}









const ThemePreviewDetail: React.FC<{




  item: ShopItem;




  themeCfg: Partial<ThemeConfig>;




  isTrying: boolean;




  onClose: () => void;




  onEquip: () => void;




  onTry: () => void;




}> = ({ item, themeCfg, isTrying, onClose, onEquip, onTry }) => {




  const { t } = useTranslation();




  const colors = themeCfg.colors;




  const accent = colors?.accent || item.preview_color || '#06b6d4';









  return (




    <motion.div




      initial={{ opacity: 0, scale: 0.95 }}




      animate={{ opacity: 1, scale: 1 }}




      exit={{ opacity: 0, scale: 0.95 }}




      className="absolute inset-0 z-20 flex items-center justify-center p-4"




      style={{ background: 'rgba(2,6,23,0.85)' }}




    >




      <div




        className="w-full max-w-xs rounded-[2rem] overflow-hidden"




        style={{




          background: colors?.surfaceGlass || 'rgba(255,255,255,0.04)',




          backdropFilter: `blur(${themeCfg.blurLevel || '20px'})`,




          border: `${themeCfg.borderWidth || '1px'} solid ${colors?.borderGlass || 'rgba(255,255,255,0.08)'}`,




          borderRadius: themeCfg.borderRadius || '16px',




          boxShadow: `0 0 30px ${colors?.glowColor || accent}40`,




        }}




      >




        {/* Color bar */}




        <div className="h-24 relative overflow-hidden flex items-center justify-center"




          style={{ background: colors?.bgGradient || `linear-gradient(180deg, ${accent}22, transparent)` }}>




          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"




            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}80)`, boxShadow: `0 0 20px ${accent}60` }}>




            <Palette size={28} className="text-white drop-shadow-lg" />




          </div>




        </div>









        <div className="p-5 space-y-4">




          <div className="text-center">




            <div className="flex items-center justify-center gap-1.5">




              <h3 className="text-white font-black text-lg">{item.name}</h3>




              {!!getRequiredTier(item) && (




                <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[7px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-md">




                  <Crown size={7} fill="currentColor" /> Premium




                </span>




              )}




            </div>




            <p className="text-slate-400 text-[10px] mt-1">{item.description}</p>




          </div>









          {/* Color chips */}




          <div className="flex items-center gap-3 justify-center">




            {[




              { label: 'Accent', color: accent },




              { label: 'Surface', color: colors?.surface1 || 'rgba(255,255,255,0.03)' },




              { label: 'Glass', color: colors?.surfaceGlass || 'rgba(255,255,255,0.04)' },




              { label: 'Background', color: '#0f172a' },




            ].map(c => (




              <div key={c.label} className="flex flex-col items-center gap-1">




                <div className="w-8 h-8 rounded-lg border border-white/10" style={{ background: c.color }} />




                <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider">{c.label}</span>




              </div>




            ))}




          </div>









          {/* Info grid */}




          <div className="grid grid-cols-2 gap-2">




            {[




              { label: t('shop.effect_label'), value: effectLabels[themeCfg.effect || 'none'] },




              { label: 'Blur', value: themeCfg.blurLevel || '20px' },




              { label: 'Corner', value: themeCfg.borderRadius || '16px' },




              { label: 'Border', value: themeCfg.borderWidth || '1px' },




            ].map(info => (




              <div key={info.label} className="bg-white/5 rounded-xl p-2.5 text-center">




                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{info.label}</p>




                <p className="text-white text-[11px] font-bold mt-0.5">{info.value}</p>




              </div>




            ))}




          </div>









          {/* Glass demo card */}




          <div className="rounded-2xl p-3 text-center"




            style={{




              background: colors?.surfaceGlass || 'rgba(255,255,255,0.04)',




              backdropFilter: `blur(${themeCfg.blurLevel || '20px'})`,




              border: `${themeCfg.borderWidth || '1px'} solid ${colors?.borderGlass || 'rgba(255,255,255,0.08)'}`,




              borderRadius: themeCfg.borderRadius || '16px',




            }}>




            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: accent }}>Glassmorphism Demo</p>




            <p className="text-[8px] text-slate-400 mt-1">{t('shop.glass_demo_desc', { name: item.name })}</p>




          </div>









          {/* Live preview indicator */}




          {isTrying && (




            <div className="py-2 px-3 rounded-xl text-center text-[9px] font-black uppercase tracking-wider"




              style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>




              <Sparkles size={12} className="inline-block mr-1" />




              Trying on — close to undo




            </div>




          )}









          {/* Actions */}




          <div className="flex gap-2">




            <button onClick={onClose}




              className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all hover:bg-white/5">
              {t('common.close')}
            </button>




            <button onClick={onTry}




              className="flex-1 py-3 rounded-xl text-white text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all"




              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}88)`, border: `1px solid ${accent}40`, boxShadow: `0 0 15px ${accent}30` }}>




              {isTrying ? t('shop.trying_on') : t('shop.try_on')}




            </button>




            <button onClick={onEquip}




              className="flex-1 py-3 rounded-xl text-white text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all"




              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 0 15px ${accent}40` }}>




              {t('shop.use_item')}




            </button>




          </div>




        </div>




      </div>




    </motion.div>




  );




};









interface ShopItemCardProps {




  item: ShopItem;




  isOwned: boolean;




  isEquipped: boolean;




  isProcessing: boolean;




  isLocked: boolean;




  isPremium: boolean;




  canAccess: boolean;




  premiumTier?: string | null;




  requiredLevel: number;




  onBuy: (item: ShopItem) => void;




  onEquip: (item: ShopItem) => void;




  onPreview?: (item: ShopItem) => void;




}









const ShopItemCard: React.FC<ShopItemCardProps> = ({ item, isOwned, isEquipped, isProcessing, isLocked, isPremium, canAccess, premiumTier, requiredLevel, onBuy, onEquip, onPreview }) => {




  const { t } = useTranslation();




  const rarity = rarityConfig[item.rarity as keyof typeof rarityConfig] || rarityConfig.common;









  let themeColor = item.preview_color;




  if (!themeColor && item.category === 'theme' && item.meta_value) {




    try {




      const meta = JSON.parse(String(item.meta_value));




      themeColor = meta.primary || meta.bg;




    } catch {




      const metaStr = String(item.meta_value);




      if (metaStr.startsWith('#')) themeColor = metaStr;




    }




  }









  return (




    <motion.div




      layout




      whileHover={{ scale: 1.02 }}




      className={`relative overflow-hidden rounded-[1.5rem] border backdrop-blur-2xl p-3 flex flex-col items-center text-center transition-all duration-300 group ${




        isEquipped




          ? 'border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]'




          : `${rarity.border} ${rarity.bg} hover:border-white/20`




      }`}




    >




      {/* Shine Effect */}




      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500">




        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />




      </div>









      {/* Premium Badge */}




      {isPremium && (




        <div className="absolute top-1.5 right-1.5 z-20 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[7px] font-black uppercase tracking-wider shadow-lg flex items-center gap-0.5">




          <Crown size={7} fill="currentColor" /> Premium




        </div>




      )}









      {/* Visual Preview - Smaller */}




      <div className="relative mb-2.5 z-10">




        {item.image_url ? (




          <img src={item.image_url} alt={item.name} loading="lazy" decoding="async" className="w-14 h-14 rounded-full object-cover border-2 border-white/10" />




        ) : item.category === 'theme' && themeColor ? (




          <div




            className="relative w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer group"




            style={{




              background: `linear-gradient(135deg, ${themeColor}, ${themeColor}60)`,




              boxShadow: `0 5px 15px -3px ${themeColor}40`,




            }}




            onClick={(e) => { e.stopPropagation(); onPreview?.(item); }}




          >




            <Palette size={24} className="text-white drop-shadow-lg" />




            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-2xl">




              <Eye size={16} className="text-white drop-shadow" />




            </div>




          </div>




        ) : item.category === 'frame' ? (




          (() => {




            const frameCfg = getFrameConfig(item.id);




            return (




              <div className="relative w-14 h-14 flex items-center justify-center">




                <div className="absolute inset-0 scale-110 opacity-70">{frameCfg?.effects}</div>




                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 bg-slate-900/40 backdrop-blur-md ${frameCfg?.borderClasses || 'border-white/10'}`}>




                  <Frame size={18} style={{ color: item.preview_color || '#64748b' }} />




                </div>




              </div>




            );




          })()




        ) : item.category === 'sound' ? (




          <button




            onClick={(e) => { e.stopPropagation(); onPreview?.(item); }}




            className="relative w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer group hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"




            title={t('shop.preview')}




          >




            <Music size={24} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />




            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">




              <Eye size={14} className="text-cyan-400 drop-shadow" />




            </div>




          </button>




        ) : (




          <div className="relative w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">




            {item.category === 'bottle' && <Droplets size={24} className="text-slate-400" />}




          </div>




        )}




      </div>









      {/* Badges Container */}




      <div className="flex items-center gap-1.5 mb-1.5">




        {/* Rarity Label - Compact */}




        <div




          className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight backdrop-blur-xl border ${rarity.text}`}




          style={{ backgroundColor: `${rarity.color}10`, borderColor: `${rarity.color}20` }}




        >




          <span className="flex items-center gap-1">




            {React.createElement(rarity.icon, { size: 8 })}




            {t('shop.rarity_' + item.rarity)}




          </span>




        </div>









        {/* Premium Tier Label */}




        {isPremium && (




          <div




            className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight backdrop-blur-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 flex items-center gap-1"




          >




            <Crown size={8} className="fill-amber-400" />




            Premium




          </div>




        )}




      </div>









      <h3 className="text-white font-bold text-[13px] mb-0.5 line-clamp-1">{item.name}</h3>




      <p className="text-slate-500 text-[9px] mb-3 leading-tight line-clamp-1 opacity-70">{item.description}</p>









      {/* Purchase/Equip Button - Slimmer */}




      <button




        disabled={isProcessing || isLocked || (isPremium && !canAccess)}




        onClick={() => {




          if (isPremium && !canAccess) return;




          isOwned ? onEquip(item) : onBuy(item);




        }}




        className={`w-full py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 ${




          isEquipped




            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'




            : isOwned




            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'




            : isLocked




            ? 'bg-slate-800/40 text-slate-500 border border-white/5'




            : isPremium && !canAccess




            ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/20 cursor-pointer'




            : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20'




        }`}




      >




        <span className="flex items-center justify-center gap-1.5">




          {isProcessing ? (




            <Loader2 size={12} className="animate-spin" />




          ) : isEquipped ? (




            <><Check size={14} strokeWidth={3} /> {t('common.use')}</>




          ) : isOwned ? (




            <><Zap size={14} fill="currentColor" /> {t('common.use')}</>




          ) : isLocked ? (




            <><Lock size={12} /> {t('common.required_level', { level: requiredLevel })}</>




          ) : isPremium && !canAccess ? (




            <><Crown size={12} /> {t('common.upgrade')} {premiumTier ? TIER_LABELS[premiumTier] : ''}</>




          ) : (




            <><Coins size={14} fill="white" /> {item.price.toLocaleString()}</>




          )}




        </span>




      </button>




    </motion.div>




  );




};









export default function ShopModal() {




  const { t } = useTranslation();




  const isOpen = useUIStore(s => s.showShopModal);




  const onClose = () => {




    useUIStore.getState().setShowShopModal(false);




    useAppStore.getState().setAppState({ themePreview: null });




  };




  const profile = useAppStore(s => s.profile);




  const setAppState = useAppStore(s => s.setAppState);




  




  const setProfile = (newProfileOrUpdater: unknown) => {




       const currentProfile = useAppStore.getState().profile;




       const newProfile = typeof newProfileOrUpdater === 'function' ? (newProfileOrUpdater as (prev: typeof currentProfile) => typeof currentProfile)(currentProfile) : newProfileOrUpdater;




       setAppState({ profile: newProfile as AppProfile | null });




  };




  




  const onSpendCoins = async (amount: number) => {




    if (amount <= 0) return true;




    if (!profile?.id) return false;




    return true;




  };









  const queryClient = useQueryClient();




  const profileId = profile?.id;




  const shopQueryKey = appQueryKeys.shop(profileId);




  const [activeCategory, setActiveCategory] = useState<'theme' | 'frame' | 'bottle' | 'sound' | 'gift'>('theme');




  const [viewMode, setViewMode] = useState<'shop' | 'inventory'>('shop');




  const [giftCode, setGiftCode] = useState('');




  const [isRedeeming, setIsRedeeming] = useState(false);









  const handleRedeem = async () => {




    if (!giftCode.trim()) {




      toast.error(t('shop.gift_needs_code'));




      return;




    }




    if (!profileId) {




      toast.error(t('shop.gift_needs_login'));




      return;




    }




    setIsRedeeming(true);




    try {




      const res = await redeemGiftCode(profileId, giftCode);




      if (res.success) {




        toast.success(res.message);




        setGiftCode('');




        queryClient.invalidateQueries({ queryKey: shopQueryKey });




        if (profileId) {




          const updatedProfile = await queryClient.fetchQuery({




            queryKey: appQueryKeys.profile(profileId),




            queryFn: () => fetchProfileById(profileId),




          });




          setProfile(updatedProfile);




        }




      } else {




        toast.error(res.message);




      }




    } catch (err: any) {




      toast.error(err?.message || t('shop.gift_redeem_failed'));




    } finally {




      setIsRedeeming(false);




    }




  };









  const [processingId, setProcessingId] = useState<string | null>(null);




  const [equippedBottleId, setEquippedBottleId] = useState<string | null>(profile?.equipped_bottle_id || null);




  const [equippedFrameId, setEquippedFrameId] = useState<string | null>(profile?.equipped_frame_id || null);




  const [equippedThemeId, setEquippedThemeId] = useState<string | null>(profile?.equipped_theme_id || null);




  const [equippedSound, setEquippedSound] = useState<string | null>(profile?.equipped_notification_sound || null);




  const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);




  const [purchaseCelebration, setPurchaseCelebration] = useState<ShopItem | null>(null);




  const [rarityFilter, setRarityFilter] = useState<string[]>([]);




  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'plus' | 'pro'>('all');




  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'rarity' | 'level'>('default');




  const [showFilterDropdown, setShowFilterDropdown] = useState(false);




  const [showSortDropdown, setShowSortDropdown] = useState(false);




  const filterRef = useRef<HTMLDivElement>(null);




  const sortRef = useRef<HTMLDivElement>(null);









  useEffect(() => {




    const handleClickOutside = (e: MouseEvent) => {




      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterDropdown(false);




      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortDropdown(false);




    };




    document.addEventListener('mousedown', handleClickOutside);




    return () => document.removeEventListener('mousedown', handleClickOutside);




  }, []);









  const hasActiveFilter = rarityFilter.length > 0 || tierFilter !== 'all';









  const { setSocialComposer } = useAiSocial().socialProps;




  const setShowSocialComposer = useModalStore(s => s.setShowSocialComposer);




  const profileNickname = profile?.nickname;




  const themePreview = useAppStore(s => s.themePreview);




  const isTrying = previewItem !== null && themePreview !== null;









  const handleTryTheme = (item: ShopItem) => {




    const previewCfg = extractThemeConfig(item);




    if (!previewCfg) return;




    const baseTheme = getThemeConfigSync(useAppStore.getState().profile?.equipped_theme_id);




    const merged: ThemeConfig = {




      ...baseTheme,




      ...previewCfg,




      colors: { ...baseTheme.colors, ...(previewCfg.colors || {}) },




    };




    useAppStore.getState().setAppState({ themePreview: merged });




  };









  useEffect(() => {




    if (profileId) {




      setEquippedBottleId(profile.equipped_bottle_id || null);




      setEquippedFrameId(profile.equipped_frame_id || null);




      setEquippedThemeId(profile.equipped_theme_id || null);




      setEquippedSound(profile.equipped_notification_sound || null);




    }




  }, [isOpen, profile?.equipped_bottle_id, profile?.equipped_frame_id, profile?.equipped_theme_id, profile?.equipped_notification_sound, profileId]);









  const { data: shopData, isLoading: isShopLoading } = useQuery({




    queryKey: shopQueryKey,




    queryFn: () => fetchShopData(profileId!),




    enabled: !!profileId && isOpen,




    staleTime: 1000 * 60 * 5,




  });









  const items = shopData?.items || [];




  const ownedItems = shopData?.ownedItems || new Set<string>();









  const buyMutation = useMutation({




    mutationFn: (item: ShopItem) => purchaseShopItem(profileId!, item),




    onSuccess: async (_, item) => {




      queryClient.setQueryData(shopQueryKey, (old: { items: ShopItem[]; ownedItems: Set<string> } | undefined) => {




        if (!old) return old;




        return { ...old, ownedItems: new Set([...old.ownedItems, item.id]) };




      });




      if (profileId) {




        const updatedProfile = await queryClient.fetchQuery({




          queryKey: appQueryKeys.profile(profileId),




          queryFn: () => fetchProfileById(profileId),




        });




        setProfile(updatedProfile);




      }




      setPurchaseCelebration(item);




    },




  });









  const equipMutation = useMutation({




    mutationFn: (item: ShopItem) => equipShopItem(profileId!, item),




    onSuccess: async ({ profile: updatedProfile, themeColor }, item) => {




      if (updatedProfile) {




        setProfile(updatedProfile);




      } else if (profile) {




        // Fallback: Update locally if updatedProfile not returned




        const fieldMap: Record<string, keyof Profile> = {




          theme: 'equipped_theme_id',




          frame: 'equipped_frame_id',




          bottle: 'equipped_bottle_id',




          sound: 'equipped_notification_sound'




        };




        const field = fieldMap[item.category];




        if (field) {




          setProfile({ ...profile, [field]: item.id });




        }




      }









      if (item.category === 'theme') {




        const activeColor = themeColor || getThemeColor(item);




        if (profileId) {




          writeAppPreferences(profileId, { themeColor: activeColor });




        }




      }




      




      toast.success(t('shop.equipped', { name: item.name }));




    },




  });









  const handleBuy = async (item: ShopItem) => {




    if (!profileId || !profile) return;




    if (ownedItems.has(item.id)) return;




    if ((profile?.coins || 0) < item.price) {




      toast.error(t('shop.need_more_coins'));




      return;




    }




    setProcessingId(item.id);




    try { await buyMutation.mutateAsync(item); } 




    catch { toast.error(t('shop.transaction_failed')); }




    finally { setProcessingId(null); }




  };









  const handleEquip = async (item: ShopItem) => {




    if (!profileId || !profile || !ownedItems.has(item.id)) return;




    setProcessingId(item.id);




    try {




      await equipMutation.mutateAsync(item);




      if (item.category === 'bottle') window.dispatchEvent(new CustomEvent('bottleEquipped', { detail: { equipped_bottle_id: item.id } }));




      if (item.category === 'frame') setEquippedFrameId(item.id);




      if (item.category === 'theme') setEquippedThemeId(item.id);




      if (item.category === 'sound') setEquippedSound(getSoundValue(item));




      // Clear preview only after successful equip




      setPreviewItem(null);




      useAppStore.getState().setAppState({ themePreview: null });




    } catch { toast.error(t('shop.try_again')); }




    finally { setProcessingId(null); }




  };









  const isItemEquipped = (item: ShopItem) => {




    if (item.category === 'bottle') return equippedBottleId === item.id;




    if (item.category === 'frame') return equippedFrameId === item.id;




    if (item.category === 'theme') return equippedThemeId === item.id;




    if (item.category === 'sound') return equippedSound === getSoundValue(item);




    return false;




  };









  const rarityOrder = ['common', 'rare', 'epic', 'legendary', 'mythic'];









  const filteredItems = activeCategory === 'gift' ? [] : items




    .filter((item: ShopItem) => {




      if (item.category !== activeCategory) return false;




      if (viewMode === 'inventory') return ownedItems.has(item.id);




      return true;




    })




    .filter((item: ShopItem) => {




      if (rarityFilter.length > 0 && !rarityFilter.includes(item.rarity)) return false;




      if (tierFilter !== 'all') {




        const requiredTier = getRequiredTier(item);




        if (tierFilter === 'free') { if (requiredTier) return false; }




        else if (requiredTier !== tierFilter) return false;




      }




      return true;




    })




    .sort((a: ShopItem, b: ShopItem) => {




      const aEq = isItemEquipped(a);




      const bEq = isItemEquipped(b);




      if (aEq && !bEq) return -1;




      if (!aEq && bEq) return 1;









      switch (sortBy) {




        case 'price_asc': return a.price - b.price;




        case 'price_desc': return b.price - a.price;




        case 'rarity': return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);




        case 'level': return getRequiredLevel(b) - getRequiredLevel(a);




        default: return 0;




      }




    });









  if (!isOpen) return null;









  return (




    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center" onClick={onClose}>




      <motion.div 




        initial={{ opacity: 0 }} 




        animate={{ opacity: 1 }} 




        exit={{ opacity: 0 }}




        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 




      />









      <motion.div




        initial={{ y: '100%' }}




        animate={{ y: 0 }}




        exit={{ y: '100%' }}




        transition={{ type: 'spring', damping: 25, stiffness: 200 }}




        onClick={e => e.stopPropagation()}




        className="relative w-full max-w-lg bg-slate-900/80 backdrop-blur-3xl border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col h-[85vh] sm:h-[80vh] shadow-2xl"




      >




        {/* Compact Header */}




        <div className="p-5 pb-2 relative z-10 shrink-0">




          <div className="flex justify-between items-center mb-4">




            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">




              <button




                onClick={() => setViewMode('shop')}




                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${




                  viewMode === 'shop' ? 'bg-amber-500 text-white' : 'text-slate-400'




                }`}




              >




                <ShoppingCart size={12} /> {t('shop.shop_tab')}




              </button>




              <button




                onClick={() => setViewMode('inventory')}




                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${




                  viewMode === 'inventory' ? 'bg-cyan-500 text-white' : 'text-slate-400'




                }`}




              >




                <Package size={12} /> {t('shop.inventory_tab')}




              </button>




            </div>




            <button onClick={onClose} className="p-2 bg-white/5 rounded-xl text-white border border-white/10">




              <X size={18} />




            </button>




          </div>









          {/* Compact Balance Card */}




          <div className="relative overflow-hidden rounded-2xl bg-slate-800/40 border border-white/5 p-4 flex items-center justify-between shadow-xl">




            <div className="flex items-center gap-3">




              <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">




                <Coins size={20} className="text-white" fill="white" />




              </div>




              <div>




                <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest">{t('shop.coin_balance')}</p>




                <div className="flex items-baseline gap-1">




                  <span className="text-amber-400 text-2xl font-black">




                    <CountUp value={profile?.coins || 0} />




                  </span>




                </div>




              </div>




            </div>




            <div className="p-2 rounded-lg bg-white/5 border border-white/5">




              <ShoppingBag size={18} className="text-slate-500" />




            </div>




          </div>




        </div>









        {/* Compact Categories */}




        <div className="px-5 mb-4 relative z-10 shrink-0 overflow-x-auto scrollbar-hide">




          <div className="flex gap-2 min-w-max">




            {[




              { id: 'theme' as const, icon: Palette, label: t('shop.category_theme') },




              { id: 'frame' as const, icon: Frame, label: t('shop.category_frame') },




              { id: 'bottle' as const, icon: Droplets, label: t('shop.category_bottle') },




              { id: 'sound' as const, icon: Music, label: t('shop.category_sound') },




              { id: 'gift' as const, icon: Gift, label: t('shop.category_gift') },




            ].map(({ id, icon: Icon, label }) => (




              <button




                key={id}




                onClick={() => setActiveCategory(id)}




                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${




                  activeCategory === id




                    ? `bg-white text-slate-900 shadow-xl`




                    : `bg-slate-800/40 text-slate-400 border border-white/5`




                }`}




              >




                <Icon size={14} strokeWidth={3} />




                {label}




              </button>




            ))}




          </div>




        </div>









        {/* Filter & Sort */}




        {activeCategory !== 'gift' && (




          <div className="px-5 mb-3 relative z-10 shrink-0">




            <div className="flex items-center justify-end gap-2">




              <div ref={filterRef} className="relative">




                <button




                  onClick={() => setShowFilterDropdown(d => !d)}




                  className={`p-2 rounded-xl border transition-all ${




                    hasActiveFilter




                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'




                      : 'bg-slate-800/40 text-slate-400 border-white/5'




                  }`}




                >




                  <Filter size={16} />




                </button>




                {showFilterDropdown && (




                  <div className="absolute right-0 top-full mt-2" style={{ pointerEvents: 'none' }}>




                    <div className="w-52 bg-slate-800/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl space-y-3" style={{ pointerEvents: 'auto' }}>




                    <div>




                      <p className="text-[8px] font-black uppercase tracking-wider text-slate-500 mb-1.5 px-1">{t('shop.filter_rarity')}</p>




                      <div className="flex flex-wrap gap-1">




                        {(['common','rare','epic','legendary','mythic'] as const).map(r => {




                          const cfg = rarityConfig[r];




                          const active = rarityFilter.length === 0 || rarityFilter.includes(r);




                          return (




                            <button




                              key={r}




                              onClick={() => setRarityFilter(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])}




                              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${




                                active




                                  ? `${cfg.text} ${cfg.border} ${cfg.bg}`




                                  : 'text-slate-600 border-white/5'




                              }`}




                            >




                              {React.createElement(cfg.icon, { size: 8 })}




                              {t('shop.rarity_' + r)}

                            </button>




                          );




                        })}




                      </div>




                    </div>




                    <div className="h-px bg-white/5" />




                    <div>




                      <p className="text-[8px] font-black uppercase tracking-wider text-slate-500 mb-1.5 px-1">{t('shop.filter_tier')}</p>




                      <div className="flex flex-wrap gap-1">




{(['all','free','plus','pro'] as const).map(tier => (
                          <button
                            key={tier}
                            onClick={() => setTierFilter(tier)}
                            className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                              tierFilter === tier
                                ? tier === 'all' ? 'bg-white text-slate-900'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'text-slate-600 border-white/5'
                            }`}
                          >
                            {tier === 'all' ? t('common.all') : tier === 'free' ? t('shop.filter_free') : TIER_LABELS[tier] || tier}




                          </button>




                        ))}




                      </div>




                    </div>




                    {hasActiveFilter && (




                      <>




                        <div className="h-px bg-white/5" />




                        <button




                          onClick={() => { setRarityFilter([]); setTierFilter('all'); }}




                          className="w-full py-1 rounded-lg text-[8px] font-black uppercase tracking-wider text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all"




                        >




                          {t('shop.filter_clear')}




                        </button>




                      </>




                    )}




                  </div>




                  </div>




                )}




              </div>









              <div ref={sortRef} className="relative">




                <button




                  onClick={() => setShowSortDropdown(d => !d)}




                  className="p-2 rounded-xl border border-white/5 bg-slate-800/40 text-slate-400 hover:bg-slate-700/40 transition-all"




                >




                  <ArrowUpDown size={16} />




                </button>




                {showSortDropdown && (




                  <div className="absolute right-0 top-full mt-2" style={{ pointerEvents: 'none' }}>




                    <div className="w-44 bg-slate-800/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl" style={{ pointerEvents: 'auto' }}>




                      {[['default',t('shop.sort_default')],['price_asc',t('shop.sort_price_asc')],['price_desc',t('shop.sort_price_desc')],['rarity',t('shop.sort_rarity')],['level',t('shop.sort_level')]].map(([val, label]) => (




                        <button




                          key={val}




                          onClick={() => { setSortBy(val as typeof sortBy); setShowSortDropdown(false); }}




                          className={`w-full px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-left transition-all ${




                            sortBy === val ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-white/5'




                          }`}




                        >




                          {label}




                        </button>




                      ))}




                    </div>




                  </div>




                )}




              </div>




            </div>




          </div>




        )}









        {/* Scrollable Content */}




        <div className="flex-1 overflow-y-auto px-5 pb-24 scrollbar-hide">




          <AnimatePresence mode="wait">




            {activeCategory === 'gift' ? (




              <motion.div




                key="gifthub-category"




                initial={{ opacity: 0, y: 10 }}




                animate={{ opacity: 1, y: 0 }}




                exit={{ opacity: 0, y: -10 }}




                className="w-full flex flex-col gap-5 py-4"




              >




                <div className="glass-card p-6 flex flex-col items-center text-center gap-4 border border-white/10 bg-slate-900/60 shadow-2xl relative overflow-hidden">




                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />




                  




                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 relative z-10 animate-bounce">




                    <Gift size={32} className="text-white drop-shadow" />




                  </div>




                  




                  <div className="space-y-1">




                    <h3 className="text-white font-black text-lg">{t('shop.gift_title')}</h3>




                    <p className="text-slate-400 text-xs leading-relaxed max-w-sm">

                      {t('shop.gift_desc')}

                    </p>




                  </div>









                  <div className="w-full space-y-3 mt-2 relative z-10">




                    <input




                      type="text"




                      value={giftCode}




                      onChange={(e) => setGiftCode(e.target.value)}




                      placeholder={t('shop.gift_placeholder')}




                      className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm font-bold focus:outline-none focus:border-amber-500 focus:bg-white/10 transition-all text-center tracking-wider"




                    />









                    <button




                      onClick={handleRedeem}




                      disabled={isRedeeming}




                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-sm uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"




                    >




                      {isRedeeming ? (




                        <>




                          <Loader2 size={16} className="animate-spin" />




                          {t('shop.gift_redeeming')}




                        </>




                      ) : (




                        <>

                          <Gift size={16} />

                          {t('shop.gift_redeem')}

                        </>




                      )}




                    </button>




                  </div>




                </div>









                <div className="glass-card p-5 border border-white/5 bg-slate-900/30 text-left space-y-3">




                  <h4 className="text-white font-bold text-xs flex items-center gap-1.5 text-amber-400">




                    <Sparkles size={14} /> {t('shop.gift_terms_title')}




                  </h4>




                  <ul className="text-slate-500 text-[10px] space-y-1.5 list-disc pl-4 font-medium leading-relaxed">




                    <li>{t('shop.gift_terms_1')}</li>




                    <li>{t('shop.gift_terms_2')}</li>




                    <li>{t('shop.gift_terms_3')}</li>




                    <li>{t('shop.gift_terms_4')}</li>




                  </ul>




                </div>




              </motion.div>




            ) : isShopLoading ? (




              <div className="flex flex-col justify-center items-center py-20 gap-3">




                <Loader2 className="animate-spin text-amber-500" size={32} />




                <p className="text-slate-500 font-bold uppercase text-[10px]">{t('common.loading')}</p>




              </div>




            ) : (




              <motion.div




                key={`${activeCategory}-${viewMode}`}




                initial={{ opacity: 0, y: 10 }}




                animate={{ opacity: 1, y: 0 }}




                exit={{ opacity: 0, y: -10 }}




                className="grid grid-cols-2 gap-3"




              >




                {filteredItems.map((item: ShopItem) => {




                  const requiredTier = getRequiredTier(item);




                  const isPremiumItem = !!requiredTier;




                  const canAccess = canAccessPremiumItem(item, profile?.subscription_tier);




                  const premiumTier = requiredTier;




                  return (




                    <ShopItemCard




                      key={item.id}




                      item={item}




                      isOwned={ownedItems.has(item.id)}




                      isEquipped={isItemEquipped(item)}




                      isProcessing={processingId === item.id}




                      isLocked={(profile?.level || 1) < getRequiredLevel(item) && !ownedItems.has(item.id)}




                      isPremium={isPremiumItem}




                      canAccess={canAccess}




                      premiumTier={premiumTier}




                      requiredLevel={getRequiredLevel(item)}




                      onBuy={handleBuy}




                      onEquip={handleEquip}




                      onPreview={setPreviewItem}




                    />




                  );




                })}




              </motion.div>




            )}




          </AnimatePresence>




          




          {viewMode === 'shop' && activeCategory === 'theme' && (




            <div className="mt-8 space-y-3">




              <button




                onClick={() => useUIStore.getState().setShowThemeCreator(true)}




                className="w-full py-3 rounded-2xl border border-white/10 bg-white/5 text-slate-300 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-white/10 hover:border-white/20"




              >




                <Sparkles size={14} />




                {t('shop.create_your_theme')}




              </button>




              <GachaMachine profile={profile} onSpendCoins={onSpendCoins} />




            </div>




          )}




        </div>









        {/* Preview Overlays */}




        <AnimatePresence>




          {previewItem && previewItem.category === 'theme' && (() => {




            const cfg = extractThemeConfig(previewItem);




            if (!cfg) return null;




            return (




              <ThemePreviewDetail




                key={previewItem.id}




                item={previewItem}




                themeCfg={cfg}




                isTrying={isTrying}




                onClose={() => { setPreviewItem(null); useAppStore.getState().setAppState({ themePreview: null }); }}




                onTry={() => handleTryTheme(previewItem)}




                onEquip={() => handleEquip(previewItem)}




              />




            );




          })()}









          {previewItem && previewItem.category === 'sound' && (




            <SoundPreviewDetail




              key={previewItem.id}




              item={previewItem}




              onClose={() => setPreviewItem(null)}




              onPlay={() => playNotificationSound(getSoundValue(previewItem))}




            />




          )}









          {/* Purchase Celebration */}




          {purchaseCelebration && (




            <motion.div




              initial={{ opacity: 0, scale: 0.95 }}




              animate={{ opacity: 1, scale: 1 }}




              exit={{ opacity: 0, scale: 0.95 }}




              className="absolute inset-0 z-30 flex items-center justify-center p-6"




              style={{ background: 'rgba(2,6,23,0.9)' }}




            >




              <motion.div




                initial={{ scale: 0.8, opacity: 0 }}




                animate={{ scale: 1, opacity: 1 }}




                transition={{ type: 'spring', damping: 15, stiffness: 200 }}




                className="w-full max-w-xs rounded-[2.5rem] overflow-hidden border border-white/10 bg-slate-900/90 backdrop-blur-2xl text-center"




              >




                <div className="h-32 relative overflow-hidden flex items-center justify-center"




                  style={{ background: 'radial-gradient(circle at 50% 50%, rgba(52,211,153,0.2), transparent)' }}>




                  <motion.div




                    initial={{ scale: 0, rotate: -20 }}




                    animate={{ scale: 1, rotate: 0 }}




                    transition={{ type: 'spring', damping: 12, stiffness: 150, delay: 0.1 }}




                    className="w-20 h-20 rounded-[1.25rem] flex items-center justify-center"




                    style={{




                      background: 'linear-gradient(135deg, #34d399, #10b981)',




                      boxShadow: '0 0 40px rgba(52,211,153,0.4)',




                    }}




                  >




                    <ShoppingBag size={32} className="text-white drop-shadow-lg" />




                  </motion.div>




                </div>









                <div className="p-6 space-y-4">




                  <div>




                    <motion.p




                      initial={{ opacity: 0, y: 10 }}




                      animate={{ opacity: 1, y: 0 }}




                      transition={{ delay: 0.2 }}




                      className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400"




                    >




                      {t('shop.purchase_success')}




                    </motion.p>




                    <motion.h3




                      initial={{ opacity: 0, y: 10 }}




                      animate={{ opacity: 1, y: 0 }}




                      transition={{ delay: 0.3 }}




                      className="text-white font-black text-xl mt-1"




                    >




                      {purchaseCelebration.name}




                    </motion.h3>




                    <motion.p




                      initial={{ opacity: 0, y: 10 }}




                      animate={{ opacity: 1, y: 0 }}




                      transition={{ delay: 0.4 }}




                      className="text-slate-400 text-[10px] mt-1"




                    >




                      {purchaseCelebration.description}




                    </motion.p>




                  </div>









                  <div className="flex gap-3">




                    <motion.button




                      initial={{ opacity: 0, y: 10 }}




                      animate={{ opacity: 1, y: 0 }}




                      transition={{ delay: 0.5 }}




                      onClick={() => {




                        equipMutation.mutate(purchaseCelebration);




                        setPurchaseCelebration(null);




                      }}




                      className="flex-1 py-4 rounded-2xl border border-white/10 text-white text-sm font-black uppercase tracking-wider transition-all active:scale-95 hover:bg-white/5"




                    >


                      {t('shop.equip_item')}


                    </motion.button>




                    <motion.button




                      initial={{ opacity: 0, y: 10 }}




                      animate={{ opacity: 1, y: 0 }}




                      transition={{ delay: 0.55 }}




                      onClick={() => {




                        const shareText = buildPurchaseShareText({




                          nickname: profileNickname as string | undefined,




                          itemName: purchaseCelebration.name,




                          itemCategory: purchaseCelebration.category,




                        });




                        setSocialComposer({ content: shareText, imageUrl: '', postKind: 'status', visibility: 'followers', eventType: 'purchase', referenceId: purchaseCelebration.id });




                        setShowSocialComposer(true);




                        setPurchaseCelebration(null);




                      }}




                      className="flex-1 py-4 rounded-2xl text-white text-sm font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"




                      style={{




                        background: 'linear-gradient(135deg, #34d399, #10b981)',




                        boxShadow: '0 0 25px rgba(52,211,153,0.3)',




                      }}




                    >




                      <Share2 size={16} />


                      {t('shop.share_purchase')}


                    </motion.button>




                  </div>









                </div>




              </motion.div>




            </motion.div>




          )}




        </AnimatePresence>




      </motion.div>




    </div>




  );




}