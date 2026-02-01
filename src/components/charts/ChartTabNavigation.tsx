/**
 * ChartTabNavigation Component
 *
 * Tab navigation for switching between chart types.
 */
'use client';

import { ChartTabNavigationProps } from '@/types/components';

export function ChartTabNavigation({ tabs, activeTab, onTabChange }: ChartTabNavigationProps) {
  return (
    <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === tab.id
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
