import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
}

export const PullToRefresh = ({ onRefresh }: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const threshold = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === null) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;
    
    if (distance > 0 && distance < threshold * 1.5) {
      setPullDistance(Math.min(distance, threshold));
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    startY.current = null;
  }, [pullDistance, isRefreshing, onRefresh]);

  return (
    <div
      className="flex justify-center items-center overflow-hidden"
      style={{ height: Math.min(pullDistance, threshold) }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        animate={{ rotate: isRefreshing ? 360 : 0 }}
        transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
        className={`text-cyan-400 transition-opacity ${pullDistance >= threshold ? 'opacity-100' : 'opacity-50'}`}
      >
        <RefreshCw size={24} />
      </motion.div>
    </div>
  );
};