import { useState, useEffect } from 'react';
import { X, Timer, Flame, Info } from 'lucide-react';
import { motion } from 'framer-motion';

import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';

const PLANS = [
  { hours: 16, label: '16:8', desc: 'Phổ biến nhất. Nhịn 16h, ăn 8h.' },
  { hours: 18, label: '18:6', desc: 'Đốt mỡ nhanh. Nhịn 18h, ăn 6h.' },
  { hours: 20, label: '20:4', desc: 'Chiến binh (Warrior Diet).' },
  { hours: 23, label: 'OMAD', desc: 'Một bữa một ngày (23:1).' },
];

export default function FastingModal() {
  const isOpen = useUIStore(s => s.showFastingModal);
  const onClose = () => useUIStore.getState().setShowFastingModal(false);
  
  const { isFastingMode, fastingPlanHours, fastingTotalMs, fastingStartTime } = useAppStore(s => s.fastingState);
  const startFasting = useAppStore(s => s.actions.startFasting);
  const stopFasting = useAppStore(s => s.actions.stopFasting);
  const [selectedPlan, setSelectedPlan] = useState(fastingPlanHours);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (isOpen && isFastingMode) {
      setTimeout(() => setNow(Date.now()), 0);
      const timer = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(timer);
    }

    if (isOpen) {
      setTimeout(() => setNow(0), 0);
    }
  }, [isOpen, isFastingMode]);

  if (!isOpen) return null;

  const fastingElapsed = isFastingMode && fastingStartTime ? now - fastingStartTime : 0;
  const progress = Math.min((fastingElapsed / fastingTotalMs) * 100, 100);
  const isCompleted = fastingElapsed >= fastingTotalMs;

  const remainingMs = Math.max(fastingTotalMs - fastingElapsed, 0);
  const h = Math.floor(remainingMs / (1000 * 60 * 60));
  const m = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((remainingMs % (1000 * 60)) / 1000);

  const elapsedH = Math.floor(fastingElapsed / (1000 * 60 * 60));
  const elapsedM = Math.floor((fastingElapsed % (1000 * 60 * 60)) / (1000 * 60));

  const STROKE_WIDTH = 12;
  const RADIUS = 110;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress / 100);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-6" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-md bg-slate-900 border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 shrink-0 sm:hidden" />
        
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1">
              <Flame size={12} /> Advanced Tracker
            </p>
            <h3 className="text-2xl font-black text-white mt-1">
              Nhịn Ăn Gián Đoạn
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-hide pb-6 flex-1">
          {!isFastingMode ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-400 mb-2">Chọn chế độ phù hợp với cơ thể bạn:</p>
              {PLANS.map(plan => (
                <button
                  key={plan.hours}
                  onClick={() => setSelectedPlan(plan.hours)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 ${
                    selectedPlan === plan.hours 
                      ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]' 
                      : 'bg-slate-800/50 border-white/5 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`text-lg font-black ${selectedPlan === plan.hours ? 'text-orange-400' : 'text-white'}`}>
                        {plan.label}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">{plan.desc}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.hours ? 'border-orange-500' : 'border-slate-600'}`}>
                      {selectedPlan === plan.hours && <div className="w-3 h-3 rounded-full bg-orange-500" />}
                    </div>
                  </div>
                </button>
              ))}

              <div className="mt-6 p-4 rounded-2xl bg-cyan-950/30 border border-cyan-900/50 flex gap-3">
                <Info size={20} className="text-cyan-500 shrink-0" />
                <p className="text-xs text-cyan-200/70 leading-relaxed">
                  Trong khi Fasting, AI sẽ đẩy thông báo nhắc bạn uống nước lọc, trà xanh hoặc cà phê đen để giảm cảm giác đói và duy trì Ketosis.
                </p>
              </div>

              <button 
                onClick={() => startFasting(selectedPlan)}
                className="w-full mt-4 py-4 rounded-2xl bg-orange-500 text-slate-950 font-black text-lg active:scale-95 transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)]"
              >
                Bắt đầu Fasting
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center pt-4">
              <div className="relative flex items-center justify-center my-6">
                <svg width="260" height="260" viewBox="0 0 240 240" className="-rotate-90">
                  <circle cx="120" cy="120" r={RADIUS} strokeWidth={STROKE_WIDTH} className="stroke-slate-800" fill="none" />
                  <motion.circle cx="120" cy="120" r={RADIUS} strokeWidth={STROKE_WIDTH} className={isCompleted ? "stroke-emerald-400" : "stroke-orange-500"} fill="none" strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} initial={{ strokeDashoffset: CIRCUMFERENCE }} animate={{ strokeDashoffset }} transition={{ duration: 1, ease: "easeOut" }} />
                </svg>
                <div className="absolute text-center flex flex-col items-center">
                  <Timer size={24} className={isCompleted ? "text-emerald-400 mb-2" : "text-orange-500 mb-2"} />
                  <p className="text-4xl font-black text-white font-mono-tech tracking-tight">
                    {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {isCompleted ? 'Đã hoàn thành' : 'Còn lại'}
                  </p>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-4 text-center"><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Đã trôi qua</p><p className="text-xl font-bold text-white">{elapsedH}h {elapsedM}m</p></div>
                <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-4 text-center"><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Mục tiêu</p><p className="text-xl font-bold text-white">{fastingPlanHours}h</p></div>
              </div>

              <button onClick={stopFasting} className="w-full py-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black text-sm active:scale-95 transition-all hover:bg-rose-500/20">Kết thúc Fasting</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
