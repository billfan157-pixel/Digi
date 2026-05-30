import { create } from 'zustand';
import i18n from '@/i18n';
import { toast } from 'sonner';

import { AppStorage } from '@/lib/storage';

export interface DrinkPreset {
  id: string;
  name: string;
  amount: number;
  factor: number;
  icon: string;
  color: string;
}

interface DrinkPresetState {
  drinkPresets: DrinkPreset[];
  editingPresets: DrinkPreset[];
  customDrinkForm: { name: string; amount: number | string; factor: number };

  setDrinkPresets: (presets: DrinkPreset[]) => void;
  setEditingPresets: (presets: DrinkPreset[]) => void;
  setCustomDrinkForm: (form: { name: string; amount: number | string; factor: number }) => void;

  loadDrinkPresets: () => void;
  saveDrinkPresets: () => void;
  handleUpdatePreset: (index: number, field: keyof DrinkPreset, value: unknown) => void;
}

export const useDrinkPresetStore = create<DrinkPresetState>((set, get) => ({
  drinkPresets: [
    { id: '1', name: i18n.t('common.preset_water'), amount: 250, factor: 1.0, icon: 'Droplet', color: 'cyan' },
    { id: '2', name: i18n.t('common.preset_coffee'), amount: 200, factor: 0.8, icon: 'Coffee', color: 'orange' },
    { id: '3', name: i18n.t('common.preset_electrolyte'), amount: 300, factor: 1.1, icon: 'Activity', color: 'emerald' },
    { id: '4', name: i18n.t('common.preset_beer_wine'), amount: 330, factor: -0.5, icon: 'Zap', color: 'red' }
  ],
  editingPresets: [],
  customDrinkForm: { name: i18n.t('common.preset_peach_tea'), amount: 300, factor: 1.0 },

  setDrinkPresets: (presets) => set({ drinkPresets: presets }),
  setEditingPresets: (presets) => set({ editingPresets: presets }),
  setCustomDrinkForm: (form) => set({ customDrinkForm: form }),

  loadDrinkPresets: () => {
    const saved = AppStorage.getItem('digiwell_presets');
    if (saved) {
      try {
        const parsedPresets = JSON.parse(saved);
        // Basic validation to prevent loading corrupted data
        if (Array.isArray(parsedPresets) && parsedPresets.length > 0) {
          set({ drinkPresets: parsedPresets });
        }
      } catch (e) {
        console.error("Lỗi khi tải cấu hình đồ uống:", e);
        AppStorage.removeItem('digiwell_presets'); // Clear corrupted data
      }
    }
  },

  saveDrinkPresets: () => {
    const { editingPresets } = get();
    AppStorage.setItem('digiwell_presets', JSON.stringify(editingPresets));
    set({ drinkPresets: editingPresets });
    toast.success(i18n.t('settings.drink_presets_saved'));
  },

  handleUpdatePreset: (index, field, value) => {
    set(state => ({
      editingPresets: state.editingPresets.map((preset, i) => i === index ? { ...preset, [field]: value } : preset)
    }));
  },
}));
