/* eslint-disable react-refresh/only-export-components */
import React, { Fragment } from 'react';
import i18n from '@/i18n';
import { getFrameConfigSync } from '@/services/frame.service';

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
    name: i18n.t('avatar_frames.frame_aqua_pulse'),
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
    name: i18n.t('avatar_frames.frame_deep_ocean'),
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
    name: i18n.t('avatar_frames.frame_heartbeat'),
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
    name: i18n.t('avatar_frames.frame_energy_aura'),
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
    name: i18n.t('avatar_frames.frame_zen_garden'),
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
    name: i18n.t('avatar_frames.frame_aurora'),
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
    name: i18n.t('avatar_frames.frame_fire_streak'),
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

  // ── 🎋 TRE TRÚC: Đốt tre xoay quanh ──
  frame_bamboo: {
    id: 'frame_bamboo',
    name: i18n.t('avatar_frames.frame_bamboo'),
    borderClasses: 'border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]',
    effects: (
      <FrameSVG>
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={i}
            x1="50" y1="5" x2="50" y2="15"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
            style={{
              transformOrigin: '50px 50px',
              transform: `rotate(${i * 45}deg)`,
              animation: `frame-spark ${1.5 + Math.random()}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
        <circle cx="50" cy="50" r="48" fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="6 12" className="animate-[frame-spin_10s_linear_infinite]" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 20" className="animate-[frame-spin-reverse_15s_linear_infinite]" />
      </FrameSVG>
    ),
  },

  // ── 🌅 HOÀNG HÔN: Vòng cung hoàng hôn ──
  frame_sunset: {
    id: 'frame_sunset',
    name: i18n.t('avatar_frames.frame_sunset'),
    borderClasses: 'border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.4)]',
    effects: (
      <FrameSVG>
        <defs>
          <linearGradient id="sunset-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          d="M 10,50 A 40,40 0 0,1 90,50"
          fill="none"
          stroke="url(#sunset-grad)"
          strokeWidth="4"
          strokeLinecap="round"
          className="animate-[frame-glow-pulse_3s_ease-in-out_infinite]"
        />
        <circle cx="50" cy="50" r="48" fill="none" stroke="#f97316" strokeWidth="1" opacity="0.2" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="1 6" className="animate-[frame-spin_6s_linear_infinite]" />
      </FrameSVG>
    ),
  },

  // ── ❄️ BĂNG TINH: Bông tuyết xoay──
  frame_ice_crystal: {
    id: 'frame_ice_crystal',
    name: i18n.t('avatar_frames.frame_ice_crystal'),
    borderClasses: 'border-cyan-300/50 shadow-[0_0_12px_rgba(103,232,249,0.4)]',
    effects: (
      <FrameSVG>
        {Array.from({ length: 6 }).map((_, i) => (
          <Fragment key={i}>
            <line
              x1="50" y1="8" x2="50" y2="92"
              stroke="#67e8f9"
              strokeWidth="1.5"
              opacity="0.6"
              style={{
                transformOrigin: '50px 50px',
                transform: `rotate(${i * 30}deg)`,
              }}
            />
            <line
              x1="50" y1="20" x2="56" y2="30"
              stroke="#22d3ee"
              strokeWidth="1"
              opacity="0.4"
              style={{
                transformOrigin: '50px 50px',
                transform: `rotate(${i * 30}deg)`,
              }}
            />
            <line
              x1="50" y1="70" x2="56" y2="80"
              stroke="#22d3ee"
              strokeWidth="1"
              opacity="0.4"
              style={{
                transformOrigin: '50px 50px',
                transform: `rotate(${i * 30}deg)`,
              }}
            />
          </Fragment>
        ))}
        <circle cx="50" cy="50" r="30" fill="none" stroke="#67e8f9" strokeWidth="0.5" className="animate-[frame-spin_20s_linear_infinite]" />
        <circle cx="50" cy="50" r="48" fill="none" stroke="#22d3ee" strokeWidth="0.5" opacity="0.3" />
      </FrameSVG>
    ),
  },

  // ── ⚡ SẤM SÉT: Tia chớp nhấp nháy ──
  frame_thunder: {
    id: 'frame_thunder',
    name: i18n.t('avatar_frames.frame_thunder'),
    borderClasses: 'border-yellow-400/40 shadow-[0_0_15px_rgba(250,204,21,0.5)]',
    effects: (
      <FrameSVG>
        <defs>
          <filter id="thunder-glow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>
        <path
          d="M 42,10 L 50,35 L 45,38 L 55,70 L 48,72 L 58,90"
          fill="none"
          stroke="#facc15"
          strokeWidth="2.5"
          strokeLinejoin="round"
          filter="url(#thunder-glow)"
          style={{ animation: 'frame-lightning 2s steps(1) infinite' }}
        />
        <path
          d="M 60,15 L 65,30 L 60,32 L 68,55"
          fill="none"
          stroke="#fde047"
          strokeWidth="1.5"
          strokeLinejoin="round"
          opacity="0.6"
          style={{ animation: 'frame-lightning 2s steps(1) infinite', animationDelay: '0.5s' }}
        />
        <circle cx="50" cy="50" r="48" fill="none" stroke="#facc15" strokeWidth="1" strokeDasharray="3 8" className="animate-[frame-spin_3s_linear_infinite]" />
      </FrameSVG>
    ),
  },

  // ── 🌌 XOÁY NGÂN HÀ: Vòng xoáy thiên hà ──
  frame_galaxy_swirl: {
    id: 'frame_galaxy_swirl',
    name: i18n.t('avatar_frames.frame_galaxy_swirl'),
    borderClasses: 'border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.6)]',
    effects: (
      <FrameSVG>
        <defs>
          <radialGradient id="galaxy-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#galaxy-core)" className="animate-[frame-spin_15s_linear_infinite]" />
        <path
          d="M 50,50 Q 65,20 85,35 Q 95,60 70,75 Q 45,85 25,70 Q 15,45 35,30 Q 50,20 50,50"
          fill="none"
          stroke="#a78bfa"
          strokeWidth="1.5"
          opacity="0.7"
          className="animate-[frame-spin_12s_linear_infinite]"
        />
        <path
          d="M 50,50 Q 35,80 15,65 Q 5,40 30,25 Q 55,15 75,30 Q 85,55 65,70 Q 50,80 50,50"
          fill="none"
          stroke="#c084fc"
          strokeWidth="1"
          opacity="0.5"
          className="animate-[frame-spin-reverse_18s_linear_infinite]"
        />
        <circle cx="50" cy="50" r="48" fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.3" />
      </FrameSVG>
    ),
  },

  // ── 🥈 BẠC QUÝ: Ánh bạc sang trọng ──
  frame_premium_silver: {
    id: 'frame_premium_silver',
    name: i18n.t('avatar_frames.frame_premium_silver'),
    borderClasses: 'border-slate-300/60 shadow-[0_0_15px_rgba(203,213,225,0.5)] shadow-[inset_0_0_10px_rgba(203,213,225,0.2)]',
    effects: (
      <FrameSVG>
        <defs>
          <linearGradient id="silver-shine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.3" />
            <stop offset="40%" stopColor="#f1f5f9" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#f8fafc" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {Array.from({ length: 3 }).map((_, i) => (
          <circle
            key={i}
            cx="50" cy="50" r="48"
            fill="none"
            stroke="url(#silver-shine)"
            strokeWidth="3"
            opacity="0.5"
            style={{
              animation: `frame-dash-reverse 3s linear infinite`,
              animationDelay: `${i * 1}s`,
              strokeDasharray: '40 200',
            }}
          />
        ))}
        <circle cx="50" cy="50" r="48" fill="none" stroke="#cbd5e1" strokeWidth="1" opacity="0.3" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#f1f5f9" strokeWidth="0.5" className="animate-[frame-spin-reverse_8s_linear_infinite]" />
      </FrameSVG>
    ),
  },

  // ── 🏆 HOÀNG KIM: Ánh vàng lấp lánh ──
  frame_premium_gold: {
    id: 'frame_premium_gold',
    name: i18n.t('avatar_frames.frame_premium_gold'),
    borderClasses: 'border-yellow-400/60 shadow-[0_0_20px_rgba(251,191,36,0.7)] shadow-[inset_0_0_15px_rgba(251,191,36,0.3)]',
    effects: (
      <FrameSVG>
        <defs>
          <linearGradient id="gold-shine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#fef3c7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id="gold-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#gold-glow)" />
        {Array.from({ length: 4 }).map((_, i) => (
          <polygon
            key={i}
            points="50,2 52,8 50,14 48,8"
            fill="#fbbf24"
            opacity="0"
            style={{
              transformOrigin: '50px 50px',
              transform: `rotate(${i * 90}deg)`,
              animation: `frame-shard-glint 2s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
        <circle cx="50" cy="50" r="48" fill="none" stroke="url(#gold-shine)" strokeWidth="2" className="animate-[frame-spin_6s_linear_infinite]" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="2 10" className="animate-[frame-spin-reverse_10s_linear_infinite]" />
      </FrameSVG>
    ),
  },

  // ── 🔥 PHƯỢNG HOÀNG: Lửa thiêng đỏ rực ──
  frame_premium_phoenix: {
    id: 'frame_premium_phoenix',
    name: i18n.t('avatar_frames.frame_premium_phoenix'),
    borderClasses: 'border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.6)]',
    effects: (
      <FrameSVG>
        <defs>
          <filter id="phoenix-fire">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
          <linearGradient id="phoenix-grad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x = 50 + Math.cos(angle) * 46;
          const y = 50 + Math.sin(angle) * 46;
          return (
            <path
              key={i}
              d={`M ${x},${y} Q ${x + 10 * Math.cos(angle - 0.3)},${y + 10 * Math.sin(angle - 0.3)} ${x + 15 * Math.cos(angle - 0.5)},${y + 15 * Math.sin(angle - 0.5)}`}
              fill="none"
              stroke="url(#phoenix-grad)"
              strokeWidth="2"
              strokeLinecap="round"
              filter="url(#phoenix-fire)"
              opacity="0.7"
              style={{
                transformOrigin: `${x}px ${y}px`,
                animation: `frame-fire-flicker ${0.8 + Math.random() * 0.5}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          );
        })}
        <circle cx="50" cy="50" r="48" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.2" />
      </FrameSVG>
    ),
  },

  // ── 🌙 NGUYỆT CẦU: Trăng sao huyền ảo ──
  frame_premium_lunar: {
    id: 'frame_premium_lunar',
    name: i18n.t('avatar_frames.frame_premium_lunar'),
    borderClasses: 'border-indigo-400/50 shadow-[0_0_25px_rgba(129,140,248,0.6)]',
    effects: (
      <FrameSVG>
        <defs>
          <radialGradient id="moon-glow" cx="40%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#moon-glow)" />
        {/* Trăng lưỡi liềm */}
        <path
          d="M 35,20 A 22,22 0 1,0 65,25 A 18,18 0 1,1 35,20 Z"
          fill="#818cf8"
          opacity="0.9"
          className="animate-[frame-float_4s_ease-in-out_infinite]"
        />
        {/* Sao */}
        {Array.from({ length: 5 }).map((_, i) => (
          <circle
            key={i}
            cx={20 + Math.random() * 60}
            cy={15 + Math.random() * 70}
            r={1.5}
            fill="#c7d2fe"
            style={{
              animation: `frame-twinkle ${1.5 + Math.random()}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
        {/* Quỹ đạo sao đôi */}
        <circle cx="50" cy="50" r="42" fill="none" stroke="#818cf8" strokeWidth="0.5" strokeDasharray="3 12" opacity="0.3" className="animate-[frame-spin_20s_linear_infinite]" />
        <circle cx="50" cy="50" r="48" fill="none" stroke="#a5b4fc" strokeWidth="1" opacity="0.2" />
      </FrameSVG>
    ),
  },

  // ── 🐉 LONG THẦN: Rồng thiêng uy nghi ──
  frame_premium_dragon: {
    id: 'frame_premium_dragon',
    name: i18n.t('avatar_frames.frame_premium_dragon'),
    borderClasses: 'border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.8)] shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]',
    effects: (
      <FrameSVG>
        <defs>
          <linearGradient id="dragon-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="dragon-fire" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="none" stroke="url(#dragon-gold)" strokeWidth="3" opacity="0.5" className="animate-[frame-glow-pulse_3s_ease-in-out_infinite]" />
        {/* Vảy rồng */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const x = 50 + Math.cos(angle) * 44;
          const y = 50 + Math.sin(angle) * 44;
          return (
            <path
              key={i}
              d={`M ${x - 3},${y} Q ${x},${y - 5} ${x + 3},${y} Q ${x},${y + 3} ${x - 3},${y} Z`}
              fill="url(#dragon-gold)"
              opacity="0.6"
              style={{
                transformOrigin: `${x}px ${y}px`,
                animation: `frame-shard-glint 4s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          );
        })}
        {/* Quỹ đạo lửa */}
        <path
          d="M 50,2 A 48,48 0 1,1 49.9,2"
          fill="none"
          stroke="url(#dragon-fire)"
          strokeWidth="1.5"
          strokeDasharray="20 60"
          className="animate-[frame-spin_4s_linear_infinite]"
        />
        <circle cx="50" cy="50" r="46" fill="none" stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="1 8" opacity="0.4" className="animate-[frame-spin-reverse_12s_linear_infinite]" />
      </FrameSVG>
    ),
  },

  // ── 💎 KIM CƯƠNG: Mảnh vỡ lăng kính (Prismatic Shards) ──
  frame_diamond: {
    id: 'frame_diamond',
    name: i18n.t('avatar_frames.frame_diamond'),
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

// Map frame ID → hiệu ứng SVG, dùng làm thư viện effect cho frame OTA
export const FRAME_EFFECT_SOURCES: Record<string, React.ReactNode> = {};
Object.entries(HEALTH_FRAMES).forEach(([id, cfg]) => {
  FRAME_EFFECT_SOURCES[id] = cfg.effects;
});

export function getFrameConfig(frameId: string | null | undefined): AvatarFrameConfig | undefined {
  if (!frameId) return undefined;

  // 1. Thử OTA từ DB trước
  const remote = getFrameConfigSync(frameId);
  if (remote?.effectSourceId && FRAME_EFFECT_SOURCES[remote.effectSourceId]) {
    return {
      id: frameId,
      name: remote.name,
      borderClasses: remote.borderClasses,
      effects: FRAME_EFFECT_SOURCES[remote.effectSourceId],
    };
  }

  // 2. Fallback hardcoded
  if (HEALTH_FRAMES[frameId]) return HEALTH_FRAMES[frameId];

  // 3. Default fallback
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
