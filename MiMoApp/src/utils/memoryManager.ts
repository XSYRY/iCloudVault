import { useEffect } from 'react';
import { Image } from 'react-native';

class MemoryManager {
  private static instance: MemoryManager;
  private imageCache: Map<string, number> = new Map();
  private maxCacheSize: number = 50;
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  constructor() {
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60000);
    }
  }

  registerImage(uri: string): void {
    this.imageCache.set(uri, Date.now());

    if (this.imageCache.size > this.maxCacheSize) {
      this.cleanup();
    }
  }

  touchImage(uri: string): void {
    if (this.imageCache.has(uri)) {
      this.imageCache.set(uri, Date.now());
    }
  }

  cleanup(): void {
    if (this.imageCache.size <= this.maxCacheSize) {
      return;
    }

    const entries = Array.from(this.imageCache.entries());
    entries.sort((a, b) => a[1] - b[1]);

    const toRemove = entries.slice(0, Math.floor(entries.length * 0.3));
    toRemove.forEach(([uri]) => {
      this.imageCache.delete(uri);
      Image.resolveAssetSource({ uri } as any);
    });
  }

  clearAll(): void {
    this.imageCache.clear();
    Image.queryCache?.(['*']);
  }

  getCacheSize(): number {
    return this.imageCache.size;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clearAll();
  }
}

export const memoryManager = MemoryManager.getInstance();

export function useMemoryCleanup(uri?: string) {
  useEffect(() => {
    if (uri) {
      memoryManager.registerImage(uri);
    }

    return () => {
      if (uri) {
        memoryManager.touchImage(uri);
      }
    };
  }, [uri]);
}

export async function clearImageCache(): Promise<void> {
  try {
    if (Image.queryCache) {
      await Image.queryCache(['*']);
    }
    memoryManager.clearAll();
  } catch (error) {
    console.error('Failed to clear image cache:', error);
  }
}
