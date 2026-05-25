import type { IColorExtractor } from './types';

export class SkiaColorExtractor implements IColorExtractor {
  async extract(uri: string): Promise<string> {
    try {
      const { Skia } = require('@shopify/react-native-skia');
      const image = Skia.Image.MakeFromURI(uri);
      if (!image) return this.fallback();

      const width = image.width();
      const height = image.height();
      if (width === 0 || height === 0) return this.fallback();

      const sampleSize = Math.min(width, height, 64);
      const pixels = image.readPixels(0, 0, {
        width: sampleSize,
        height: sampleSize,
        alphaType: 'Opaque' as const,
        colorType: 'RGBA_8888' as const,
      });

      if (!pixels) return this.fallback();

      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      const data = new Uint8Array(pixels);

      for (let i = 0; i < data.length; i += 4) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
        count++;
      }

      if (count === 0) return this.fallback();

      const r = Math.round(rSum / count);
      const g = Math.round(gSum / count);
      const b = Math.round(bSum / count);

      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch {
      return this.fallback();
    }
  }

  private fallback(): string {
    const PALETTE = [
      '#6750A4', '#E91E63', '#4CAF50', '#2196F3', '#FF9800',
      '#9C27B0', '#009688', '#FF5722', '#607D8B', '#795548',
    ];
    return PALETTE[Math.floor(Math.random() * PALETTE.length)];
  }
}
