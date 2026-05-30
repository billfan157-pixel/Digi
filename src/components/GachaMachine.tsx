import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Zap, Sparkles, RefreshCw, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';
import type { Profile } from '../models';

import { AppStorage } from '@/lib/storage';

interface GachaProps {
  profile: Profile | null;
  onSpendCoins: (amount: number) => Promise<boolean>;
}

const SLICES = [
  { id: 0, label: '50 Vàng', type: 'coin', value: 50, color: '#f59e0b', icon: Coins },
  { id: 1, label: '50 EXP', type: 'exp', value: 50, color: '#3b82f6', icon: Zap },
  { id: 2, label: '100 Vàng', type: 'coin', value: 100, color: '#f59e0b', icon: Coins },
  { id: 3, label: '100 EXP', type: 'exp', value: 100, color: '#3b82f6', icon: Zap },
  { id: 4, label: 'JACKPOT', type: 'coin', value: 500, color: '#ec4899', icon: Sparkles },
  { id: 5, label: '20 Vàng', type: 'coin', value: 20, color: '#f59e0b', icon: Coins },
];

export default function GachaMachine({ profile }: GachaProps) {
  const [canSpin, setCanSpin] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [reward, setReward] = useState<typeof SLICES[0] | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    const todayStr = new Date().toLocaleDateString('en-CA');
    const lastSpin = AppStorage.getItem(`digiwell_last_spin_${profile.id}`);
    if (lastSpin !== todayStr) {
      setTimeout(() => setCanSpin(true), 0);
    }
  }, [profile?.id]);

  const handleSpin = () => {
    if (!canSpin || isSpinning || !profile?.id) return;
    
    setIsSpinning(true);
    setReward(null);

    // Xác suất trúng: 20 Vàng (30%), 50 Vàng (30%), 50 EXP (20%), 100 Vàng (10%), 100 EXP (8%), JACKPOT (2%)
    const rand = Math.random() * 100;
    let targetIndex = 5; // 20 Vàng
    if (rand < 2) targetIndex = 4; // JACKPOT
    else if (rand < 10) targetIndex = 3; // 100 EXP
    else if (rand < 20) targetIndex = 2; // 100 Vàng
    else if (rand < 40) targetIndex = 1; // 50 EXP
    else if (rand < 70) targetIndex = 0; // 50 Vàng

    // Lắc góc ngẫu nhiên (±15 độ) để vòng quay dừng ở vị trí tự nhiên hơn
    const randomOffset = (Math.random() - 0.5) * 30;
    const targetAngle = 360 - (targetIndex * 60 + 30) + randomOffset;
    const extraSpins = 5 * 360;
    
    const currentMod = rotation % 360;
    const finalRotation = rotation + extraSpins + (targetAngle - currentMod + (targetAngle < currentMod ? 360 : 0));

    setRotation(finalRotation);

    // Đợi 5 giây cho hiệu ứng quay kết thúc
    setTimeout(async () => {
      const selectedPrize = SLICES[targetIndex];
      setReward(selectedPrize);
      setIsSpinning(false);
      setCanSpin(false);
      
      const todayStr = new Date().toLocaleDateString('en-CA');
      AppStorage.setItem(`digiwell_last_spin_${profile.id}`, todayStr);

      // Gọi Backend cập nhật tiền thưởng
      try {
        const { error } = await supabase.rpc('award_exp_and_rank', {
          p_user_id: profile.id,
          p_exp: selectedPrize.type === 'exp' ? selectedPrize.value : 0,
          p_coins: selectedPrize.type === 'coin' ? selectedPrize.value : 0
        });
        if (!error) {
          // Cập nhật lại UI thông qua Event Listener của App.tsx
          window.dispatchEvent(new CustomEvent('hydrationEvent', { detail: { refresh_profile: true } }));
        }
      } catch(e) { console.error(e); }

      confetti({
        particleCount: selectedPrize.value >= 100 ? 150 : 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: selectedPrize.type === 'coin' ? ['#f59e0b', '#fbbf24'] : ['#3b82f6', '#60a5fa']
      });
      
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);

    }, 5000);
  };

  return (
    <div className="mt-6 p-6 bg-slate-900/80 border border-slate-700/50 rounded-3xl relative overflow-hidden flex flex-col items-center">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-900/0 to-slate-900/0 pointer-events-none" />
      
      <div className="text-center relative z-10 mb-6">
        <h3 className="text-white font-black text-xl flex items-center justify-center gap-2 uppercase tracking-widest">
          <Star className="text-amber-400 fill-amber-400" size={20} /> Lucky Wheel
        </h3>
        <p className="text-slate-400 text-xs mt-1">Login daily to get 1 free spin!</p>
      </div>

      {/* BẢN ĐỒ VÒNG QUAY (ROULETTE WHEEL) */}
      <div className="relative w-64 h-64 mb-6 z-10">
        {/* Mũi tên chỉ thị */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rotate-45 z-20 shadow-lg drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
        
        {/* Trục Quay */}
        <div className="w-full h-full rounded-full border-8 border-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden bg-slate-900">
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 5, ease: [0.1, 2.5, 0.2, 1] }}
            className="w-full h-full rounded-full relative"
            style={{
              background: 'conic-gradient(#1e293b 0deg 60deg, #334155 60deg 120deg, #1e293b 120deg 180deg, #334155 180deg 240deg, #1e293b 240deg 300deg, #334155 300deg 360deg)'
            }}
          >
            {SLICES.map((slice, i) => {
              const centerAngle = i * 60 + 30;
              return (
                <div
                  key={i}
                  className="absolute top-0 left-1/2 w-20 h-[50%] origin-bottom flex flex-col items-center justify-start pt-4"
                  style={{ transform: `translateX(-50%) rotate(${centerAngle}deg)` }}
                >
                  <slice.icon size={24} style={{ color: slice.color }} className="mb-1" />
                  <span className="text-[10px] font-black text-white leading-none mt-1">{slice.label}</span>
                </div>
              );
            })}
          </motion.div>
        </div>
        
        {/* Tâm Vòng Quay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-slate-800 border-4 border-slate-700 rounded-full z-20 flex items-center justify-center shadow-inner">
          <div className="w-4 h-4 bg-amber-400 rounded-full shadow-[0_0_10px_#f59e0b]" />
        </div>
      </div>

      {/* MÀN HÌNH CHÚC MỪNG PHẦN THƯỞNG */}
      <AnimatePresence>
        {reward && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 rounded-3xl"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.5 }}
              className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.5)] mb-4"
            >
              <reward.icon size={48} className="text-white" />
            </motion.div>
            <h4 className="text-3xl font-black text-white mb-2">{reward.label}</h4>
            <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-8">Reward Received</p>
            <button
              onClick={() => setReward(null)}
              className="w-full py-4 rounded-xl bg-white text-slate-900 font-black text-sm active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Awesome!
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mt-2 w-full">
        <button
          onClick={handleSpin}
          disabled={!canSpin || isSpinning}
          className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
            canSpin 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95' 
              : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}
        >
          {isSpinning ? (
            <><RefreshCw size={18} className="animate-spin" /> SPINNING...</>
          ) : canSpin ? (
            'SPIN FREE'
          ) : (
            'ALREADY SPUN TODAY'
          )}
        </button>
      </div>
    </div>
  );
}