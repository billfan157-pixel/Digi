import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useSettings } from './useSettings';

/**
 * Hook to format volume based on user's unit preference (ml or oz)
 */
export function useVolumeFormat() {
  const profile = useAppStore((state) => state.profile);
  const { settings } = useSettings(profile);

  const formatVolume = useMemo(() => {
    return (ml: number): string => {
      if (settings.unit === 'oz') {
        const oz = ml * 0.033814;
        // Format: if >= 16, show as whole number, otherwise 1 decimal
        return oz >= 16 ? `${Math.round(oz)} oz` : `${oz.toFixed(1)} oz`;
      }
      // For ml: use L for >= 1000, otherwise ml
      return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
    };
  }, [settings.unit]);

  const formatVolumeCompact = useMemo(() => {
    return (ml: number): string => {
      if (settings.unit === 'oz') {
        const oz = ml * 0.033814;
        return oz >= 16 ? `${Math.round(oz)}` : `${oz.toFixed(1)}`;
      }
      return ml >= 1000 ? `${(ml / 1000).toFixed(1)}` : `${ml}`;
    };
  }, [settings.unit]);

  const getUnitLabel = useMemo(() => {
    return (): string => {
      return settings.unit === 'oz' ? 'oz' : 'ml';
    };
  }, [settings.unit]);

  return {
    formatVolume,
    formatVolumeCompact,
    getUnitLabel,
    unit: settings.unit,
  };
}
