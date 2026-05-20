import { motion } from 'framer-motion';
import { HydrateSparkBottle } from './HydrateSparkBottle';

export function BottleVisualizer({
  isConnected, currentVolume, capacity, fillPercentage
}: {
  isConnected: boolean; currentVolume: number; capacity: number; fillPercentage: number;
}) {
  const displayVolume = isConnected ? currentVolume : 0;
  const pct = isConnected ? Math.round(fillPercentage) : 0;

  return (
    <div className="flex flex-col items-center py-4 relative">
      {/* Bottle Visual */}
      <div className="relative w-48 h-[260px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="w-full h-full"
        >
          <HydrateSparkBottle fillPercentage={fillPercentage} isConnected={isConnected} />
        </motion.div>
      </div>

      {/* Volume Display — Below bottle, no overlap */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-col items-center mt-2"
      >
        <div className="flex items-baseline gap-1.5">
          <motion.span
            key={displayVolume}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-4xl font-black text-white tracking-tighter tabular-nums"
            style={{ textShadow: '0 0 20px rgba(34,211,238,0.3)' }}
          >
            {displayVolume}
          </motion.span>
          <span className="text-sm font-bold text-cyan-400/70 tracking-wider uppercase">ml</span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <div className="h-px w-6 bg-gradient-to-r from-transparent to-white/15" />
          <span className="text-[10px] font-bold text-white/30 tracking-widest tabular-nums">/ {capacity}</span>
          <div className="h-px w-6 bg-gradient-to-l from-transparent to-white/15" />
        </div>

        {/* Fill percentage badge */}
        {isConnected && (
          <div className="mt-2 px-3 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/15">
            <span className="text-[9px] font-black text-cyan-400/80 tracking-widest uppercase tabular-nums">{pct}% đầy</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
