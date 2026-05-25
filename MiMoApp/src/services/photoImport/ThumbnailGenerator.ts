import ImageResizer from '@bam.tech/react-native-image-resizer';
import type { IThumbnailGenerator } from './types';

export class ThumbnailGenerator implements IThumbnailGenerator {
  async generate(
    uri: string,
    maxWidth: number = 256,
    maxHeight: number = 256,
    quality: number = 70,
  ): Promise<string> {
    try {
      const result = await ImageResizer.createResizedImage(
        uri,
        maxWidth,
        maxHeight,
        'JPEG',
        quality,
        0,
        undefined,
        false,
        { mode: 'cover', onlyScaleDown: true },
      );
      return result.uri;
    } catch {
      return uri;
    }
  }
}
