import { Droplet, Coffee, Activity, Zap } from 'lucide-react';
import React from 'react';

export const presetStyles: Record<string, { bg: string; border: string; text: string }> = {
  cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-400' },
  orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400' },
  emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  red: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400' }
};

export const renderIcon = (iconName: string, props?: Record<string, unknown>): React.ReactNode => {
  if (iconName === 'Droplet') return <Droplet {...props} />;
  if (iconName === 'Coffee') return <Coffee {...props} />;
  if (iconName === 'Activity') return <Activity {...props} />;
  if (iconName === 'Zap') return <Zap {...props} />;
  return <Droplet {...props} />;
};
