// ============================================================
// WatermelonDB 数据库 Schema 和 Model 定义
// 后期可直接用 WatermelonDB 替换 — 接口已预留
// ============================================================

// ---- 数据库版本 & 迁移占位 ----
export const DB_VERSION = 2;

export interface Migration {
  from: number;
  to: number;
  migrate: () => Promise<void>;
}

// ---- 表名常量 ----
export const Tables = {
  PHOTOS: 'photos',
  ALBUMS: 'albums',
  ALBUM_PHOTOS: 'album_photos',
  SMART_ALBUMS: 'smart_albums',
  PHOTO_VERSIONS: 'photo_versions',
  FACE_GROUPS: 'face_groups',
  FACE_GROUP_PHOTOS: 'face_group_photos',
} as const;

// ---- Photo 表 schema ----
export const photoSchema = {
  name: Tables.PHOTOS,
  columns: [
    { name: 'uri',             type: 'string' },
    { name: 'thumbnail_uri',   type: 'string', isOptional: true },
    { name: 'filename',        type: 'string' },
    { name: 'size_bytes',      type: 'number' },
    { name: 'width',           type: 'number' },
    { name: 'height',          type: 'number' },
    { name: 'created_at',      type: 'number' },
    { name: 'date_taken',      type: 'string' },
    { name: 'time_taken',      type: 'string' },
    { name: 'latitude',        type: 'number', isOptional: true },
    { name: 'longitude',       type: 'number', isOptional: true },
    { name: 'location_name',   type: 'string', isOptional: true },
    { name: 'exif_json',       type: 'string' },
    { name: 'color',           type: 'string' },
    { name: 'is_favorite',     type: 'boolean' },
    { name: 'is_hidden',       type: 'boolean' },
    { name: 'is_pinned',       type: 'boolean' },
    { name: 'is_deleted',      type: 'boolean' },
    { name: 'deleted_at',      type: 'number', isOptional: true },
    { name: 'ai_tags_json',    type: 'string', isOptional: true },
    { name: 'ai_category',     type: 'string', isOptional: true },
    { name: 'face_count',      type: 'number', isOptional: true },
    { name: 'phash',           type: 'string', isOptional: true },
    { name: 'embedding_json',  type: 'string', isOptional: true },
    { name: 'duplicate_of_id', type: 'string', isOptional: true },
    { name: 'edits_json',      type: 'string' },
    { name: 'rating',          type: 'number' },
    { name: 'media_type',      type: 'string' },
    { name: 'duration',        type: 'number', isOptional: true },
    { name: 'live_photo_video_uri', type: 'string', isOptional: true },
  ],
};

// ---- Album 表 schema ----
export const albumSchema = {
  name: Tables.ALBUMS,
  columns: [
    { name: 'name',        type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'cover_uri',   type: 'string', isOptional: true },
    { name: 'photo_count', type: 'number' },
    { name: 'is_smart',    type: 'boolean' },
    { name: 'created_at',  type: 'number' },
    { name: 'sort_order',  type: 'number' },
  ],
};

// ---- AlbumPhotos 关联表 ----
export const albumPhotosSchema = {
  name: Tables.ALBUM_PHOTOS,
  columns: [
    { name: 'album_id',  type: 'string' },
    { name: 'photo_id',  type: 'string' },
    { name: 'added_at',  type: 'number' },
  ],
};

// ---- SmartAlbum 规则表 ----
export const smartAlbumSchema = {
  name: Tables.SMART_ALBUMS,
  columns: [
    { name: 'album_id',  type: 'string' },
    { name: 'field',     type: 'string' },
    { name: 'operator',  type: 'string' },
    { name: 'value',     type: 'string' },
  ],
};

// ---- EditVersion 表 ----
export const photoVersionSchema = {
  name: Tables.PHOTO_VERSIONS,
  columns: [
    { name: 'photo_id',       type: 'string' },
    { name: 'timestamp',      type: 'number' },
    { name: 'thumbnail_uri',  type: 'string' },
    { name: 'description',    type: 'string' },
  ],
};

// ---- FaceGroup 表 ----
export const faceGroupSchema = {
  name: Tables.FACE_GROUPS,
  columns: [
    { name: 'name',           type: 'string' },
    { name: 'thumbnail_uri',  type: 'string', isOptional: true },
    { name: 'face_count',     type: 'number' },
  ],
};

// ---- FaceGroupPhotos 关联表 ----
export const faceGroupPhotosSchema = {
  name: Tables.FACE_GROUP_PHOTOS,
  columns: [
    { name: 'face_group_id', type: 'string' },
    { name: 'photo_id',      type: 'string' },
  ],
};

// ---- 完整 Schema 描述（用于 WatermelonDB 初始化）----
export const schema = {
  version: DB_VERSION,
  tables: [
    photoSchema,
    albumSchema,
    albumPhotosSchema,
    smartAlbumSchema,
    photoVersionSchema,
    faceGroupSchema,
    faceGroupPhotosSchema,
  ],
  migrations: [] as Migration[],
};
