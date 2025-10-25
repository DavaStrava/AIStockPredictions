'use client';

import React from 'react';
import { useContentSizeHints, useResponsiveTransition } from '@/hooks/useLayoutShiftPrevention';

/**
 * Configuration interface for responsive grid behavior
 */
export interface ResponsiveGridConfig {
  /** Minimum width for grid items before wrapping */
  minItemWidth?: string;
  /** Gap spacing between grid items */
  gap?: 'gap-2' | 'gap-4' | 'gap-6' | 'gap-8';
  /** Custom CSS classes to apply */
  className?: string;
  /** Column configuration for different breakpoints */
  columns?: {
    mobile?: number;    // < 768px
    tablet?: number;    // 768px - 1024px  
    desktop?: number;   // 1024px - 1440px
    large?: number;     // > 1440px
  };
}

/**
 * Props for the ResponsiveGrid component
 */
export interface ResponsiveGridProps extends ResponsiveGridConfig {
  children: React.ReactNode;
  /** Enable layout shift prevention during responsive transitions */
  preventLayoutShift?: boolean;
  /** Provide minimum height for grid items to prevent layout shift */
  itemMinHeight?: string;
}

/**
 * ResponsiveGrid component that provides a responsive grid layout
 * with configurable breakpoints, column progression (1→2→3→4→5),
 * and layout shift prevention
 * 
 * Features:
 * - Smooth transitions between breakpoints
 * - Layout shift prevention with proper sizing hints
 * - Configurable minimum item heights
 * - Responsive gap spacing
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  minItemWidth = '320px',
  gap = 'gap-6',
  className = '',
  columns = {
    mobile: 1,
    tablet: 2, 
    desktop: 3,
    large: 4
  },
  preventLayoutShift = true,
  itemMinHeight
}) => {
  const { isTransitioning, transitionClass } = useResponsiveTransition(300);
  const sizeHints = useContentSizeHints();
  // Generate responsive grid classes based on column configuration
  const generateGridClasses = () => {
    const baseClasses = ['grid'];
    
    // Mobile columns (default: 1)
    baseClasses.push(`grid-cols-${columns.mobile !== undefined ? columns.mobile : 1}`);
    
    // Tablet columns (md breakpoint: 768px+)
    if (columns.tablet !== undefined) {
      baseClasses.push(`md:grid-cols-${columns.tablet}`);
    }
    
    // Desktop columns (lg breakpoint: 1024px+)  
    if (columns.desktop !== undefined) {
      baseClasses.push(`lg:grid-cols-${columns.desktop}`);
    }
    
    // Large desktop columns (xl breakpoint: 1280px+)
    if (columns.large !== undefined) {
      baseClasses.push(`xl:grid-cols-${columns.large}`);
    } else if (columns.desktop !== undefined) {
      // If large is not specified but desktop is, use desktop value for xl
      baseClasses.push(`xl:grid-cols-${columns.desktop}`);
    }
    
    // Add 2xl breakpoint for very large screens (1536px+)
    const largeValue = columns.large !== undefined ? columns.large : columns.desktop;
    if (largeValue !== undefined && largeValue < 5) {
      baseClasses.push(`2xl:grid-cols-${Math.min(largeValue + 1, 5)}`);
    } else if (largeValue === 5) {
      baseClasses.push(`2xl:grid-cols-5`);
    }
    
    return baseClasses.join(' ');
  };

  const gridClasses = generateGridClasses();
  
  // Transition classes for smooth responsive changes
  const transitionClasses = preventLayoutShift 
    ? 'transition-all duration-300 ease-in-out'
    : '';
  
  // Calculate minimum height based on breakpoint if not provided
  const calculatedMinHeight = itemMinHeight || sizeHints.cardMinHeight;

  return (
    <div 
      className={`${gridClasses} ${gap} ${transitionClasses} ${transitionClass} ${className}`}
      style={{
        // Use CSS Grid with minmax for responsive behavior
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
        // Prevent layout shift by setting minimum height for grid items
        ...(preventLayoutShift && {
          '--grid-item-min-height': calculatedMinHeight,
        } as React.CSSProperties)
      }}
      data-transitioning={isTransitioning}
      data-testid="responsive-grid"
    >
      {children}
    </div>
  );
};

/**
 * Default export for convenience
 */
export default ResponsiveGrid;