'use client';

import React from 'react';
import MultiColumnLayout from './MultiColumnLayout';
import MarketIndicesSidebar from './MarketIndicesSidebar';
import AdditionalInsightsSidebar from './AdditionalInsightsSidebar';

interface MultiColumnLayoutExampleProps {
  children: React.ReactNode;
  onIndexClick: (symbol: string) => void;
}

/**
 * Example component demonstrating how to use MultiColumnLayout
 * with MarketIndicesSidebar and AdditionalInsightsSidebar.
 * 
 * This shows the integration pattern for the three-column layout:
 * - Left: Market indices (hidden on mobile/tablet)
 * - Center: Main content (always visible)
 * - Right: Additional insights (hidden on mobile/tablet/desktop)
 */
const MultiColumnLayoutExample: React.FC<MultiColumnLayoutExampleProps> = ({
  children,
  onIndexClick
}) => {
  return (
    <MultiColumnLayout
      leftColumn={
        <MarketIndicesSidebar onIndexClick={onIndexClick} />
      }
      centerColumn={children}
      rightColumn={
        <AdditionalInsightsSidebar />
      }
      sidebarWidth="medium"
    />
  );
};

export default MultiColumnLayoutExample;