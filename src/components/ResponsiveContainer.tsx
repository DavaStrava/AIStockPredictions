'use client';

import React from 'react';
import { useResponsiveTransition } from '@/hooks/useLayoutShiftPrevention';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  variant?: 'narrow' | 'wide' | 'full';
  className?: string;
  preventLayoutShift?: boolean;
}

/**
 * ResponsiveContainer provides dynamic width allocation based on screen size
 * with layout shift prevention during responsive transitions
 * 
 * Features:
 * - Progressive width scaling from mobile to large desktop
 * - Smooth transitions between breakpoints
 * - Layout shift prevention during responsive changes
 * - Proper sizing hints for dynamic content
 */
const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  variant = 'wide',
  className = '',
  preventLayoutShift = true
}) => {
  const { isTransitioning, transitionClass } = useResponsiveTransition(300);
  
  // Base classes for all variants
  const baseClasses = 'mx-auto px-4 sm:px-6 lg:px-8';
  
  // Width classes based on variant
  let widthClasses = '';
  switch (variant) {
    case 'narrow':
      widthClasses = 'max-w-4xl';
      break;
    case 'wide':
      widthClasses = 'max-w-7xl xl:max-w-none xl:px-12 2xl:px-16';
      break;
    case 'full':
      widthClasses = 'w-full xl:px-12 2xl:px-16';
      break;
    default:
      widthClasses = 'max-w-7xl xl:max-w-none xl:px-12 2xl:px-16';
  }
  
  // Transition classes for smooth responsive changes
  const transitionClasses = preventLayoutShift 
    ? 'transition-all duration-300 ease-in-out'
    : '';
  
  return (
    <div 
      className={`${baseClasses} ${widthClasses} ${transitionClasses} ${transitionClass} ${className}`}
      data-transitioning={isTransitioning}
    >
      {children}
    </div>
  );
};

export default ResponsiveContainer;