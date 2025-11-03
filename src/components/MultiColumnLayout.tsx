import React from 'react';

interface MultiColumnLayoutProps {
  leftColumn: React.ReactNode;
  centerColumn: React.ReactNode;
  rightColumn?: React.ReactNode;
  sidebarWidth?: 'narrow' | 'medium' | 'wide';
  className?: string;
}

/**
 * MultiColumnLayout component provides a flexible three-column layout manager
 * with responsive sidebar visibility and configurable sidebar widths.
 * 
 * Features:
 * - Left sidebar hidden on mobile/tablet/desktop (< xl breakpoint)
 * - Right sidebar always visible
 * - Configurable sidebar widths
 * - Responsive gap spacing
 * - Proper flex behavior for content areas
 */
const MultiColumnLayout: React.FC<MultiColumnLayoutProps> = ({
  leftColumn,
  centerColumn,
  rightColumn,
  sidebarWidth = 'medium',
  className = ''
}) => {
  const sidebarWidths = {
    narrow: 'w-64',   // 256px
    medium: 'w-80',   // 320px
    wide: 'w-96'      // 384px
  };

  return (
    <div className={`flex gap-6 min-h-screen ${className}`}>
      {/* Left Sidebar - Hidden on mobile/tablet/desktop, visible on xl+ */}
      {leftColumn && (
        <aside className={`${sidebarWidths[sidebarWidth]} flex-shrink-0 hidden xl:block`}>
          <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {leftColumn}
          </div>
        </aside>
      )}
      
      {/* Main Content Area - Always visible, takes remaining space */}
      <main className="flex-1 min-w-0">
        {centerColumn}
      </main>
      
      {/* Right Sidebar - Always visible */}
      <aside className={`${sidebarWidths[sidebarWidth]} flex-shrink-0`}>
        <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {rightColumn}
        </div>
      </aside>
    </div>
  );
};

export default MultiColumnLayout;