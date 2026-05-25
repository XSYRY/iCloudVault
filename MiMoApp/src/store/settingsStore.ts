import { create } from 'zustand';
import type { AppSettings, ThemeName } from '../types';

const STORAGE_KEY = 'mimo-settings';

import { MMKV } from 'react-native-mmkv';

let mmkvInstance: MMKV | null = null;
function getMMKV(): MMKV {
  if (!mmkvInstance) {
    mmkvInstance = new MMKV({ id: STORAGE_KEY });
  }
  return mmkvInstance;
}

interface SettingsState extends AppSettings {
  isHydrated: boolean;

  loadSettings: () => Promise<void>;
  persistSettings: () => Promise<void>;

  setTheme: (theme: ThemeName) => void;
  setGridColumns: (cols: number) => void;
  setMasonryEnabled: (enabled: boolean) => void;
  setPin: (code: string | null) => void;
  setPinEnabled: (enabled: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setShowFabLabels: (show: boolean) => void;
  setOnboardingComplete: (done: boolean) => void;
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  setLastImportTimestamp: (ts: number) => void;

  updateSettings: (patch: Partial<AppSettings>) => void;
}

const defaults: AppSettings = {
  theme: 'dynamic',
  gridColumns: 3,
  masonryEnabled: true,
  pinEnabled: false,
  pinCode: null,
  biometricEnabled: false,
  showFabLabels: true,
  onboardingComplete: false,
  searchHistory: [],
  lastImportTimestamp: null,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaults,
  isHydrated: false,

  loadSettings: async () => {
    try {
      const mmkv = getMMKV();
      const raw = mmkv.getString(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AppSettings>;
        set({ ...saved, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  persistSettings: async () => {
    try {
      const { isHydrated, loadSettings, persistSettings, setTheme, setGridColumns,
        setPin, setPinEnabled, setBiometricEnabled, setShowFabLabels,
        setOnboardingComplete, addSearchHistory, clearSearchHistory,
        setLastImportTimestamp, updateSettings, ...settings } = get();
      const mmkv = getMMKV();
      mmkv.set(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  },

  setTheme: (theme) => {
    set({ theme });
    get().persistSettings();
  },
  setGridColumns: (cols) => {
    set({ gridColumns: cols });
    get().persistSettings();
  },
  setMasonryEnabled: (enabled) => {
    set({ masonryEnabled: enabled });
    get().persistSettings();
  },
  setPin: (code) => {
    set({ pinCode: code });
    get().persistSettings();
  },
  setPinEnabled: (enabled) => {
    set({ pinEnabled: enabled });
    get().persistSettings();
  },
  setBiometricEnabled: (enabled) => {
    set({ biometricEnabled: enabled });
    get().persistSettings();
  },
  setShowFabLabels: (show) => {
    set({ showFabLabels: show });
    get().persistSettings();
  },
  setOnboardingComplete: (done) => {
    set({ onboardingComplete: done });
    get().persistSettings();
  },
  addSearchHistory: (query) => {
    set((s) => ({
      searchHistory: [query, ...s.searchHistory.filter((h) => h !== query)].slice(0, 20),
    }));
    get().persistSettings();
  },
  clearSearchHistory: () => {
    set({ searchHistory: [] });
    get().persistSettings();
  },
  setLastImportTimestamp: (ts) => {
    set({ lastImportTimestamp: ts });
    get().persistSettings();
  },

  updateSettings: (patch) => {
    set(patch);
    get().persistSettings();
  },
}));
