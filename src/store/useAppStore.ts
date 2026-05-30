import { create } from 'zustand';
import type { WaterLog } from '../models';
import type { AppProfile } from '@/services/profile.service';
import type { WaterIntakeResult } from '../lib/HydrationEngine';
import type { CalendarEventItem } from '../hooks/useCalendarSync';
import type { ThemeConfig } from '@/config/themes';

export interface AppState {
  // ── Core Data ──
  profile: AppProfile | null;
  waterIntake: number;
  waterGoal: number;
  streak: number;
  waterEntries: WaterLog[];
  weeklyHistory: { d: string; ml: number; isToday: boolean }[];

  // ── Integrations ──
  weatherData: { temp: number; humidity: number; feelsLike: number; status?: string; location?: string } | null;
  weatherLastUpdatedAt: string | null;
  watchData: { heartRate: number; steps: number } | null;
  isWeatherSynced: boolean;
  isCalendarSynced: boolean;
  calendarEvents: CalendarEventItem[];
  isWatchConnected: boolean;
  isSyncing: boolean;
  hasPendingCloudSync: boolean;

  // ── Calculated/Derived ──
  hydrationResult: WaterIntakeResult | null;
  isPremium: boolean;

  // ── Fasting State ──
  fastingState: {
    isFastingMode: boolean;
    fastingPlanHours: number;
    fastingTotalMs: number;
    fastingStartTime: number | null;
  };

  // ── Theme Preview (Phase 3) ──
  themePreview: Partial<ThemeConfig> | null;

  // ── App Actions ──
  actions: {
    handleAddWater: (amount: number, factor: number, name: string) => Promise<void>;
    handleDeleteEntry: (id: string | number) => Promise<void>;
    handleEditEntry: (id: string, newAmount: number) => Promise<void>;
    handleLogout: () => void;
    openSocialComposer: (kind: 'status' | 'progress' | 'story' | 'challenge') => void;
    startFasting: (hours: number) => void;
    stopFasting: () => void;
  };

  // ── Setters ──
  setAppState: (state: Partial<AppState>) => void;
  setActions: (actions: Partial<AppState['actions']>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null, waterIntake: 0, waterGoal: 2000, streak: 0, waterEntries: [], weeklyHistory: [],
  weatherData: null, weatherLastUpdatedAt: null, watchData: null, isWeatherSynced: false, isCalendarSynced: false, calendarEvents: [], isWatchConnected: false,
  isSyncing: false, hasPendingCloudSync: false,
  hydrationResult: null, isPremium: false,
  fastingState: { isFastingMode: false, fastingPlanHours: 16, fastingTotalMs: 16 * 60 * 60 * 1000, fastingStartTime: null },

  themePreview: null,

  actions: {
    handleAddWater: async () => { }, handleDeleteEntry: async () => { }, handleEditEntry: async () => { },
    handleLogout: () => { }, openSocialComposer: () => { },
    startFasting: () => { }, stopFasting: () => { }
  },

  setAppState: (newState) => set((state) => ({ ...state, ...newState })),
  setActions: (newActions) => set((state) => ({ actions: { ...state.actions, ...newActions } })),
}));
