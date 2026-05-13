import { useEffect, useRef, useState } from 'react';
import { 
  Camera, Loader2, RefreshCw, Repeat2, X, Zap, ZapOff, 
  Grid as GridIcon, Maximize2, Timer, Settings, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface QuickDropCameraProps {
  isOpen: boolean;
  isPublishing: boolean;
  onCapture: (blob: Blob) => Promise<void>;
  onClose: () => void;
}

// Camera countdown timer
function CountdownTimer({ count, onComplete }: { count: number; onComplete: () => void }) {
  useEffect(() => {
    if (count === 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => {}, 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  if (count === 0) return null;

  return (
    <motion.div
      key={count}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.5, opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div className="w-32 h-32 rounded-full bg-cyan-400/20 backdrop-blur-xl border-4 border-cyan-400 flex items-center justify-center">
        <span className="text-7xl font-black text-white number-glow">
          {count}
        </span>
      </div>
    </motion.div>
  );
}

// Camera settings panel
function CameraSettings({ 
  onClose, 
  gridEnabled, 
  onGridToggle,
  flashEnabled,
  onFlashToggle 
}: {
  onClose: () => void;
  gridEnabled: boolean;
  onGridToggle: () => void;
  flashEnabled: boolean;
  onFlashToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-x-5 bottom-32 glass-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white">Cài đặt Camera</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          aria-label="Đóng cài đặt"
        >
          <X size={18} className="text-slate-400" />
        </button>
      </div>

      {/* Grid toggle */}
      <button
        onClick={onGridToggle}
        className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-200 active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            gridEnabled ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-white/5'
          }`}>
            <GridIcon size={18} className={gridEnabled ? 'text-cyan-400' : 'text-slate-400'} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white">Lưới hướng dẫn</p>
            <p className="text-[10px] text-slate-400">Giúp căn chỉnh khung hình</p>
          </div>
        </div>
        {gridEnabled && <Check size={18} className="text-cyan-400" />}
      </button>

      {/* Flash toggle */}
      <button
        onClick={onFlashToggle}
        className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-200 active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            flashEnabled ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-white/5'
          }`}>
            {flashEnabled ? (
              <Zap size={18} className="text-amber-400" />
            ) : (
              <ZapOff size={18} className="text-slate-400" />
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white">Flash tự động</p>
            <p className="text-[10px] text-slate-400">Bật trong môi trường tối</p>
          </div>
        </div>
        {flashEnabled && <Check size={18} className="text-amber-400" />}
      </button>
    </motion.div>
  );
}

// Grid overlay component
function GridOverlay() {
  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.3 }}
      aria-hidden="true"
    >
      {/* Vertical lines */}
      <line x1="33.33%" y1="0" x2="33.33%" y2="100%" stroke="white" strokeWidth="1" />
      <line x1="66.66%" y1="0" x2="66.66%" y2="100%" stroke="white" strokeWidth="1" />
      {/* Horizontal lines */}
      <line x1="0" y1="33.33%" x2="100%" y2="33.33%" stroke="white" strokeWidth="1" />
      <line x1="0" y1="66.66%" x2="100%" y2="66.66%" stroke="white" strokeWidth="1" />
    </svg>
  );
}

// Focus indicator
function FocusIndicator({ x, y, show }: { x: number; y: number; show: boolean }) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ scale: 1.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="absolute pointer-events-none"
      style={{ 
        left: `${x}px`, 
        top: `${y}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="w-20 h-20 border-2 border-cyan-400 rounded-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 bg-cyan-400 rounded-full" />
        </div>
      </div>
    </motion.div>
  );
}


export const QuickDropCameraUltimate = ({ 
  isOpen, 
  isPublishing, 
  onCapture, 
  onClose 
}: QuickDropCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState('');
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setShowSettings(false);
      setCountdown(null);
      return;
    }

    let isMounted = true;
    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Thiết bị này chưa hỗ trợ camera trực tiếp.');
        return;
      }

      setIsCameraLoading(true);
      setCameraError('');
      stopCamera();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: cameraFacing,
            width: { ideal: 1080 },
            height: { ideal: 1440 },
          },
        });
        
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error('[QuickDropCamera] Camera error:', error);
        if (isMounted) {
          setCameraError('Không mở được camera. Kiểm tra quyền camera rồi thử lại.');
        }
      } finally {
        if (isMounted) setIsCameraLoading(false);
      }
    };

    void startCamera();
    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [cameraFacing, isOpen]);

  // Handle countdown completion
  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      handleCapture();
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle focus tap
  const handleFocusTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || showSettings) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setFocusPoint({ x, y });
    setTimeout(() => setFocusPoint(null), 1000);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || isPublishing || isCameraLoading) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      toast.error('Camera chưa sẵn sàng.');
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      toast.error('Không thể chụp Drop lúc này.');
      return;
    }

    // Apply zoom if needed
    if (zoom !== 1) {
      context.save();
      context.scale(zoom, zoom);
      context.translate(-((zoom - 1) * width) / 2, -((zoom - 1) * height) / 2);
      context.drawImage(video, 0, 0, width, height);
      context.restore();
    } else {
      context.drawImage(video, 0, 0, width, height);
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Không thể tạo ảnh Drop.');
        return;
      }
      void onCapture(blob);
    }, 'image/jpeg', 0.95);
  };

  const startCountdown = () => {
    setCountdown(3);
  };

  const switchCamera = () => {
    setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment');
    setZoom(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex justify-center bg-slate-950">
      <style>{`
        .number-glow {
          text-shadow: 0 0 30px rgba(34, 211, 238, 0.6);
        }
      `}</style>

      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="relative h-full w-full max-w-md overflow-hidden bg-slate-950"
      >
        {/* Video preview */}
        <div 
          className="relative h-full w-full overflow-hidden"
          onClick={handleFocusTap}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full object-cover transition-transform duration-300 ${
              cameraFacing === 'user' ? '-scale-x-100' : ''
            }`}
            style={{ transform: `scale(${zoom})` }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Grid overlay */}
          {gridEnabled && !isCameraLoading && !cameraError && <GridOverlay />}

          {/* Focus indicator */}
          <AnimatePresence>
            {focusPoint && (
              <FocusIndicator x={focusPoint.x} y={focusPoint.y} show={true} />
            )}
          </AnimatePresence>

          {/* Countdown timer */}
          <AnimatePresence>
            {countdown !== null && (
              <CountdownTimer 
                count={countdown} 
                onComplete={() => setCountdown(null)} 
              />
            )}
          </AnimatePresence>
        </div>

        {/* Vignette overlay */}
        <div 
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"
          aria-hidden="true"
        />

        {/* Top bar */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-5 pt-[calc(1rem+env(safe-area-inset-top))]">
          <motion.button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass-control flex h-11 w-11 items-center justify-center rounded-full text-white active:scale-95 disabled:opacity-50"
            aria-label="Đóng Drop"
          >
            <X size={20} />
          </motion.button>

          <div className="glass-card-strong px-4 py-2 flex items-center gap-2">
            <Camera size={14} className="text-cyan-400" aria-hidden="true" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">
              Drop
            </span>
          </div>

          <motion.button
            type="button"
            onClick={switchCamera}
            disabled={isPublishing || isCameraLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass-control flex h-11 w-11 items-center justify-center rounded-full text-white active:scale-95 disabled:opacity-50"
            aria-label="Đổi camera"
          >
            <Repeat2 size={19} />
          </motion.button>
        </div>

        {/* Loading / Error state */}
        <AnimatePresence>
          {(isCameraLoading || cameraError) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-x-5 top-1/2 -translate-y-1/2"
            >
              <div className="glass-card-strong p-6 text-center">
                {isCameraLoading ? (
                  <>
                    <Loader2 size={32} className="mx-auto mb-3 animate-spin text-cyan-400" />
                    <p className="text-sm font-bold text-white">Đang mở camera...</p>
                    <p className="text-xs text-slate-400 mt-1">Vui lòng chờ trong giây lát</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-3">
                      <Camera size={24} className="text-rose-400" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">{cameraError}</p>
                    <p className="text-xs text-slate-400 mb-4">
                      Kiểm tra quyền truy cập camera trong cài đặt
                    </p>
                    <button
                      type="button"
                      onClick={switchCamera}
                      className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-bold text-cyan-400 transition-all duration-200 hover:bg-cyan-500/20 active:scale-95"
                    >
                      <RefreshCw size={16} />
                      Thử camera khác
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <CameraSettings
              onClose={() => setShowSettings(false)}
              gridEnabled={gridEnabled}
              onGridToggle={() => setGridEnabled(v => !v)}
              flashEnabled={flashEnabled}
              onFlashToggle={() => setFlashEnabled(v => !v)}
            />
          )}
        </AnimatePresence>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between mb-6">
            {/* Timer button */}
            <motion.button
              type="button"
              onClick={startCountdown}
              disabled={isPublishing || isCameraLoading || !!cameraError || countdown !== null}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass-control flex h-12 w-12 items-center justify-center rounded-full disabled:opacity-50"
              aria-label="Đặt hẹn giờ 3 giây"
            >
              <Timer size={20} className="text-white" />
            </motion.button>

            {/* Capture button */}
            <motion.button
              type="button"
              onClick={handleCapture}
              disabled={isPublishing || isCameraLoading || !!cameraError || countdown !== null}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-20 w-20 items-center justify-center rounded-full border-[6px] border-white bg-white/20 shadow-2xl backdrop-blur-md disabled:opacity-50"
              aria-label="Chụp Drop"
            >
              {isPublishing ? (
                <Loader2 size={28} className="animate-spin text-white" />
              ) : (
                <span className="h-14 w-14 rounded-full bg-white" />
              )}
            </motion.button>

            {/* Settings button */}
            <motion.button
              type="button"
              onClick={() => setShowSettings(v => !v)}
              disabled={isPublishing || isCameraLoading || !!cameraError}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`glass-control flex h-12 w-12 items-center justify-center rounded-full disabled:opacity-50 ${
                showSettings ? 'bg-cyan-500/20 border-cyan-500/30' : ''
              }`}
              aria-label="Cài đặt camera"
            >
              <Settings size={20} className={showSettings ? 'text-cyan-400' : 'text-white'} />
            </motion.button>
          </div>

          {/* Zoom slider */}
          {!showSettings && !isCameraLoading && !cameraError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3"
            >
              <span className="text-xs font-bold text-white/60">1x</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-32 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
                aria-label="Zoom camera"
              />
              <span className="text-xs font-bold text-white/60">3x</span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export { QuickDropCameraUltimate as QuickDropCamera };