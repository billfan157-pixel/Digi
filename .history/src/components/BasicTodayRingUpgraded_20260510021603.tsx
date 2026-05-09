<div className="relative flex justify-center">
  <div className="relative h-64 w-64 sm:h-72 sm:w-72">
    <svg className="h-full w-full -rotate-90" viewBox="0 0 256 256" aria-hidden="true">
      <defs>
        <linearGradient id="ringMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>

        <linearGradient id="ringSoft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>

        <filter id="ringShadow">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* soft outer halo */}
      <circle
        cx="128"
        cy="128"
        r="98"
        fill="none"
        stroke="url(#ringSoft)"
        strokeWidth="18"
        opacity="0.35"
      />

      {/* track */}
      <circle
        cx="128"
        cy="128"
        r="88"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="16"
      />

      {/* subtle highlight */}
      <circle
        cx="128"
        cy="128"
        r="88"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="16"
        strokeLinecap="round"
        strokeDasharray="18 550"
        strokeDashoffset="12"
      />

      {/* progress ring */}
      <circle
        cx="128"
        cy="128"
        r="88"
        fill="none"
        stroke="url(#ringMain)"
        strokeWidth="16"
        strokeLinecap="round"
        strokeDasharray={2 * Math.PI * 88}
        strokeDashoffset={(1 - dailyPercent / 100) * (2 * Math.PI * 88)}
        filter="url(#ringShadow)"
        style={{
          transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />

      {/* tiny end cap glow */}
      <circle
        cx="128"
        cy="40"
        r="4.5"
        fill="#7dd3fc"
        opacity={dailyPercent > 0 ? 1 : 0.25}
        filter="url(#ringShadow)"
      />
    </svg>

    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
      <div className="mb-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-md">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Today
        </span>
      </div>

      <p
        className="text-5xl font-black leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-sky-400 to-violet-500"
        style={{
          textShadow: '0 0 18px rgba(56, 189, 248, 0.18)',
        }}
      >
        {mounted ? animatedPercent : 0}%
      </p>

      <p className="mt-3 text-xs font-medium text-slate-400">
        {waterIntake.toLocaleString('vi-VN')} / {waterGoal.toLocaleString('vi-VN')} ml
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-full border border-white/8 bg-slate-950/40 px-3 py-1.5">
        <Droplets size={14} className="text-cyan-400" />
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-300">
          {milestone.text}
        </span>
      </div>
    </div>
  </div>
</div>