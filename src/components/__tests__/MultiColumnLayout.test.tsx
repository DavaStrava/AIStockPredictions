import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MultiColumnLayout from '../MultiColumnLayout';

describe('MultiColumnLayout Component', () => {
  const defaultProps = {
    leftColumn: <div data-testid="left-content">Left Sidebar Content</div>,
    centerColumn: <div data-testid="center-content">Main Content Area</div>,
    rightColumn: <div data-testid="right-content">Right Sidebar Content</div>
  };

  describe('Basic Layout Structure', () => {
    it('should render three-column layout with all sections', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      // Check for the main container
      const layout = container.firstChild as HTMLElement;
      expect(layout).toBeInTheDocument();
      expect(layout).toHaveClass('flex', 'gap-6', 'min-h-screen');
      
      // Check for all content
      expect(screen.getByTestId('left-content')).toBeInTheDocument();
      expect(screen.getByTestId('center-content')).toBeInTheDocument();
      expect(screen.getByTestId('right-content')).toBeInTheDocument();
    });

    it('should render two-column layout when right column is not provided', () => {
      const { container } = render(
        <MultiColumnLayout 
          leftColumn={defaultProps.leftColumn}
          centerColumn={defaultProps.centerColumn}
        />
      );
      
      expect(screen.getByTestId('left-content')).toBeInTheDocument();
      expect(screen.getByTestId('center-content')).toBeInTheDocument();
      expect(screen.queryByTestId('right-content')).not.toBeInTheDocument();
      
      // Should only have 1 aside element (left sidebar only)
      const asides = container.querySelectorAll('aside');
      expect(asides.length).toBe(1);
    });

    it('should apply correct flexbox layout classes', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('flex', 'gap-6', 'min-h-screen');
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      // Left sidebar is now always visible (no hidden/lg:block classes)
      expect(leftSidebar).toHaveClass('flex-shrink-0');
      expect(leftSidebar).not.toHaveClass('hidden');
      expect(leftSidebar).not.toHaveClass('lg:block');
      
      const mainContent = container.querySelector('main');
      expect(mainContent).toHaveClass('flex-1', 'min-w-0');
      
      const rightSidebar = container.querySelector('aside:last-of-type');
      expect(rightSidebar).toHaveClass('w-80', 'flex-shrink-0', 'hidden', 'xl:block');
    });
  });

  describe('Sidebar Width Configuration', () => {
    it('should apply narrow sidebar width correctly', () => {
      const { container } = render(
        <MultiColumnLayout 
          {...defaultProps}
          sidebarWidth="narrow"
        />
      );
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      expect(leftSidebar).toHaveClass('w-64');
    });

    it('should apply medium sidebar width by default', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      expect(leftSidebar).toHaveClass('w-80');
    });

    it('should apply wide sidebar width correctly', () => {
      const { container } = render(
        <MultiColumnLayout 
          {...defaultProps}
          sidebarWidth="wide"
        />
      );
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      expect(leftSidebar).toHaveClass('w-96');
    });

    it('should handle invalid sidebar width gracefully', () => {
      const { container } = render(
        <MultiColumnLayout 
          {...defaultProps}
          sidebarWidth={'invalid' as any}
        />
      );
      
      // Should still render without errors
      const leftSidebar = container.querySelector('aside:first-of-type');
      expect(leftSidebar).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should keep left sidebar always visible (no responsive hiding)', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      // Left sidebar is now always visible - no hidden or responsive classes
      expect(leftSidebar).not.toHaveClass('hidden');
      expect(leftSidebar).not.toHaveClass('lg:block');
      expect(leftSidebar).toHaveClass('flex-shrink-0');
    });

    it('should hide right sidebar on smaller screens', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const rightSidebar = container.querySelector('aside:last-of-type');
      expect(rightSidebar).toHaveClass('hidden', 'xl:block');
    });

    it('should maintain main content visibility across all screen sizes', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const mainContent = container.querySelector('main');
      expect(mainContent).not.toHaveClass('hidden');
      expect(mainContent).toHaveClass('flex-1');
    });

    it('should apply correct width classes to left sidebar based on sidebarWidth prop', () => {
      const widthTests = [
        { width: 'narrow' as const, expectedClass: 'w-64' },
        { width: 'medium' as const, expectedClass: 'w-80' },
        { width: 'wide' as const, expectedClass: 'w-96' }
      ];

      widthTests.forEach(({ width, expectedClass }) => {
        const { container } = render(
          <MultiColumnLayout 
            {...defaultProps}
            sidebarWidth={width}
          />
        );
        
        const leftSidebar = container.querySelector('aside:first-of-type');
        expect(leftSidebar).toHaveClass(expectedClass);
      });
    });
  });

  describe('Content Rendering', () => {
    it('should render complex content in left sidebar', () => {
      const complexLeftContent = (
        <div data-testid="complex-left">
          <nav>
            <ul>
              <li><a href="#1">Navigation Item 1</a></li>
              <li><a href="#2">Navigation Item 2</a></li>
            </ul>
          </nav>
          <section>
            <h2>Sidebar Section</h2>
            <p>Complex sidebar content</p>
          </section>
        </div>
      );

      render(
        <MultiColumnLayout 
          leftColumn={complexLeftContent}
          centerColumn={defaultProps.centerColumn}
        />
      );
      
      expect(screen.getByTestId('complex-left')).toBeInTheDocument();
      expect(screen.getByText('Navigation Item 1')).toBeInTheDocument();
      expect(screen.getByText('Sidebar Section')).toBeInTheDocument();
    });

    it('should render interactive content in main area', () => {
      const interactiveContent = (
        <div data-testid="interactive-main">
          <header>
            <h1>Main Content Header</h1>
            <button data-testid="main-button">Action Button</button>
          </header>
          <main>
            <form data-testid="main-form">
              <input type="text" placeholder="Search..." />
              <button type="submit">Submit</button>
            </form>
          </main>
        </div>
      );

      render(
        <MultiColumnLayout 
          leftColumn={defaultProps.leftColumn}
          centerColumn={interactiveContent}
        />
      );
      
      expect(screen.getByTestId('interactive-main')).toBeInTheDocument();
      expect(screen.getByTestId('main-button')).toBeInTheDocument();
      expect(screen.getByTestId('main-form')).toBeInTheDocument();
      
      // Test interactivity
      const button = screen.getByTestId('main-button');
      fireEvent.click(button);
      expect(button).toBeInTheDocument(); // Should remain functional
    });

    it('should render optional right sidebar content', () => {
      const rightSidebarContent = (
        <div data-testid="right-sidebar-content">
          <aside>
            <h3>Additional Information</h3>
            <ul>
              <li>Info Item 1</li>
              <li>Info Item 2</li>
            </ul>
          </aside>
          <div>
            <button data-testid="right-action">Right Action</button>
          </div>
        </div>
      );

      render(
        <MultiColumnLayout 
          leftColumn={defaultProps.leftColumn}
          centerColumn={defaultProps.centerColumn}
          rightColumn={rightSidebarContent}
        />
      );
      
      expect(screen.getByTestId('right-sidebar-content')).toBeInTheDocument();
      expect(screen.getByText('Additional Information')).toBeInTheDocument();
      expect(screen.getByTestId('right-action')).toBeInTheDocument();
    });
  });

  describe('Layout Flexibility', () => {
    it('should handle empty content gracefully', () => {
      const { container } = render(
        <MultiColumnLayout 
          leftColumn={null}
          centerColumn={<div>Only Center</div>}
          rightColumn={undefined}
        />
      );
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      const mainContent = container.querySelector('main');
      expect(leftSidebar).toBeInTheDocument();
      expect(mainContent).toBeInTheDocument();
      expect(screen.queryByTestId('right-content')).not.toBeInTheDocument();
      expect(screen.getByText('Only Center')).toBeInTheDocument();
    });

    it('should handle dynamic content changes', () => {
      const DynamicContent = ({ showExtra }: { showExtra: boolean }) => (
        <div>
          <p>Base Content</p>
          {showExtra && <p data-testid="extra-content">Extra Content</p>}
        </div>
      );

      const { rerender } = render(
        <MultiColumnLayout 
          leftColumn={defaultProps.leftColumn}
          centerColumn={<DynamicContent showExtra={false} />}
        />
      );
      
      expect(screen.queryByTestId('extra-content')).not.toBeInTheDocument();
      
      rerender(
        <MultiColumnLayout 
          leftColumn={defaultProps.leftColumn}
          centerColumn={<DynamicContent showExtra={true} />}
        />
      );
      
      expect(screen.getByTestId('extra-content')).toBeInTheDocument();
    });

    it('should maintain layout proportions with varying content sizes', () => {
      const shortContent = <div>Short</div>;
      const longContent = (
        <div>
          {Array.from({ length: 50 }, (_, i) => (
            <p key={i}>Long content paragraph {i + 1}</p>
          ))}
        </div>
      );

      const { rerender, container } = render(
        <MultiColumnLayout 
          leftColumn={shortContent}
          centerColumn={shortContent}
          rightColumn={shortContent}
        />
      );
      
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('flex');
      
      rerender(
        <MultiColumnLayout 
          leftColumn={longContent}
          centerColumn={longContent}
          rightColumn={longContent}
        />
      );
      
      // Layout should maintain structure with long content
      expect(layout).toHaveClass('flex');
      const leftSidebar = container.querySelector('aside:first-of-type');
      const mainContent = container.querySelector('main');
      const rightSidebar = container.querySelector('aside:last-of-type');
      expect(leftSidebar).toBeInTheDocument();
      expect(mainContent).toBeInTheDocument();
      expect(rightSidebar).toBeInTheDocument();
    });
  });

  describe('Accessibility and Semantics', () => {
    it('should use proper semantic HTML elements', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      // Should use semantic HTML elements
      const leftSidebar = container.querySelector('aside:first-of-type');
      const mainContent = container.querySelector('main');
      const rightSidebar = container.querySelector('aside:last-of-type');
      
      expect(leftSidebar?.tagName).toBe('ASIDE');
      expect(mainContent?.tagName).toBe('MAIN');
      expect(rightSidebar?.tagName).toBe('ASIDE');
    });

    it('should maintain focus management across columns', () => {
      const FocusableContent = ({ id }: { id: string }) => (
        <div>
          <button data-testid={`button-${id}`}>Button {id}</button>
          <input data-testid={`input-${id}`} placeholder={`Input ${id}`} />
        </div>
      );

      render(
        <MultiColumnLayout 
          leftColumn={<FocusableContent id="left" />}
          centerColumn={<FocusableContent id="center" />}
          rightColumn={<FocusableContent id="right" />}
        />
      );
      
      // Test focus navigation
      const leftButton = screen.getByTestId('button-left');
      const centerButton = screen.getByTestId('button-center');
      const rightButton = screen.getByTestId('button-right');
      
      leftButton.focus();
      expect(document.activeElement).toBe(leftButton);
      
      centerButton.focus();
      expect(document.activeElement).toBe(centerButton);
      
      rightButton.focus();
      expect(document.activeElement).toBe(rightButton);
    });

    it('should support keyboard navigation', () => {
      const KeyboardContent = () => (
        <div>
          <button 
            data-testid="keyboard-button"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.setAttribute('data-activated', 'true');
              }
            }}
          >
            Keyboard Button
          </button>
        </div>
      );

      render(
        <MultiColumnLayout 
          leftColumn={<KeyboardContent />}
          centerColumn={defaultProps.centerColumn}
        />
      );
      
      const button = screen.getByTestId('keyboard-button');
      button.focus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(button).toHaveAttribute('data-activated', 'true');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle rapid layout changes efficiently', () => {
      const { rerender, container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const startTime = performance.now();
      
      // Rapid layout changes
      for (let i = 0; i < 10; i++) {
        rerender(
          <MultiColumnLayout 
            leftColumn={<div>Left {i}</div>}
            centerColumn={<div>Center {i}</div>}
            rightColumn={i % 2 === 0 ? <div>Right {i}</div> : undefined}
            sidebarWidth={i % 3 === 0 ? 'narrow' : i % 3 === 1 ? 'medium' : 'wide'}
          />
        );
      }
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(100); // Should be performant
      const layout = container.firstChild as HTMLElement;
      expect(layout).toBeInTheDocument();
    });

    it('should handle component unmounting gracefully', () => {
      const { unmount } = render(<MultiColumnLayout {...defaultProps} />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('should handle error boundaries in individual columns', () => {
      const ErrorThrowingComponent = () => {
        throw new Error('Column error');
      };

      // Test that errors in one column don't break the entire layout
      expect(() => {
        render(
          <MultiColumnLayout 
            leftColumn={<ErrorThrowingComponent />}
            centerColumn={defaultProps.centerColumn}
            rightColumn={defaultProps.rightColumn}
          />
        );
      }).toThrow('Column error');
    });

    it('should maintain layout integrity with CSS conflicts', () => {
      const ConflictingContent = () => (
        <div 
          style={{ 
            position: 'absolute', 
            zIndex: 9999,
            width: '200vw' // Intentionally problematic CSS
          }}
          data-testid="conflicting-content"
        >
          Conflicting Content
        </div>
      );

      const { container } = render(
        <MultiColumnLayout 
          leftColumn={<ConflictingContent />}
          centerColumn={defaultProps.centerColumn}
        />
      );
      
      // Layout should still be present despite CSS conflicts
      const layout = container.firstChild as HTMLElement;
      expect(layout).toBeInTheDocument();
      expect(screen.getByTestId('conflicting-content')).toBeInTheDocument();
    });
  });

  describe('Sticky Positioning', () => {
    it('should apply sticky positioning to left sidebar content', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const leftSidebar = container.querySelector('aside:first-of-type > div');
      expect(leftSidebar).toHaveClass('sticky', 'top-8');
      expect(leftSidebar).toHaveClass('max-h-[calc(100vh-4rem)]', 'overflow-y-auto');
    });

    it('should apply sticky positioning to right sidebar content', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const rightSidebar = container.querySelector('aside:last-of-type > div');
      expect(rightSidebar).toHaveClass('sticky', 'top-8');
      expect(rightSidebar).toHaveClass('max-h-[calc(100vh-4rem)]', 'overflow-y-auto');
    });

    it('should not apply sticky positioning to main content', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const mainContent = container.querySelector('main');
      expect(mainContent).not.toHaveClass('sticky');
    });

    it('should wrap sidebar content in sticky container', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      const stickyWrapper = leftSidebar?.querySelector('div');
      
      expect(stickyWrapper).toBeInTheDocument();
      expect(stickyWrapper).toHaveClass('sticky');
      expect(leftSidebar?.children.length).toBe(1); // Only one child (the sticky wrapper)
    });

    it('should apply consistent sticky positioning to both sidebars', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const leftSidebarSticky = container.querySelector('aside:first-of-type > div');
      const rightSidebarSticky = container.querySelector('aside:last-of-type > div');
      
      // Both should have identical sticky positioning classes
      expect(leftSidebarSticky?.className).toContain('sticky top-8');
      expect(rightSidebarSticky?.className).toContain('sticky top-8');
      expect(leftSidebarSticky?.className).toContain('max-h-[calc(100vh-4rem)]');
      expect(rightSidebarSticky?.className).toContain('max-h-[calc(100vh-4rem)]');
    });

    it('should enable vertical scrolling for sidebar content that exceeds max height', () => {
      const tallContent = (
        <div data-testid="tall-content">
          {Array.from({ length: 100 }, (_, i) => (
            <p key={i}>Sidebar item {i + 1}</p>
          ))}
        </div>
      );

      const { container } = render(
        <MultiColumnLayout 
          leftColumn={tallContent}
          centerColumn={defaultProps.centerColumn}
        />
      );
      
      const leftSidebarSticky = container.querySelector('aside:first-of-type > div');
      expect(leftSidebarSticky).toHaveClass('overflow-y-auto');
      expect(screen.getByTestId('tall-content')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className to layout container', () => {
      const { container } = render(
        <MultiColumnLayout 
          {...defaultProps}
          className="custom-layout-class"
        />
      );
      
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('custom-layout-class');
      expect(layout).toHaveClass('flex', 'gap-6', 'min-h-screen'); // Should still have base classes
    });

    it('should handle multiple custom classes', () => {
      const { container } = render(
        <MultiColumnLayout 
          {...defaultProps}
          className="custom-class-1 custom-class-2 bg-gray-100"
        />
      );
      
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('custom-class-1', 'custom-class-2', 'bg-gray-100');
    });

    it('should work without custom className', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const layout = container.firstChild as HTMLElement;
      expect(layout).toHaveClass('flex', 'gap-6', 'min-h-screen');
    });
  });

  describe('Integration with Responsive Components', () => {
    it('should work with ResponsiveGrid in main content', () => {
      const GridContent = () => (
        <div data-testid="grid-content" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>Grid Item 1</div>
          <div>Grid Item 2</div>
          <div>Grid Item 3</div>
        </div>
      );

      render(
        <MultiColumnLayout 
          leftColumn={defaultProps.leftColumn}
          centerColumn={<GridContent />}
        />
      );
      
      expect(screen.getByTestId('grid-content')).toBeInTheDocument();
      expect(screen.getByText('Grid Item 1')).toBeInTheDocument();
      expect(screen.getByText('Grid Item 2')).toBeInTheDocument();
      expect(screen.getByText('Grid Item 3')).toBeInTheDocument();
    });

    it('should integrate with collapsible sections', () => {
      const CollapsibleContent = () => {
        const [expanded, setExpanded] = React.useState(false);
        
        return (
          <div data-testid="collapsible-content">
            <button 
              onClick={() => setExpanded(!expanded)}
              data-testid="toggle-button"
            >
              Toggle Section
            </button>
            {expanded && (
              <div data-testid="expanded-content">
                Expanded Content
              </div>
            )}
          </div>
        );
      };

      render(
        <MultiColumnLayout 
          leftColumn={<CollapsibleContent />}
          centerColumn={defaultProps.centerColumn}
        />
      );
      
      expect(screen.getByTestId('collapsible-content')).toBeInTheDocument();
      expect(screen.queryByTestId('expanded-content')).not.toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('toggle-button'));
      expect(screen.getByTestId('expanded-content')).toBeInTheDocument();
    });
  });
});