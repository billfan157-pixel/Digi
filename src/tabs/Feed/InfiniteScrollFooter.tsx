import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollFooterProps {
  hasPosts: boolean;
  isFetchingMore: boolean;
  hasMore: boolean;
}

export const InfiniteScrollFooter = forwardRef<HTMLDivElement, InfiniteScrollFooterProps>(
  ({ hasPosts, isFetchingMore, hasMore }, ref) => {
    return (
      <div ref={ref} className="py-8 text-center">
        {!hasPosts ? null : isFetchingMore ? (
          <Loader2 size={24} className="text-slate-500 animate-spin mx-auto" />
        ) : hasMore ? (
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Loading more...</p>
        ) : (
          <div>
            <div className="w-2 h-2 bg-slate-700 rounded-full mx-auto mb-3" />
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">You have seen all posts</p>
          </div>
        )}
      </div>
    );
  }
);

InfiniteScrollFooter.displayName = 'InfiniteScrollFooter';
