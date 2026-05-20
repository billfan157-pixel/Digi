import { motion } from 'framer-motion';
import { Droplet, GlassWater, RefreshCw, Zap, Activity, ChevronRight } from 'lucide-react';

export function ControlDeck({
  isConnected, isSyncing, onDrink, onRefill, onForceSync,
}: {
  isConnected: boolean; isSyncing: boolean; onDrink: (amount: number) => void; onRefill: () => void; onForceSync: () => void;
}) {
  const controls = [
    { id: 'sip-50', label: 'SIP', sub: '+50ml', icon: <Droplet size={22} />, color: '#22d3ee', onClick: () => onDrink(50) },
    { id: 'sip-250', label: 'GULP', sub: '+250ml', icon: <GlassWater size={22} />, color: '#3b82f6', onClick: () => onDrink(250) },
    { id: 'refill', label: 'REFILL', sub: 'Fill Tank', icon: <RefreshCw size={22} />, color: '#10b981', onClick: onRefill },
    { id: 'sync', label: 'BOOST', sub: 'Overclock', icon: <Zap size={22} />, color: '#d946ef', onClick: onForceSync },
  ];

  return (
    <div className="rounded-[2.5rem] border border-white/5 bg-slate-900/40 backdrop-blur-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black">Manual Overrides</p>
          <h3 className="text-xl font-black text-white mt-1">Hệ thống nạp</h3>
        </div>
        <Activity size={18} className="text-white/10" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {controls.map(control => (
          <motion.button
            key={control.id}
            whileTap={{ scale: 0.95 }}
            disabled={!isConnected || isSyncing}
            onClick={control.onClick}
            className="group relative rounded-3xl border border-white/5 bg-slate-950/40 p-5 text-left transition-all hover:bg-slate-900/60 hover:border-white/10 disabled:opacity-40"
          >
            {/* Action color glow */}
            <div
              className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"
              style={{ background: control.color }}
            />

            <div className="flex items-center justify-between mb-5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-slate-900 shadow-inner group-hover:scale-110 transition-transform"
                style={{ color: control.color }}
              >
                {control.icon}
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>

            <p className="text-sm font-black text-white tracking-wider">{control.label}</p>
            <p className="text-[10px] text-slate-500 mt-1 font-bold tracking-widest uppercase">{control.sub}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
