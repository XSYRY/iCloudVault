import { Image } from 'react-native';
import { useEffect, useRef } from 'react';
import type { Photo } from '../types';

// ---------------------------------------------------------------------------
// LRU Cache implementation
// ---------------------------------------------------------------------------

class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.cache = new Map<K, V>();
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value === undefined) {
      return undefined;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest (first entry)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// ---------------------------------------------------------------------------
// ThumbnailCacheManager
// ---------------------------------------------------------------------------

interface ThumbnailCacheManager {
  /** Preload thumbnails for items near the visible range. */
  prefetchRange(
    uris: string[],
    visibleStart: number,
    visibleEnd: number,
    buffer?: number,
  ): void;

  /** Get a cached URI or return the original. */
  getCachedUri(uri: string): string;

  /** Check if a URI is cached. */
  isCached(uri: string): boolean;

  /** Clear the cache. */
  clear(): void;

  /** Get cache statistics. */
  getStats(): { hits: number; misses: number; size: number; maxSize: number };
}

const MAX_CACHE_SIZE = 500;

function createThumbnailCacheManager(): ThumbnailCacheManager {
  const lru = new LRUCache<string, string>(MAX_CACHE_SIZE);
  let hits = 0;
  let misses = 0;

  // Keep track of in-flight prefetches so we don't duplicate requests.
  const pending = new Set<string>();

  function prefetchUri(uri: string): void {
    if (!uri || lru.has(uri) || pending.has(uri)) {
      return;
    }

    pending.add(uri);

    Image.prefetch(uri)
      .then(() => {
        lru.set(uri, uri);
      })
      .catch(() => {
        // Prefetch failed – silently ignore.
      })
      .finally(() => {
        pending.delete(uri);
      });
  }

  const manager: ThumbnailCacheManager = {
    prefetchRange(
      uris: string[],
      visibleStart: number,
      visibleEnd: number,
      buffer: number = 10,
    ): void {
      if (!uris || uris.length === 0) {
        return;
      }

      const rangeStart = Math.max(0, visibleStart - buffer);
      const rangeEnd = Math.min(uris.length - 1, visibleEnd + buffer);

      for (let i = rangeStart; i <= rangeEnd; i++) {
        const uri = uris[i];
        if (uri) {
          prefetchUri(uri);
        }
      }
    },

    getCachedUri(uri: string): string {
      if (lru.has(uri)) {
        // Access through `get` so LRU order is updated.
        lru.get(uri);
        hits++;
        return uri;
      }
      misses++;
      return uri;
    },

    isCached(uri: string): boolean {
      return lru.has(uri);
    },

    clear(): void {
      lru.clear();
      pending.clear();
      hits = 0;
      misses = 0;
    },

    getStats() {
      return {
        hits,
        misses,
        size: lru.size,
        maxSize: MAX_CACHE_SIZE,
      };
    },
  };

  return manager;
}

/** Singleton thumbnail cache instance. */
export const thumbnailCache: ThumbnailCacheManager =
  createThumbnailCacheManager();

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * Calls `thumbnailCache.prefetchRange` whenever the visible range changes.
 *
 * @param photos  The full photo list currently rendered.
 * @param visibleRange  The indices of the first and last visible items.
 */
export function useThumbnailPrefetch(
  photos: Photo[],
  visibleRange?: { start: number; end: number },
): void {
  const urisRef = useRef<string[]>([]);

  // Rebuild URI list only when photos identity changes.
  useEffect(() => {
    urisRef.current = photos.map((p) => p.thumbnailUri ?? p.uri ?? '');
  }, [photos]);

  useEffect(() => {
    if (!visibleRange) {
      return;
    }

    thumbnailCache.prefetchRange(
      urisRef.current,
      visibleRange.start,
      visibleRange.end,
    );
  }, [visibleRange?.start, visibleRange?.end]);
}
