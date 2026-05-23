import { useAppStore } from '@/store/useAppStore';
import {
  getGlassCardVariant,
  getGlassMetricVariant,
  getGlassControlVariant,
} from '@/styles/glass';

// Hook to get theme-specific glass variants
export const useGlassVariants = () => {
  const profile = useAppStore(state => state.profile);
  const themeId = profile?.equipped_theme_id;

  return {
    glassCard: getGlassCardVariant(themeId),
    glassMetric: getGlassMetricVariant(themeId),
    glassControl: getGlassControlVariant(themeId),
  };
};
