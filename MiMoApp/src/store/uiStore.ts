import { create } from 'zustand';
import type { ViewMode } from '../types';
import type { Story } from '../services/stories';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
  durationMs: number;
}

interface MapPreviewPin {
  latitude: number;
  longitude: number;
}

interface MapPreviewPinDropPoint {
  x: number;
  y: number;
  requestId: number;
}

interface UiState {
  activeView: ViewMode;
  gridColumns: number;

  toasts: ToastMessage[];

  isFabOpen: boolean;
  isSearchActive: boolean;
  isDrawerOpen: boolean;
  isAiOverlayVisible: boolean;
  isDedupOverlayVisible: boolean;
  isStatsModalVisible: boolean;
  isSettingsModalVisible: boolean;
  isAlbumPickerVisible: boolean;
  isTabBarHidden: boolean;
  mapOnlyWithMemos: boolean;
  mapPreviewPin: MapPreviewPin | null;
  mapPreviewPinDropPoint: MapPreviewPinDropPoint | null;

  gridScrollOffset: number;

  storyCache: Map<string, Story>;

  setActiveView: (view: ViewMode) => void;
  setGridColumns: (cols: number) => void;
  showToast: (text: string, type?: ToastMessage['type'], durationMs?: number) => void;
  dismissToast: (id: string) => void;
  toggleFab: (open?: boolean) => void;
  setSearchActive: (active: boolean) => void;
  setDrawerOpen: (open: boolean) => void;
  setAiOverlayVisible: (visible: boolean) => void;
  setDedupOverlayVisible: (visible: boolean) => void;
  setStatsModalVisible: (visible: boolean) => void;
  setSettingsModalVisible: (visible: boolean) => void;
  setAlbumPickerVisible: (visible: boolean) => void;
  setTabBarHidden: (hidden: boolean) => void;
  setMapOnlyWithMemos: (enabled: boolean) => void;
  toggleMapOnlyWithMemos: () => void;
  setMapPreviewPin: (pin: MapPreviewPin | null) => void;
  requestMapPreviewPinDropPoint: (point: Omit<MapPreviewPinDropPoint, 'requestId'>) => void;
  clearMapPreviewPinDropPoint: () => void;
  setGridScrollOffset: (offset: number) => void;
  cacheStory: (story: Story) => void;
  getStory: (id: string) => Story | null;
}

let toastId = 0;
let mapPreviewPinRequestId = 0;

export const useUiStore = create<UiState>((set, get) => ({
  activeView: 'grid',
  gridColumns: 3,
  toasts: [],
  isFabOpen: false,
  isSearchActive: false,
  isDrawerOpen: false,
  isAiOverlayVisible: false,
  isDedupOverlayVisible: false,
  isStatsModalVisible: false,
  isSettingsModalVisible: false,
  isAlbumPickerVisible: false,
  isTabBarHidden: false,
  mapOnlyWithMemos: false,
  mapPreviewPin: null,
  mapPreviewPinDropPoint: null,
  gridScrollOffset: 0,
  storyCache: new Map(),

  setActiveView: (view) => set({ activeView: view }),
  setGridColumns: (cols) => set({ gridColumns: cols }),

  showToast: (text, type = 'info', durationMs = 2500) => {
    const id = `toast-${++toastId}`;
    set((s) => ({ toasts: [...s.toasts, { id, text, type, durationMs }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, durationMs);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  toggleFab: (open) => set((s) => ({ isFabOpen: open !== undefined ? open : !s.isFabOpen })),
  setSearchActive: (active) => set({ isSearchActive: active }),
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),
  setAiOverlayVisible: (visible) => set({ isAiOverlayVisible: visible }),
  setDedupOverlayVisible: (visible) => set({ isDedupOverlayVisible: visible }),
  setStatsModalVisible: (visible) => set({ isStatsModalVisible: visible }),
  setSettingsModalVisible: (visible) => set({ isSettingsModalVisible: visible }),
  setAlbumPickerVisible: (visible) => set({ isAlbumPickerVisible: visible }),
  setTabBarHidden: (hidden) => set({ isTabBarHidden: hidden }),
  setMapOnlyWithMemos: (enabled) => set({ mapOnlyWithMemos: enabled }),
  toggleMapOnlyWithMemos: () =>
    set((s) => ({ mapOnlyWithMemos: !s.mapOnlyWithMemos })),
  setMapPreviewPin: (pin) => set({ mapPreviewPin: pin }),
  requestMapPreviewPinDropPoint: (point) =>
    set({
      mapPreviewPinDropPoint: {
        ...point,
        requestId: ++mapPreviewPinRequestId,
      },
    }),
  clearMapPreviewPinDropPoint: () => set({ mapPreviewPinDropPoint: null }),
  setGridScrollOffset: (offset) => set({ gridScrollOffset: offset }),

  cacheStory: (story) => {
    const cache = new Map(get().storyCache);
    cache.set(story.id, story);
    set({ storyCache: cache });
  },
  getStory: (id) => get().storyCache.get(id) ?? null,
}));
