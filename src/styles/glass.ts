/**
 * Shared glassmorphism design tokens
 * Dùng chung cho toàn bộ app, tránh duplicate class strings
 * Uses CSS variables for dynamic theme support
 */

export const glassCard = `
  relative overflow-hidden rounded-[var(--theme-border-radius,28px)]
  bg-[var(--theme-surface-glass,rgba(34,211,238,0.04))] backdrop-blur-[var(--theme-blur,40px)] backdrop-saturate-[1.5]
  border-[var(--theme-border-width,1px)] border-[var(--theme-border-glass,rgba(34,211,238,0.1))]
  shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)]
`;

export const glassMetric = `
  group relative overflow-hidden rounded-[var(--theme-border-radius,20px)]
  bg-[var(--theme-surface-glass,rgba(34,211,238,0.03))] border border-[var(--theme-border-glass,rgba(34,211,238,0.06))]
  transition-all duration-300 ease-out
  hover:bg-[var(--theme-surface-glass,rgba(34,211,238,0.06))] hover:border-[var(--theme-border-glass,rgba(34,211,238,0.1))]
  shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.2)]
`;

export const glassControl = `
  relative flex p-1 shadow-sm border-[var(--theme-border-width,1px)] border-[var(--theme-border-glass,rgba(34,211,238,0.1))] bg-[var(--theme-surface-glass,rgba(34,211,238,0.04))] rounded-[var(--theme-border-radius,16px)]
`;

export const activeTabClass = `
  absolute inset-0 rounded-[var(--theme-border-radius-inner,8px)]
  bg-gradient-to-r from-cyan-500/10 to-blue-500/10
  border border-cyan-500/20 shadow-[0_0_12px_var(--theme-glow-color,rgba(34,211,238,0.15))]
`;

// Inner metric card — dùng bên trong glassCard cho các stat nhỏ
export const glassInner = `
  relative overflow-hidden rounded-[var(--theme-border-radius,16px)]
  bg-[var(--theme-surface-glass,rgba(34,211,238,0.03))] border border-[var(--theme-border-glass,rgba(34,211,238,0.06))]
  shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]
`;

// Badge / pill label
export const glassBadge = `
  inline-flex items-center gap-1.5 rounded-full
  px-2.5 py-1 text-[10px] font-black uppercase tracking-widest
  border
`;

// ==========================================
// DYNAMIC THEME-SPECIFIC GLASS VARIANTS
// ==========================================

import { getThemeConfigSync } from '@/services/theme.service';

// Helper function to get glassCard variant by theme ID (dynamic with theme variables)
export function getGlassCardVariant(themeId: string | null | undefined): string {
  const theme = getThemeConfigSync(themeId);
  const { colors, blurLevel, borderRadius, borderWidth, glassPattern, glassGlowIntensity, glassInnerGlow, glassGradient } = theme;

  // Build pattern overlay
  let patternOverlay = '';
  if (glassPattern === 'gradient' && glassGradient) {
    patternOverlay = `before:content-[''] before:absolute before:inset-0 before:bg-[${glassGradient}] before:pointer-events-none`;
  } else if (glassPattern === 'grid') {
    const colorMatch = colors.borderGlass.match(/rgba?\(([^)]+)\)/);
    const baseColor = colorMatch ? colorMatch[1].split(',').slice(0, 3).join(',') : '255,255,255';
    patternOverlay = `before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(45deg,rgba(${baseColor},0.1)_25%,transparent_25%,transparent_50%,rgba(${baseColor},0.1)_50%,rgba(${baseColor},0.1)_75%,transparent_75%)] before:bg-[length_8px_8px] before:pointer-events-none`;
  } else if (glassPattern === 'satin') {
    patternOverlay = `before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_100%)] before:bg-[length_100%_4px] before:pointer-events-none`;
  } else if (glassPattern === 'lens') {
    patternOverlay = `before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_0%,transparent_60%)] before:pointer-events-none`;
  }

  // Build glow shadow
  const glowIntensity = glassGlowIntensity;
  const glowShadow = glowIntensity > 0 ? `,0_0_${Math.round(glowIntensity * 50)}px_${colors.glowColor}` : '';

  // Build inner glow
  const innerGlow = glassInnerGlow ? `,inset_0_1px_1px_rgba(255,255,255,0.2)` : `,inset_0_1px_1px_rgba(255,255,255,0.15)`;

  return `
    relative overflow-hidden rounded-[${borderRadius}]
    bg-[${colors.surfaceGlass}] backdrop-blur-[${blurLevel}] backdrop-saturate-[1.5]
    border-[${borderWidth}] border-[${colors.borderGlass}]
    shadow-[0_24px_48px_-12px_${colors.glowColor}${innerGlow}${glowShadow}]
    ${patternOverlay}
  `;
}

// Helper function to get glassMetric variant by theme ID (dynamic with theme variables)
export function getGlassMetricVariant(themeId: string | null | undefined): string {
  const theme = getThemeConfigSync(themeId);
  const { colors, borderRadius, glassPattern, glassGlowIntensity, glassGradient, glassHoverEffect } = theme;

  // Parse surfaceGlass to get base opacity for hover effect
  const baseOpacity = parseFloat(colors.surfaceGlass.match(/[\d.]+/)?.[0] || '0.03');
  const hoverOpacity = Math.min(baseOpacity * 1.5, 0.15);

  // Parse borderGlass to get base border opacity
  const borderMatch = colors.borderGlass.match(/[\d.]+/);
  const baseBorderOpacity = borderMatch ? parseFloat(borderMatch[0]) : 0.06;
  const hoverBorderOpacity = Math.min(baseBorderOpacity * 1.5, 0.15);

  // Extract color from rgba
  const colorMatch = colors.borderGlass.match(/rgba?\(([^)]+)\)/);
  const baseColor = colorMatch ? colorMatch[1].split(',').slice(0, 3).join(',') : '255,255,255';

  // Build pattern overlay
  let patternOverlay = '';
  if (glassPattern === 'gradient' && glassGradient) {
    patternOverlay = `before:content-[''] before:absolute before:inset-0 before:bg-[${glassGradient}] before:pointer-events-none`;
  } else if (glassPattern === 'grid') {
    patternOverlay = `before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(45deg,rgba(${baseColor},0.08)_25%,transparent_25%,transparent_50%,rgba(${baseColor},0.08)_50%,rgba(${baseColor},0.08)_75%,transparent_75%)] before:bg-[length_6px_6px] before:pointer-events-none`;
  } else if (glassPattern === 'satin') {
    patternOverlay = `before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.015)_50%,transparent_100%)] before:bg-[length_100%_3px] before:pointer-events-none`;
  } else if (glassPattern === 'lens') {
    patternOverlay = `before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_0%,transparent_60%)] before:pointer-events-none`;
  }

  // Build hover effect based on glassHoverEffect
  let hoverEffect = '';
  if (glassHoverEffect === 'brightness') {
    hoverEffect = `hover:brightness-110`;
  } else if (glassHoverEffect === 'scale') {
    hoverEffect = `hover:scale-[1.02]`;
  } else if (glassHoverEffect === 'glow') {
    hoverEffect = `hover:shadow-[0_0_20px_${colors.glowColor}]`;
  } else {
    hoverEffect = `hover:bg-[rgba(${baseColor},${hoverOpacity})] hover:border-[rgba(${baseColor},${hoverBorderOpacity})]`;
  }

  // Build glow shadow
  const glowIntensity = glassGlowIntensity;
  const glowShadow = glowIntensity > 0 ? `,0_4px_12px_${colors.glowColor}` : `,0_4px_12px_rgba(0,0,0,0.2)`;

  return `
    group relative overflow-hidden rounded-[${borderRadius}]
    bg-[${colors.surfaceGlass}] border border-[${colors.borderGlass}]
    transition-all duration-300 ease-out
    ${hoverEffect}
    shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)${glowShadow}]
    ${patternOverlay}
  `;
}

// Helper function to get glassControl variant by theme ID (dynamic generation)
export function getGlassControlVariant(themeId: string | null | undefined): string {
  const theme = getThemeConfigSync(themeId);
  const { colors, borderRadius, borderWidth } = theme;

  return `
    relative flex p-1 shadow-sm border-[${borderWidth}] border-[${colors.borderGlass}] bg-[${colors.surfaceGlass}] rounded-[${borderRadius}]
  `;
}
