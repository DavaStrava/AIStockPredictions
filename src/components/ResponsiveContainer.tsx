import React from 'react';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  variant?: 'narrow' | 'wide' | 'full';
  className?: string;
}

/**
 * ResponsiveContainer provides dynamic width allocation based on screen size
 * Replaces fixed max-w-7xl containers with progressive width scaling
 */
const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  variant = 'wide',
  className = ''
}) => {
  // Start with the original working classes and enhance them
  const baseClasses = 'mx-auto px-4 sm:px-6 lg:px-8';
  
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
  
  return (
    <div className={`${baseClasses} ${widthClasses} ${className}`}>
      {children}
    </div>
  );
};

export default ResponsiveContainer;