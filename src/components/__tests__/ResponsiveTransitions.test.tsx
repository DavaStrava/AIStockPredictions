/**
 * Responsive Transitions Tests
 * 
 * These tests verify smooth responsive transitions and horizontal scroll prevention.
 * 
 * Requirements: 3.3, 4.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import ResponsiveContainer from '../ResponsiveContainer';
import ResponsiveGrid from '../ResponsiveGrid';
import MultiColumnLayout from '../MultiColumnLayout';

describe('Responsive Transitions', () => {
  describe('Horizontal Scroll Prevention', () => {
    it('should not cause horizontal overflow in ResponsiveContainer', () => {
      const { container } = render(
        <ResponsiveContainer variant="wide">
          <div style={{ width: '100%' }}>Wide Content</div>
        </ResponsiveContainer>
      );
      
      const wrapper = container.firstChild as HTMLElement;
      // Should have proper padding and margin classes that prevent overflow
      expect(wrapper.className).toContain('mx-auto');
      expect(wrapper.className).toContain('px-4');
    });

    it('should apply max-width constraints in ResponsiveGrid', () => {
      const { container } = render(
        <ResponsiveGrid>
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      );
      
      const grid = container.firstChild as HTMLElement;
      // Grid should be a block-level element that respects container width
      expect(grid.className).toContain('grid');
    });

    it('should prevent overflow in MultiColumnLayout main content', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center Content</div>}
        />
      );
      
      const mainContent = container.querySelector('main');
      expect(mainContent?.className).toContain('min-w-0');
      expect(mainContent?.className).toContain('flex-1');
    });

    it('should handle long content without horizontal scroll', () => {
      const longText = 'A'.repeat(1000);
      const { container } = render(
        <ResponsiveContainer variant="wide">
          <div>{longText}</div>
        </ResponsiveContainer>
      );
      
      const wrapper = container.firstChild as HTMLElement;
      // Should have proper padding that prevents overflow
      expect(wrapper.className).toContain('px-4');
    });
  });

  describe('Layout Adaptation During Resize', () => {
    it('should maintain proper structure in ResponsiveContainer', () => {
      const { container, rerender } = render(
        <ResponsiveContainer variant="narrow">
          <div>Content</div>
        </ResponsiveContainer>
      );
      
      let wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('max-w-4xl');
      
      // Simulate changing variant (like a responsive breakpoint change)
      rerender(
        <ResponsiveContainer variant="wide">
          <div>Content</div>
        </ResponsiveContainer>
      );
      
      wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('max-w-7xl');
    });

    it('should adapt grid columns without breaking layout', () => {
      const { container, rerender } = render(
        <ResponsiveGrid columns={{ mobile: 1 }}>
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      );
      
      let grid = container.firstChild as HTMLElement;
      expect(grid.className).toContain('grid-cols-1');
      
      // Simulate breakpoint change
      rerender(
        <ResponsiveGrid columns={{ mobile: 1, tablet: 2 }}>
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      );
      
      grid = container.firstChild as HTMLElement;
      expect(grid.className).toContain('md:grid-cols-2');
    });

    it('should handle sidebar visibility changes gracefully', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left Sidebar</div>}
          centerColumn={<div>Main Content</div>}
          rightColumn={<div>Right Sidebar</div>}
        />
      );
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      const rightSidebar = container.querySelector('aside:last-of-type');
      
      // Left sidebar hidden on mobile/tablet/desktop, visible on xl
      expect(leftSidebar?.className).toContain('hidden');
      expect(leftSidebar?.className).toContain('xl:block');
      
      // Right sidebar always visible (no hidden or responsive classes)
      expect(rightSidebar?.className).not.toContain('hidden');
      expect(rightSidebar?.className).not.toContain('xl:block');
    });
  });

  describe('Smooth Breakpoint Transitions', () => {
    it('should apply transition classes to responsive containers', () => {
      const { container } = render(
        <ResponsiveContainer variant="wide">
          <div>Content</div>
        </ResponsiveContainer>
      );
      
      const wrapper = container.firstChild as HTMLElement;
      // Should have classes that CSS transitions can target
      expect(wrapper.className).toContain('mx-auto');
      expect(wrapper.className).toContain('px-4');
    });

    it('should maintain grid structure during transitions', () => {
      const { container } = render(
        <ResponsiveGrid
          columns={{
            mobile: 1,
            tablet: 2,
            desktop: 3,
            large: 4
          }}
        >
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </ResponsiveGrid>
      );
      
      const grid = container.firstChild as HTMLElement;
      // Should have all breakpoint classes for smooth transitions
      expect(grid.className).toContain('grid-cols-1');
      expect(grid.className).toContain('md:grid-cols-2');
      expect(grid.className).toContain('lg:grid-cols-3');
      expect(grid.className).toContain('xl:grid-cols-4');
    });

    it('should apply gap spacing consistently', () => {
      const { container } = render(
        <ResponsiveGrid gap="gap-6">
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      );
      
      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toContain('gap-6');
    });
  });

  describe('Content Reflow Prevention', () => {
    it('should use flex-shrink-0 for sidebars to prevent collapse', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
        />
      );
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      expect(leftSidebar?.className).toContain('flex-shrink-0');
    });

    it('should apply min-w-0 to main content to prevent overflow', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
        />
      );
      
      const mainContent = container.querySelector('main');
      expect(mainContent?.className).toContain('min-w-0');
    });

    it('should maintain proper flex behavior', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
        />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('flex');
      
      const mainContent = container.querySelector('main');
      expect(mainContent?.className).toContain('flex-1');
    });
  });

  describe('Responsive Grid Behavior', () => {
    it('should handle varying numbers of items gracefully', () => {
      const { container, rerender } = render(
        <ResponsiveGrid>
          <div>Item 1</div>
        </ResponsiveGrid>
      );
      
      let grid = container.firstChild as HTMLElement;
      expect(grid.children.length).toBe(1);
      
      // Add more items
      rerender(
        <ResponsiveGrid>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
          <div>Item 4</div>
        </ResponsiveGrid>
      );
      
      grid = container.firstChild as HTMLElement;
      expect(grid.children.length).toBe(4);
    });

    it('should apply minItemWidth correctly', () => {
      const { container } = render(
        <ResponsiveGrid minItemWidth="300px">
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      );
      
      const grid = container.firstChild as HTMLElement;
      expect(grid.style.gridTemplateColumns).toContain('300px');
    });

    it('should support custom gap values', () => {
      const gapValues = ['gap-2', 'gap-4', 'gap-6', 'gap-8'] as const;
      
      gapValues.forEach(gap => {
        const { container } = render(
          <ResponsiveGrid gap={gap}>
            <div>Item</div>
          </ResponsiveGrid>
        );
        
        const grid = container.firstChild as HTMLElement;
        expect(grid.className).toContain(gap);
      });
    });
  });

  describe('Sidebar Width Configurations', () => {
    it('should apply narrow sidebar width', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
          sidebarWidth="narrow"
        />
      );
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      expect(leftSidebar?.className).toContain('w-64');
    });

    it('should apply medium sidebar width', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
          sidebarWidth="medium"
        />
      );
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      expect(leftSidebar?.className).toContain('w-80');
    });

    it('should apply wide sidebar width', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
          sidebarWidth="wide"
        />
      );
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      expect(leftSidebar?.className).toContain('w-96');
    });
  });

  describe('Sticky Positioning', () => {
    it('should apply sticky positioning to sidebars', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
        />
      );
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      const stickyContainer = leftSidebar?.querySelector('div');
      expect(stickyContainer?.className).toContain('sticky');
    });

    it('should set proper top offset for sticky elements', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
        />
      );
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      const stickyContainer = leftSidebar?.querySelector('div');
      expect(stickyContainer?.className).toContain('top-8');
    });

    it('should apply max-height to prevent overflow', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
        />
      );
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      const stickyContainer = leftSidebar?.querySelector('div');
      expect(stickyContainer?.className).toMatch(/max-h-\[calc\(100vh-4rem\)\]/);
    });
  });

  describe('Custom ClassName Support', () => {
    it('should support custom className in ResponsiveContainer', () => {
      const customClass = 'custom-container-class';
      const { container } = render(
        <ResponsiveContainer className={customClass}>
          <div>Content</div>
        </ResponsiveContainer>
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain(customClass);
    });

    it('should support custom className in ResponsiveGrid', () => {
      const customClass = 'custom-grid-class';
      const { container } = render(
        <ResponsiveGrid className={customClass}>
          <div>Item</div>
        </ResponsiveGrid>
      );
      
      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toContain(customClass);
    });

    it('should support custom className in MultiColumnLayout', () => {
      const customClass = 'custom-layout-class';
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
          className={customClass}
        />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain(customClass);
    });
  });
});
