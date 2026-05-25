import type { Photo } from '../../types';

export interface LivePhotoData {
  photoId: string;
  imageUri: string;
  videoUri: string;
  duration: number;
  width: number;
  height: number;
}

export interface ILivePhotoService {
  extractLivePhotoData(photo: Photo): LivePhotoData | null;
  isLivePhoto(photo: Photo): boolean;
  getLivePhotos(photos: Photo[]): Photo[];
}

export const LIVE_PHOTO_DURATION = 3000;
