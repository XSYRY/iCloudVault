import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

export type NetworkStatus = 'unknown' | 'none' | 'wifi' | 'cellular' | 'bluetooth' | 'ethernet';

export interface NetworkInfo {
  status: NetworkStatus;
  isConnected: boolean;
  isInternetReachable: boolean | null;
  details?: {
    isConnectionExpensive?: boolean;
    ssid?: string | null;
    bssid?: string | null;
    strength?: number | null;
    ipAddress?: string | null;
    subnet?: string | null;
    frequency?: number | null;
    cellularGeneration?: string | null;
    carrier?: string | null;
  };
}

class NetworkMonitor {
  private static instance: NetworkMonitor;
  private listeners: Set<(info: NetworkInfo) => void> = new Set();
  private subscription: NetInfoSubscription | null = null;
  private currentInfo: NetworkInfo = {
    status: 'unknown',
    isConnected: false,
    isInternetReachable: null,
  };

  private constructor() {
    this.startMonitoring();
  }

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private mapConnectionType(type: string | null): NetworkStatus {
    switch (type) {
      case 'wifi':
        return 'wifi';
      case 'cellular':
        return 'cellular';
      case 'bluetooth':
        return 'bluetooth';
      case 'ethernet':
        return 'ethernet';
      case 'none':
        return 'none';
      default:
        return 'unknown';
    }
  }

  private startMonitoring(): void {
    this.subscription = NetInfo.addEventListener((state: NetInfoState) => {
      const details = (state.details ?? {}) as Record<string, any>;
      this.currentInfo = {
        status: this.mapConnectionType(state.type),
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        details: {
          isConnectionExpensive: details.isConnectionExpensive,
          ssid: details.ssid,
          bssid: details.bssid,
          strength: details.strength,
          ipAddress: details.ipAddress,
          subnet: details.subnet,
          frequency: details.frequency,
          cellularGeneration: details.cellularGeneration,
          carrier: details.carrier,
        },
      };

      this.notifyListeners();
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentInfo);
      } catch (error) {
        console.error('Error in network listener:', error);
      }
    });
  }

  addListener(callback: (info: NetworkInfo) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentInfo);
    return () => {
      this.listeners.delete(callback);
    };
  }

  getCurrentInfo(): NetworkInfo {
    return { ...this.currentInfo };
  }

  isConnected(): boolean {
    return this.currentInfo.isConnected;
  }

  isWifi(): boolean {
    return this.currentInfo.status === 'wifi';
  }

  isCellular(): boolean {
    return this.currentInfo.status === 'cellular';
  }

  isExpensive(): boolean {
    return this.currentInfo.details?.isConnectionExpensive ?? false;
  }

  stopMonitoring(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
  }

  async checkConnection(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch (error) {
      console.error('Failed to check network connection:', error);
      return false;
    }
  }

  async refresh(): Promise<NetworkInfo> {
    try {
      const state = await NetInfo.refresh();
      const details = (state.details ?? {}) as Record<string, any>;
      this.currentInfo = {
        status: this.mapConnectionType(state.type),
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        details: {
          isConnectionExpensive: details.isConnectionExpensive,
          ssid: details.ssid,
          bssid: details.bssid,
          strength: details.strength,
          ipAddress: details.ipAddress,
          subnet: details.subnet,
          frequency: details.frequency,
          cellularGeneration: details.cellularGeneration,
          carrier: details.carrier,
        },
      };
      this.notifyListeners();
      return this.currentInfo;
    } catch (error) {
      console.error('Failed to refresh network info:', error);
      return this.currentInfo;
    }
  }
}

export const networkMonitor = NetworkMonitor.getInstance();

export function useNetworkStatus() {
  return {
    addListener: networkMonitor.addListener.bind(networkMonitor),
    getCurrentInfo: networkMonitor.getCurrentInfo.bind(networkMonitor),
    isConnected: networkMonitor.isConnected.bind(networkMonitor),
    isWifi: networkMonitor.isWifi.bind(networkMonitor),
    isCellular: networkMonitor.isCellular.bind(networkMonitor),
    isExpensive: networkMonitor.isExpensive.bind(networkMonitor),
    checkConnection: networkMonitor.checkConnection.bind(networkMonitor),
    refresh: networkMonitor.refresh.bind(networkMonitor),
  };
}
