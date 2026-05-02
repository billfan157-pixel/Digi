import React, { useEffect, useState } from 'react';
import type { Profile } from '../models';
import { readThemePreference } from '@/services/appPreferences.service';

export default function ThemeEngine({ profile }: { profile: Profile | null }) {
  const [themeColor, setThemeColor] = useState<string>('#06b6d4'); // Mặc định Cyan

  useEffect(() => {
    if (profile?.id) {
      setTimeout(() => setThemeColor(readThemePreference(profile.id)), 0);
    }
  }, [profile?.id]);

  useEffect(() => {
    const handleThemeUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.themeColor) {
        setThemeColor(customEvent.detail.themeColor);
      }
    };
    window.addEventListener('themeUpdated', handleThemeUpdate);
    return () => window.removeEventListener('themeUpdated', handleThemeUpdate);
  }, []);

  // Nếu màu là màu mặc định (Cyan) thì không cần ghi đè để tiết kiệm hiệu năng
  if (!themeColor || themeColor === '#06b6d4') return null;

  // Tự động Ghi đè (Override) hàng loạt các Class CSS của Tailwind trên toàn App!
  return (
    <style>
      {`
        :root {
          --neon-cyan: ${themeColor} !important;
        }
        
        /* Ghi đè Text, Background, Border */
        .text-cyan-400, .text-cyan-500, .text-cyan-600 { color: ${themeColor} !important; }
        .bg-cyan-400, .bg-cyan-500, .bg-cyan-600 { background-color: ${themeColor} !important; }
        .border-cyan-400, .border-cyan-500, .border-cyan-600 { border-color: ${themeColor} !important; }
        
        /* Ghi đè Gradient */
        .from-cyan-400, .from-cyan-500, .from-cyan-600 { --tw-gradient-from: ${themeColor} !important; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important; }
        .to-cyan-400, .to-cyan-500, .to-cyan-600 { --tw-gradient-to: ${themeColor} !important; }
        
        /* Ghi đè các thẻ có Opacity (VD: bg-cyan-500/20) - Rất quan trọng để UI không bị gãy */
        .bg-cyan-500\\/10 { background-color: ${themeColor}1a !important; }
        .bg-cyan-500\\/15 { background-color: ${themeColor}26 !important; }
        .bg-cyan-500\\/20 { background-color: ${themeColor}33 !important; }
        .bg-cyan-500\\/30 { background-color: ${themeColor}4d !important; }
        .border-cyan-500\\/20 { border-color: ${themeColor}33 !important; }
        .border-cyan-500\\/30 { border-color: ${themeColor}4d !important; }
        .border-cyan-500\\/50 { border-color: ${themeColor}80 !important; }
      `}
    </style>
  );
}
