import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { RefreshCcw, AlertTriangle } from 'lucide-react';
import { Sentry } from '@/lib/sentry';

function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  React.useEffect(() => {
    if (Sentry.getCurrentScope()) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
        <AlertTriangle className="text-red-500 w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        Đã có lỗi xảy ra
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-[280px]">
        {error instanceof Error ? error.message : 'Màn hình này tạm thời không thể hiển thị do lỗi kĩ thuật.'}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl transition-colors"
      >
        <RefreshCcw size={18} />
        Thử lại
      </button>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}
