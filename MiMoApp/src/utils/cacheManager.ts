import { offlineStorage } from './offlineStorage';
import { logger } from './logger';

export type CacheStrategy = 'memory-only' | 'persistent' | 'hybrid';

export type CacheExpiry = '1h' | '6h' | '12h' | '24h' | '7d' | '30d' | 'never';

export interface CacheConfig {
  strategy: CacheStrategy;
  expiry: CacheExpiry;
  maxSize: number;
  maxItems: number;
}

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  expiry: number;
  accessed: number;
  size: number;
}

class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig = {
    strategy: 'hybrid',
    expiry: '24h',
    maxSize: 100 * 1024 * 1024,
    maxItems: 1000,
  };

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  setConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  private getExpiryMs(expiry: CacheExpiry): number {
    const expiryMap: Record<CacheExpiry, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'never': Infinity,
    };
    return expiryMap[expiry];
  }

  private async getSizeInBytes(data: any): Promise<number> {
    try {
      const serialized = JSON.stringify(data);
      return serialized.length * 2;
    } catch {
      return 1024;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key);

    if (entry) {
      if (entry.expiry > Date.now()) {
        entry.accessed = Date.now();
        return entry.data as T;
      } else {
        this.memoryCache.delete(key);
      }
    }

    if (this.config.strategy !== 'memory-only') {
      try {
        const stored = await offlineStorage.getItem<CacheEntry>(`cache_${key}`);
        if (stored) {
          if (stored.expiry > Date.now()) {
            stored.accessed = Date.now();
            this.memoryCache.set(key, stored);
            await offlineStorage.setItem(`cache_${key}`, stored);
            return stored.data as T;
          } else {
            await offlineStorage.removeItem(`cache_${key}`);
          }
        }
      } catch (error) {
        logger.error('CacheManager: Failed to get from persistent storage:', { error });
      }
    }

    return null;
  }

  async set<T>(key: string, data: T, expiry?: CacheExpiry): Promise<void> {
    const expiryMs = this.getExpiryMs(expiry || this.config.expiry);
    const size = await this.getSizeInBytes(data);
    const timestamp = Date.now();

    const entry: CacheEntry = {
      key,
      data,
      timestamp,
      expiry: expiry === 'never' ? Infinity : timestamp + expiryMs,
      accessed: timestamp,
      size,
    };

    this.memoryCache.set(key, entry);

    if (this.config.strategy !== 'memory-only') {
      try {
        await offlineStorage.setItem(`cache_${key}`, entry);
      } catch (error) {
        logger.error('CacheManager: Failed to set to persistent storage:', { error });
      }
    }

    await this.enforceLimits();
  }

  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);

    if (this.config.strategy !== 'memory-only') {
      try {
        await offlineStorage.removeItem(`cache_${key}`);
      } catch (error) {
        logger.error('CacheManager: Failed to remove from persistent storage:', { error });
      }
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (this.config.strategy !== 'memory-only') {
      try {
        await offlineStorage.removeItemsByPrefix('cache_');
      } catch (error) {
        logger.error('CacheManager: Failed to clear persistent storage:', { error });
      }
    }
  }

  async has(key: string): Promise<boolean> {
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      return entry.expiry > Date.now();
    }

    if (this.config.strategy !== 'memory-only') {
      try {
        const stored = await offlineStorage.getItem<CacheEntry>(`cache_${key}`);
        if (stored && stored.expiry > Date.now()) {
          return true;
        }
      } catch (error) {
        logger.error('CacheManager: Failed to check existence:', { error });
      }
    }

    return false;
  }

  private async enforceLimits(): Promise<void> {
    const entries = Array.from(this.memoryCache.values());
    
    if (entries.length > this.config.maxItems) {
      entries.sort((a, b) => a.accessed - b.accessed);
      const toRemove = entries.slice(0, entries.length - this.config.maxItems);
      
      for (const entry of toRemove) {
        await this.remove(entry.key);
      }
    }

    let totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    if (totalSize > this.config.maxSize) {
      const sortedEntries = [...entries].sort((a, b) => a.accessed - b.accessed);
      
      for (const entry of sortedEntries) {
        if (totalSize <= this.config.maxSize) break;
        await this.remove(entry.key);
        totalSize -= entry.size;
      }
    }
  }

  async getStats(): Promise<{
    memoryCount: number;
    memorySize: number;
    persistentCount: number;
    persistentSize: number;
  }> {
    const memoryEntries = Array.from(this.memoryCache.values());
    const memoryCount = memoryEntries.length;
    const memorySize = memoryEntries.reduce((sum, entry) => sum + entry.size, 0);

    let persistentCount = 0;
    let persistentSize = 0;

    if (this.config.strategy !== 'memory-only') {
      try {
        const cachedItems = await offlineStorage.getItemsByPrefix('cache_');
        persistentCount = Object.keys(cachedItems).length;
        for (const item of Object.values(cachedItems)) {
          if (item && typeof item === 'object' && 'size' in item) {
            persistentSize += (item as CacheEntry).size;
          }
        }
      } catch (error) {
        logger.error('CacheManager: Failed to get stats:', { error });
      }
    }

    return {
      memoryCount,
      memorySize,
      persistentCount,
      persistentSize,
    };
  }

  async clearExpired(): Promise<void> {
    const now = Date.now();

    for (const [key, entry] of this.memoryCache) {
      if (entry.expiry < now) {
        this.memoryCache.delete(key);
      }
    }

    if (this.config.strategy !== 'memory-only') {
      try {
        const cachedItems = await offlineStorage.getItemsByPrefix('cache_');
        for (const [key, item] of Object.entries(cachedItems)) {
          if (item && typeof item === 'object' && 'expiry' in item) {
            if ((item as CacheEntry).expiry < now) {
              await offlineStorage.removeItem(key);
            }
          }
        }
      } catch (error) {
        logger.error('CacheManager: Failed to clear expired:', { error });
      }
    }
  }

  async prune(): Promise<void> {
    await this.clearExpired();
    await this.enforceLimits();
  }
}

export const cacheManager = CacheManager.getInstance();

export function useCache() {
  return {
    get: cacheManager.get.bind(cacheManager),
    set: cacheManager.set.bind(cacheManager),
    remove: cacheManager.remove.bind(cacheManager),
    clear: cacheManager.clear.bind(cacheManager),
    has: cacheManager.has.bind(cacheManager),
    getStats: cacheManager.getStats.bind(cacheManager),
    clearExpired: cacheManager.clearExpired.bind(cacheManager),
    prune: cacheManager.prune.bind(cacheManager),
    setConfig: cacheManager.setConfig.bind(cacheManager),
    getConfig: cacheManager.getConfig.bind(cacheManager),
  };
}
