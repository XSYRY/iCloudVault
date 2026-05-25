import type { Photo, Album, AppSettings } from '../../types';

export interface BackupData {
  photos: Photo[];
  albums: Album[];
  settings: AppSettings;
  timestamp: number;
  version: number;
  deviceId: string;
}

export interface BackupMeta {
  id: string;
  timestamp: number;
  size: number;
  photoCount: number;
  albumCount: number;
  deviceId: string;
  label: string;
}

export interface BackupProgress {
  phase: 'scanning' | 'exporting' | 'writing';
  progress: number;
  message: string;
}

export type BackupProgressCallback = (progress: BackupProgress) => void;

export interface IBackupService {
  exportBackup(label?: string, onProgress?: BackupProgressCallback): Promise<BackupMeta>;
  importBackup(id: string, onProgress?: BackupProgressCallback): Promise<void>;
  listBackups(): Promise<BackupMeta[]>;
  deleteBackup(id: string): Promise<void>;
  getBackupInfo(id: string): Promise<BackupMeta | null>;
}
