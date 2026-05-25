import type { ExifData } from '../types';
import { ExifParserAdapter } from '../services/photoImport/ExifParserAdapter';
import type { IExifParser } from '../services/photoImport/types';

let _parser: IExifParser = new ExifParserAdapter();

export function setExifParser(parser: IExifParser): void {
  _parser = parser;
}

export function parseExif(uri: string, rawExif?: Record<string, unknown>): Promise<ExifData> {
  return _parser.parse(uri, rawExif);
}

export function formatExifValue(exif: ExifData, key: keyof ExifData): string {
  const val = exif[key];
  switch (key) {
    case 'fNumber': return val ? `f/${val}` : '—';
    case 'exposureTime': return val ? `${val}s` : '—';
    case 'iso': return val ? `ISO ${val}` : '—';
    case 'focalLength': return val ? `${val}mm` : '—';
    case 'flash': return val ? '开' : '关';
    default: return val ? String(val) : '—';
  }
}
