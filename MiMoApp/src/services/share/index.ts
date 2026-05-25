import Share from 'react-native-share';
import type { Photo } from '../../types';

export async function sharePhoto(photo: Photo): Promise<void> {
  try {
    await Share.open({
      url: photo.uri,
      type: 'image/jpeg',
      title: photo.filename,
      message: photo.filename,
    });
  } catch {}
}

export async function sharePhotos(photos: Photo[]): Promise<void> {
  if (photos.length === 0) return;
  if (photos.length === 1) {
    return sharePhoto(photos[0]);
  }

  try {
    const urls = photos.map((p) => p.uri);
    await Share.open({
      urls,
      type: 'image/jpeg',
      title: `${photos.length} 张照片`,
    });
  } catch {}
}
