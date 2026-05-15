import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface NewPostsBannerProps {
  count: number;
  onShowNewPosts: () => void;
}

export const NewPostsBanner = ({ count, onShowNewPosts }: NewPostsBannerProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setTimeout(() => setVisible(true), 0);
      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setVisible(false), 0);
    }
  }, [count]);

  return (
    <AnimatePresence>
      {visible && count > 0 && (
        <motion.button
          key="new-posts-btn"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          onClick={() => { onShowNewPosts(); setVisible(false); }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2.5 rounded-full font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 active:scale-95 transition-transform"
        >
          <RefreshCw size={16} className="animate-spin-slow" /> Có {count} diễn biến mới
        </motion.button>
      )}
    </AnimatePresence>
  );
};
