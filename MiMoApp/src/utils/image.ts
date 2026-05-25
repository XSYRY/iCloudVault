import { ThumbnailGenerator } from '../services/photoImport/ThumbnailGenerator';
import { FallbackColorExtractor } from '../services/photoImport/FallbackColorExtractor';
import type { IThumbnailGenerator, IColorExtractor } from '../services/photoImport/types';

let _thumbnail: IThumbnailGenerator = new ThumbnailGenerator();
let _colorExtractor: IColorExtractor = new FallbackColorExtractor();

export function setThumbnailGenerator(gen: IThumbnailGenerator): void {
  _thumbnail = gen;
}

export function setColorExtractor(ext: IColorExtractor): void {
  _colorExtractor = ext;
}

export function getThumbnailUri(uri: string, size = 256): string {
  return uri.replace(/\.(jpg|png|heic)$/i, `_thumb${size}.$1`);
}

export async function generateThumbnail(uri: string, maxWidth = 256, maxHeight = 256, quality = 70): Promise<string> {
  return _thumbnail.generate(uri, maxWidth, maxHeight, quality);
}

export async function extractDominantColor(uri: string): Promise<string> {
  return _colorExtractor.extract(uri);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
