import { useState, useEffect, useCallback } from 'react';
import { networkMonitor } from './networkMonitor';
import { logger } from './logger';

export type OfflineMode = 'online' | 'offline' | 'pending';

export interface OfflineState {
  mode: OfflineMode;
  isConnected: boolean;
  lastSyncTime: number | null;
  pendingChanges: number;
  syncStatus: 'idle' | 'syncing' | 'completed' | 'failed';
}

export function useOfflineState(): OfflineState {
  const [mode, setMode] = useState<OfflineMode>('online');
  const [isConnected, setIsConnected] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'failed'>('idle');

  useEffect(() => {
    const unsubscribe = networkMonitor.addListener((info) => {
      const wasConnected = isConnected;
      const nowConnected = info.isConnected;
      
      setIsConnected(nowConnected);
      
      if (nowConnected) {
        setMode('online');
        logger.info('Network connected');
      } else {
        setMode('offline');
        logger.info('Network disconnected');
      }

      if (!wasConnected && nowConnected) {
        setSyncStatus('syncing');
        setTimeout(() => {
          setSyncStatus('completed');
          setLastSyncTime(Date.now());
        }, 3000);
      }
    });

    return unsubscribe;
  }, [isConnected]);

  return {
    mode,
    isConnected,
    lastSyncTime,
    pendingChanges,
    syncStatus,
  };
}

export function useOfflineMode(): {
  isOffline: boolean;
  isOnline: boolean;
  mode: OfflineMode;
  syncStatus: 'idle' | 'syncing' | 'completed' | 'failed';
  lastSyncTime: number | null;
} {
  const { mode, isConnected, lastSyncTime, syncStatus } = useOfflineState();

  return {
    isOffline: !isConnected,
    isOnline: isConnected,
    mode,
    syncStatus,
    lastSyncTime,
  };
}
