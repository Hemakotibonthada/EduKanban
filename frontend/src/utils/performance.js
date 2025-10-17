/**
 * Performance Monitoring Utilities
 * Tracks and reports frontend performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoads: [],
      apiCalls: [],
      renders: [],
      interactions: []
    };
    this.observers = [];
    this.initialized = false;
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    if (this.initialized || typeof window === 'undefined') return;

    this.initialized = true;

    // Monitor page load performance
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => this.capturePageLoadMetrics(), 0);
      });
    }

    // Monitor Core Web Vitals
    this.observeWebVitals();

    // Monitor long tasks
    this.observeLongTasks();

    // Monitor resource loading
    this.observeResources();
  }

  /**
   * Capture page load metrics
   */
  capturePageLoadMetrics() {
    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    const metrics = {
      // Navigation timing
      navigationStart: timing.navigationStart,
      redirectTime: timing.redirectEnd - timing.redirectStart,
      dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
      tcpTime: timing.connectEnd - timing.connectStart,
      requestTime: timing.responseStart - timing.requestStart,
      responseTime: timing.responseEnd - timing.responseStart,
      
      // Page processing timing
      domLoadingTime: timing.domLoading - timing.fetchStart,
      domInteractiveTime: timing.domInteractive - timing.fetchStart,
      domContentLoadedTime: timing.domContentLoadedEventEnd - timing.navigationStart,
      domCompleteTime: timing.domComplete - timing.navigationStart,
      loadEventTime: timing.loadEventEnd - timing.navigationStart,
      
      // Key metrics
      ttfb: timing.responseStart - timing.navigationStart, // Time to First Byte
      fcp: this.getFirstContentfulPaint(),
      domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
      windowLoad: timing.loadEventEnd - timing.navigationStart,
      
      // Navigation type
      navigationType: this.getNavigationType(navigation.type),
      
      timestamp: Date.now()
    };

    this.metrics.pageLoads.push(metrics);
    this.reportMetrics('pageLoad', metrics);

    return metrics;
  }

  /**
   * Get First Contentful Paint
   */
  getFirstContentfulPaint() {
    if (!window.performance || !window.performance.getEntriesByType) return null;

    const paintEntries = window.performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    
    return fcpEntry ? fcpEntry.startTime : null;
  }

  /**
   * Get navigation type
   */
  getNavigationType(type) {
    const types = {
      0: 'navigate',
      1: 'reload',
      2: 'back_forward',
      255: 'reserved'
    };
    return types[type] || 'unknown';
  }

  /**
   * Observe Core Web Vitals (LCP, FID, CLS)
   */
  observeWebVitals() {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.reportMetrics('lcp', {
          value: lastEntry.renderTime || lastEntry.loadTime,
          element: lastEntry.element?.tagName,
          timestamp: Date.now()
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          this.reportMetrics('fid', {
            value: entry.processingStart - entry.startTime,
            name: entry.name,
            timestamp: Date.now()
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        
        this.reportMetrics('cls', {
          value: clsValue,
          timestamp: Date.now()
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

    } catch (error) {
      console.error('Error setting up Web Vitals observers:', error);
    }
  }

  /**
   * Observe long tasks (> 50ms)
   */
  observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const longTaskObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (entry.duration > 50) {
            this.reportMetrics('longTask', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
              timestamp: Date.now()
            });
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (error) {
      // longtask not supported in all browsers
      console.debug('Long task observer not supported');
    }
  }

  /**
   * Observe resource loading
   */
  observeResources() {
    if (!window.performance || !window.performance.getEntriesByType) return;

    const resources = window.performance.getEntriesByType('resource');
    const slowResources = resources.filter(r => r.duration > 1000);

    if (slowResources.length > 0) {
      this.reportMetrics('slowResources', {
        count: slowResources.length,
        resources: slowResources.map(r => ({
          name: r.name,
          duration: r.duration,
          size: r.transferSize,
          type: r.initiatorType
        })),
        timestamp: Date.now()
      });
    }
  }

  /**
   * Track API call performance
   */
  trackApiCall(url, duration, status) {
    const metric = {
      url,
      duration,
      status,
      timestamp: Date.now()
    };

    this.metrics.apiCalls.push(metric);

    // Report slow API calls (> 3s)
    if (duration > 3000) {
      this.reportMetrics('slowApiCall', metric);
    }
  }

  /**
   * Track component render time
   */
  trackRender(componentName, duration) {
    const metric = {
      component: componentName,
      duration,
      timestamp: Date.now()
    };

    this.metrics.renders.push(metric);

    // Report slow renders (> 100ms)
    if (duration > 100) {
      this.reportMetrics('slowRender', metric);
    }
  }

  /**
   * Track user interactions
   */
  trackInteraction(type, target, duration) {
    const metric = {
      type,
      target,
      duration,
      timestamp: Date.now()
    };

    this.metrics.interactions.push(metric);
  }

  /**
   * Report metrics to backend or analytics service
   */
  reportMetrics(type, data) {
    // Only report in production
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Performance] ${type}:`, data);
      return;
    }

    // Send to analytics endpoint
    try {
      // Use sendBeacon for better reliability
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ type, data })], {
          type: 'application/json'
        });
        navigator.sendBeacon('/api/analytics/performance', blob);
      } else {
        // Fallback to fetch
        fetch('/api/analytics/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, data }),
          keepalive: true
        }).catch(err => console.error('Failed to report metrics:', err));
      }
    } catch (error) {
      console.error('Error reporting metrics:', error);
    }
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const pageLoad = this.metrics.pageLoads[this.metrics.pageLoads.length - 1];
    
    return {
      pageLoad: pageLoad ? {
        ttfb: pageLoad.ttfb,
        fcp: pageLoad.fcp,
        domReady: pageLoad.domReady,
        windowLoad: pageLoad.windowLoad
      } : null,
      apiCalls: {
        total: this.metrics.apiCalls.length,
        average: this.getAverage(this.metrics.apiCalls.map(c => c.duration)),
        slow: this.metrics.apiCalls.filter(c => c.duration > 3000).length
      },
      renders: {
        total: this.metrics.renders.length,
        average: this.getAverage(this.metrics.renders.map(r => r.duration)),
        slow: this.metrics.renders.filter(r => r.duration > 100).length
      }
    };
  }

  /**
   * Get average value
   */
  getAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = {
      pageLoads: [],
      apiCalls: [],
      renders: [],
      interactions: []
    };
  }

  /**
   * Cleanup observers
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.initialized = false;
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// React hook for component performance tracking
export const usePerformanceTracking = (componentName) => {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    performanceMonitor.trackRender(componentName, duration);
  };
};

// HOC for automatic performance tracking
// Note: This should be used in .jsx files, not imported here
export const createPerformanceTracker = (componentName) => {
  return {
    start: () => performance.now(),
    end: (startTime) => {
      const duration = performance.now() - startTime;
      performanceMonitor.trackRender(componentName, duration);
    }
  };
};

export default performanceMonitor;
