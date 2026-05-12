import { useState } from 'react';
import { ScanFace } from 'lucide-react';
import { useBiometric } from '../hooks/useBiometric';
import { motion, AnimatePresence } from 'framer-motion';

export default function LockedScreen({ profile, onUnlock, onLogout }: any) {
  const { authenticateBiometric, isAuthenticating } = useBiometric();
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  const handleUnlock = async () => {
    if (!profile?.id) return;
    const success = await authenticateBiometric(profile.id);
    if (success) {
      setIsUnlocked(true);
      setTimeout(() => {
        onUnlock();
      }, 300);
    }
  };

  return (
    <AnimatePresence>
      {!isUnlocked && (
        <motion.div 
          key="locked-screen"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 font-sans"
        >
          <button
            onClick={handleUnlock}
            disabled={isAuthenticating}
            className="w-24 h-24 bg-cyan-500/20 rounded-full flex items-center justify-center mb-6 border border-cyan-500/30 hover:bg-cyan-500/30 active:scale-90 transition-all duration-200 disabled:opacity-50"
          >
            <ScanFace size={44} className="text-cyan-400" />
          </button>
          <h2 className="text-2xl font-black mb-2">Đã khóa ứng dụng</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-center text-sm">DigiWell được bảo vệ bằng Sinh trắc học.<br/>Chạm vào biểu tượng để xác thực.</p>
          <button onClick={handleUnlock} disabled={isAuthenticating} className="w-full max-w-xs py-4 rounded-xl bg-cyan-500 text-white dark:text-black font-bold mb-4 shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 active:scale-95 transition-all">
            {isAuthenticating ? 'Đang xác thực...' : 'Mở khóa bằng Sinh trắc học'}
          </button>
          <button onClick={onLogout} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors text-sm font-medium">Đăng nhập bằng tài khoản khác</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
