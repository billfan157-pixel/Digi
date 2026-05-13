import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

interface RippleRing {
  id: number;
  delay: number;
}

interface WaterSplashEffectProps {
  /** Tăng giá trị này mỗi lần muốn kích hoạt hiệu ứng */
  trigger: number;
  /** Lượng ml vừa uống — dùng để scale mức độ hiệu ứng */
  amount?: number;
}

export const WaterSplashEffect: React.FC<WaterSplashEffectProps> = ({ trigger, amount = 250 }) => {
  const [particles, setParticles] = useState<SplashParticle[]>([]);
  const [ripples, setRipples] = useState<RippleRing[]>([]);
  const [showFlash, setShowFlash] = useState(false);

  const spawn = useCallback(() => {
    // Scale số hạt theo lượng nước: 100ml → 8 hạt, 500ml → 20 hạt
    const count = Math.min(Math.max(Math.round(amount / 12), 8), 24);

    const newParticles: SplashParticle[] = Array.from({ length: count }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const dist = 40 + Math.random() * 80;
      return {
        id: Date.now() + i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 20, // Bay lên nhẹ
        size: 4 + Math.random() * 8,
        delay: Math.random() * 0.15,
        duration: 0.6 + Math.random() * 0.5,
      };
    });

    const newRipples: RippleRing[] = [
      { id: Date.now() + 100, delay: 0 },
      { id: Date.now() + 101, delay: 0.15 },
      { id: Date.now() + 102, delay: 0.35 },
    ];

    setParticles(newParticles);
    setRipples(newRipples);
    setShowFlash(true);

    setTimeout(() => setShowFlash(false), 300);
    setTimeout(() => { setParticles([]); setRipples([]); }, 1500);
  }, [amount]);

  useEffect(() => {
    if (trigger > 0) spawn();
  }, [trigger, spawn]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible z-40">
      {/* Flash trung tâm */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            key="splash-flash"
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{ scale: 1.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute w-32 h-32 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(34,211,238,0.5) 0%, rgba(34,211,238,0) 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Ripple rings */}
      <AnimatePresence>
        {ripples.map(r => (
          <motion.div
            key={r.id}
            initial={{ scale: 0.2, opacity: 0.7 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, delay: r.delay, ease: 'easeOut' }}
            className="absolute w-40 h-40 rounded-full border-2 border-cyan-400/60"
          />
        ))}
      </AnimatePresence>

      {/* Giọt nước bắn */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: p.x,
              y: p.y + 30, // Rơi xuống nhẹ do trọng lực
              scale: [0, 1.2, 0.6],
              opacity: [1, 0.9, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'easeOut',
            }}
            exit={{ opacity: 0 }}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: `radial-gradient(circle at 30% 30%, rgba(165,243,252,0.95), rgba(34,211,238,0.7))`,
              boxShadow: '0 0 6px rgba(34,211,238,0.5)',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default WaterSplashEffect;
