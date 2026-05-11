import React from 'react';
import AvatarFrame from '@/components/AvatarFrame';
import type { Profile } from '@/models';

interface TabHeaderProps {
  label: string;
  title: React.ReactNode;
  profile?: Profile | null;
  actionIcon?: React.ReactNode;
  onActionClick?: () => void;
  onAvatarClick?: () => void;
}

/** Shared header component — identical structure across all tabs */
export default function TabHeader({
  label,
  title,
  profile,
  actionIcon,
  onActionClick,
  onAvatarClick,
}: TabHeaderProps) {
  return (
    <div className="flex justify-between items-center pt-2 pb-3 px-6 relative z-20">
      <div className="flex-1 pr-4">
        <p className="section-title text-slate-400 mb-1.5">{label}</p>
        <h1 className="text-3xl font-black tracking-tighter text-white leading-tight">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actionIcon && (
          <button
            onClick={onActionClick}
            className="w-11 h-11 rounded-xl bg-slate-800/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/15 active:scale-90 transition-all duration-200 ease-out shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] group"
          >
            <span className="group-hover:scale-110 transition-transform flex items-center justify-center">
              {actionIcon}
            </span>
          </button>
        )}
        <button
          onClick={onAvatarClick}
          className="rounded-full active:scale-90 transition-all duration-200 ease-out flex items-center justify-center hover:scale-105"
        >
          <AvatarFrame
            size="sm"
            level={profile?.level || 1}
            avatarUrl={profile?.avatar_url ?? null}
            nickname={profile?.nickname}
            showBadge={false}
          />
        </button>
      </div>
    </div>
  );
}