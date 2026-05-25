import { Platform } from 'react-native';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  category?: string;
  data?: any;
  stack?: string;
  userId?: string;
  sessionId?: string;
}

interface LogOptions {
  category?: string;
  data?: any;
  stack?: string;
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs: number = 500;
  private currentLevel: LogLevel = LogLevel.DEBUG;
  private listeners: Set<(entry: LogEntry) => void> = new Set();
  private sessionId: string = '';
  private userId?: string;
  private categories: Set<string> = new Set();

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private generateSessionId(): string {
    return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    options?: LogOptions
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      category: options?.category,
      data: options?.data,
      stack: options?.stack,
      userId: this.userId,
      sessionId: this.sessionId,
    };

    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.notifyListeners(entry);

    return entry;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private notifyListeners(entry: LogEntry): void {
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        console.error('Error in log listener:', error);
      }
    });
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  clearUserId(): void {
    this.userId = undefined;
  }

  addCategory(category: string): void {
    this.categories.add(category);
  }

  removeCategory(category: string): void {
    this.categories.delete(category);
  }

  addListener(callback: (entry: LogEntry) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  debug(message: string, options?: LogOptions): LogEntry | undefined {
    if (!this.shouldLog(LogLevel.DEBUG)) return undefined;
    
    if (Platform.OS !== 'web') {
      console.debug(`[DEBUG] ${options?.category ? `[${options.category}] ` : ''}${message}`, options?.data || '');
    }
    
    return this.createEntry(LogLevel.DEBUG, message, options);
  }

  info(message: string, options?: LogOptions): LogEntry | undefined {
    if (!this.shouldLog(LogLevel.INFO)) return undefined;
    
    if (Platform.OS !== 'web') {
      console.info(`[INFO] ${options?.category ? `[${options.category}] ` : ''}${message}`, options?.data || '');
    }
    
    return this.createEntry(LogLevel.INFO, message, options);
  }

  warn(message: string, options?: LogOptions): LogEntry | undefined {
    if (!this.shouldLog(LogLevel.WARN)) return undefined;
    
    if (Platform.OS !== 'web') {
      console.warn(`[WARN] ${options?.category ? `[${options.category}] ` : ''}${message}`, options?.data || '');
    }
    
    return this.createEntry(LogLevel.WARN, message, options);
  }

  error(message: string, options?: LogOptions): LogEntry | undefined {
    if (!this.shouldLog(LogLevel.ERROR)) return undefined;
    
    if (Platform.OS !== 'web') {
      console.error(`[ERROR] ${options?.category ? `[${options.category}] ` : ''}${message}`, options?.data || '');
    }
    
    return this.createEntry(LogLevel.ERROR, message, {
      ...options,
      stack: options?.stack || new Error().stack,
    });
  }

  critical(message: string, options?: LogOptions): LogEntry | undefined {
    if (!this.shouldLog(LogLevel.CRITICAL)) return undefined;
    
    if (Platform.OS !== 'web') {
      console.error(`[CRITICAL] ${options?.category ? `[${options.category}] ` : ''}${message}`, options?.data || '');
    }
    
    return this.createEntry(LogLevel.CRITICAL, message, {
      ...options,
      stack: options?.stack || new Error().stack,
    });
  }

  getLogs(options?: {
    level?: LogLevel;
    category?: string;
    limit?: number;
    since?: number;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (options?.level !== undefined) {
      filtered = filtered.filter(log => log.level === options.level);
    }

    if (options?.category) {
      filtered = filtered.filter(log => log.category === options.category);
    }

    if (options?.since) {
      filtered = filtered.filter(log => log.timestamp >= options.since!);
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  getRecentLogs(limit: number = 50): LogEntry[] {
    return this.getLogs({ limit });
  }

  getLogsByCategory(category: string): LogEntry[] {
    return this.getLogs({ category });
  }

  getErrorLogs(): LogEntry[] {
    return this.getLogs({ level: LogLevel.ERROR });
  }

  getCriticalLogs(): LogEntry[] {
    return this.getLogs({ level: LogLevel.CRITICAL });
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogCount(): number {
    return this.logs.length;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  startNewSession(): void {
    this.sessionId = this.generateSessionId();
  }

  async exportLogs(): Promise<string> {
    return JSON.stringify(this.logs, null, 2);
  }

  async exportLogsForReport(): Promise<string> {
    const report = {
      sessionId: this.sessionId,
      userId: this.userId,
      exportedAt: new Date().toISOString(),
      logCount: this.logs.length,
      logs: this.logs,
    };
    return JSON.stringify(report, null, 2);
  }
}

export const logger = Logger.getInstance();

export const createCategoryLogger = (category: string) => ({
  debug: (message: string, data?: any) => logger.debug(message, { category, data }),
  info: (message: string, data?: any) => logger.info(message, { category, data }),
  warn: (message: string, data?: any) => logger.warn(message, { category, data }),
  error: (message: string, data?: any, stack?: string) => 
    logger.error(message, { category, data, stack }),
  critical: (message: string, data?: any, stack?: string) => 
    logger.critical(message, { category, data, stack }),
});

export const appLogger = createCategoryLogger('App');
export const networkLogger = createCategoryLogger('Network');
export const storageLogger = createCategoryLogger('Storage');
export const uiLogger = createCategoryLogger('UI');
export const authLogger = createCategoryLogger('Auth');

export function logError(message: string, error: unknown, extra?: Record<string, unknown>) {
  const normalizedError = error instanceof Error ? error : new Error(String(error));
  return logger.error(message, {
    ...extra,
    data: {
      ...(extra?.data as Record<string, unknown> | undefined),
      error: normalizedError.message,
    },
    stack: normalizedError.stack,
  });
}
