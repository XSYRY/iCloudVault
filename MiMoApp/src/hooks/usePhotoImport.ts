import { useState, useRef, useCallback } from 'react';
import { usePhotoStore, useSettingsStore, useUiStore } from '../store';
import {
  createPhotoImportService,
  PhotoImportService,
  type ImportProgress,
  type PickedImage,
} from '../services/photoImport';

export type ImportSource = 'gallery' | 'camera';

export interface UsePhotoImportReturn {
  isImporting: boolean;
  progress: ImportProgress | null;
  importFromGallery: () => Promise<void>;
  importFromCamera: () => Promise<void>;
  cancelImport: () => void;
}

export function usePhotoImport(): UsePhotoImportReturn {
  const addPhotos = usePhotoStore((s) => s.addPhotos);
  const showToast = useUiStore((s) => s.showToast);
  const setLastImportTimestamp = useSettingsStore((s) => s.setLastImportTimestamp);

  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const serviceRef = useRef<PhotoImportService>(createPhotoImportService());

  const doImport = useCallback(
    async (source: ImportSource) => {
      setIsImporting(true);
      setProgress({ current: 0, total: 0, currentFile: '', phase: 'picking' });

      const service = serviceRef.current;
      service.reset();

      let images: PickedImage[];
      try {
        if (source === 'gallery') {
          images = await service.pickFromGallery({ multiple: true, maxFiles: 50, mediaType: 'mixed' });
        } else {
          images = await service.pickFromCamera();
        }
      } catch {
        setIsImporting(false);
        setProgress(null);
        showToast('无法打开照片选择器', 'error');
        return;
      }

      if (images.length === 0) {
        setIsImporting(false);
        setProgress(null);
        return;
      }

      try {
        const photos = await service.importPhotos(images, (p) => {
          setProgress(p);
        });

        if (photos.length > 0) {
          addPhotos(photos);
          setLastImportTimestamp(Date.now());
          showToast(`成功导入 ${photos.length} 张照片`, 'success');
        } else if (!service.cancelled) {
          showToast('导入失败，请重试', 'warning');
        }
      } catch {
        showToast('导入过程中出错', 'error');
      } finally {
        setIsImporting(false);
        setProgress(null);
      }
    },
    [addPhotos, showToast, setLastImportTimestamp],
  );

  const importFromGallery = useCallback(() => doImport('gallery'), [doImport]);
  const importFromCamera = useCallback(() => doImport('camera'), [doImport]);

  const cancelImport = useCallback(() => {
    serviceRef.current.cancel();
    setIsImporting(false);
    setProgress(null);
    showToast('已取消导入', 'info');
  }, [showToast]);

  return { isImporting, progress, importFromGallery, importFromCamera, cancelImport };
}
