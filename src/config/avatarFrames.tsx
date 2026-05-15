/* eslint-disable react-refresh/only-export-components */
import type React from 'react';

/**
 * Hệ thống khung viền avatar ĐỘC BẢN.
 * Mỗi khung có một thuật toán vẽ SVG và animation riêng.
 */
export interface AvatarFrameConfig {
  id: string;
  name: string;
  borderClasses: string;
  effects: React.ReactNode;
}

const FrameSVG = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={`absolute inset-0 w-full h-full pointer-events-none z-0 ${className}`}
    style={{ overflow: 'visible' }}
  >
    {children}
  </svg>
);

export const HEALTH_FRAMES: Record<string, AvatarFrameConfig> = {

  // ── 💧 NHỊP NƯỚC: Hiệu ứng sóng loang (Ripples) ──
  frame_aqua_pulse: {
    id: 'frame_aqua_pulse',
    name: 'Nhịp Nước',
    borderClasses: 'border-cyan-400/40',
    effects: (
      <FrameSVG>
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx="50" cy="50" r="48"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            opacity="0"
            style={{
              animation: `frame-pulse-ring 3s cubic-bezier(0.21, 0.53, 0.56, 0.8) infinite`,
              animationDelay: `${i * 1}s`
            }}
          />
        ))}
      </FrameSVG>
    ),
  },

  // ── 🌊 ĐẠI DƯƠNG SÂU: Bong bóng khí nổi lên (Floating Bubbles) ──
  frame_deep_ocean: {
    id: 'frame_deep_ocean',
    name: 'Đại Dương Sâu',
    borderClasses: 'border-blue-600/50 shadow-[inset_0_0_10px_rgba(30,64,175,0.5)]',
    effects: (
      <FrameSVG>
        {Array.from({ length: 8 }).map((_, i) => (
          <circle
            key={i}
            cx={20 + Math.random() * 60}
            cy="100"
            r={1 + Math.random() * 2.5}
            fill="#60a5fa"
            opacity="0.6"
            style={{
              animation: `frame-bubble-up ${2 + Math.random() * 2}s linear infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
        <circle cx="50" cy="50" r="49" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 4" className="animate-[frame-spin_15s_linear_infinite]" />
      </FrameSVG>
    ),
  },

  // ── ❤️ NHỊP TIM: Đường điện tâm đồ (EKG Line) chạy vòng tròn ──
  frame_heartbeat: {
    id: 'frame_heartbeat',
    name: 'Nhịp Tim',
    borderClasses: 'border-rose-500/30',
    effects: (
      <FrameSVG className="animate-[frame-spin_4s_linear_infinite]">
        <path
          d="M 50,2 A 48,48 0 1,1 49.9,2 L 50,2 M 50,2 l 2,5 l 2,-10 l 3,15 l 2,-10 l 2,0"
          fill="none"
          stroke="#fb7185"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="10 300"
          style={{ animation: 'frame-dash 2s linear infinite' }}
        />
        <circle cx="50" cy="50" r="48" fill="none" stroke="#fb7185" strokeWidth="1" opacity="0.2" />
      </FrameSVG>
    ),
  },

  // ── ⚡ HÀO QUANG NĂNG LƯỢNG: Tia lửa điện (Electrical Sparks) ──
  frame_energy_aura: {
    id: 'frame_energy_aura',
    name: 'Hào Quang Năng Lượng',
    borderClasses: 'border-amber-400/20',
    effects: (
      <FrameSVG>
        {Array.from({ length: 4 }).map((_, i) => (
          <path
            key={i}
            d="M 50,2 L 48,10 L 52,12 L 50,20"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              transformOrigin: '50px 50px',
              transform: `rotate(${i * 90}deg)`,
              animation: 'frame-spark 0.2s steps(2) infinite',
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
        <circle cx="50" cy="50" r="48" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="1 15" className="animate-[frame-spin_1s_linear_infinite]" />
      </FrameSVG>
    ),
  },

  // ── 🌿 VƯỜN THIỀN: Cánh hoa/Lá rơi (Floating Petals) ──
  frame_zen_garden: {
    id: 'frame_zen_garden',
    name: 'Vườn Thiền',
    borderClasses: 'border-emerald-500/40',
    effects: (
      <FrameSVG>
        {Array.from({ length: 5 }).map((_, i) => (
          <path
            key={i}
            d="M 0,0 C 2,2 5,2 5,5 C 5,8 2,8 0,10 C -2,8 -5,8 -5,5 C -5,2 -2,2 0,0"
            fill="#34d399"
            style={{
              transformOrigin: 'center',
              animation: `frame-leaf-fall ${4 + i}s ease-in-out infinite`,
              animationDelay: `${i * 1.2}s`,
              position: 'absolute'
            }}
          />
        ))}
        <circle cx="50" cy="50" r="49" fill="none" stroke="#10b981" strokeWidth="0.5" opacity="0.3" />
      </FrameSVG>
    ),
  },

  // ── 🌈 CỰC QUANG: Đám mây Plasma đổi màu ──
  frame_aurora: {
    id: 'frame_aurora',
    name: 'Cực Quang',
    borderClasses: 'border-transparent',
    effects: (
      <div className="absolute -inset-2 rounded-full overflow-hidden">
        <div 
          className="absolute inset-0 opacity-60 blur-xl"
          style={{
            background: 'conic-gradient(from 0deg, #a78bfa, #22d3ee, #34d399, #fbbf24, #a78bfa)',
            animation: 'frame-spin 4s linear infinite'
          }}
        />
        <div className="absolute inset-[4px] rounded-full bg-slate-950" />
      </div>
    ),
  },

  // ── 🔥 NGỌN LỬA: Lửa cháy thực thụ (Animated Flames) ──
  frame_fire_streak: {
    id: 'frame_fire_streak',
    name: 'Ngọn Lửa Streak',
    borderClasses: 'border-orange-600/20',
    effects: (
      <FrameSVG>
        <defs>
          <filter id="fire-blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
          </filter>
        </defs>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const x = 50 + Math.cos(angle) * 48;
          const y = 50 + Math.sin(angle) * 48;
          return (
            <path
              key={i}
              d={`M ${x},${y} Q ${x + 5},${y - 10} ${x},${y - 20} Q ${x - 5},${y - 10} ${x},${y} Z`}
              fill="#f97316"
              filter="url(#fire-blur)"
              opacity="0.7"
              style={{
                transformOrigin: `${x}px ${y}px`,
                animation: `frame-fire-flicker ${0.5 + Math.random()}s ease-in-out infinite`,
                animationDelay: `${Math.random()}s`
              }}
            />
          );
        })}
      </FrameSVG>
    ),
  },

  // ── 💎 KIM CƯƠNG: Mảnh vỡ lăng kính (Prismatic Shards) ──
  frame_diamond: {
    id: 'frame_diamond',
    name: 'Kim Cương Kỷ Luật',
    borderClasses: 'border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.4)]',
    effects: (
      <FrameSVG>
        <defs>
          <linearGradient id="shard-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {Array.from({ length: 6 }).map((_, i) => (
          <polygon
            key={i}
            points="50,2 54,10 50,18 46,10"
            fill="url(#shard-grad)"
            style={{
              transformOrigin: '50px 50px',
              transform: `rotate(${i * 60}deg)`,
              animation: `frame-shard-glint 3s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
        <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="1 4" className="animate-[frame-spin_20s_linear_infinite]" />
      </FrameSVG>
    ),
  },
};

export function getFrameConfig(frameId: string | null | undefined): AvatarFrameConfig | undefined {
  if (!frameId) return undefined;
  if (HEALTH_FRAMES[frameId]) return HEALTH_FRAMES[frameId];

  // Default fallback
  return {
    id: frameId,
    name: frameId,
    borderClasses: 'border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]',
    effects: (
      <FrameSVG>
        <circle cx="50" cy="50" r="48" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="4 4" className="animate-[frame-spin_5s_linear_infinite]" />
      </FrameSVG>
    ),
  };
}
