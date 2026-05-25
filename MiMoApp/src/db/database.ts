import type { Photo, Album } from '../types';

export interface IDatabase {
  getAllPhotos(): Promise<Photo[]>;
  getPhotoById(id: string): Promise<Photo | null>;
  insertPhoto(photo: Photo): Promise<void>;
  updatePhoto(id: string, patch: Partial<Photo>): Promise<void>;
  deletePhotos(ids: string[]): Promise<void>;

  getAllAlbums(): Promise<Album[]>;
  getAlbumById(id: string): Promise<Album | null>;
  insertAlbum(album: Album): Promise<void>;
  updateAlbum(id: string, patch: Partial<Album>): Promise<void>;
  deleteAlbum(id: string): Promise<void>;
  addPhotosToAlbum(albumId: string, photoIds: string[]): Promise<void>;
  removePhotosFromAlbum(albumId: string, photoIds: string[]): Promise<void>;

  kvGet<T>(key: string, fallback: T): Promise<T>;
  kvSet<T>(key: string, value: T): Promise<void>;

  close(): Promise<void>;
}

class MockDatabase implements IDatabase {
  private photos = new Map<string, Photo>();
  private albums = new Map<string, Album>();
  private kv = new Map<string, unknown>();

  async getAllPhotos(): Promise<Photo[]> {
    return [...this.photos.values()];
  }
  async getPhotoById(id: string): Promise<Photo | null> {
    return this.photos.get(id) ?? null;
  }
  async insertPhoto(photo: Photo): Promise<void> {
    this.photos.set(photo.id, { ...photo });
  }
  async updatePhoto(id: string, patch: Partial<Photo>): Promise<void> {
    const existing = this.photos.get(id);
    if (existing) this.photos.set(id, { ...existing, ...patch });
  }
  async deletePhotos(ids: string[]): Promise<void> {
    ids.forEach((id) => this.photos.delete(id));
  }

  async getAllAlbums(): Promise<Album[]> {
    return [...this.albums.values()];
  }
  async getAlbumById(id: string): Promise<Album | null> {
    return this.albums.get(id) ?? null;
  }
  async insertAlbum(album: Album): Promise<void> {
    this.albums.set(album.id, { ...album });
  }
  async updateAlbum(id: string, patch: Partial<Album>): Promise<void> {
    const existing = this.albums.get(id);
    if (existing) this.albums.set(id, { ...existing, ...patch });
  }
  async deleteAlbum(id: string): Promise<void> {
    this.albums.delete(id);
  }
  async addPhotosToAlbum(albumId: string, photoIds: string[]): Promise<void> {
    const album = this.albums.get(albumId);
    if (album) {
      album.photoIds = [...new Set([...album.photoIds, ...photoIds])];
      album.photoCount = album.photoIds.length;
    }
  }
  async removePhotosFromAlbum(albumId: string, photoIds: string[]): Promise<void> {
    const album = this.albums.get(albumId);
    if (album) {
      album.photoIds = album.photoIds.filter((pid) => !photoIds.includes(pid));
      album.photoCount = album.photoIds.length;
    }
  }

  async kvGet<T>(key: string, fallback: T): Promise<T> {
    return (this.kv.get(key) as T) ?? fallback;
  }
  async kvSet<T>(key: string, value: T): Promise<void> {
    this.kv.set(key, value);
  }

  async close(): Promise<void> {
    this.photos.clear();
    this.albums.clear();
    this.kv.clear();
  }
}

let _instance: IDatabase | null = null;

export function getDatabase(): IDatabase {
  if (!_instance) {
    _instance = createDatabase();
  }
  return _instance;
}

export function setDatabase(db: IDatabase): void {
  _instance = db;
}

function createDatabase(): IDatabase {
  try {
    require('@nozbe/watermelondb');
    const { createWatermelonDatabase } = require('./WatermelonDatabase');
    return createWatermelonDatabase();
  } catch {
    return new MockDatabase();
  }
}
