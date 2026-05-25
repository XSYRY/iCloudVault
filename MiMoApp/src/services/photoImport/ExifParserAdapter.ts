import type { ExifData } from '../../types';
import type { IExifParser } from './types';

function getVal(obj: Record<string, unknown>, key: string): unknown {
  return obj[key];
}

export class ExifParserAdapter implements IExifParser {
  async parse(uri: string, rawExif?: Record<string, unknown>): Promise<ExifData> {
    if (!rawExif) {
      return { width: 0, height: 0 };
    }

    return {
      make: this.str(rawExif, 'Make') ?? this.str(rawExif, '{Exif}.Make'),
      model: this.str(rawExif, 'Model') ?? this.str(rawExif, '{Exif}.Model'),
      fNumber: this.num(rawExif, 'FNumber') ?? this.num(rawExif, '{Exif}.FNumber'),
      exposureTime: this.fmtExposure(rawExif),
      iso: this.num(rawExif, 'ISOSpeedRatings') ?? this.num(rawExif, '{Exif}.ISOSpeedRatings'),
      focalLength: this.fmtFocal(rawExif),
      flash: this.fmtFlash(rawExif),
      gpsLat: this.num(rawExif, 'GPSLatitude'),
      gpsLon: this.num(rawExif, 'GPSLongitude'),
      dateTaken: this.fmtDate(rawExif),
      software: this.str(rawExif, 'Software'),
      width: this.num(rawExif, 'PixelWidth') ?? this.num(rawExif, 'ImageWidth') ?? 0,
      height: this.num(rawExif, 'PixelHeight') ?? this.num(rawExif, 'ImageHeight') ?? 0,
    };
  }

  private str(obj: Record<string, unknown>, key: string): string | undefined {
    const val = getVal(obj, key);
    return typeof val === 'string' ? val : undefined;
  }

  private num(obj: Record<string, unknown>, key: string): number | undefined {
    const val = getVal(obj, key);
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const n = parseFloat(val);
      return isNaN(n) ? undefined : n;
    }
    return undefined;
  }

  private fmtExposure(obj: Record<string, unknown>): string | undefined {
    const val = getVal(obj, 'ExposureTime') ?? getVal(obj, '{Exif}.ExposureTime');
    if (val == null) return undefined;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') {
      return val >= 1 ? `${val}s` : `1/${Math.round(1 / val)}s`;
    }
    return undefined;
  }

  private fmtFocal(obj: Record<string, unknown>): string | undefined {
    const val = getVal(obj, 'FocalLength') ?? getVal(obj, '{Exif}.FocalLength');
    if (val == null) return undefined;
    if (typeof val === 'number') return `${val}mm`;
    if (typeof val === 'string') return val.endsWith('mm') ? val : `${val}mm`;
    return undefined;
  }

  private fmtFlash(obj: Record<string, unknown>): boolean {
    const val = getVal(obj, 'Flash') ?? getVal(obj, '{Exif}.Flash');
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    return false;
  }

  private fmtDate(obj: Record<string, unknown>): string | undefined {
    const val = getVal(obj, 'DateTimeOriginal') ?? getVal(obj, '{Exif}.DateTimeOriginal') ?? getVal(obj, 'CreationDate');
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return new Date(val * 1000).toISOString().slice(0, 10);
    return undefined;
  }
}
