import React, { useEffect, useState } from 'react';
import { X, ShoppingBag, Check, Sparkles, Palette, Frame, Droplets, Coins, Loader2, Package, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const getRarityStyles = (rarity?: string | null) => {
    switch (rarity) {
      case 'common': return 'border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
      case 'rare': return 'border-blue-500 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.3)]';
      case 'epic': return 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(147,51,234,0.3)]';
      case 'legendary': return 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
      default: return 'border-slate-700 bg-slate-800/50';
    }
  };

  // Lấy màu hiển thị cho Theme (hỗ trợ cả data cũ chưa có preview_color)
  let themeColor = item.preview_color;
  if (!themeColor && item.category === 'theme' && item.meta_value) {
    try {
      const meta = JSON.parse(item.meta_value);
      themeColor = meta.primary || meta.bg;
    } catch(e) {
      if (item.meta_value.startsWith('#')) {
        themeColor = item.meta_value;
      }
    }
  }

  return (
    <motion.div
      layout
      className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${isEquipped ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : getRarityStyles(item.rarity)} hover:scale-105`}
    >
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-full mb-3 object-cover border-2 border-slate-700" />
      ) : item.category === 'theme' && themeColor ? (
        <div 
          className="w-16 h-16 rounded-2xl mb-3 flex items-center justify-center relative transition-transform" 
          style={{ 
            backgroundColor: `${themeColor}15`, 
            border: `1px solid ${themeColor}40`,
            boxShadow: `0 8px 20px -4px ${themeColor}30`
          }}
        >
          <div className="absolute inset-0 opacity-30 rounded-2xl" style={{ background: `radial-gradient(circle at 50% 0%, ${themeColor}, transparent 70%)` }} />
          <Palette size={28} style={{ color: themeColor }} className="z-10 relative drop-shadow-sm" />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-full mb-3 bg-slate-700 flex items-center justify-center">
          {item.category === 'theme' && <Palette size={24} className="text-slate-400" />}
          {item.category === 'frame' && <Frame size={24} className="text-slate-400" />}
          {item.category === 'bottle' && <Droplets size={24} className="text-slate-400" />}
          {item.category === 'sound' && <Music size={24} className="text-slate-400" />}
        </div>
      )}
      <p className="text-white font-bold text-sm mb-1">{item.name}</p>
      <p className="text-slate-400 text-xs mb-3">{item.description}</p>
      <button
        disabled={isProcessing || isLocked}
        onClick={() => isOwned ? onEquip(item) : onBuy(item)}
        className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
          isEquipped
            ? 'bg-slate-700 text-slate-400'
            : isOwned
            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            : isLocked
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg'
        }`}
      >
        {isProcessing ? <><Loader2 size={14} className="animate-spin" /> Đang xử lý</> : isEquipped ? <><Check size={14} /> Đang dùng</> : isOwned ? <><Sparkles size={12} /> Trang bị</> : isLocked ? <>🔒 LV.{requiredLevel}</> : <><Coins size={12} /> {item.price}</>}
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
  const [currentTheme, setCurrentTheme] = useState<string>('');
  const [equippedSound, setEquippedSound] = useState<string | null>(profile?.equipped_notification_sound || null);

  useEffect(() => {
    if (profileId) {
      setEquippedBottleId(profile.equipped_bottle_id || null);
      setEquippedSound(profile.equipped_notification_sound || null);
      setCurrentTheme(readThemePreference(profileId));
    }
  }, [isOpen, profile?.equipped_bottle_id, profile?.equipped_notification_sound, profileId]);

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
    } catch (error) {
      console.error('Equip error:', error);
      toast.error('Trang bị thất bại!');
    } finally {
      setProcessingId(null);
    }
  };

  const isItemEquipped = (item: ShopItem) => {
    if (item.category === 'bottle') return equippedBottleId === item.id;
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
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-t-[2.5rem] sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto scrollbar-hide"
      >
        {/* Header & Credit Card */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-4 mb-6 border border-slate-700/50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex bg-slate-950/50 rounded-lg p-1 border border-white/5">
              <button onClick={() => setViewMode('shop')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'shop' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'}`}>Cửa hàng</button>
              <button onClick={() => setViewMode('inventory')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'inventory' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>Kho đồ</button>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400"><ShoppingBag size={24} /></div>
            <div>
              <p className="text-slate-400 text-xs font-bold">Thẻ Thành Viên</p>
              <p className="text-amber-400 text-2xl font-black flex items-center gap-2">
                <CountUp value={profile?.coins || 0} /> <Coins size={20} className="text-amber-400" />
              </p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory('theme')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeCategory === 'theme' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Palette size={16} /> 🎨 Giao Diện
          </button>
          <button
            onClick={() => setActiveCategory('frame')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeCategory === 'frame' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Frame size={16} /> 🖼️ Khung Avatar
          </button>
          <button
            onClick={() => setActiveCategory('bottle')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeCategory === 'bottle' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Droplets size={16} /> 💧 Skin Bình
          </button>
          <button
            onClick={() => setActiveCategory('sound')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeCategory === 'sound' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Music size={16} /> 🎵 Âm thanh
          </button>
        </div>

        {/* Item Grid */}
        <AnimatePresence mode="wait">
          {isShopLoading ? (
            <motion.div key="shop-loading" exit={{ opacity: 0 }} className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-cyan-500" size={32} />
            </motion.div>
          ) : (
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 gap-3"
            >
              {filteredItems.map((item: ShopItem) => {
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
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty Inventory */}
        {!isShopLoading && filteredItems.length === 0 && viewMode === 'inventory' && (
          <div className="mt-6 text-center p-8 border border-dashed border-slate-700 rounded-2xl bg-slate-800/20">
            <Package size={40} className="mx-auto text-slate-500 mb-3" />
            <p className="text-slate-400 text-sm font-medium">Kho đồ trống.</p>
            <p className="text-slate-500 text-xs mt-1">Hãy ghé Cửa hàng để săn thêm đồ xịn nhé!</p>
          </div>
        )}

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
