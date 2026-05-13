import React, { useEffect, useMemo, useState } from 'react';
import { X, ShoppingBag, Check, Sparkles, Palette, Frame, Droplets, Coins, Loader2, Package, Music, Box, ShoppingCart, Gem, Shield, Star, Lock } from 'lucide-react';
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
  common: { border: 'border-emerald-500/30', glow: 'rgba(52,211,153,0.15)', label: 'Thường', icon: Box, color: '#34d399' },
  rare: { border: 'border-sky-500/30', glow: 'rgba(56,189,248,0.2)', label: 'Hiếm', icon: Gem, color: '#38bdf8' },
  epic: { border: 'border-violet-500/30', glow: 'rgba(139,92,246,0.25)', label: 'Sử thi', icon: Shield, color: '#8b5cf6' },
  legendary: { border: 'border-amber-500/30', glow: 'rgba(245,158,11,0.3)', label: 'Huyền thoại', icon: Star, color: '#f59e0b' },
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl p-4 flex flex-col items-center text-center transition-all duration-300 group ${
        isEquipped
          ? 'border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
          : `${rarity.border} bg-slate-900/60 hover:bg-slate-800/60 hover:border-white/10`
      }`}
    >
      {/* Background glow on hover */}
      <div
        className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${rarity.glow}, transparent 70%)` }}
      />

      {item.image_url ? (
        <div className="relative mb-3 z-10">
          <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-full object-cover border-2 border-white/10" />
        </div>
      ) : item.category === 'theme' && themeColor ? (
        <div
          className="relative w-16 h-16 rounded-2xl mb-3 flex items-center justify-center overflow-hidden z-10"
          style={{
            background: `linear-gradient(135deg, ${themeColor}25, ${themeColor}10)`,
            border: `1px solid ${themeColor}40`,
            boxShadow: `0 8px 25px -4px ${themeColor}30`,
          }}
        >
          <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 50% 0%, ${themeColor}, transparent 70%)` }} />
          <Palette size={28} style={{ color: themeColor }} className="relative drop-shadow-lg" />
        </div>
      ) : item.category === 'frame' && item.preview_color ? (
        (() => {
          const frameCfg = getFrameConfig(item.id);
          return (
            <div className="relative w-16 h-16 mb-3 flex items-center justify-center z-10">
              {frameCfg?.effects}
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 bg-slate-800/80 ${frameCfg?.borderClasses || 'border-white/10'}`}>
                <Frame size={20} style={{ color: item.preview_color || '#64748b' }} />
              </div>
            </div>
          );
        })()
      ) : (
        <div className="relative w-16 h-16 rounded-2xl mb-3 bg-slate-800/60 border border-white/5 flex items-center justify-center z-10">
          {item.category === 'theme' && <Palette size={24} className="text-slate-400" />}
          {item.category === 'frame' && <Frame size={24} className="text-slate-400" />}
          {item.category === 'bottle' && <Droplets size={24} className="text-slate-400" />}
          {item.category === 'sound' && <Music size={24} className="text-slate-400" />}
        </div>
      )}

      {/* Rarity badge */}
      {item.rarity && item.rarity !== 'common' && (
        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 backdrop-blur-md z-20"
          style={{
            background: `${rarity.color}20`,
            border: `1px solid ${rarity.color}30`,
            color: rarity.color,
          }}
        >
          {React.createElement(rarity.icon, { size: 10 })}
          {rarity.label}
        </div>
      )}

      <p className="text-white font-bold text-sm mb-1 relative z-10">{item.name}</p>
      <p className="text-slate-400 text-[11px] mb-3 leading-relaxed relative z-10 line-clamp-2">{item.description}</p>

      <button
        disabled={isProcessing || isLocked}
        onClick={() => isOwned ? onEquip(item) : onBuy(item)}
        className={`relative z-10 w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
          isEquipped
            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
            : isOwned
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
            : isLocked
            ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed border border-white/5'
            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02]'
        }`}
      >
        {isProcessing ? (
          <><Loader2 size={14} className="animate-spin" /> Đang xử lý</>
        ) : isEquipped ? (
          <><Check size={14} /> Đang trang bị</>
        ) : isOwned ? (
          <><Sparkles size={12} /> Trang bị</>
        ) : isLocked ? (
          <><Lock size={12} /> LV {requiredLevel}</>
        ) : (
          <><Coins size={12} /> {item.price}</>
        )}
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
    toast.error('Giao dịch xu đang bị khóa cho tới khi mutation phía server được xác nhận đầy đủ.');
    return false;
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
    staleTime: 1000 * 60 * 60,
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

      queryClient.invalidateQueries({ queryKey: appQueryKeys.profile(profileId) }).catch(() => {});
      toast.success(`🎉 Mua thành công ${item.name}!`);
    },
  });

  const equipMutation = useMutation({
    mutationFn: (item: ShopItem) => equipShopItem(profileId!, item),
    onSuccess: ({ profile: updatedProfile, themeColor }, item) => {
      if (updatedProfile) {
        setProfile(updatedProfile);
        queryClient.setQueryData(appQueryKeys.profile(profileId), updatedProfile);
      }

      if (item.category === 'bottle') {
        setEquippedBottleId(item.id);
      }

      if (item.category === 'theme' && themeColor) {
        setCurrentTheme(themeColor);
        window.dispatchEvent(new CustomEvent('themeUpdated', { detail: { themeColor } }));
      }

      if (item.category === 'sound') {
        setEquippedSound(getSoundValue(item));
      }

      toast.success(`Đã trang bị ${item.name}!`);
    },
  });

  const handleBuy = async (item: ShopItem) => {
    if (!profileId || !profile) return;
    if (ownedItems.has(item.id)) return;

    if ((profile?.coins || 0) < item.price) {
      toast.error('Không đủ xu để mua!');
      return;
    }

    setProcessingId(item.id);
    try {
      await buyMutation.mutateAsync(item);
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Mua hàng thất bại!');
    } finally {
      setProcessingId(null);
    }
  };

  const handleEquip = async (item: ShopItem) => {
    if (!profileId || !profile) return;
    if (!ownedItems.has(item.id)) return;
    setProcessingId(item.id);

    try {
      await equipMutation.mutateAsync(item);
      if (item.category === 'bottle') {
        window.dispatchEvent(new CustomEvent('bottleEquipped', { detail: { equipped_bottle_id: item.id } }));
      }
      if (item.category === 'frame') {
        setEquippedFrameId(item.id);
      }
    } catch (error) {
      console.error('Equip error:', error);
      toast.error('Trang bị thất bại!');
    } finally {
      setProcessingId(null);
    }
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
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-0" onClick={onClose}>
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border border-white/5 rounded-t-[2.5rem] sm:rounded-3xl p-6 shadow-2xl shadow-black/40 max-h-[85vh] overflow-y-auto scrollbar-hide"
      >
        {/* Backdrop glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

        {/* Header & Coin Card */}
        <div className="relative mb-6">
          <div className="flex justify-between items-center mb-5">
            <div className="flex bg-slate-800/60 backdrop-blur-md rounded-xl p-1 border border-white/5">
              <button
                onClick={() => setViewMode('shop')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'shop'
                    ? 'bg-amber-500/15 text-amber-400 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShoppingCart size={14} /> Mua sắm
              </button>
              <button
                onClick={() => setViewMode('inventory')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'inventory'
                    ? 'bg-cyan-500/15 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Package size={14} /> Kho đồ
              </button>
            </div>
            <button onClick={onClose} className="p-2.5 bg-slate-800/80 backdrop-blur-md rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-white/5">
              <X size={18} />
            </button>
          </div>

          {/* Coin card — premium glass */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 via-slate-900/60 to-slate-800/40 border border-white/5 p-5">
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-amber-500/10 blur-[40px] rounded-full" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-xl border border-amber-500/20 shrink-0">
                <Coins size={24} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-0.5">Số dư</p>
                <p className="text-amber-400 text-2xl font-black">
                  <CountUp value={profile?.coins || 0} />
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 shrink-0">
                <ShoppingBag size={20} className="text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs — glass bubble */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {[
            { id: 'theme' as const, icon: Palette, label: 'Giao diện' },
            { id: 'frame' as const, icon: Frame, label: 'Khung Avatar' },
            { id: 'bottle' as const, icon: Droplets, label: 'Skin Bình' },
            { id: 'sound' as const, icon: Music, label: 'Âm thanh' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 active:scale-95 shrink-0 ${
                activeCategory === id
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                  : 'bg-slate-800/40 text-slate-400 hover:text-slate-300 border border-transparent hover:border-white/10 backdrop-blur-md'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Item Grid */}
        <AnimatePresence mode="wait">
          {isShopLoading ? (
            <motion.div key="shop-loading" exit={{ opacity: 0 }} className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-cyan-500" size={32} />
            </motion.div>
          ) : (
            <motion.div
              key={`${activeCategory}-${viewMode}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 gap-3"
            >
              {filteredItems.length > 0 ? filteredItems.map((item: ShopItem) => {
                const requiredLevel = getRequiredLevel(item);
                const isLocked = (profile?.level || 1) < requiredLevel && !ownedItems.has(item.id);

                return (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    isOwned={ownedItems.has(item.id)}
                    isEquipped={isItemEquipped(item)}
                    isProcessing={processingId === item.id}
                    isLocked={isLocked}
                    requiredLevel={requiredLevel}
                    onBuy={handleBuy}
                    onEquip={handleEquip}
                  />
                );
              }) : (
                <div className="col-span-2 mt-2 text-center p-10 border border-dashed border-white/5 rounded-2xl bg-slate-900/30 backdrop-blur-sm">
                  <Package size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400 text-sm font-bold mb-1">
                    {viewMode === 'inventory' ? 'Kho đồ trống' : 'Danh mục trống'}
                  </p>
                  <p className="text-slate-500 text-xs">Săn thêm đồ từ cửa hàng nhé</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {viewMode === 'shop' && (
          <GachaMachine 
            profile={profile} 
            onSpendCoins={onSpendCoins || (async () => false)} 
          />
        )}
      </motion.div>
    </div>
  );
}