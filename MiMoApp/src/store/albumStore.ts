import { create } from 'zustand';
import type { Album, SmartAlbumRule } from '../types';
import { getDatabase } from '../db';
import { logError } from '../utils/logger';

const dbCatch = (op: string) => (err: unknown) => logError(`albumStore.${op}`, err);

interface AlbumState {
  albums: Album[];
  isHydrated: boolean;

  setAlbums: (albums: Album[]) => void;
  hydrateFromDb: () => Promise<void>;
  createAlbum: (name: string, description?: string) => Album;
  createSmartAlbum: (name: string, rules: SmartAlbumRule[], description?: string) => Album;
  updateAlbum: (id: string, patch: Partial<Album>) => void;
  deleteAlbum: (id: string) => void;
  addToAlbum: (albumId: string, photoIds: string[]) => void;
  removeFromAlbum: (albumId: string, photoIds: string[]) => void;
  getAlbumsByPhotoId: (photoId: string) => Album[];

  evaluateSmartRules: (rules: SmartAlbumRule[], photoTags: string[], photoCategory: string) => boolean;
}

let albumCounter = 0;
const nextAlbumId = (): string => `album-${Date.now()}-${++albumCounter}`;

export const useAlbumStore = create<AlbumState>((set, get) => ({
  albums: [],
  isHydrated: false,

  setAlbums: (albums) => set({ albums, isHydrated: true }),

  hydrateFromDb: async () => {
    try {
      const db = getDatabase();
      const albums = await db.getAllAlbums();
      set({ albums, isHydrated: true });
    } catch (err) {
      logError('hydrateFromDb', err);
      set({ isHydrated: true });
    }
  },

  createAlbum: (name, description = '') => {
    const album: Album = {
      id: nextAlbumId(),
      name,
      description,
      photoCount: 0,
      isSmart: false,
      photoIds: [],
      createdAt: Date.now(),
      sortOrder: get().albums.length,
    };
    set((s) => ({ albums: [...s.albums, album] }));
    getDatabase().insertAlbum(album).catch(dbCatch('createAlbum'));
    return album;
  },

  createSmartAlbum: (name, rules, description = '') => {
    const album: Album = {
      id: nextAlbumId(),
      name,
      description,
      photoCount: 0,
      isSmart: true,
      smartRules: rules,
      photoIds: [],
      createdAt: Date.now(),
      sortOrder: get().albums.length,
    };
    set((s) => ({ albums: [...s.albums, album] }));
    getDatabase().insertAlbum(album).catch(dbCatch('createSmartAlbum'));
    return album;
  },

  updateAlbum: (id, patch) => {
    set((s) => ({
      albums: s.albums.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
    getDatabase().updateAlbum(id, patch).catch(dbCatch('updateAlbum'));
  },

  deleteAlbum: (id) => {
    set((s) => ({ albums: s.albums.filter((a) => a.id !== id) }));
    getDatabase().deleteAlbum(id).catch(dbCatch('deleteAlbum'));
  },

  addToAlbum: (albumId, photoIds) => {
    set((s) => ({
      albums: s.albums.map((a) =>
        a.id === albumId
          ? { ...a, photoIds: [...new Set([...a.photoIds, ...photoIds])], photoCount: a.photoCount + photoIds.length }
          : a,
      ),
    }));
    getDatabase().addPhotosToAlbum(albumId, photoIds).catch(dbCatch('addToAlbum'));
  },

  removeFromAlbum: (albumId, photoIds) => {
    set((s) => ({
      albums: s.albums.map((a) =>
        a.id === albumId
          ? {
              ...a,
              photoIds: a.photoIds.filter((pid) => !photoIds.includes(pid)),
              photoCount: a.photoCount - photoIds.length,
            }
          : a,
      ),
    }));
    getDatabase().removePhotosFromAlbum(albumId, photoIds).catch(dbCatch('removeFromAlbum'));
  },

  getAlbumsByPhotoId: (photoId) => get().albums.filter((a) => a.photoIds.includes(photoId)),

  evaluateSmartRules: (rules, photoTags, photoCategory) =>
    rules.every((rule) => {
      switch (rule.field) {
        case 'category':
          return rule.operator === 'equals' ? photoCategory === rule.value : false;
        case 'tags':
          if (rule.operator === 'contains' && typeof rule.value === 'string') {
            return photoTags.some((t) => t.toLowerCase().includes(rule.value.toString().toLowerCase()));
          }
          return false;
        case 'rating':
          return false;
        default:
          return false;
      }
    }),
}));
