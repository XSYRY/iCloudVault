import type { Photo } from '../../types';
import type { ILivePhotoService, LivePhotoData } from './types';

export class LivePhotoService implements ILivePhotoService {
  isLivePhoto(photo: Photo): boolean {
    return photo.mediaType === 'live' && !!photo.livePhotoVideoUri;
  }

  extractLivePhotoData(photo: Photo): LivePhotoData | null {
    if (!this.isLivePhoto(photo)) return null;
    return {
      photoId: photo.id,
      imageUri: photo.uri,
      videoUri: photo.livePhotoVideoUri!,
      duration: photo.duration ?? 3000,
      width: photo.width,
      height: photo.height,
    };
  }

  getLivePhotos(photos: Photo[]): Photo[] {
    return photos.filter((p) => this.isLivePhoto(p));
  }
}

let _instance: LivePhotoService | null = null;

export function getLivePhotoService(): ILivePhotoService {
  if (!_instance) _instance = new LivePhotoService();
  return _instance;
}
