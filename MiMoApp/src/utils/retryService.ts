export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryOn: (error: any) => boolean;
}

export interface RetryResult<T> {
  data: T | null;
  error: any;
  attempts: number;
  success: boolean;
}

class RetryService {
  private static instance: RetryService;
  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryOn: this.isRetryableError,
  };

  private constructor() {}

  static getInstance(): RetryService {
    if (!RetryService.instance) {
      RetryService.instance = new RetryService();
    }
    return RetryService.instance;
  }

  private isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const retryableErrors = [
      'Network Error',
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'EHOSTUNREACH',
      'ENETUNREACH',
      'ENETDOWN',
      'ERR_INTERNET_DISCONNECTED',
    ];

    if (typeof error === 'string') {
      return retryableErrors.some(e => error.includes(e));
    }

    if (error.message) {
      return retryableErrors.some(e => error.message.includes(e));
    }

    if (error.status) {
      return error.status >= 500;
    }

    return false;
  }

  setDefaultConfig(config: Partial<RetryConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  getDefaultConfig(): RetryConfig {
    return { ...this.defaultConfig };
  }

  async executeWithRetry<T>(
    fn: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const mergedConfig: RetryConfig = { ...this.defaultConfig, ...config };
    let attempts = 0;
    let error: any = null;

    for (let i = 0; i <= mergedConfig.maxRetries; i++) {
      attempts = i + 1;

      try {
        const data = await fn();
        return {
          data,
          error: null,
          attempts,
          success: true,
        };
      } catch (e) {
        error = e;

        if (i === mergedConfig.maxRetries) {
          break;
        }

        if (!mergedConfig.retryOn(e)) {
          break;
        }

        const delay = Math.min(
          mergedConfig.initialDelay * Math.pow(mergedConfig.backoffMultiplier, i),
          mergedConfig.maxDelay
        );

        await this.delay(delay);
      }
    }

    return {
      data: null,
      error,
      attempts,
      success: false,
    };
  }

  async executeWithExponentialBackoff<T>(
    fn: () => Promise<T>,
    maxRetries?: number
  ): Promise<RetryResult<T>> {
    return this.executeWithRetry(fn, {
      maxRetries: maxRetries ?? this.defaultConfig.maxRetries,
      backoffMultiplier: 2,
    });
  }

  async executeWithFixedDelay<T>(
    fn: () => Promise<T>,
    delayMs: number,
    maxRetries?: number
  ): Promise<RetryResult<T>> {
    return this.executeWithRetry(fn, {
      maxRetries: maxRetries ?? this.defaultConfig.maxRetries,
      initialDelay: delayMs,
      maxDelay: delayMs,
      backoffMultiplier: 1,
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const retryService = RetryService.getInstance();

export function useRetry() {
  return {
    executeWithRetry: retryService.executeWithRetry.bind(retryService),
    executeWithExponentialBackoff: retryService.executeWithExponentialBackoff.bind(retryService),
    executeWithFixedDelay: retryService.executeWithFixedDelay.bind(retryService),
    setDefaultConfig: retryService.setDefaultConfig.bind(retryService),
    getDefaultConfig: retryService.getDefaultConfig.bind(retryService),
  };
}
