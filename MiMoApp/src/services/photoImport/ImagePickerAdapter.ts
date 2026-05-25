import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import type { Asset } from 'react-native-image-picker';
import type { IPhotoPicker, PickedImage, PickerOptions } from './types';

function mapAsset(asset: Asset): PickedImage {
  const isVideo = asset.type?.startsWith('video/') ?? false;
  return {
    uri: asset.uri ?? '',
    filename: asset.fileName ?? (isVideo ? `VID_${Date.now()}.mp4` : `IMG_${Date.now()}.jpg`),
    width: asset.width ?? 0,
    height: asset.height ?? 0,
    sizeBytes: asset.fileSize ?? 0,
    type: asset.type ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
    duration: asset.duration ? asset.duration * 1000 : undefined,
    exif: (asset as Record<string, unknown>).exif as Record<string, unknown> | undefined,
    latitude: (asset as Record<string, unknown>).latitude as number | undefined,
    longitude: (asset as Record<string, unknown>).longitude as number | undefined,
    timestamp: asset.timestamp ? new Date(asset.timestamp).getTime() : undefined,
  };
}

export class ImagePickerAdapter implements IPhotoPicker {
  async pickFromGallery(options?: PickerOptions): Promise<PickedImage[]> {
    const response = await launchImageLibrary({
      mediaType: options?.mediaType ?? 'mixed',
      selectionLimit: options?.multiple ? (options.maxFiles ?? 20) : 1,
      quality: (options?.quality ?? 1) as 1,
      includeBase64: false,
      includeExtra: true,
    });

    if (response.didCancel || response.errorCode) {
      return [];
    }

    return (response.assets ?? []).map(mapAsset);
  }

  async pickFromCamera(options?: PickerOptions): Promise<PickedImage[]> {
    const response = await launchCamera({
      mediaType: options?.mediaType ?? 'photo',
      quality: (options?.quality ?? 1) as 1,
      includeBase64: false,
      includeExtra: true,
      saveToPhotos: true,
    });

    if (response.didCancel || response.errorCode) {
      return [];
    }

    return (response.assets ?? []).map(mapAsset);
  }
}
