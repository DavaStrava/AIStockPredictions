import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MultiColumnLayout from '../MultiColumnLayout';

describe('MultiColumnLayout', () => {
  const defaultProps = {
    leftColumn: <div data-testid="left-column">Left Content</div>,
    centerColumn: <div data-testid="center-column">Center Content</div>,
    rightColumn: <div data-testid="right-column">Right Content</div>
  };

  describe('Basic Rendering', () => {
    it('renders all three columns when provided', () => {
      render(<MultiColumnLayout {...defaultProps} />);
      
      expect(screen.getByTestId('left-column')).toBeInTheDocument();
      expect(screen.getByTestId('center-column')).toBeInTheDocument();
      expect(screen.getByTestId('right-column')).toBeInTheDocument();
    });

    it('renders center column as main element', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toContainElement(screen.getByTestId('center-column'));
    });

    it('renders left and right columns as aside elements', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const asideElements = container.querySelectorAll('aside');
      expect(asideElements).toHaveLength(2);
    });

    it('applies base flex layout classes', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'gap-6', 'min-h-screen');
    });
  });

  describe('Left Sidebar Visibility - NEW BEHAVIOR', () => {
    it('applies hidden xl:block classes to left sidebar', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      expect(leftSidebar).toHaveClass('hidden');
      expect(leftSidebar).toHaveClass('xl:block');
    });

    it('does not render left sidebar when leftColumn is null', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={null}
          centerColumn={<div>Center</div>}
          rightColumn={<div>Right</div>}
        />
      );
      
      const asideElements = container.querySelectorAll('aside');
      // Should only have right sidebar
      expect(asideElements).toHaveLength(1);
      expect(screen.queryByTestId('left-column')).not.toBeInTheDocument();
    });

    it('does not render left sidebar when leftColumn is undefined', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={undefined}
          centerColumn={<div>Center</div>}
          rightColumn={<div>Right</div>}
        />
      );
      
      const asideElements = container.querySelectorAll('aside');
      // Should only have right sidebar
      expect(asideElements).toHaveLength(1);
    });

    it('renders left sidebar when leftColumn is provided (even if empty)', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div data-testid="empty-left"></div>}
          centerColumn={<div>Center</div>}
          rightColumn={<div>Right</div>}
        />
      );
      
      const asideElements = container.querySelectorAll('aside');
      expect(asideElements).toHaveLength(2);
      expect(screen.getByTestId('empty-left')).toBeInTheDocument();
    });

    it('applies correct responsive classes for xl breakpoint visibility', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      const classList = Array.from(leftSidebar?.classList || []);
      
      // Should be hidden by default and visible on xl+
      expect(classList).toContain('hidden');
      expect(classList).toContain('xl:block');
      
      // Should NOT have lg:block (old behavior)
      expect(classList).not.toContain('lg:block');
    });
  });

  describe('Right Sidebar Visibility - NEW BEHAVIOR', () => {
    it('does not apply hidden classes to right sidebar', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const rightSidebar = container.querySelector('aside:last-of-type');
      expect(rightSidebar).not.toHaveClass('hidden');
      expect(rightSidebar).not.toHaveClass('xl:block');
    });

    it('renders right sidebar without conditional rendering', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const rightSidebar = container.querySelector('aside:last-of-type');
      expect(rightSidebar).toBeInTheDocument();
      expect(screen.getByTestId('right-column')).toBeInTheDocument();
    });

    it('always renders right sidebar even when rightColumn is undefined', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
          rightColumn={undefined}
        />
      );
      
      // Right sidebar should still be rendered (even with undefined content)
      const asideElements = container.querySelectorAll('aside');
      expect(asideElements).toHaveLength(2); // Left and Right
    });

    it('always renders right sidebar even when rightColumn is null', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
          rightColumn={null}
        />
      );
      
      // Right sidebar should still be rendered (even with null content)
      const asideElements = container.querySelectorAll('aside');
      expect(asideElements).toHaveLength(2); // Left and Right
    });

    it('applies correct classes for always-visible behavior', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const rightSidebar = container.querySelector('aside:last-of-type');
      const classList = Array.from(rightSidebar?.classList || []);
      
      // Should NOT have hidden or responsive visibility classes
      expect(classList).not.toContain('hidden');
      expect(classList).not.toContain('xl:block');
      expect(classList).not.toContain('lg:block');
      expect(classList).not.toContain('md:block');
    });
  });

  describe('Center Column Behavior', () => {
    it('always renders center column', () => {
      render(<MultiColumnLayout {...defaultProps} />);
      
      expect(screen.getByTestId('center-column')).toBeInTheDocument();
    });

    it('applies flex-1 and min-w-0 classes to main element', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('flex-1', 'min-w-0');
    });

    it('renders center column without conditional logic', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={null}
          centerColumn={<div data-testid="center">Center</div>}
          rightColumn={null}
        />
      );
      
      expect(screen.getByTestId('center')).toBeInTheDocument();
      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
    });
  });

  describe('Sidebar Width Configuration', () => {
    it('applies narrow width class when specified', () => {
      const { container } = render(
        <MultiColumnLayout {...defaultProps} sidebarWidth="narrow" />
      );
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      const rightSidebar = container.querySelector('aside:last-of-type');
      
      expect(leftSidebar).toHaveClass('w-64');
      expect(rightSidebar).toHaveClass('w-64');
    });

    it('applies medium width class by default', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      const rightSidebar = container.querySelector('aside:last-of-type');
      
      expect(leftSidebar).toHaveClass('w-80');
      expect(rightSidebar).toHaveClass('w-80');
    });

    it('applies wide width class when specified', () => {
      const { container } = render(
        <MultiColumnLayout {...defaultProps} sidebarWidth="wide" />
      );
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      const rightSidebar = container.querySelector('aside:last-of-type');
      
      expect(leftSidebar).toHaveClass('w-96');
      expect(rightSidebar).toHaveClass('w-96');
    });

    it('applies same width to both sidebars', () => {
      const widths: Array<'narrow' | 'medium' | 'wide'> = ['narrow', 'medium', 'wide'];
      const expectedClasses = {
        narrow: 'w-64',
        medium: 'w-80',
        wide: 'w-96'
      };

      widths.forEach(width => {
        const { container } = render(
          <MultiColumnLayout {...defaultProps} sidebarWidth={width} />
        );
        
        const leftSidebar = container.querySelector('aside:first-of-type');
        const rightSidebar = container.querySelector('aside:last-of-type');
        
        expect(leftSidebar).toHaveClass(expectedClasses[width]);
        expect(rightSidebar).toHaveClass(expectedClasses[width]);
      });
    });
  });

  describe('Sticky Positioning and Scrolling', () => {
    it('applies sticky positioning to left sidebar content', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      const stickyContainer = leftSidebar?.querySelector('div');
      
      expect(stickyContainer).toHaveClass('sticky', 'top-8');
    });

    it('applies sticky positioning to right sidebar content', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const rightSidebar = container.querySelector('aside:last-of-type');
      const stickyContainer = rightSidebar?.querySelector('div');
      
      expect(stickyContainer).toHaveClass('sticky', 'top-8');
    });

    it('applies max-height and overflow-y-auto to sidebar containers', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      const rightSidebar = container.querySelector('aside:last-of-type');
      
      const leftContainer = leftSidebar?.querySelector('div');
      const rightContainer = rightSidebar?.querySelector('div');
      
      expect(leftContainer).toHaveClass('max-h-[calc(100vh-4rem)]', 'overflow-y-auto');
      expect(rightContainer).toHaveClass('max-h-[calc(100vh-4rem)]', 'overflow-y-auto');
    });
  });

  describe('Flex Behavior', () => {
    it('applies flex-shrink-0 to left sidebar', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      expect(leftSidebar).toHaveClass('flex-shrink-0');
    });

    it('applies flex-shrink-0 to right sidebar', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const rightSidebar = container.querySelector('aside:last-of-type');
      expect(rightSidebar).toHaveClass('flex-shrink-0');
    });

    it('applies flex-1 to main content area', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('flex-1');
    });

    it('applies min-w-0 to main content to prevent overflow', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('min-w-0');
    });
  });

  describe('Custom ClassName Support', () => {
    it('applies custom className to wrapper', () => {
      const { container } = render(
        <MultiColumnLayout {...defaultProps} className="custom-class" />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });

    it('preserves base classes when custom className is provided', () => {
      const { container } = render(
        <MultiColumnLayout {...defaultProps} className="custom-class" />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'gap-6', 'min-h-screen', 'custom-class');
    });

    it('handles empty className gracefully', () => {
      const { container } = render(
        <MultiColumnLayout {...defaultProps} className="" />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'gap-6', 'min-h-screen');
    });

    it('handles multiple custom classes', () => {
      const { container } = render(
        <MultiColumnLayout {...defaultProps} className="class-1 class-2 class-3" />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('class-1', 'class-2', 'class-3');
    });
  });

  describe('Complex Content Handling', () => {
    it('handles complex nested content in left column', () => {
      const complexContent = (
        <div data-testid="complex-left">
          <header>Header</header>
          <nav>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </nav>
        </div>
      );

      render(
        <MultiColumnLayout
          leftColumn={complexContent}
          centerColumn={<div>Center</div>}
          rightColumn={<div>Right</div>}
        />
      );

      expect(screen.getByTestId('complex-left')).toBeInTheDocument();
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('handles complex nested content in right column', () => {
      const complexContent = (
        <div data-testid="complex-right">
          <section>
            <h2>Section Title</h2>
            <p>Section content</p>
          </section>
        </div>
      );

      render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
          rightColumn={complexContent}
        />
      );

      expect(screen.getByTestId('complex-right')).toBeInTheDocument();
      expect(screen.getByText('Section Title')).toBeInTheDocument();
      expect(screen.getByText('Section content')).toBeInTheDocument();
    });

    it('handles React fragments as column content', () => {
      render(
        <MultiColumnLayout
          leftColumn={
            <>
              <div data-testid="fragment-1">Fragment 1</div>
              <div data-testid="fragment-2">Fragment 2</div>
            </>
          }
          centerColumn={<div>Center</div>}
          rightColumn={<div>Right</div>}
        />
      );

      expect(screen.getByTestId('fragment-1')).toBeInTheDocument();
      expect(screen.getByTestId('fragment-2')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles all columns with null content', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={null}
          centerColumn={null}
          rightColumn={null}
        />
      );

      // Should still render structure
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('flex');
    });

    it('handles only center column provided', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={null}
          centerColumn={<div data-testid="only-center">Only Center</div>}
          rightColumn={null}
        />
      );

      expect(screen.getByTestId('only-center')).toBeInTheDocument();
      
      // Should have only one aside (right sidebar always renders)
      const asideElements = container.querySelectorAll('aside');
      expect(asideElements).toHaveLength(1);
    });

    it('handles empty string as column content', () => {
      render(
        <MultiColumnLayout
          leftColumn=""
          centerColumn=""
          rightColumn=""
        />
      );

      // Should render without errors
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles very long content in sidebars', () => {
      const longContent = Array.from({ length: 100 }, (_, i) => (
        <div key={i}>Item {i}</div>
      ));

      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div data-testid="long-left">{longContent}</div>}
          centerColumn={<div>Center</div>}
          rightColumn={<div data-testid="long-right">{longContent}</div>}
        />
      );

      expect(screen.getByTestId('long-left')).toBeInTheDocument();
      expect(screen.getByTestId('long-right')).toBeInTheDocument();
      
      // Verify overflow-y-auto is applied for scrolling
      const leftSidebar = container.querySelector('aside:first-of-type div');
      const rightSidebar = container.querySelector('aside:last-of-type div');
      
      expect(leftSidebar).toHaveClass('overflow-y-auto');
      expect(rightSidebar).toHaveClass('overflow-y-auto');
    });
  });

  describe('Regression Tests - Visibility Changes', () => {
    it('REGRESSION: left sidebar should be hidden on lg breakpoint (not visible)', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      const classList = Array.from(leftSidebar?.classList || []);
      
      // Should NOT have lg:block (old behavior)
      expect(classList).not.toContain('lg:block');
      
      // Should have xl:block (new behavior)
      expect(classList).toContain('xl:block');
    });

    it('REGRESSION: right sidebar should not have xl:block class (always visible)', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const rightSidebar = container.querySelector('aside:last-of-type');
      const classList = Array.from(rightSidebar?.classList || []);
      
      // Should NOT have xl:block (old behavior)
      expect(classList).not.toContain('xl:block');
      
      // Should NOT have hidden class
      expect(classList).not.toContain('hidden');
    });

    it('REGRESSION: left sidebar should have conditional rendering', () => {
      const { container: withLeft } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
          rightColumn={<div>Right</div>}
        />
      );

      const { container: withoutLeft } = render(
        <MultiColumnLayout
          leftColumn={null}
          centerColumn={<div>Center</div>}
          rightColumn={<div>Right</div>}
        />
      );

      // With left column: should have 2 asides
      expect(withLeft.querySelectorAll('aside')).toHaveLength(2);

      // Without left column: should have 1 aside (right only)
      expect(withoutLeft.querySelectorAll('aside')).toHaveLength(1);
    });

    it('REGRESSION: right sidebar should not have conditional rendering', () => {
      const { container: withRight } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
          rightColumn={<div>Right</div>}
        />
      );

      const { container: withoutRight } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
          rightColumn={null}
        />
      );

      // Both should have 2 asides (right sidebar always renders)
      expect(withRight.querySelectorAll('aside')).toHaveLength(2);
      expect(withoutRight.querySelectorAll('aside')).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('uses semantic HTML elements', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      expect(container.querySelector('main')).toBeInTheDocument();
      expect(container.querySelectorAll('aside')).toHaveLength(2);
    });

    it('maintains proper document structure', () => {
      const { container } = render(<MultiColumnLayout {...defaultProps} />);
      
      const wrapper = container.firstChild as HTMLElement;
      const main = wrapper.querySelector('main');
      const asides = wrapper.querySelectorAll('aside');
      
      expect(wrapper.contains(main!)).toBe(true);
      asides.forEach(aside => {
        expect(wrapper.contains(aside)).toBe(true);
      });
    });
  });
});
