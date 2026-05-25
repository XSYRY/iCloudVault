import { Image } from 'react-native';

class ImageCacheManager {
  private static instance: ImageCacheManager;
  private preloadedImages: Set<string> = new Set();
  private loadingImages: Map<string, Promise<void>> = new Map();

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  async preloadImages(urls: string[], batchSize: number = 5): Promise<void> {
    const batches = [];
    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await Promise.all(
        batch.map(url => this.preloadImage(url))
      );
    }
  }

  async preloadImage(url: string): Promise<void> {
    if (this.preloadedImages.has(url)) {
      return Promise.resolve();
    }

    if (this.loadingImages.has(url)) {
      return this.loadingImages.get(url);
    }

    const loadPromise = new Promise<void>((resolve, reject) => {
      Image.prefetch(url)
        .then(() => {
          this.preloadedImages.add(url);
          this.loadingImages.delete(url);
          resolve();
        })
        .catch((error) => {
          this.loadingImages.delete(url);
          reject(error);
        });
    });

    this.loadingImages.set(url, loadPromise);
    return loadPromise;
  }

  isPreloaded(url: string): boolean {
    return this.preloadedImages.has(url);
  }

  clearCache(): void {
    this.preloadedImages.clear();
    this.loadingImages.clear();
  }

  getCacheSize(): number {
    return this.preloadedImages.size;
  }
}

export const imageCacheManager = ImageCacheManager.getInstance();

export function useImagePreloader() {
  const preloadPhotos = async (photos: Array<{ uri?: string; thumbnailUri?: string }>, limit?: number) => {
    const urls = photos
      .slice(0, limit)
      .map(photo => photo.thumbnailUri || photo.uri)
      .filter(Boolean) as string[];

    await imageCacheManager.preloadImages(urls, 8);
  };

  const preloadVisiblePhotos = (visiblePhotos: Array<{ uri?: string; thumbnailUri?: string }>) => {
    const urls = visiblePhotos
      .map(photo => photo.thumbnailUri || photo.uri)
      .filter(Boolean) as string[];

    imageCacheManager.preloadImages(urls, 10);
  };

  return {
    preloadPhotos,
    preloadVisiblePhotos,
    isPreloaded: imageCacheManager.isPreloaded,
    getCacheSize: imageCacheManager.getCacheSize,
  };
}

export function getOptimizedImageUrl(
  url: string,
  width: number,
  height: number
): string {
  if (!url) return url;

  if (url.includes('picsum.photos')) {
    return `${url.split('?')[0]}/${width}/${height}`;
  }

  if (url.includes('cloudinary.com')) {
    return `${url.replace('/upload/', '/upload/w_${width},h_${height},c_fill,q_auto,f_auto/')}`;
  }

  if (url.includes('firebase')) {
    return `${url}${url.includes('?') ? '&' : '?'}width=${width}&height=${height}`;
  }

  return url;
}
