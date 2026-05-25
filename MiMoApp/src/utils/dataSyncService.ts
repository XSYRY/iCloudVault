import { networkMonitor } from './networkMonitor';
import { logger, appLogger } from './logger';
import { offlineStorage } from './offlineStorage';

export type SyncStatus = 'idle' | 'syncing' | 'completed' | 'failed' | 'pending';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: Record<string, any>;
  timestamp: number;
  status: SyncStatus;
  retryCount: number;
  error?: string;
}

export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
}

class DataSyncService {
  private static instance: DataSyncService;
  private operations: SyncOperation[] = [];
  private syncStatus: SyncStatus = 'idle';
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private config: SyncConfig = {
    autoSync: true,
    syncInterval: 60000,
    maxRetries: 3,
    retryDelay: 5000,
    batchSize: 10,
  };

  private constructor() {
    this.loadPendingOperations();
    this.setupNetworkListener();
    this.startAutoSync();
  }

  static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  private async loadPendingOperations(): Promise<void> {
    try {
      const stored = await offlineStorage.getItem<SyncOperation[]>('sync_operations');
      if (stored) {
        this.operations = stored;
        appLogger.info('Loaded pending operations', { count: this.operations.length });
      }
    } catch (error) {
      logger.error('Failed to load pending operations:', { error });
    }
  }

  private async saveOperations(): Promise<void> {
    try {
      await offlineStorage.setItem('sync_operations', this.operations);
    } catch (error) {
      logger.error('Failed to save operations:', { error });
    }
  }

  private setupNetworkListener(): void {
    networkMonitor.addListener((info) => {
      if (info.isConnected && this.operations.length > 0) {
        appLogger.info('Network restored, starting sync');
        this.sync();
      }
    });
  }

  private startAutoSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    if (this.config.autoSync) {
      this.syncIntervalId = setInterval(() => {
        if (networkMonitor.isConnected()) {
          this.sync();
        }
      }, this.config.syncInterval);
    }
  }

  setConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
    this.startAutoSync();
  }

  getConfig(): SyncConfig {
    return { ...this.config };
  }

  addOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>): string {
    const newOperation: SyncOperation = {
      ...operation,
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    };

    this.operations.push(newOperation);
    this.saveOperations();

    if (networkMonitor.isConnected()) {
      this.sync();
    }

    return newOperation.id;
  }

  getPendingOperations(): SyncOperation[] {
    return this.operations.filter(op => op.status === 'pending' || op.status === 'failed');
  }

  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  async sync(): Promise<void> {
    if (this.syncStatus === 'syncing') {
      return;
    }

    if (!networkMonitor.isConnected()) {
      this.syncStatus = 'pending';
      return;
    }

    const pendingOps = this.getPendingOperations();
    if (pendingOps.length === 0) {
      this.syncStatus = 'idle';
      return;
    }

    this.syncStatus = 'syncing';
    appLogger.info('Starting sync', { count: pendingOps.length });

    try {
      for (let i = 0; i < pendingOps.length; i += this.config.batchSize) {
        const batch = pendingOps.slice(i, i + this.config.batchSize);
        await this.syncBatch(batch);
      }

      this.syncStatus = 'completed';
      appLogger.info('Sync completed');
    } catch (error) {
      this.syncStatus = 'failed';
      logger.error('Sync failed:', { error });
    }
  }

  private async syncBatch(operations: SyncOperation[]): Promise<void> {
    for (const op of operations) {
      try {
        await this.executeOperation(op);
        op.status = 'completed';
        op.error = undefined;
      } catch (error) {
        op.retryCount++;
        op.error = String(error);

        if (op.retryCount >= this.config.maxRetries) {
          op.status = 'failed';
          logger.error('Operation failed after max retries:', { op });
        } else {
          op.status = 'pending';
          await this.delay(this.config.retryDelay * op.retryCount);
        }
      }
    }

    this.saveOperations();
    this.cleanupCompletedOperations();
  }

  private async executeOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'create':
        await this.createRemote(operation.collection, operation.data);
        break;
      case 'update':
        await this.updateRemote(operation.collection, operation.data);
        break;
      case 'delete':
        await this.deleteRemote(operation.collection, operation.data);
        break;
    }
  }

  private async createRemote(collection: string, data: Record<string, any>): Promise<void> {
    appLogger.debug(`Creating ${collection} remotely`, { id: data.id });
  }

  private async updateRemote(collection: string, data: Record<string, any>): Promise<void> {
    appLogger.debug(`Updating ${collection} remotely`, { id: data.id });
  }

  private async deleteRemote(collection: string, data: Record<string, any>): Promise<void> {
    appLogger.debug(`Deleting ${collection} remotely`, { id: data.id });
  }

  private cleanupCompletedOperations(): void {
    const completedThreshold = Date.now() - 24 * 60 * 60 * 1000;
    this.operations = this.operations.filter(op => 
      op.status !== 'completed' || op.timestamp > completedThreshold
    );
    this.saveOperations();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getSyncStats(): Promise<{
    pending: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const pending = this.operations.filter(op => op.status === 'pending').length;
    const completed = this.operations.filter(op => op.status === 'completed').length;
    const failed = this.operations.filter(op => op.status === 'failed').length;

    return {
      pending,
      completed,
      failed,
      total: this.operations.length,
    };
  }

  async clearFailedOperations(): Promise<void> {
    this.operations = this.operations.filter(op => op.status !== 'failed');
    await this.saveOperations();
  }

  async retryFailedOperations(): Promise<void> {
    const failedOps = this.operations.filter(op => op.status === 'failed');
    failedOps.forEach(op => {
      op.status = 'pending';
      op.retryCount = 0;
      op.error = undefined;
    });
    await this.saveOperations();
    
    if (networkMonitor.isConnected()) {
      await this.sync();
    }
  }

  stopAutoSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }
}

export const dataSyncService = DataSyncService.getInstance();

export function useDataSync() {
  return {
    addOperation: dataSyncService.addOperation.bind(dataSyncService),
    getPendingOperations: dataSyncService.getPendingOperations.bind(dataSyncService),
    getSyncStatus: dataSyncService.getSyncStatus.bind(dataSyncService),
    sync: dataSyncService.sync.bind(dataSyncService),
    getSyncStats: dataSyncService.getSyncStats.bind(dataSyncService),
    clearFailedOperations: dataSyncService.clearFailedOperations.bind(dataSyncService),
    retryFailedOperations: dataSyncService.retryFailedOperations.bind(dataSyncService),
    setConfig: dataSyncService.setConfig.bind(dataSyncService),
    getConfig: dataSyncService.getConfig.bind(dataSyncService),
    stopAutoSync: dataSyncService.stopAutoSync.bind(dataSyncService),
  };
}
