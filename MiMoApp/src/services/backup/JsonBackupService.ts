import type { IBackupService, BackupData, BackupMeta, BackupProgressCallback } from './types';
import type { AppSettings } from '../../types';
import { getDatabase } from '../../db';
import { logError } from '../../utils/logger';

const BACKUP_DIR = 'mimo-backups';
const BACKUP_PREFIX = 'mimo-backup-';
const BACKUP_EXT = '.json';
const BACKUP_VERSION = 1;

interface RnfsModule {
  DocumentDirectoryPath: string;
  mkdir(filepath: string, options?: { NSURLIsExcludedFromBackupKey?: boolean }): Promise<void>;
  writeFile(filepath: string, contents: string, encoding?: string): Promise<void>;
  readFile(filepath: string, encoding?: string): Promise<string>;
  unlink(filepath: string): Promise<void>;
  readDir(filepath: string): Promise<Array<{ name: string; path: string; size: number; mtime?: Date }>>;
  exists(filepath: string): Promise<boolean>;
}

let _rnfs: RnfsModule | null | undefined = undefined;

function getRnfs(): RnfsModule | null {
  if (_rnfs !== undefined) return _rnfs;
  try {
    _rnfs = require('react-native-fs') as RnfsModule;
  } catch {
    _rnfs = null;
  }
  return _rnfs;
}

const memoryStore = new Map<string, string>();

function getBackupDirPath(): string {
  const rnfs = getRnfs();
  if (rnfs) {
    return `${rnfs.DocumentDirectoryPath}/${BACKUP_DIR}`;
  }
  return BACKUP_DIR;
}

function makeFileName(timestamp: number): string {
  return `${BACKUP_PREFIX}${timestamp}${BACKUP_EXT}`;
}

function parseTimestampFromFilename(name: string): number | null {
  if (!name.startsWith(BACKUP_PREFIX) || !name.endsWith(BACKUP_EXT)) return null;
  const tsStr = name.slice(BACKUP_PREFIX.length, -BACKUP_EXT.length);
  const ts = Number(tsStr);
  return Number.isFinite(ts) ? ts : null;
}

function metaFromData(id: string, data: BackupData, size: number): BackupMeta {
  return {
    id,
    timestamp: data.timestamp,
    size,
    photoCount: data.photos.length,
    albumCount: data.albums.length,
    deviceId: data.deviceId,
    label: new Date(data.timestamp).toLocaleString(),
  };
}

function byteLength(str: string): number {
  try {
    return new TextEncoder().encode(str).length;
  } catch {
    return str.length * 3;
  }
}

export class JsonBackupService implements IBackupService {
  async exportBackup(label?: string, onProgress?: BackupProgressCallback): Promise<BackupMeta> {
    onProgress?.({ phase: 'scanning', progress: 0, message: '正在扫描数据...' });

    const db = getDatabase();
    const photos = await db.getAllPhotos();
    const albums = await db.getAllAlbums();

    onProgress?.({ phase: 'exporting', progress: 0.3, message: '正在序列化数据...' });

    const data: BackupData = {
      photos,
      albums,
      settings: this.readCurrentSettings(),
      timestamp: Date.now(),
      version: BACKUP_VERSION,
      deviceId: this.getDeviceId(),
    };

    const json = JSON.stringify(data);
    const size = byteLength(json);
    const fileName = makeFileName(data.timestamp);
    const id = fileName;

    onProgress?.({ phase: 'writing', progress: 0.7, message: '正在写入备份文件...' });

    const rnfs = getRnfs();
    if (rnfs) {
      try {
        const dirPath = getBackupDirPath();
        const dirExists = await rnfs.exists(dirPath);
        if (!dirExists) {
          await rnfs.mkdir(dirPath, { NSURLIsExcludedFromBackupKey: true });
        }
        await rnfs.writeFile(`${dirPath}/${fileName}`, json, 'utf8');
      } catch (err) {
        logError('JsonBackupService.exportBackup', err);
        memoryStore.set(id, json);
      }
    } else {
      memoryStore.set(id, json);
    }

    onProgress?.({ phase: 'writing', progress: 1, message: '备份完成' });

    const meta = metaFromData(id, data, size);
    if (label) {
      meta.label = label;
    }
    return meta;
  }

  async importBackup(id: string, onProgress?: BackupProgressCallback): Promise<void> {
    onProgress?.({ phase: 'scanning', progress: 0, message: '正在读取备份...' });

    const json = await this.readBackupFile(id);
    if (!json) {
      throw new Error(`备份文件不存在: ${id}`);
    }

    onProgress?.({ phase: 'exporting', progress: 0.2, message: '正在解析数据...' });

    let data: BackupData;
    try {
      data = JSON.parse(json) as BackupData;
    } catch (err) {
      throw new Error('备份文件格式损坏');
    }

    if (data.version > BACKUP_VERSION) {
      throw new Error(`备份版本 v${data.version} 不兼容，当前支持 v${BACKUP_VERSION}`);
    }

    onProgress?.({ phase: 'exporting', progress: 0.5, message: '正在恢复数据...' });

    const db = getDatabase();

    for (const photo of data.photos) {
      try {
        await db.insertPhoto(photo);
      } catch (err) {
        logError('JsonBackupService.importBackup.photo', err);
      }
    }

    for (const album of data.albums) {
      try {
        await db.insertAlbum(album);
      } catch (err) {
        logError('JsonBackupService.importBackup.album', err);
      }
    }

    if (data.settings) {
      try {
        const { useSettingsStore } = require('../../store');
        useSettingsStore.getState().updateSettings(data.settings);
      } catch (err) {
        logError('JsonBackupService.importBackup.settings', err);
      }
    }

    onProgress?.({ phase: 'writing', progress: 0.8, message: '正在刷新数据...' });

    try {
      const { usePhotoStore } = require('../../store');
      await usePhotoStore.getState().hydrateFromDb();
      const { useAlbumStore } = require('../../store');
      await useAlbumStore.getState().hydrateFromDb();
    } catch (err) {
      logError('JsonBackupService.importBackup.hydrate', err);
    }

    onProgress?.({ phase: 'writing', progress: 1, message: '恢复完成' });
  }

  async listBackups(): Promise<BackupMeta[]> {
    const rnfs = getRnfs();
    const metas: BackupMeta[] = [];

    if (rnfs) {
      try {
        const dirPath = getBackupDirPath();
        const dirExists = await rnfs.exists(dirPath);
        if (dirExists) {
          const entries = await rnfs.readDir(dirPath);
          for (const entry of entries) {
            const ts = parseTimestampFromFilename(entry.name);
            if (ts === null) continue;
            try {
              const content = await rnfs.readFile(entry.path, 'utf8');
              const data = JSON.parse(content) as BackupData;
              metas.push(metaFromData(entry.name, data, entry.size));
            } catch (err) {
              logError('JsonBackupService.listBackups.parse', err);
            }
          }
        }
      } catch (err) {
        logError('JsonBackupService.listBackups', err);
      }
    }

    for (const [id, json] of memoryStore.entries()) {
      try {
        const data = JSON.parse(json) as BackupData;
        const size = byteLength(json);
        metas.push(metaFromData(id, data, size));
      } catch (err) {
        logError('JsonBackupService.listBackups.memory', err);
      }
    }

    const seen = new Set<string>();
    return metas.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }

  async deleteBackup(id: string): Promise<void> {
    const rnfs = getRnfs();
    if (rnfs) {
      try {
        const dirPath = getBackupDirPath();
        const filePath = `${dirPath}/${id}`;
        const exists = await rnfs.exists(filePath);
        if (exists) {
          await rnfs.unlink(filePath);
        }
      } catch (err) {
        logError('JsonBackupService.deleteBackup', err);
      }
    }
    memoryStore.delete(id);
  }

  async getBackupInfo(id: string): Promise<BackupMeta | null> {
    const json = await this.readBackupFile(id);
    if (!json) return null;

    try {
      const data = JSON.parse(json) as BackupData;
      const size = byteLength(json);
      return metaFromData(id, data, size);
    } catch {
      return null;
    }
  }

  private async readBackupFile(id: string): Promise<string | null> {
    const rnfs = getRnfs();
    if (rnfs) {
      try {
        const dirPath = getBackupDirPath();
        const filePath = `${dirPath}/${id}`;
        const exists = await rnfs.exists(filePath);
        if (exists) {
          return await rnfs.readFile(filePath, 'utf8');
        }
      } catch (err) {
        logError('JsonBackupService.readBackupFile', err);
      }
    }
    return memoryStore.get(id) ?? null;
  }

  private readCurrentSettings(): AppSettings {
    try {
      const { useSettingsStore } = require('../../store');
      const state = useSettingsStore.getState();
      return {
        theme: state.theme,
        gridColumns: state.gridColumns,
        masonryEnabled: state.masonryEnabled,
        pinEnabled: state.pinEnabled,
        pinCode: state.pinCode,
        biometricEnabled: state.biometricEnabled,
        showFabLabels: state.showFabLabels,
        onboardingComplete: state.onboardingComplete,
        searchHistory: state.searchHistory,
        lastImportTimestamp: state.lastImportTimestamp,
      };
    } catch {
      return {
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
    }
  }

  private getDeviceId(): string {
    try {
      const { Platform } = require('react-native');
      return `${Platform.OS}-${Date.now()}`;
    } catch {
      return `unknown-${Date.now()}`;
    }
  }
}

let _instance: JsonBackupService | null = null;

export function getBackupService(): JsonBackupService {
  if (!_instance) _instance = new JsonBackupService();
  return _instance;
}
