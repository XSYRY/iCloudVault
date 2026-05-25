// ============================================================
// WatermelonDB Photo Model
// 映射到 photos 表 — 后期接入 @nozbe/watermelondb
// ============================================================

import type { Photo as IPhoto, ExifData, EditState } from '../../types';

export interface PhotoRecord {
  id: string;
  uri: string;
  thumbnailUri: string | null;
  filename: string;
  sizeBytes: number;
  width: number;
  height: number;
  createdAt: number;
  dateTaken: string;
  timeTaken: string;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  exifJson: string;
  color: string;
  isFavorite: boolean;
  isHidden: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  deletedAt: number | null;
  aiTagsJson: string | null;
  aiCategory: string | null;
  faceCount: number | null;
  phash: string | null;
  embeddingJson: string | null;
  duplicateOfId: string | null;
  editsJson: string;
  rating: number;
  mediaType: string;
  duration: number | null;
  livePhotoVideoUri: string | null;
}

// 序列化：IPhoto → DB record
export function photoToRecord(photo: IPhoto): PhotoRecord {
  return {
    ...photo,
    thumbnailUri: photo.thumbnailUri ?? null,
    locationName: photo.locationName ?? null,
    aiTagsJson: photo.aiTags ? JSON.stringify(photo.aiTags) : null,
    aiCategory: photo.aiCategory ?? null,
    faceCount: photo.faceCount ?? null,
    phash: photo.phash ?? null,
    embeddingJson: photo.embedding ? JSON.stringify(photo.embedding) : null,
    duplicateOfId: photo.duplicateOfId ?? null,
    exifJson: JSON.stringify(photo.exif),
    editsJson: JSON.stringify(photo.edits),
    deletedAt: photo.deletedAt ?? null,
    latitude: photo.latitude ?? null,
    longitude: photo.longitude ?? null,
    mediaType: photo.mediaType,
    duration: photo.duration ?? null,
    livePhotoVideoUri: photo.livePhotoVideoUri ?? null,
  };
}

// 反序列化：DB record → IPhoto
export function recordToPhoto(rec: PhotoRecord): IPhoto {
  return {
    id: rec.id,
    uri: rec.uri,
    thumbnailUri: rec.thumbnailUri ?? undefined,
    filename: rec.filename,
    sizeBytes: rec.sizeBytes,
    width: rec.width,
    height: rec.height,
    createdAt: rec.createdAt,
    dateTaken: rec.dateTaken,
    timeTaken: rec.timeTaken,
    latitude: rec.latitude,
    longitude: rec.longitude,
    locationName: rec.locationName ?? null,
    aiTags: rec.aiTagsJson ? JSON.parse(rec.aiTagsJson) : null,
    aiCategory: (rec.aiCategory as IPhoto['aiCategory']) ?? null,
    faceCount: rec.faceCount,
    phash: rec.phash,
    embedding: rec.embeddingJson ? JSON.parse(rec.embeddingJson) : null,
    duplicateOfId: rec.duplicateOfId,
    exif: JSON.parse(rec.exifJson),
    color: rec.color,
    isFavorite: rec.isFavorite,
    isHidden: rec.isHidden,
    isPinned: rec.isPinned,
    isDeleted: rec.isDeleted,
    deletedAt: rec.deletedAt ?? undefined,
    edits: JSON.parse(rec.editsJson),
    versions: [],
    rating: rec.rating,
    mediaType: (rec.mediaType as IPhoto['mediaType']) || 'photo',
    duration: rec.duration ?? null,
    livePhotoVideoUri: rec.livePhotoVideoUri ?? undefined,
  };
}
