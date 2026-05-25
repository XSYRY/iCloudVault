import { create } from 'zustand';
import type { Photo, PhotoFilter, SortMode } from '../types';
import { getDatabase } from '../db';
import { logError } from '../utils/logger';

interface PhotoState {
  photos: Photo[];
  sortMode: SortMode;
  filter: PhotoFilter;
  selectionMode: boolean;
  selectedIds: Set<string>;
  isGridReady: boolean;
  isHydrated: boolean;

  setPhotos: (photos: Photo[]) => void;
  addPhotos: (photos: Photo[]) => void;
  updatePhoto: (id: string, patch: Partial<Photo>) => void;
  removePhotos: (ids: string[]) => void;

  setSortMode: (mode: SortMode) => void;
  setFilter: (patch: Partial<PhotoFilter>) => void;
  resetFilter: () => void;

  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  enterSelection: () => void;
  exitSelection: () => void;

  batchFavorite: () => void;
  batchDelete: () => void;
  batchHide: () => void;

  getFilteredPhotos: () => Photo[];
  getPhotoById: (id: string) => Photo | undefined;

  hydrateFromDb: () => Promise<void>;
}

const PHOTO_MEMOS_KV_KEY = 'photo-memos';

const defaultFilter: PhotoFilter = {
  category: null,
  isFavorite: null,
  mediaType: null,
  dateRange: null,
  location: null,
  searchQuery: '',
};

const dbCatch = (op: string) => (err: unknown) => logError(`photoStore.${op}`, err);

export const usePhotoStore = create<PhotoState>((set, get) => ({
  photos: [],
  sortMode: 'date-desc',
  filter: { ...defaultFilter },
  selectionMode: false,
  selectedIds: new Set(),
  isGridReady: false,
  isHydrated: false,

  hydrateFromDb: async () => {
    try {
      const db = getDatabase();
      const [photos, memoMap] = await Promise.all([
        db.getAllPhotos(),
        db.kvGet<Record<string, string>>(PHOTO_MEMOS_KV_KEY, {}),
      ]);
      const hydratedPhotos = photos.map((photo) => ({
        ...photo,
        memo: memoMap[photo.id] ?? photo.memo,
      }));
      set({ photos: hydratedPhotos, isGridReady: true, isHydrated: true });
    } catch (err) {
      logError('hydrateFromDb', err);
      set({ isGridReady: true, isHydrated: true });
    }
  },

  setPhotos: (photos) => set({ photos, isGridReady: true, isHydrated: true }),
  addPhotos: (photos) => {
    set((s) => ({ photos: [...photos, ...s.photos] }));
    const db = getDatabase();
    for (const p of photos) {
      db.insertPhoto(p).catch(dbCatch('insertPhoto'));
    }
  },
  updatePhoto: (id, patch) => {
    set((s) => ({
      photos: s.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
    getDatabase().updatePhoto(id, patch).catch(dbCatch('updatePhoto'));
    if (Object.prototype.hasOwnProperty.call(patch, 'memo')) {
      getDatabase()
        .kvGet<Record<string, string>>(PHOTO_MEMOS_KV_KEY, {})
        .then((memoMap) => {
          const nextMemoMap = { ...memoMap };
          const nextMemo = patch.memo?.trim();
          if (nextMemo) {
            nextMemoMap[id] = nextMemo;
          } else {
            delete nextMemoMap[id];
          }
          return getDatabase().kvSet(PHOTO_MEMOS_KV_KEY, nextMemoMap);
        })
        .catch(dbCatch('updatePhotoMemo'));
    }
  },
  removePhotos: (ids) => {
    set((s) => ({
      photos: s.photos.filter((p) => !ids.includes(p.id)),
      selectedIds: new Set([...s.selectedIds].filter((sid) => !ids.includes(sid))),
    }));
    getDatabase().deletePhotos(ids).catch(dbCatch('deletePhotos'));
  },

  setSortMode: (mode) => set({ sortMode: mode }),
  setFilter: (patch) => set((s) => ({ filter: { ...s.filter, ...patch } })),
  resetFilter: () => set({ filter: { ...defaultFilter } }),

  toggleSelection: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { selectedIds: next };
    }),
  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
  clearSelection: () => set({ selectedIds: new Set(), selectionMode: false }),
  enterSelection: () => set({ selectionMode: true, selectedIds: new Set() }),
  exitSelection: () => set({ selectionMode: false, selectedIds: new Set() }),

  batchFavorite: () => {
    const { photos, selectedIds } = get();
    const allFav = [...selectedIds].every((id) => photos.find((p) => p.id === id)?.isFavorite);
    set((s) => ({
      photos: s.photos.map((p) =>
        selectedIds.has(p.id) ? { ...p, isFavorite: !allFav } : p,
      ),
      selectedIds: new Set(),
      selectionMode: false,
    }));
    const db = getDatabase();
    for (const id of selectedIds) {
      db.updatePhoto(id, { isFavorite: !allFav }).catch(dbCatch('batchFavorite'));
    }
  },
  batchDelete: () => {
    const { selectedIds } = get();
    set((s) => ({
      photos: s.photos.map((p) =>
        selectedIds.has(p.id) ? { ...p, isDeleted: true, deletedAt: Date.now() } : p,
      ),
      selectedIds: new Set(),
      selectionMode: false,
    }));
    const db = getDatabase();
    for (const id of selectedIds) {
      db.updatePhoto(id, { isDeleted: true, deletedAt: Date.now() }).catch(dbCatch('batchDelete'));
    }
  },
  batchHide: () => {
    const { selectedIds } = get();
    set((s) => ({
      photos: s.photos.map((p) =>
        selectedIds.has(p.id) ? { ...p, isHidden: true } : p,
      ),
      selectedIds: new Set(),
      selectionMode: false,
    }));
    const db = getDatabase();
    for (const id of selectedIds) {
      db.updatePhoto(id, { isHidden: true }).catch(dbCatch('batchHide'));
    }
  },

  getFilteredPhotos: () => {
    const { photos, sortMode, filter } = get();
    let result = photos.filter((p) => !p.isDeleted);
    if (filter.category) result = result.filter((p) => p.aiCategory === filter.category);
    if (filter.isFavorite) result = result.filter((p) => p.isFavorite);
    if (filter.mediaType) result = result.filter((p) => p.mediaType === filter.mediaType);
    if (filter.location) result = result.filter((p) => p.locationName?.includes(filter.location!));
    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.filename.toLowerCase().includes(q) ||
          (p.aiTags && p.aiTags.some((t) => t.toLowerCase().includes(q))) ||
          p.locationName?.toLowerCase().includes(q) ||
          p.memo?.toLowerCase().includes(q) ||
          p.dateTaken.includes(q),
      );
    }
    result.sort((a, b) => {
      switch (sortMode) {
        case 'date-asc': return a.createdAt - b.createdAt;
        case 'name': return a.filename.localeCompare(b.filename);
        case 'size': return a.sizeBytes - b.sizeBytes;
        case 'date-desc':
        default: return b.createdAt - a.createdAt;
      }
    });
    return result;
  },

  getPhotoById: (id) => get().photos.find((p) => p.id === id),
}));
