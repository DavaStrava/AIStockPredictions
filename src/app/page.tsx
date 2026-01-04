'use client';

import { useState, useEffect } from 'react';
import StockDashboard from '@/components/StockDashboard';
import WatchlistManager from '@/components/WatchlistManager';
import TradeTracker from '@/components/trading-journal/TradeTracker';
import { PortfolioManager } from '@/components/portfolio';
import DevErrorDashboard from '@/components/DevErrorDashboard';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import ResponsiveLayoutErrorBoundary from '@/components/ResponsiveLayoutErrorBoundary';
import UserMenu from '@/components/UserMenu';
import { setupGlobalErrorHandling, checkMemoryUsage } from '@/lib/error-monitoring';

type ActiveTab = 'dashboard' | 'watchlists' | 'trades' | 'portfolio';

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
              <h1 className="text-responsive-h2 text-foreground">
                AI Stock Prediction
              </h1>
              <span className="ml-2 px-2 py-1 text-responsive-badge bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                MVP
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-responsive-caption text-gray-500 hidden sm:block">
                Technical Analysis Engine
              </div>
              <UserMenu />
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
            <button
              onClick={() => setActiveTab('trades')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trades'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Trade Tracker
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'portfolio'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Portfolio
            </button>
          </nav>
        </div>
      </header>
      
      <main className="py-8">
        <ResponsiveLayoutErrorBoundary>
          {activeTab === 'dashboard' && (
            <StockDashboard />
          )}
          {activeTab === 'watchlists' && (
            <ResponsiveContainer variant="wide">
              <WatchlistManager useMockData={true} />
            </ResponsiveContainer>
          )}
          {activeTab === 'trades' && (
            <ResponsiveContainer variant="wide">
              <TradeTracker />
            </ResponsiveContainer>
          )}
          {activeTab === 'portfolio' && (
            <PortfolioManager />
          )}
        </ResponsiveLayoutErrorBoundary>
      </main>
      
      {/* Development Error Dashboard */}
      <DevErrorDashboard />
    </div>
  );
}
