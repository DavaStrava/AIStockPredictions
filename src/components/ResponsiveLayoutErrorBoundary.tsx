/**
 * ResponsiveLayoutErrorBoundary Component
 * 
 * Specialized error boundary for responsive layout failures with graceful
 * degradation to mobile layout.
 * 
 * Requirements: 3.3, 4.4
 */

'use client';

import React from 'react';
import { reportReactError } from '@/lib/error-monitoring';

interface ResponsiveLayoutErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorType: 'layout' | 'data' | 'rendering' | 'unknown';
  fallbackLayout: 'mobile' | 'desktop';
}

interface ResponsiveLayoutErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ 
    error?: Error; 
    resetError: () => void;
    errorType: string;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * ResponsiveLayoutErrorBoundary
 * 
 * This error boundary provides specialized handling for responsive layout errors:
 * 1. Catches errors in responsive components
 * 2. Gracefully degrades to mobile layout on failure
 * 3. Provides detailed error information in development
 * 4. Reports errors to monitoring system
 * 5. Allows recovery without full page reload
 */
class ResponsiveLayoutErrorBoundary extends React.Component<
  ResponsiveLayoutErrorBoundaryProps,
  ResponsiveLayoutErrorBoundaryState
> {
  constructor(props: ResponsiveLayoutErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorType: 'unknown',
      fallbackLayout: 'mobile'
    };
  }

  /**
   * getDerivedStateFromError
   * 
   * Called when an error is thrown during rendering.
   * Updates state to trigger fallback UI on next render.
   * 
   * This method determines the error type and appropriate fallback strategy.
   */
  static getDerivedStateFromError(error: Error): Partial<ResponsiveLayoutErrorBoundaryState> {
    // Analyze error to determine type
    const errorMessage = error.message.toLowerCase();
    let errorType: ResponsiveLayoutErrorBoundaryState['errorType'] = 'unknown';
    
    if (errorMessage.includes('layout') || errorMessage.includes('grid') || errorMessage.includes('flex')) {
      errorType = 'layout';
    } else if (errorMessage.includes('data') || errorMessage.includes('undefined') || errorMessage.includes('null')) {
      errorType = 'data';
    } else if (errorMessage.includes('render') || errorMessage.includes('component')) {
      errorType = 'rendering';
    }

    return {
      hasError: true,
      error,
      errorType,
      fallbackLayout: 'mobile' // Always fall back to mobile layout for safety
    };
  }

  /**
   * componentDidCatch
   * 
   * Called after an error has been thrown.
   * Used for side effects like logging and error reporting.
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('ResponsiveLayoutErrorBoundary caught an error:', {
      error,
      errorInfo,
      errorType: this.state.errorType,
      fallbackLayout: this.state.fallbackLayout
    });
    
    // Report to error monitoring system
    reportReactError(error, errorInfo, 'ResponsiveLayoutErrorBoundary');
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Update state with full error information
    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  /**
   * resetError
   * 
   * Resets the error boundary state, allowing the component tree to re-render.
   * This enables recovery without a full page reload.
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorType: 'unknown',
      fallbackLayout: 'mobile'
    });
  };

  /**
   * renderFallbackUI
   * 
   * Renders the fallback UI when an error occurs.
   * Provides different fallbacks based on error type.
   */
  renderFallbackUI() {
    const { error, errorType } = this.state;
    const { fallback: FallbackComponent } = this.props;

    // Use custom fallback if provided
    if (FallbackComponent) {
      return (
        <FallbackComponent 
          error={error} 
          resetError={this.resetError}
          errorType={errorType}
        />
      );
    }

    // Default fallback UI with mobile-first layout
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          {/* Error Icon */}
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg 
                className="h-8 w-8 text-yellow-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Layout Error Detected
              </h3>
            </div>
          </div>
          
          {/* Error Message */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              We encountered an issue with the responsive layout. The page has been switched to a simplified mobile layout for stability.
            </p>
            
            {errorType !== 'unknown' && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                Error Type: <span className="font-semibold capitalize">{errorType}</span>
              </p>
            )}
            
            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4">
                <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-64">
                  <div className="mb-2">
                    <strong>Error:</strong> {error.message}
                  </div>
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.resetError}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Reload Page
            </button>
          </div>
          
          {/* Help Text */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              If this problem persists, try:
            </p>
            <ul className="mt-2 text-xs text-gray-500 dark:text-gray-500 list-disc list-inside space-y-1">
              <li>Refreshing the page</li>
              <li>Clearing your browser cache</li>
              <li>Using a different browser</li>
              <li>Resizing your browser window</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderFallbackUI();
    }

    return this.props.children;
  }
}

export default ResponsiveLayoutErrorBoundary;

/**
 * Hook for using responsive error boundary in functional components
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { reportError } = useResponsiveErrorBoundary();
 *   
 *   try {
 *     // risky operation
 *   } catch (error) {
 *     reportError(error);
 *   }
 * }
 * ```
 */
export function useResponsiveErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const reportError = React.useCallback((error: Error) => {
    console.error('Responsive layout error:', error);
    reportReactError(error, { componentStack: '' }, 'useResponsiveErrorBoundary');
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    reportError,
    clearError,
    hasError: error !== null
  };
}
