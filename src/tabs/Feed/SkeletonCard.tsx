export const SkeletonCard = () => (
  <div className="bg-slate-900/50 rounded-3xl p-5 space-y-4 animate-pulse shadow-lg border border-white/5">
    <div className="flex gap-3 items-center">
      <div className="w-12 h-12 rounded-full bg-white/10" />
      <div className="space-y-2 flex-1">
        <div className="h-3 bg-white/10 rounded w-1/3" />
        <div className="h-2 bg-white/10 rounded w-1/4" />
      </div>
    </div>
    <div className="h-24 bg-white/10 rounded-2xl" />
  </div>
);
