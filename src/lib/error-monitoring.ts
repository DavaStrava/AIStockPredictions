/**
 * Error Monitoring and Reporting System
 * 
 * This module provides comprehensive error tracking and reporting
 * to help identify and resolve production issues quickly.
 */

interface ErrorReport {
  id: string;
  timestamp: Date;
  error: Error;
  context: {
    component?: string;
    props?: any;
    state?: any;
    userAgent?: string;
    url?: string;
    userId?: string;
    // Allow additional context properties for different error types
    [key: string]: any;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

class ErrorMonitor {
  private errors: ErrorReport[] = [];
  private maxErrors = 100; // Keep last 100 errors in memory

  /**
   * Report an error with context information
   */
  reportError(
    error: Error,
    context: ErrorReport['context'] = {},
    severity: ErrorReport['severity'] = 'medium',
    tags: string[] = []
  ): void {
    const report: ErrorReport = {
      id: this.generateId(),
      timestamp: new Date(),
      error,
      context: {
        ...context,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
      severity,
      tags,
    };

    // Add to memory store
    this.errors.unshift(report);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Report [${severity.toUpperCase()}]`);
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Tags:', tags);
      console.groupEnd();
    }

    // In production, you would send this to your error tracking service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(report);
    }
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit = 10): ErrorReport[] {
    return this.errors.slice(0, limit);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorReport['severity']): ErrorReport[] {
    return this.errors.filter(error => error.severity === severity);
  }

  /**
   * Clear all stored errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Generate unique error ID
   */
  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Send error to external service (placeholder)
   */
  private async sendToErrorService(report: ErrorReport): Promise<void> {
    try {
      // In a real application, you would send this to your error tracking service
      // Example implementations:
      
      // Sentry
      // Sentry.captureException(report.error, {
      //   tags: report.tags,
      //   contexts: { custom: report.context },
      //   level: report.severity as any,
      // });

      // Custom API endpoint
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report),
      // });

      console.log('Error report would be sent to monitoring service:', report.id);
    } catch (err) {
      console.error('Failed to send error report:', err);
    }
  }
}

// Global error monitor instance
export const errorMonitor = new ErrorMonitor();

/**
 * React Error Boundary Helper
 */
export function reportReactError(
  error: Error,
  errorInfo: React.ErrorInfo,
  componentName?: string
): void {
  errorMonitor.reportError(
    error,
    {
      component: componentName,
      componentStack: errorInfo.componentStack,
    },
    'high',
    ['react', 'component-error']
  );
}

/**
 * API Error Helper
 */
export function reportApiError(
  error: Error,
  endpoint: string,
  method: string = 'GET',
  payload?: any
): void {
  errorMonitor.reportError(
    error,
    {
      endpoint,
      method,
      payload,
    },
    'medium',
    ['api', 'network']
  );
}

/**
 * Async Operation Error Helper
 */
export function reportAsyncError(
  error: Error,
  operation: string,
  context?: any
): void {
  errorMonitor.reportError(
    error,
    {
      operation,
      ...context,
    },
    'medium',
    ['async', 'promise']
  );
}

/**
 * Global Error Handler Setup
 */
export function setupGlobalErrorHandling(): void {
  if (typeof window === 'undefined') return;

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorMonitor.reportError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      {
        reason: event.reason,
        promise: event.promise,
      },
      'high',
      ['unhandled-promise', 'global']
    );
  });

  // Catch global JavaScript errors
  window.addEventListener('error', (event) => {
    errorMonitor.reportError(
      event.error || new Error(event.message),
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      'high',
      ['javascript', 'global']
    );
  });

  // Catch resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target as HTMLElement;
      errorMonitor.reportError(
        new Error(`Resource loading failed: ${target.tagName}`),
        {
          tagName: target.tagName,
          src: (target as any).src || (target as any).href,
        },
        'low',
        ['resource', 'loading']
      );
    }
  }, true);
}

/**
 * Performance Monitoring
 */
export function reportPerformanceIssue(
  metric: string,
  value: number,
  threshold: number,
  context?: any
): void {
  if (value > threshold) {
    errorMonitor.reportError(
      new Error(`Performance threshold exceeded: ${metric} = ${value}ms (threshold: ${threshold}ms)`),
      {
        metric,
        value,
        threshold,
        ...context,
      },
      'medium',
      ['performance', metric]
    );
  }
}

/**
 * Memory Usage Monitoring
 */
export function checkMemoryUsage(): void {
  if (typeof window === 'undefined' || !(performance as any).memory) return;

  const memory = (performance as any).memory;
  const usedMB = memory.usedJSHeapSize / 1024 / 1024;
  const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
  const usagePercent = (usedMB / limitMB) * 100;

  if (usagePercent > 80) {
    errorMonitor.reportError(
      new Error(`High memory usage: ${usedMB.toFixed(2)}MB (${usagePercent.toFixed(1)}%)`),
      {
        usedMB,
        limitMB,
        usagePercent,
      },
      'medium',
      ['memory', 'performance']
    );
  }
}

/**
 * DEVELOPMENT DEBUGGING HELPER - SSR-SAFE WINDOW ACCESS PATTERN
 * 
 * This code demonstrates a crucial pattern for Next.js and other SSR frameworks:
 * safely accessing browser-only APIs without breaking server-side rendering.
 * 
 * 🔍 THE PROBLEM BEING SOLVED:
 * In Next.js, code runs in two environments:
 * 1. SERVER-SIDE: During build time and initial page load (Node.js environment)
 * 2. CLIENT-SIDE: In the user's browser (Browser environment)
 * 
 * The `window` object only exists in browsers, not on the server. Without proper
 * checks, accessing `window` on the server would cause a ReferenceError and crash
 * the application during server-side rendering.
 * 
 * 🛡️ THE SOLUTION - DUAL ENVIRONMENT CHECKS:
 * 
 * 1. `process.env.NODE_ENV === 'development'`
 *    - Ensures this debugging code only runs in development
 *    - Prevents debugging tools from being exposed in production
 *    - Environment variables are available in both server and client contexts
 * 
 * 2. `typeof window !== 'undefined'`
 *    - Checks if we're running in a browser environment
 *    - `typeof` operator safely returns 'undefined' for undeclared variables
 *    - This is the standard pattern for detecting browser vs server environment
 * 
 * 💡 WHY BOTH CHECKS ARE NEEDED:
 * - Environment check: Security and performance (don't expose debug tools in prod)
 * - Window check: Runtime safety (don't crash on server-side rendering)
 * 
 * 🔧 ALTERNATIVE APPROACHES:
 * - `if (typeof globalThis !== 'undefined' && globalThis.window)` - More explicit
 * - `if (process.browser)` - Next.js specific (deprecated in newer versions)
 * - `useEffect(() => { window.errorMonitor = errorMonitor })` - React hook approach
 * 
 * 📚 LEARNING CONCEPTS:
 * - Server-Side Rendering (SSR) compatibility
 * - Environment detection patterns
 * - Safe browser API access
 * - Development vs production code separation
 * - Global object exposure for debugging
 * 
 * This pattern is essential for any code that needs to work in both server and
 * client environments, which is common in modern web applications using SSR/SSG.
 */
// Export for debugging in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).errorMonitor = errorMonitor;
}