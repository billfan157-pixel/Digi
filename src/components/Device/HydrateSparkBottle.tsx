import { motion } from 'framer-motion';

export function HydrateSparkBottle({
  fillPercentage,
  isConnected
}: {
  fillPercentage: number;
  isConnected: boolean;
}) {
  const fillPct = isConnected ? Math.min(Math.max(fillPercentage, 0), 100) : 0;
  const isLowWater = fillPct < 20 && isConnected;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-end">
      {/* ── Complete Bottle Assembly ── */}
      <div className="relative w-[72px] flex-1 max-h-[94%] flex flex-col items-center">

        {/* ═══ 1. FLIP-TOP CAP ASSEMBLY ═══ */}
        <div className="relative z-20 flex-shrink-0 w-[56px] h-[52px] mb-[-2px]">

          {/* Cap top dome (the flip lid) */}
          <div className="absolute top-0 left-[4px] right-[4px] h-[22px] rounded-t-[14px] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #8a949e 0%, #6d7680 30%, #5a6370 60%, #4e5862 100%)',
              boxShadow: 'inset 0 2px 1px rgba(255,255,255,0.18), inset 0 -1px 2px rgba(0,0,0,0.15)'
            }}
          >
            {/* Hinge mechanism */}
            <div className="absolute top-[4px] left-1/2 -translate-x-1/2 w-[26px] h-[4px] rounded-full"
              style={{
                background: 'linear-gradient(to bottom, #9aa3ad, #737c86)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 1px 1px rgba(0,0,0,0.15)'
              }}
            />
            {/* Flip latch / push button */}
            <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[14px] h-[6px] rounded-[3px]"
              style={{
                background: 'linear-gradient(to bottom, #b0b8c0, #8a929a)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3)'
              }}
            />
            {/* Subtle groove line */}
            <div className="absolute bottom-0 left-[6px] right-[6px] h-[1px]"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            />
          </div>

          {/* Spout lip (the drink opening visible when open) */}
          <div className="absolute top-[20px] left-[3px] right-[3px] h-[8px]"
            style={{
              background: 'linear-gradient(to bottom, #5a6370 0%, #4e5862 50%, #525b65 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.2)',
              borderRadius: '2px 2px 4px 4px'
            }}
          />

          {/* Cap collar / neck ring (wider, connects to body) */}
          <div className="absolute bottom-0 left-0 right-0 h-[24px] overflow-hidden"
            style={{
              borderRadius: '4px 4px 6px 6px',
              background: 'linear-gradient(to bottom, #6b747e 0%, #5e6770 30%, #535c65 60%, #4a535e 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 3px 6px rgba(0,0,0,0.3)'
            }}
          >
            {/* Ring detail lines */}
            <div className="absolute top-[3px] left-[2px] right-[2px] h-[1px]" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="absolute bottom-[3px] left-0 right-0 h-[1px]" style={{ background: 'rgba(0,0,0,0.25)' }} />
            {/* Center grip ridge */}
            <div className="absolute top-[8px] left-[3px] right-[3px] h-[6px]"
              style={{
                background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 2px)',
                borderRadius: '2px'
              }}
            />
          </div>
        </div>

        {/* ═══ 2. SHOULDER (tapers from cap width to body width) ═══ */}
        <div className="relative flex-shrink-0 w-full h-[18px] -mt-[1px]"
          style={{
            background: 'linear-gradient(to right, #3d424a 0%, #5e6770 12%, #8e98a2 28%, #b5bdc5 42%, #ccd3d9 50%, #b5bdc5 58%, #8e98a2 72%, #5e6770 88%, #3d424a 100%)',
            borderRadius: '3px 3px 0 0',
            clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)'
          }}
        >
          {/* Shoulder highlight */}
          <div className="absolute left-[22%] top-0 bottom-0 w-[4px] rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(255,255,255,0.1))',
              filter: 'blur(1px)'
            }}
          />
        </div>

        {/* ═══ 3. BRUSHED STEEL BODY (tall cylinder) ═══ */}
        <div className="relative w-full flex-1 min-h-0 overflow-hidden -mt-[1px]"
          style={{
            borderRadius: '2px 2px 0 0',
            background: 'linear-gradient(to right, #3a3f47 0%, #535c65 8%, #6d7680 14%, #8e98a2 24%, #a8b2bb 34%, #bcc4cc 44%, #ccd3d9 50%, #bcc4cc 56%, #a8b2bb 66%, #8e98a2 76%, #6d7680 86%, #535c65 92%, #3a3f47 100%)',
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.5)'
          }}
        >
          {/* Brushed metal texture (fine horizontal lines) */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.6) 1px, rgba(255,255,255,0.6) 2px)',
              backgroundSize: '100% 2px'
            }}
          />

          {/* Primary specular highlight (left) */}
          <div className="absolute left-[20%] top-[2%] bottom-[2%] w-[5px] rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 15%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.4) 85%, rgba(255,255,255,0) 100%)',
              filter: 'blur(1.5px)'
            }}
          />

          {/* Secondary specular (right, subtle) */}
          <div className="absolute right-[24%] top-[4%] bottom-[4%] w-[3px] rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 25%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.12) 75%, rgba(255,255,255,0) 100%)',
              filter: 'blur(1px)'
            }}
          />

          {/* Edge darkening (left & right) */}
          <div className="absolute left-0 top-0 bottom-0 w-[6px] pointer-events-none"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.15), transparent)' }}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[6px] pointer-events-none"
            style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.15), transparent)' }}
          />

          {/* ── Branding (vertical) — "DigiWell" ── */}
          <div className="absolute bottom-[30%] right-[14%] pointer-events-none" style={{ writingMode: 'vertical-rl' }}>
            <span className="text-[7px] font-black tracking-[0.35em] uppercase"
              style={{ color: 'rgba(55,60,70,0.55)', textShadow: '0 0.5px 0 rgba(255,255,255,0.1)' }}
            >DigiWell</span>
          </div>

          {/* Capacity sub-label */}
          <div className="absolute bottom-[22%] right-[14%] pointer-events-none" style={{ writingMode: 'vertical-rl' }}>
            <span className="text-[5px] font-bold tracking-wider" style={{ color: 'rgba(55,60,70,0.35)' }}>750 ml</span>
          </div>

          {/* ── Water level indicator (sleek side strip) ── */}
          <div className="absolute left-[12%] top-[8%] bottom-[6%] w-[3.5px] rounded-full overflow-hidden pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.12)' }}
          >
            <motion.div
              className="absolute bottom-0 left-0 right-0"
              initial={false}
              animate={{ height: `${fillPct}%` }}
              transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: isLowWater ? [0.6, 1, 0.6] : [0.7, 1, 0.7] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background: isLowWater
                    ? 'linear-gradient(to top, #fbbf24, #f59e0b)'
                    : 'linear-gradient(to top, #22d3ee, #06b6d4)',
                  boxShadow: isLowWater
                    ? '0 0 8px rgba(251,191,36,0.8)'
                    : '0 0 8px rgba(34,211,238,0.7)',
                  borderRadius: '2px'
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* ═══ 4. RAINBOW LED BASE (frosted translucent) ═══ */}
        <div className="relative flex-shrink-0 w-[76px] h-[28px] -mt-[1px] z-10">
          {/* Physical base housing */}
          <div className="absolute inset-0 rounded-b-[12px] overflow-hidden"
            style={{
              background: 'linear-gradient(to bottom, #4a535e 0%, #3a3f47 40%, #2e343b 100%)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
            }}
          >
            {/* Rainbow LED strip — full width, frosted glass look */}
            {isConnected && (
              <motion.div
                className="absolute inset-x-0 bottom-0 h-[22px] rounded-b-[12px]"
                animate={{
                  filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)']
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                style={{
                  background: 'linear-gradient(to right, #ff0044 0%, #ff4400 10%, #ff8800 18%, #ffcc00 28%, #88ff00 38%, #00ff66 48%, #00ffcc 58%, #0088ff 68%, #4400ff 78%, #8800ff 86%, #cc00ff 93%, #ff0066 100%)',
                  opacity: 0.9
                }}
              />
            )}
            {!isConnected && (
              <div className="absolute inset-x-0 bottom-0 h-[22px] rounded-b-[12px]"
                style={{
                  background: 'linear-gradient(to right, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)'
                }}
              />
            )}
            {/* Frosted glass overlay for LED diffusion */}
            <div className="absolute inset-0 rounded-b-[12px]"
              style={{
                background: 'linear-gradient(to bottom, rgba(50,56,64,0.7) 0%, rgba(50,56,64,0.15) 40%, transparent 70%)',
              }}
            />
            {/* Subtle inner glow on the translucent edge */}
            {isConnected && (
              <div className="absolute inset-x-[2px] bottom-[2px] h-[8px] rounded-b-[10px]"
                style={{
                  background: 'linear-gradient(to top, rgba(255,255,255,0.08), transparent)',
                }}
              />
            )}
          </div>

          {/* Bloom glow beneath base */}
          {isConnected && (
            <>
              <motion.div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80px] h-[20px] rounded-full"
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                  filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)']
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                style={{
                  background: 'linear-gradient(to right, #ff0044, #ff8800, #ffcc00, #00ff66, #00ccff, #4400ff, #cc00ff)',
                  filter: 'blur(12px)'
                }}
              />
              {/* Secondary softer glow */}
              <motion.div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[100px] h-[16px] rounded-full"
                animate={{
                  opacity: [0.15, 0.3, 0.15],
                  filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)']
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                style={{
                  background: 'linear-gradient(to right, #ff0044, #ffcc00, #00ff88, #0088ff, #cc00ff)',
                  filter: 'blur(20px)'
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Ground shadow ── */}
      <div
        className="w-20 h-3 rounded-full flex-shrink-0 mt-2"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 75%)',
          filter: 'blur(6px)'
        }}
      />
    </div>
  );
}
