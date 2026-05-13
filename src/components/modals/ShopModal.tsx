import React, { useEffect, useMemo, useState } from 'react';
import { X, ShoppingBag, Check, Sparkles, Palette, Frame, Droplets, Coins, Loader2, Package, Music, Box, ShoppingCart, Gem, Shield, Star, Lock, Zap, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFrameConfig } from '../../config/avatarFrames';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CountUp from '../CountUp';
import GachaMachine from '../GachaMachine';
import type { Profile, ShopItem } from '../../models';
import { appQueryKeys } from '@/lib/queryKeys';
import { fetchProfileById } from '@/services/profile.service';
import { readThemePreference } from '@/services/appPreferences.service';
import { useUIStore } from '@/store/useUIStore';
import { useAppStore } from '@/store/useAppStore';
import {
  equipShopItem,
  fetchShopData,
  getRequiredLevel,
  getSoundValue,
  getThemeColor,
  purchaseShopItem,
} from '@/services/shop.service';

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
    label: 'Hiếm', 
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
    label: 'Huyền thoại', 
    icon: Crown, 
    color: '#fbbf24',
    text: 'text-amber-400'
  },
  mythic: { 
    border: 'border-rose-500/60', 
    bg: 'bg-rose-500/15',
    glow: 'rgba(244,63,94,0.5)', 
    label: 'Thần thoại', 
    icon: Zap, 
    color: '#f43f5e',
    text: 'text-rose-400'
  },
} as const;

interface ShopItemCardProps {
  item: ShopItem;
  isOwned: boolean;
  isEquipped: boolean;
  isProcessing: boolean;
  isLocked: boolean;
  requiredLevel: number;
  onBuy: (item: ShopItem) => void;
  onEquip: (item: ShopItem) => void;
}

const ShopItemCard: React.FC<ShopItemCardProps> = ({ item, isOwned, isEquipped, isProcessing, isLocked, requiredLevel, onBuy, onEquip }) => {
  const rarity = rarityConfig[item.rarity as keyof typeof rarityConfig] || rarityConfig.common;

  let themeColor = item.preview_color;
  if (!themeColor && item.category === 'theme' && item.meta_value) {
    try {
      const meta = JSON.parse(item.meta_value);
      themeColor = meta.primary || meta.bg;
    } catch(e) {
      if (item.meta_value.startsWith('#')) themeColor = item.meta_value;
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

      {/* Visual Preview - Smaller */}
      <div className="relative mb-2.5 z-10">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-full object-cover border-2 border-white/10" />
        ) : item.category === 'theme' && themeColor ? (
          <div
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${themeColor}, ${themeColor}60)`,
              boxShadow: `0 5px 15px -3px ${themeColor}40`,
            }}
          >
            <Palette size={24} className="text-white drop-shadow-lg" />
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
        ) : (
          <div className="relative w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            {item.category === 'bottle' && <Droplets size={24} className="text-slate-400" />}
            {item.category === 'sound' && <Music size={24} className="text-slate-400" />}
          </div>
        )}
      </div>

      {/* Rarity Label - Compact */}
      <div
        className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight mb-1.5 backdrop-blur-xl border ${rarity.text}`}
        style={{ backgroundColor: `${rarity.color}10`, borderColor: `${rarity.color}20` }}
      >
        <span className="flex items-center gap-1">
          {React.createElement(rarity.icon, { size: 8 })}
          {rarity.label}
        </span>
      </div>

      <h3 className="text-white font-bold text-[13px] mb-0.5 line-clamp-1">{item.name}</h3>
      <p className="text-slate-500 text-[9px] mb-3 leading-tight line-clamp-1 opacity-70">{item.description}</p>

      {/* Purchase/Equip Button - Slimmer */}
      <button
        disabled={isProcessing || isLocked}
        onClick={() => isOwned ? onEquip(item) : onBuy(item)}
        className={`w-full py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 ${
          isEquipped
            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
            : isOwned
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            : isLocked
            ? 'bg-slate-800/40 text-slate-500 border border-white/5'
            : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20'
        }`}
      >
        <span className="flex items-center justify-center gap-1.5">
          {isProcessing ? (
            <Loader2 size={12} className="animate-spin" />
          ) : isEquipped ? (
            <><Check size={14} strokeWidth={3} /> Dùng</>
          ) : isOwned ? (
            <><Zap size={14} fill="currentColor" /> Dùng</>
          ) : isLocked ? (
            <><Lock size={12} /> Cấp {requiredLevel}</>
          ) : (
            <><Coins size={14} fill="white" /> {item.price.toLocaleString()}</>
          )}
        </span>
      </button>
    </motion.div>
  );
};

export default function ShopModal() {
  const isOpen = useUIStore(s => s.showShopModal);
  const onClose = () => useUIStore.getState().setShowShopModal(false);
  const profile = useAppStore(s => s.profile);
  const setAppState = useAppStore(s => s.setAppState);
  
  const setProfile = (newProfileOrUpdater: any) => {
       const currentProfile = useAppStore.getState().profile;
       const newProfile = typeof newProfileOrUpdater === 'function' ? newProfileOrUpdater(currentProfile) : newProfileOrUpdater;
       setAppState({ profile: newProfile });
  };
  
  const onSpendCoins = async (amount: number) => {
    if (amount <= 0) return true;
    if (!profile?.id) return false;
    return true;
  };

  const queryClient = useQueryClient();
  const profileId = profile?.id;
  const shopQueryKey = appQueryKeys.shop(profileId);
  const [activeCategory, setActiveCategory] = useState<'theme' | 'frame' | 'bottle' | 'sound'>('theme');
  const [viewMode, setViewMode] = useState<'shop' | 'inventory'>('shop');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [equippedBottleId, setEquippedBottleId] = useState<string | null>(profile?.equipped_bottle_id || null);
  const [equippedFrameId, setEquippedFrameId] = useState<string | null>(profile?.equipped_frame_id || null);
  const [currentTheme, setCurrentTheme] = useState<string>('');
  const [equippedSound, setEquippedSound] = useState<string | null>(profile?.equipped_notification_sound || null);

  useEffect(() => {
    if (profileId) {
      setEquippedBottleId(profile.equipped_bottle_id || null);
      setEquippedFrameId(profile.equipped_frame_id || null);
      setEquippedSound(profile.equipped_notification_sound || null);
      setCurrentTheme(readThemePreference(profileId));
    }
  }, [isOpen, profile?.equipped_bottle_id, profile?.equipped_frame_id, profile?.equipped_notification_sound, profileId]);

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
      toast.success(`🎉 Đã sở hữu ${item.name}!`);
    },
  });

  const equipMutation = useMutation({
    mutationFn: (item: ShopItem) => equipShopItem(profileId!, item),
    onSuccess: ({ profile: updatedProfile, themeColor }, item) => {
      if (updatedProfile) setProfile(updatedProfile);
      if (item.category === 'bottle') setEquippedBottleId(item.id);
      if (item.category === 'theme' && themeColor) {
        setCurrentTheme(themeColor);
        window.dispatchEvent(new CustomEvent('themeUpdated', { detail: { themeColor } }));
      }
      if (item.category === 'sound') setEquippedSound(getSoundValue(item));
      toast.success(`Đã trang bị ${item.name}!`);
    },
  });

  const handleBuy = async (item: ShopItem) => {
    if (!profileId || !profile) return;
    if (ownedItems.has(item.id)) return;
    if ((profile?.coins || 0) < item.price) {
      toast.error('Cần thêm xu!');
      return;
    }
    setProcessingId(item.id);
    try { await buyMutation.mutateAsync(item); } 
    catch (e) { toast.error('Giao dịch thất bại'); }
    finally { setProcessingId(null); }
  };

  const handleEquip = async (item: ShopItem) => {
    if (!profileId || !profile || !ownedItems.has(item.id)) return;
    setProcessingId(item.id);
    try {
      await equipMutation.mutateAsync(item);
      if (item.category === 'bottle') window.dispatchEvent(new CustomEvent('bottleEquipped', { detail: { equipped_bottle_id: item.id } }));
      if (item.category === 'frame') setEquippedFrameId(item.id);
    } catch (e) { toast.error('Thử lại sau'); }
    finally { setProcessingId(null); }
  };

  const isItemEquipped = (item: ShopItem) => {
    if (item.category === 'bottle') return equippedBottleId === item.id;
    if (item.category === 'frame') return equippedFrameId === item.id;
    if (item.category === 'theme') return currentTheme === getThemeColor(item);
    if (item.category === 'sound') return equippedSound === getSoundValue(item);
    return false;
  };

  const filteredItems = items.filter((item: ShopItem) => {
    if (item.category !== activeCategory) return false;
    if (viewMode === 'inventory') return ownedItems.has(item.id);
    return true;
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
                <ShoppingCart size={12} /> Cửa hàng
              </button>
              <button
                onClick={() => setViewMode('inventory')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  viewMode === 'inventory' ? 'bg-cyan-500 text-white' : 'text-slate-400'
                }`}
              >
                <Package size={12} /> Kho đồ
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
                <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest">Số dư xu</p>
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
              { id: 'theme' as const, icon: Palette, label: 'Theme' },
              { id: 'frame' as const, icon: Frame, label: 'Khung' },
              { id: 'bottle' as const, icon: Droplets, label: 'Bình' },
              { id: 'sound' as const, icon: Music, label: 'Âm thanh' },
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-24 scrollbar-hide">
          <AnimatePresence mode="wait">
            {isShopLoading ? (
              <div className="flex flex-col justify-center items-center py-20 gap-3">
                <Loader2 className="animate-spin text-amber-500" size={32} />
                <p className="text-slate-500 font-bold uppercase text-[10px]">Đang tải...</p>
              </div>
            ) : (
              <motion.div
                key={`${activeCategory}-${viewMode}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 gap-3"
              >
                {filteredItems.map((item: ShopItem) => (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    isOwned={ownedItems.has(item.id)}
                    isEquipped={isItemEquipped(item)}
                    isProcessing={processingId === item.id}
                    isLocked={(profile?.level || 1) < getRequiredLevel(item) && !ownedItems.has(item.id)}
                    requiredLevel={getRequiredLevel(item)}
                    onBuy={handleBuy}
                    onEquip={handleEquip}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {viewMode === 'shop' && activeCategory === 'theme' && (
            <div className="mt-8">
              <GachaMachine profile={profile} onSpendCoins={onSpendCoins} />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}