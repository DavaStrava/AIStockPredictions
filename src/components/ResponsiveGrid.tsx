import React from 'react';

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
}

/**
 * ResponsiveGrid component that provides a responsive grid layout
 * with configurable breakpoints and column progression (1→2→3→4→5)
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
  }
}) => {
  // Generate responsive grid classes based on column configuration
  const generateGridClasses = () => {
    const baseClasses = ['grid'];
    
    // Mobile columns (default: 1)
    baseClasses.push(`grid-cols-${columns.mobile || 1}`);
    
    // Tablet columns (md breakpoint: 768px+)
    if (columns.tablet) {
      baseClasses.push(`md:grid-cols-${columns.tablet}`);
    }
    
    // Desktop columns (lg breakpoint: 1024px+)  
    if (columns.desktop) {
      baseClasses.push(`lg:grid-cols-${columns.desktop}`);
    }
    
    // Large desktop columns (xl breakpoint: 1280px+)
    if (columns.large) {
      baseClasses.push(`xl:grid-cols-${columns.large}`);
    }
    
    // Add 2xl breakpoint for very large screens (1536px+)
    if (columns.large && columns.large < 5) {
      baseClasses.push(`2xl:grid-cols-${Math.min(columns.large + 1, 5)}`);
    }
    
    return baseClasses.join(' ');
  };

  const gridClasses = generateGridClasses();

  return (
    <div 
      className={`${gridClasses} ${gap} ${className}`}
      style={{
        // Use CSS Grid with minmax for responsive behavior
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
      }}
    >
      {children}
    </div>
  );
};

/**
 * Default export for convenience
 */
export default ResponsiveGrid;