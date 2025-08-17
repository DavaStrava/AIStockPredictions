'use client';

import { useState, useEffect } from 'react';
import { errorMonitor } from '@/lib/error-monitoring';

export default function DevErrorDashboard() {
  const [errors, setErrors] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') return;

    const updateErrors = () => {
      setErrors(errorMonitor.getRecentErrors(20));
    };

    // Update errors every 2 seconds
    const interval = setInterval(updateErrors, 2000);
    updateErrors(); // Initial load

    return () => clearInterval(interval);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors"
        title="Error Dashboard"
      >
        🐛 {errors.length > 0 && <span className="ml-1">({errors.length})</span>}
      </button>

      {/* Error Dashboard */}
      {isVisible && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Development Error Dashboard
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    errorMonitor.clearErrors();
                    setErrors([]);
                  }}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Error List */}
            <div className="overflow-y-auto max-h-[60vh] p-4">
              {errors.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No errors recorded yet 🎉
                </div>
              ) : (
                <div className="space-y-4">
                  {errors.map((error, index) => (
                    <div
                      key={error.id}
                      className={`border rounded-lg p-4 ${
                        error.severity === 'critical'
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : error.severity === 'high'
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : error.severity === 'medium'
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-gray-300 bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      {/* Error Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              error.severity === 'critical'
                                ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                : error.severity === 'high'
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'
                                : error.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100'
                            }`}
                          >
                            {error.severity.toUpperCase()}
                          </span>
                          {error.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {error.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Error Message */}
                      <div className="mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {error.error.name}: {error.error.message}
                        </h4>
                      </div>

                      {/* Context */}
                      {Object.keys(error.context).length > 0 && (
                        <details className="mb-2">
                          <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            Context
                          </summary>
                          <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                            {JSON.stringify(error.context, null, 2)}
                          </pre>
                        </details>
                      )}

                      {/* Stack Trace */}
                      {error.error.stack && (
                        <details>
                          <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            Stack Trace
                          </summary>
                          <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                            {error.error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Showing {errors.length} recent errors
                </span>
                <span>
                  Development mode only
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}