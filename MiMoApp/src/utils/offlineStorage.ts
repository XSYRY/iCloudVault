import { MMKV } from 'react-native-mmkv';

export interface StorageOptions {
  encryptionKey?: string;
  instanceID?: string;
}

class OfflineStorage {
  private static instance: OfflineStorage;
  private storage: MMKV;

  private constructor(_options?: StorageOptions) {
    this.storage = new MMKV({
      id: _options?.instanceID || 'default',
    });
  }

  static getInstance(options?: StorageOptions): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage(options);
    }
    return OfflineStorage.instance;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      this.storage.set(key, serialized);
    } catch (error) {
      console.error('OfflineStorage: Failed to set item:', error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = this.storage.getString(key);
      if (value === undefined || value === null) return null;

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      console.error('OfflineStorage: Failed to get item:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      this.storage.delete(key);
    } catch (error) {
      console.error('OfflineStorage: Failed to remove item:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      this.storage.clearAll();
    } catch (error) {
      console.error('OfflineStorage: Failed to clear store:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return this.storage.getAllKeys();
    } catch (error) {
      console.error('OfflineStorage: Failed to get all keys:', error);
      return [];
    }
  }

  async getItemsByPrefix(prefix: string): Promise<Record<string, any>> {
    try {
      const allKeys = await this.getAllKeys();
      const matchingKeys = allKeys.filter(key => key.startsWith(prefix));
      const result: Record<string, any> = {};

      for (const key of matchingKeys) {
        const value = await this.getItem(key);
        result[key] = value;
      }

      return result;
    } catch (error) {
      console.error('OfflineStorage: Failed to get items by prefix:', error);
      return {};
    }
  }

  async removeItemsByPrefix(prefix: string): Promise<void> {
    try {
      const allKeys = await this.getAllKeys();
      const matchingKeys = allKeys.filter(key => key.startsWith(prefix));

      for (const key of matchingKeys) {
        await this.removeItem(key);
      }
    } catch (error) {
      console.error('OfflineStorage: Failed to remove items by prefix:', error);
      throw error;
    }
  }

  async getItemCount(): Promise<number> {
    try {
      const keys = await this.getAllKeys();
      return keys.length;
    } catch (error) {
      console.error('OfflineStorage: Failed to get item count:', error);
      return 0;
    }
  }

  async getStorageSize(): Promise<number> {
    try {
      const keys = await this.getAllKeys();
      let totalSize = 0;

      for (const key of keys) {
        const value = this.storage.getString(key);
        if (value) {
          totalSize += value.length * 2;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('OfflineStorage: Failed to get storage size:', error);
      return 0;
    }
  }
}

export const offlineStorage = OfflineStorage.getInstance();

export function useOfflineStorage() {
  return {
    setItem: offlineStorage.setItem.bind(offlineStorage),
    getItem: offlineStorage.getItem.bind(offlineStorage),
    removeItem: offlineStorage.removeItem.bind(offlineStorage),
    clear: offlineStorage.clear.bind(offlineStorage),
    getAllKeys: offlineStorage.getAllKeys.bind(offlineStorage),
    getItemsByPrefix: offlineStorage.getItemsByPrefix.bind(offlineStorage),
    removeItemsByPrefix: offlineStorage.removeItemsByPrefix.bind(offlineStorage),
    getItemCount: offlineStorage.getItemCount.bind(offlineStorage),
    getStorageSize: offlineStorage.getStorageSize.bind(offlineStorage),
  };
}
