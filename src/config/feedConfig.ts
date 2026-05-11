// Feed configuration and constants

export const QUICK_REACTIONS = ['💧', '🔥', '👏', '❤️', '🙌', '✨'];

export const FALLBACK_DRINKS = ['Trà xanh', 'Cà phê đá', 'Nước lọc', 'Điện giải', 'Nước detox'];

export const FEED_MODES = ['smart', 'latest', 'following'] as const;
export const FEED_FILTERS = ['all', 'milestones', 'challenges'] as const;

export const FEED_MODE_LABELS: Record<string, string> = {
  smart: 'Gợi ý',
  latest: 'Mới nhất',
  following: 'Theo dõi',
};

export const POST_SIGNAL_COLORS = {
  challenge: {
    accentText: 'text-purple-300',
    cardClass: 'border-purple-500/30 bg-purple-500/5',
    panelClass: 'border-purple-500/20 bg-purple-500/10',
  },
  milestone: {
    accentText: 'text-orange-300',
    cardClass: 'border-orange-500/30 bg-orange-500/5',
    panelClass: 'border-orange-500/20 bg-orange-500/10',
  },
  daily_goal: {
    accentText: 'text-cyan-300',
    cardClass: 'border-cyan-500/25 bg-cyan-500/5',
    panelClass: 'border-cyan-500/20 bg-cyan-500/10',
  },
  image: {
    accentText: 'text-emerald-300',
    cardClass: 'border-emerald-500/25 bg-emerald-500/5',
    panelClass: 'border-emerald-500/20 bg-emerald-500/10',
  },
  default: {
    accentText: 'text-slate-300',
    cardClass: 'border-white/5 bg-slate-900/50',
    panelClass: 'border-white/10 bg-slate-950/40',
  },
};
