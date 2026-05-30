import { Wifi, WifiOff, Upload, RefreshCw, X } from 'lucide-react';
import { clsx } from 'clsx';
import Button from './Button';

interface PendingSyncIndicatorProps {
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  onSyncNow: () => void;
  onDismiss?: () => void;
}

export default function PendingSyncIndicator({
  pendingCount,
  isOnline,
  isSyncing,
  onSyncNow,
  onDismiss,
}: PendingSyncIndicatorProps) {
  if (pendingCount === 0 && isOnline) return null;

  return (
    <div
      className={clsx(
        'fixed bottom-24 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-4 py-3 rounded-2xl',
        'backdrop-blur-xl border shadow-lg transition-all duration-300',
        isOnline
          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          : 'bg-rose-500/15 border-rose-500/30 text-rose-300',
      )}
    >
      {isOnline ? (
        <Upload className="w-5 h-5 shrink-0" />
      ) : (
        <WifiOff className="w-5 h-5 shrink-0" />
      )}

      <span className="text-sm font-medium whitespace-nowrap">
        {isOnline
          ? `${pendingCount} pending actions`
          : 'Offline'}
      </span>

      {isOnline && (
        <Button
          variant="ghost"
          className="!px-3 !py-1.5 !text-xs !rounded-xl"
          loading={isSyncing}
          icon={<RefreshCw className={clsx('w-4 h-4', isSyncing && 'animate-spin')} />}
          onClick={onSyncNow}
        >
          Đồng bộ
        </Button>
      )}

      {!isOnline && (
        <Wifi className="w-4 h-4 animate-pulse" />
      )}

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-1 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
