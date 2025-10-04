'use client';

import { useState, useEffect } from 'react';
import StockDashboard from '@/components/StockDashboard';
import MockWatchlistManager from '@/components/MockWatchlistManager';
import DevErrorDashboard from '@/components/DevErrorDashboard';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { setupGlobalErrorHandling, checkMemoryUsage } from '@/lib/error-monitoring';

type ActiveTab = 'dashboard' | 'watchlists';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Initialize error monitoring and performance tracking
  useEffect(() => {
    setupGlobalErrorHandling();
    
    // Check memory usage periodically
    const memoryCheckInterval = setInterval(checkMemoryUsage, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(memoryCheckInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-foreground">
                AI Stock Prediction
              </h1>
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                MVP
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Technical Analysis Engine
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <nav className="flex space-x-8 -mb-px">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('watchlists')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'watchlists'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Watchlists
            </button>
          </nav>
        </div>
      </header>
      
      <main className="py-8">
        <ResponsiveContainer variant="wide">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Responsive Container Test</h2>
            <p>If you can see this, the ResponsiveContainer is working!</p>
            {activeTab === 'dashboard' && (
              <div className="mt-8">
                <StockDashboard />
              </div>
            )}
            {activeTab === 'watchlists' && (
              <div className="mt-8">
                <MockWatchlistManager />
              </div>
            )}
          </div>
        </ResponsiveContainer>
      </main>
      
      {/* Development Error Dashboard */}
      <DevErrorDashboard />
    </div>
  );
}
