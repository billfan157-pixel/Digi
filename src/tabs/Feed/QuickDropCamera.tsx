import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, RefreshCw, Repeat2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface QuickDropCameraProps {
  isOpen: boolean;
  isPublishing: boolean;
  onCapture: (blob: Blob) => Promise<void>;
  onClose: () => void;
}

export const QuickDropCamera = ({ isOpen, isPublishing, onCapture, onClose }: QuickDropCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState('');
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
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
        if (isMounted) setCameraError('Không mở được camera. Kiểm tra quyền camera rồi thử lại.');
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

    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Không thể tạo ảnh Drop.');
        return;
      }
      void onCapture(blob);
    }, 'image/jpeg', 0.92);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex justify-center bg-slate-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="relative h-full w-full max-w-md overflow-hidden bg-slate-950"
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${cameraFacing === 'user' ? '-scale-x-100' : ''}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-[calc(1rem+env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-md active:scale-95 disabled:opacity-50"
            aria-label="Đóng Drop"
          >
            <X size={20} />
          </button>
          <div className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-widest text-white backdrop-blur-md">
            Drop
          </div>
          <button
            type="button"
            onClick={() => setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')}
            disabled={isPublishing || isCameraLoading}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-md active:scale-95 disabled:opacity-50"
            aria-label="Đổi camera"
          >
            <Repeat2 size={19} />
          </button>
        </div>

        {(isCameraLoading || cameraError) && (
          <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-slate-950/85 p-5 text-center backdrop-blur-xl">
            {isCameraLoading ? (
              <>
                <Loader2 size={28} className="mx-auto mb-3 animate-spin text-cyan-300" />
                <p className="text-sm font-bold text-white">Đang mở camera...</p>
              </>
            ) : (
              <>
                <Camera size={30} className="mx-auto mb-3 text-slate-400" />
                <p className="text-sm font-bold text-white">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300 active:scale-95"
                >
                  <RefreshCw size={14} />
                  Thử lại
                </button>
              </>
            )}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleCapture}
            disabled={isPublishing || isCameraLoading || !!cameraError}
            className="flex h-20 w-20 items-center justify-center rounded-full border-[6px] border-white bg-white/20 text-white shadow-2xl backdrop-blur-md active:scale-95 disabled:opacity-50"
            aria-label="Chụp Drop"
          >
            {isPublishing ? <Loader2 size={28} className="animate-spin" /> : <span className="h-14 w-14 rounded-full bg-white" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
