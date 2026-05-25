import type { IPhotoPicker, IThumbnailGenerator, IExifParser, IColorExtractor, PickerOptions, PickedImage } from './types';
import { ImagePickerAdapter } from './ImagePickerAdapter';
import { ThumbnailGenerator } from './ThumbnailGenerator';
import { ExifParserAdapter } from './ExifParserAdapter';
import { FallbackColorExtractor } from './FallbackColorExtractor';
import { PhotoImportService } from './PhotoImportService';
import type { PhotoImportServiceDeps } from './PhotoImportService';

function createColorExtractor(): IColorExtractor {
  return new FallbackColorExtractor();
}

export function createPhotoImportService(overrides?: Partial<PhotoImportServiceDeps>): PhotoImportService {
  const deps: PhotoImportServiceDeps = {
    picker: overrides?.picker ?? new ImagePickerAdapter(),
    thumbnail: overrides?.thumbnail ?? new ThumbnailGenerator(),
    exifParser: overrides?.exifParser ?? new ExifParserAdapter(),
    colorExtractor: overrides?.colorExtractor ?? createColorExtractor(),
  };
  return new PhotoImportService(deps);
}
