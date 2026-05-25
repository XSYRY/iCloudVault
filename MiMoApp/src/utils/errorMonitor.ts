import { Platform } from 'react-native';

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  RENDER = 'render',
  NETWORK = 'network',
  STORAGE = 'storage',
  NAVIGATION = 'navigation',
  USER_INTERACTION = 'user_interaction',
  UNKNOWN = 'unknown',
}

export interface ErrorReport {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  deviceInfo: DeviceInfo;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface DeviceInfo {
  platform: string;
  platformVersion: string;
  appVersion: string;
  deviceModel?: string;
  deviceId?: string;
  isSimulator: boolean;
  memoryUsage?: number;
  freeMemory?: number;
  totalMemory?: number;
}

class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errorReports: ErrorReport[] = [];
  private sessionId: string = '';
  private userId?: string;
  private maxReports: number = 100;
  private listeners: Set<(error: ErrorReport) => void> = new Set();

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      platform: Platform.OS,
      platformVersion: Platform.Version.toString(),
      appVersion: '1.0.0',
      isSimulator: Platform.OS === 'ios' ? false : false,
    };
  }

  private setupGlobalErrorHandlers(): void {
    const browserWindow = (globalThis as typeof globalThis & {
      window?: {
        onerror?: (
          message: unknown,
          source?: string,
          lineno?: number,
          colno?: number,
          error?: Error,
        ) => void;
        onunhandledrejection?: (event: { reason: unknown }) => void;
      };
    }).window;

    if (browserWindow) {
      browserWindow.onerror = (message, source, lineno, colno, error) => {
        this.captureError(error || new Error(message as string), {
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.ERROR,
          metadata: {
            source,
            lineno,
            colno,
          },
        });
      };

      browserWindow.onunhandledrejection = (event) => {
        const error = event.reason instanceof Error 
          ? event.reason 
          : new Error(String(event.reason));
        
        this.captureError(error, {
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.ERROR,
          metadata: {
            type: 'unhandled_rejection',
          },
        });
      };
    }
  }

  captureError(
    error: Error | string,
    options?: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      metadata?: Record<string, any>;
    }
  ): ErrorReport {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    const report: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      message: errorMessage,
      stack: errorStack,
      severity: options?.severity || ErrorSeverity.ERROR,
      category: options?.category || this.categorizeError(errorMessage),
      deviceInfo: this.getDeviceInfo(),
      userId: this.userId,
      sessionId: this.sessionId,
      metadata: options?.metadata,
    };

    this.errorReports.push(report);

    if (this.errorReports.length > this.maxReports) {
      this.errorReports.shift();
    }

    this.notifyListeners(report);

    if (options?.severity === ErrorSeverity.CRITICAL) {
      this.handleCriticalError(report);
    }

    return report;
  }

  private categorizeError(message: string): ErrorCategory {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('http')) {
      return ErrorCategory.NETWORK;
    }
    if (lowerMessage.includes('storage') || lowerMessage.includes('cache') || lowerMessage.includes('database')) {
      return ErrorCategory.STORAGE;
    }
    if (lowerMessage.includes('navigation') || lowerMessage.includes('navigate')) {
      return ErrorCategory.NAVIGATION;
    }
    if (lowerMessage.includes('render') || lowerMessage.includes('component')) {
      return ErrorCategory.RENDER;
    }
    
    return ErrorCategory.UNKNOWN;
  }

  private handleCriticalError(report: ErrorReport): void {
    console.error('CRITICAL ERROR DETECTED:', report);
    
    try {
      // Could send to crash reporting service here
      // e.g., Firebase Crashlytics, Sentry, Bugsnag, etc.
    } catch (e) {
      console.error('Failed to report critical error:', e);
    }
  }

  private notifyListeners(report: ErrorReport): void {
    this.listeners.forEach(listener => {
      try {
        listener(report);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }

  addListener(callback: (error: ErrorReport) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  clearUserId(): void {
    this.userId = undefined;
  }

  startNewSession(): void {
    this.sessionId = this.generateSessionId();
  }

  getReports(options?: {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    limit?: number;
  }): ErrorReport[] {
    let reports = [...this.errorReports];

    if (options?.severity) {
      reports = reports.filter(r => r.severity === options.severity);
    }

    if (options?.category) {
      reports = reports.filter(r => r.category === options.category);
    }

    if (options?.limit) {
      reports = reports.slice(-options.limit);
    }

    return reports;
  }

  getRecentReports(limit: number = 10): ErrorReport[] {
    return this.getReports({ limit });
  }

  getCriticalReports(): ErrorReport[] {
    return this.getReports({ severity: ErrorSeverity.CRITICAL });
  }

  clearReports(): void {
    this.errorReports = [];
  }

  getReportCount(): number {
    return this.errorReports.length;
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export const errorMonitor = ErrorMonitor.getInstance();

export function captureError(
  error: Error | string,
  options?: {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    metadata?: Record<string, any>;
  }
): ErrorReport {
  return errorMonitor.captureError(error, options);
}

export function captureMessage(
  message: string,
  options?: {
    severity?: ErrorSeverity;
    metadata?: Record<string, any>;
  }
): ErrorReport {
  return errorMonitor.captureError(message, {
    ...options,
    category: ErrorCategory.UNKNOWN,
  });
}

export function useErrorMonitor() {
  return {
    captureError,
    captureMessage,
    addListener: errorMonitor.addListener.bind(errorMonitor),
    setUserId: errorMonitor.setUserId.bind(errorMonitor),
    clearUserId: errorMonitor.clearUserId.bind(errorMonitor),
    getReports: errorMonitor.getReports.bind(errorMonitor),
    getRecentReports: errorMonitor.getRecentReports.bind(errorMonitor),
    getCriticalReports: errorMonitor.getCriticalReports.bind(errorMonitor),
    clearReports: errorMonitor.clearReports.bind(errorMonitor),
    getReportCount: errorMonitor.getReportCount.bind(errorMonitor),
    getSessionId: errorMonitor.getSessionId.bind(errorMonitor),
    startNewSession: errorMonitor.startNewSession.bind(errorMonitor),
  };
}
