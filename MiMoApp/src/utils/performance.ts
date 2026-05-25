import { Platform, UIManager } from 'react-native';

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private startTimes: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMeasure(label: string): void {
    this.startTimes.set(label, performance.now());
  }

  endMeasure(label: string): number {
    const startTime = this.startTimes.get(label);
    if (!startTime) {
      console.warn(`[PerformanceMonitor] No start time found for: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.set(label, duration);
    this.startTimes.delete(label);

    if (duration > 100) {
      console.warn(`[PerformanceMonitor] Slow operation: ${label} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  getMetric(label: string): number | undefined {
    return this.metrics.get(label);
  }

  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  reportMetrics(): void {
    const metrics = this.getAllMetrics();
    console.table(metrics);
  }
}

export const perfMonitor = PerformanceMonitor.getInstance();

export function enableLayoutAnimations(): void {
  if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }
}

export function useLazyImport<T>(
  importFn: () => Promise<{ default: T }>,
  deps: any[] = []
): T | null {
  const [Component, setComponent] = useState<T | null>(null);

  useEffect(() => {
    importFn().then(module => {
      setComponent(module.default);
    });
  }, deps);

  return Component;
}

import { useState, useEffect } from 'react';
