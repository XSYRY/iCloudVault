import { useCallback } from 'react';
import { useUiStore } from '../store';
import { sharePhoto, sharePhotos } from '../services/share';
import type { Photo } from '../types';

export function useShare() {
  const showToast = useUiStore((s) => s.showToast);

  const share = useCallback(
    async (photo: Photo) => {
      try {
        await sharePhoto(photo);
      } catch {
        showToast('分享失败', 'error');
      }
    },
    [showToast],
  );

  const shareMultiple = useCallback(
    async (photos: Photo[]) => {
      try {
        await sharePhotos(photos);
      } catch {
        showToast('分享失败', 'error');
      }
    },
    [showToast],
  );

  return { share, shareMultiple };
}
