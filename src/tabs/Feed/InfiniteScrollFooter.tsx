import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollFooterProps {
  hasPosts: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
}

export const InfiniteScrollFooter = forwardRef<HTMLDivElement, InfiniteScrollFooterProps>(
  ({ hasPosts, isFetchingMore, hasMore }, ref) => {
    if (!hasPosts) return null;

    return (
      <div ref={ref} className="py-8 text-center">
        {isFetchingMore ? (
          <Loader2 size={24} className="text-slate-500 animate-spin mx-auto" />
        ) : hasMore ? (
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Đang tải thêm...</p>
        ) : (
          <div>
            <div className="w-2 h-2 bg-slate-700 rounded-full mx-auto mb-3" />
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Đã xem hết tin</p>
          </div>
        )}
      </div>
    );
  }
);

InfiniteScrollFooter.displayName = 'InfiniteScrollFooter';
