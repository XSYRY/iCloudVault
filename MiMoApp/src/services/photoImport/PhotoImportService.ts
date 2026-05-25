import type { Photo, ExifData } from '../../types';
import type {
  IPhotoPicker,
  IThumbnailGenerator,
  IExifParser,
  IColorExtractor,
  PickerOptions,
  PickedImage,
  ImportProgressCallback,
} from './types';
import { NativeModules, Platform } from 'react-native';

let photoSeq = Date.now();
function nextPhotoId(): string {
  return `photo-${++photoSeq}`;
}

export interface PhotoImportServiceDeps {
  picker: IPhotoPicker;
  thumbnail: IThumbnailGenerator;
  exifParser: IExifParser;
  colorExtractor: IColorExtractor;
}

export class PhotoImportService {
  private picker: IPhotoPicker;
  private thumbnail: IThumbnailGenerator;
  private exifParser: IExifParser;
  private colorExtractor: IColorExtractor;
  private _cancelled = false;

  constructor(deps: PhotoImportServiceDeps) {
    this.picker = deps.picker;
    this.thumbnail = deps.thumbnail;
    this.exifParser = deps.exifParser;
    this.colorExtractor = deps.colorExtractor;
  }

  get cancelled(): boolean {
    return this._cancelled;
  }

  cancel(): void {
    this._cancelled = true;
  }

  reset(): void {
    this._cancelled = false;
  }

  async pickFromGallery(options?: PickerOptions): Promise<PickedImage[]> {
    return this.picker.pickFromGallery({ multiple: true, ...options });
  }

  async pickFromCamera(options?: PickerOptions): Promise<PickedImage[]> {
    return this.picker.pickFromCamera(options);
  }

  async importPhotos(
    images: PickedImage[],
    onProgress?: ImportProgressCallback,
  ): Promise<Photo[]> {
    this.reset();
    const results: Photo[] = [];
    const total = images.length;

    for (let i = 0; i < total; i++) {
      if (this._cancelled) break;

      onProgress?.({
        current: i + 1,
        total,
        currentFile: images[i].filename,
        phase: 'processing',
      });

      const photo = await this.processImage(images[i]);
      if (photo) {
        results.push(photo);
      }
    }

    onProgress?.({
      current: total,
      total,
      currentFile: '',
      phase: 'complete',
    });

    return results;
  }

  private async processImage(img: PickedImage): Promise<Photo | null> {
    try {
      const isVideo = img.type.startsWith('video/');

      const [thumbnailUri, exif, color] = await Promise.all([
        this.thumbnail.generate(img.uri, 256, 256, 70),
        this.exifParser.parse(img.uri, img.exif),
        this.colorExtractor.extract(img.uri),
      ]);

      const dateTaken = this.extractDateTaken(img, exif);
      const timeTaken = this.extractTimeTaken(img, exif);

      let duration: number | null = img.duration ?? null;
      if (isVideo && duration == null) {
        try {
          const { VideoMetadataService } = require('../video');
          const metaService = new VideoMetadataService();
          const meta = await metaService.getMetadata(img.uri);
          if (meta.duration > 0) {
            duration = meta.duration;
          }
        } catch {}
      }

      // 检测 Android 原生动态照片 (Motion Photo / Live Photo)
      let mediaType: 'photo' | 'video' | 'live' = isVideo ? 'video' : 'photo';
      let livePhotoVideoUri: string | undefined = undefined;

      if (!isVideo && Platform.OS === 'android') {
        try {
          const motionModule = NativeModules.MotionPhotoModule;
          if (motionModule) {
            const detection = await motionModule.detect(img.uri);
            if (detection && detection.isMotionPhoto) {
              const offset = detection.videoOffset ?? 0;
              const length = detection.videoLength ?? 0;
              // 提取内置 MP4 视频
              const extractedVideoPath = await motionModule.extractVideo(img.uri, offset, length);
              if (extractedVideoPath) {
                mediaType = 'live';
                livePhotoVideoUri = extractedVideoPath;
              }
            }
          }
        } catch (err) {
          console.warn('MotionPhoto detection/extraction error:', err);
        }
      }

      const photo: Photo = {
        id: nextPhotoId(),
        uri: img.uri,
        thumbnailUri,
        filename: img.filename,
        sizeBytes: img.sizeBytes,
        width: img.width,
        height: img.height,
        createdAt: img.timestamp ?? Date.now(),
        dateTaken,
        timeTaken,
        latitude: img.latitude ?? exif.gpsLat ?? null,
        longitude: img.longitude ?? exif.gpsLon ?? null,
        locationName: null,
        exif: {
          ...exif,
          width: exif.width || img.width,
          height: exif.height || img.height,
        },
        color,
        isFavorite: false,
        isHidden: false,
        isPinned: false,
        isDeleted: false,
        aiTags: null,
        aiCategory: null,
        faceCount: null,
        phash: (() => {
          let bits = '';
          const seed = img.filename.length + img.width + img.height + img.sizeBytes;
          for (let i = 0; i < 63; i++) {
            const val = Math.sin(seed * 12.9898 + i * 37.719) * 43758.5453;
            bits += (val - Math.floor(val)) > 0.5 ? '1' : '0';
          }
          return bits;
        })(),
        embedding: null,
        duplicateOfId: null,
        edits: {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          rotation: 0,
          crop: null,
          filter: null,
        },
        versions: [],
        rating: 0,
        mediaType,
        duration,
        livePhotoVideoUri,
      };

      return photo;
    } catch {
      return null;
    }
  }

  private extractDateTaken(img: PickedImage, exif: ExifData): string {
    if (exif.dateTaken) {
      return exif.dateTaken.slice(0, 10);
    }
    if (img.timestamp) {
      return new Date(img.timestamp).toISOString().slice(0, 10);
    }
    return new Date().toISOString().slice(0, 10);
  }

  private extractTimeTaken(img: PickedImage, exif: ExifData): string {
    if (exif.dateTaken && exif.dateTaken.length > 10) {
      return exif.dateTaken.slice(11, 19);
    }
    if (img.timestamp) {
      return new Date(img.timestamp).toISOString().slice(11, 19);
    }
    return new Date().toISOString().slice(11, 19);
  }
}
