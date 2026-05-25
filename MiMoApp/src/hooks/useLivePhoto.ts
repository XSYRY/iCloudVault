import { useState, useCallback, useMemo } from 'react';
import { usePhotoStore } from '../store';
import { getLivePhotoService } from '../services/livePhoto';
import type { Photo } from '../types';

export function useLivePhoto() {
  const photos = usePhotoStore((s) => s.photos);
  const service = useMemo(() => getLivePhotoService(), []);

  const livePhotos = useMemo(
    () => service.getLivePhotos(photos.filter((p) => !p.isDeleted && !p.isHidden)),
    [photos, service],
  );

  const isLivePhoto = useCallback(
    (photo: Photo) => service.isLivePhoto(photo),
    [service],
  );

  const extractData = useCallback(
    (photo: Photo) => service.extractLivePhotoData(photo),
    [service],
  );

  return { livePhotos, isLivePhoto, extractData, count: livePhotos.length };
}
