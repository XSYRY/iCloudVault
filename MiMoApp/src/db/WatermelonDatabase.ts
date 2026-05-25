import { Database, Model, Q, type Collection } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import type { IDatabase } from './database';
import type { Photo, Album, SmartAlbumRule } from '../types';
import { photoToRecord, recordToPhoto, type PhotoRecord } from './models/Photo';
import { albumToRecord, recordToAlbum, rulesToRecords, recordsToRules, type AlbumRecord, type SmartAlbumRuleRecord } from './models/Album';
import { DB_VERSION } from './schema';
import { appSchema, tableSchema } from '@nozbe/watermelondb';

class PhotoModel extends Model {
  static table = 'photos';
}

class AlbumModel extends Model {
  static table = 'albums';
}

class AlbumPhotoModel extends Model {
  static table = 'album_photos';
}

class SmartAlbumModel extends Model {
  static table = 'smart_albums';
}

class KvStoreModel extends Model {
  static table = 'kv_store';
}

const wmSchema = appSchema({
  version: DB_VERSION,
  tables: [
    tableSchema({ name: 'photos', columns: [
      { name: 'uri', type: 'string' },
      { name: 'thumbnail_uri', type: 'string', isOptional: true },
      { name: 'filename', type: 'string' },
      { name: 'size_bytes', type: 'number' },
      { name: 'width', type: 'number' },
      { name: 'height', type: 'number' },
      { name: 'created_at', type: 'number' },
      { name: 'date_taken', type: 'string' },
      { name: 'time_taken', type: 'string' },
      { name: 'latitude', type: 'number', isOptional: true },
      { name: 'longitude', type: 'number', isOptional: true },
      { name: 'location_name', type: 'string', isOptional: true },
      { name: 'exif_json', type: 'string' },
      { name: 'color', type: 'string' },
      { name: 'is_favorite', type: 'boolean' },
      { name: 'is_hidden', type: 'boolean' },
      { name: 'is_pinned', type: 'boolean' },
      { name: 'is_deleted', type: 'boolean' },
      { name: 'deleted_at', type: 'number', isOptional: true },
      { name: 'ai_tags_json', type: 'string', isOptional: true },
      { name: 'ai_category', type: 'string', isOptional: true },
      { name: 'face_count', type: 'number', isOptional: true },
      { name: 'phash', type: 'string', isOptional: true },
      { name: 'embedding_json', type: 'string', isOptional: true },
      { name: 'duplicate_of_id', type: 'string', isOptional: true },
      { name: 'edits_json', type: 'string' },
      { name: 'rating', type: 'number' },
      { name: 'media_type', type: 'string' },
      { name: 'duration', type: 'number', isOptional: true },
      { name: 'live_photo_video_uri', type: 'string', isOptional: true },
    ]}),
    tableSchema({ name: 'albums', columns: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'cover_uri', type: 'string', isOptional: true },
      { name: 'photo_count', type: 'number' },
      { name: 'is_smart', type: 'boolean' },
      { name: 'created_at', type: 'number' },
      { name: 'sort_order', type: 'number' },
    ]}),
    tableSchema({ name: 'album_photos', columns: [
      { name: 'album_id', type: 'string' },
      { name: 'photo_id', type: 'string' },
      { name: 'added_at', type: 'number' },
    ]}),
    tableSchema({ name: 'smart_albums', columns: [
      { name: 'album_id', type: 'string' },
      { name: 'field', type: 'string' },
      { name: 'operator', type: 'string' },
      { name: 'value', type: 'string' },
    ]}),
    tableSchema({ name: 'kv_store', columns: [
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ]}),
  ],
});

const adapter = new SQLiteAdapter({
  schema: wmSchema,
  jsi: true,
});

const watermelonDb = new Database({
  adapter,
  modelClasses: [PhotoModel, AlbumModel, AlbumPhotoModel, SmartAlbumModel, KvStoreModel],
});

const photoColumns: Array<[keyof PhotoRecord, string]> = [
  ['uri', 'uri'],
  ['thumbnailUri', 'thumbnail_uri'],
  ['filename', 'filename'],
  ['sizeBytes', 'size_bytes'],
  ['width', 'width'],
  ['height', 'height'],
  ['createdAt', 'created_at'],
  ['dateTaken', 'date_taken'],
  ['timeTaken', 'time_taken'],
  ['latitude', 'latitude'],
  ['longitude', 'longitude'],
  ['locationName', 'location_name'],
  ['exifJson', 'exif_json'],
  ['color', 'color'],
  ['isFavorite', 'is_favorite'],
  ['isHidden', 'is_hidden'],
  ['isPinned', 'is_pinned'],
  ['isDeleted', 'is_deleted'],
  ['deletedAt', 'deleted_at'],
  ['aiTagsJson', 'ai_tags_json'],
  ['aiCategory', 'ai_category'],
  ['faceCount', 'face_count'],
  ['phash', 'phash'],
  ['embeddingJson', 'embedding_json'],
  ['duplicateOfId', 'duplicate_of_id'],
  ['editsJson', 'edits_json'],
  ['rating', 'rating'],
  ['mediaType', 'media_type'],
  ['duration', 'duration'],
  ['livePhotoVideoUri', 'live_photo_video_uri'],
];

const albumColumns: Array<[keyof AlbumRecord, string]> = [
  ['name', 'name'],
  ['description', 'description'],
  ['coverUri', 'cover_uri'],
  ['photoCount', 'photo_count'],
  ['isSmart', 'is_smart'],
  ['createdAt', 'created_at'],
  ['sortOrder', 'sort_order'],
];

function writeColumns<T extends object>(record: Model, source: T, columns: Array<[keyof T, string]>) {
  for (const [sourceKey, dbKey] of columns) {
    (record._raw as any)[dbKey] = (source as any)[sourceKey];
  }
}

function photoRawToRecord(raw: any): PhotoRecord {
  return {
    id: raw.id,
    uri: raw.uri,
    thumbnailUri: raw.thumbnail_uri ?? null,
    filename: raw.filename,
    sizeBytes: raw.size_bytes,
    width: raw.width,
    height: raw.height,
    createdAt: raw.created_at,
    dateTaken: raw.date_taken,
    timeTaken: raw.time_taken,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    locationName: raw.location_name ?? null,
    exifJson: raw.exif_json,
    color: raw.color,
    isFavorite: raw.is_favorite,
    isHidden: raw.is_hidden,
    isPinned: raw.is_pinned,
    isDeleted: raw.is_deleted,
    deletedAt: raw.deleted_at ?? null,
    aiTagsJson: raw.ai_tags_json ?? null,
    aiCategory: raw.ai_category ?? null,
    faceCount: raw.face_count ?? null,
    phash: raw.phash ?? null,
    embeddingJson: raw.embedding_json ?? null,
    duplicateOfId: raw.duplicate_of_id ?? null,
    editsJson: raw.edits_json,
    rating: raw.rating,
    mediaType: raw.media_type,
    duration: raw.duration ?? null,
    livePhotoVideoUri: raw.live_photo_video_uri ?? null,
  };
}

function albumRawToRecord(raw: any): AlbumRecord {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    coverUri: raw.cover_uri ?? null,
    photoCount: raw.photo_count,
    isSmart: raw.is_smart,
    createdAt: raw.created_at,
    sortOrder: raw.sort_order,
  };
}

class WatermelonDatabase implements IDatabase {
  private photoCollection: Collection<PhotoModel> = watermelonDb.get<PhotoModel>('photos');
  private albumCollection: Collection<AlbumModel> = watermelonDb.get<AlbumModel>('albums');
  private albumPhotosCollection: Collection<AlbumPhotoModel> = watermelonDb.get<AlbumPhotoModel>('album_photos');
  private smartAlbumCollection: Collection<SmartAlbumModel> = watermelonDb.get<SmartAlbumModel>('smart_albums');
  private kvCollection: Collection<KvStoreModel> = watermelonDb.get<KvStoreModel>('kv_store');

  async getAllPhotos(): Promise<Photo[]> {
    const records = await this.photoCollection.query().fetch();
    return records.map((r) => recordToPhoto(photoRawToRecord(r._raw)));
  }

  async getPhotoById(id: string): Promise<Photo | null> {
    try {
      const record = await this.photoCollection.find(id);
      return recordToPhoto(photoRawToRecord(record._raw));
    } catch {
      return null;
    }
  }

  async insertPhoto(photo: Photo): Promise<void> {
    const rec = photoToRecord(photo);
    await watermelonDb.write(async () => {
      await this.photoCollection.create((record: any) => {
        record._raw.id = rec.id;
        writeColumns(record, rec, photoColumns);
      });
    });
  }

  async updatePhoto(id: string, patch: Partial<Photo>): Promise<void> {
    await watermelonDb.write(async () => {
      const record = await this.photoCollection.find(id);
      await record.update((r: any) => {
        const rec = photoToRecord({ ...recordToPhoto(photoRawToRecord(r._raw)), ...patch });
        writeColumns(r, rec, photoColumns);
      });
    });
  }

  async deletePhotos(ids: string[]): Promise<void> {
    await watermelonDb.write(async () => {
      const batch = await Promise.all(
        ids.map((id) => this.photoCollection.find(id).then((r) => r.prepareMarkAsDeleted())),
      );
      await watermelonDb.batch(...batch);
    });
  }

  async getAllAlbums(): Promise<Album[]> {
    const albumRecords = await this.albumCollection.query().fetch();
    const albums: Album[] = [];
    for (const ar of albumRecords) {
      const photoIds = await this.getAlbumPhotoIds(ar.id);
      const rules = await this.getSmartAlbumRules(ar.id);
      albums.push(recordToAlbum(albumRawToRecord(ar._raw), photoIds, rules));
    }
    return albums;
  }

  async getAlbumById(id: string): Promise<Album | null> {
    try {
      const record = await this.albumCollection.find(id);
      const photoIds = await this.getAlbumPhotoIds(id);
      const rules = await this.getSmartAlbumRules(id);
      return recordToAlbum(albumRawToRecord(record._raw), photoIds, rules);
    } catch {
      return null;
    }
  }

  async insertAlbum(album: Album): Promise<void> {
    const rec = albumToRecord(album);
    await watermelonDb.write(async () => {
      await this.albumCollection.create((record: any) => {
        record._raw.id = rec.id;
        writeColumns(record, rec, albumColumns);
      });
      if (album.smartRules) {
        const ruleRecords = rulesToRecords(album.id, album.smartRules);
        for (const rr of ruleRecords) {
          await this.smartAlbumCollection.create((record: any) => {
            record._raw.album_id = rr.albumId;
            record._raw.field = rr.field;
            record._raw.operator = rr.operator;
            record._raw.value = rr.value;
          });
        }
      }
    });
  }

  async updateAlbum(id: string, patch: Partial<Album>): Promise<void> {
    await watermelonDb.write(async () => {
      const record = await this.albumCollection.find(id);
      await record.update((r: any) => {
        const rec = albumToRecord({ ...recordToAlbum(albumRawToRecord(r._raw), []), ...patch });
        writeColumns(r, rec, albumColumns);
      });
    });
  }

  async deleteAlbum(id: string): Promise<void> {
    await watermelonDb.write(async () => {
      const record = await this.albumCollection.find(id);
      await record.markAsDeleted();
      await record.destroyPermanently();
    });
  }

  async addPhotosToAlbum(albumId: string, photoIds: string[]): Promise<void> {
    await watermelonDb.write(async () => {
      for (const photoId of photoIds) {
        await this.albumPhotosCollection.create((record: any) => {
          record._raw.album_id = albumId;
          record._raw.photo_id = photoId;
          record._raw.added_at = Date.now();
        });
      }
      const album = await this.albumCollection.find(albumId);
      const count = await this.albumPhotosCollection
        .query(Q.where('album_id', albumId))
        .fetchCount();
      await album.update((a: any) => { a._raw.photo_count = count; });
    });
  }

  async removePhotosFromAlbum(albumId: string, photoIds: string[]): Promise<void> {
    await watermelonDb.write(async () => {
      const links = await this.albumPhotosCollection
        .query(Q.where('album_id', albumId))
        .fetch();
      for (const link of links) {
        const raw = link._raw as any;
        if (photoIds.includes(raw.photo_id as string)) {
          await link.markAsDeleted();
          await link.destroyPermanently();
        }
      }
      const album = await this.albumCollection.find(albumId);
      const count = await this.albumPhotosCollection
        .query(Q.where('album_id', albumId))
        .fetchCount();
      await album.update((a: any) => { a._raw.photo_count = count; });
    });
  }

  async kvGet<T>(key: string, fallback: T): Promise<T> {
    try {
      const records = await this.kvCollection.query(Q.where('key', key)).fetch();
      if (records.length > 0) {
        const raw = records[0]._raw as any;
        return JSON.parse(raw.value as string) as T;
      }
      return fallback;
    } catch {
      return fallback;
    }
  }

  async kvSet<T>(key: string, value: T): Promise<void> {
    await watermelonDb.write(async () => {
      const existing = await this.kvCollection.query(Q.where('key', key)).fetch();
      if (existing.length > 0) {
        await existing[0].update((record: any) => {
          record._raw.value = JSON.stringify(value);
        });
      } else {
        await this.kvCollection.create((record: any) => {
          record._raw.key = key;
          record._raw.value = JSON.stringify(value);
        });
      }
    });
  }

  async close(): Promise<void> {}

  private async getAlbumPhotoIds(albumId: string): Promise<string[]> {
    const links = await this.albumPhotosCollection
      .query(Q.where('album_id', albumId))
      .fetch();
    return links.map((l) => (l._raw as any).photo_id as string);
  }

  private async getSmartAlbumRules(albumId: string): Promise<SmartAlbumRule[] | undefined> {
    const rules = await this.smartAlbumCollection
      .query(Q.where('album_id', albumId))
      .fetch();
    if (rules.length === 0) return undefined;
    return recordsToRules(rules.map((r) => ({
      albumId: (r._raw as any).album_id,
      field: (r._raw as any).field,
      operator: (r._raw as any).operator,
      value: (r._raw as any).value,
    })));
  }
}

export function createWatermelonDatabase(): IDatabase {
  return new WatermelonDatabase();
}
