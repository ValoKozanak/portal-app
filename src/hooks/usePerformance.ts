import { useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
}

interface PerformanceData {
  metrics: PerformanceMetrics;
  isSupported: boolean;
  measureTime: (name: string) => void;
  endMeasure: (name: string) => number | null;
  getMemoryUsage: () => PerformanceMemory | null;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export const usePerformance = (): PerformanceData => {
  const metrics = useRef<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null
  });

  const measurements = useRef<Map<string, number>>(new Map());
  const isSupported = 'PerformanceObserver' in window && 'performance' in window;

  const measureTime = useCallback((name: string) => {
    if (isSupported) {
      performance.mark(`${name}-start`);
      measurements.current.set(name, performance.now());
    }
  }, [isSupported]);

  const endMeasure = useCallback((name: string): number | null => {
    if (isSupported) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const startTime = measurements.current.get(name);
      if (startTime) {
        const duration = performance.now() - startTime;
        measurements.current.delete(name);
        return duration;
      }
    }
    return null;
  }, [isSupported]);

  const getMemoryUsage = useCallback((): PerformanceMemory | null => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        metrics.current.fcp = fcpEntry.startTime;
        console.log('FCP:', fcpEntry.startTime);
      }
    });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        metrics.current.lcp = lastEntry.startTime;
        console.log('LCP:', lastEntry.startTime);
      }
    });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'first-input') {
          const firstInputEntry = entry as PerformanceEventTiming;
          metrics.current.fid = firstInputEntry.processingStart - firstInputEntry.startTime;
          console.log('FID:', metrics.current.fid);
        }
      });
    });

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach(entry => {
        const layoutShiftEntry = entry as any; // Using any for LayoutShift type
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
        }
      });
      metrics.current.cls = clsValue;
      console.log('CLS:', clsValue);
    });

    // Time to First Byte
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      metrics.current.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      console.log('TTFB:', metrics.current.ttfb);
    }

    try {
      fcpObserver.observe({ entryTypes: ['paint'] });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }

    return () => {
      fcpObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, [isSupported]);

  // Monitor React render performance
  useEffect(() => {
    if (!isSupported) return;

    const originalConsoleLog = console.log;
    let renderCount = 0;
    let renderStartTime = 0;

    // Override console.log to track React renders
    console.log = (...args) => {
      if (args[0]?.includes?.('render') || args[0]?.includes?.('Render')) {
        renderCount++;
        if (renderCount === 1) {
          renderStartTime = performance.now();
        }
      }
      originalConsoleLog.apply(console, args);
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, [isSupported]);

  return {
    metrics: metrics.current,
    isSupported,
    measureTime,
    endMeasure,
    getMemoryUsage
  };
};
