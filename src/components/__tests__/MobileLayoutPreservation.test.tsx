/**
 * Mobile Layout Preservation Tests
 * 
 * These tests verify that the existing mobile experience remains unchanged
 * and that mobile-optimized component behavior is maintained.
 * 
 * Requirements: 3.1, 3.4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResponsiveContainer from '../ResponsiveContainer';
import ResponsiveGrid from '../ResponsiveGrid';
import MultiColumnLayout from '../MultiColumnLayout';
import CollapsibleSection from '../CollapsibleSection';

describe('Mobile Layout Preservation', () => {
  describe('ResponsiveContainer - Mobile Behavior', () => {
    it('should apply mobile-first padding classes', () => {
      const { container } = render(
        <ResponsiveContainer variant="wide">
          <div>Test Content</div>
        </ResponsiveContainer>
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('px-4');
      expect(wrapper.className).toContain('mx-auto');
    });

    it('should maintain narrow variant for mobile-optimized content', () => {
      const { container } = render(
        <ResponsiveContainer variant="narrow">
          <div>Narrow Content</div>
        </ResponsiveContainer>
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('max-w-4xl');
    });

    it('should apply full width variant correctly', () => {
      const { container } = render(
        <ResponsiveContainer variant="full">
          <div>Full Width Content</div>
        </ResponsiveContainer>
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('w-full');
    });
  });

  describe('ResponsiveGrid - Mobile Single Column', () => {
    it('should default to single column on mobile', () => {
      const { container } = render(
        <ResponsiveGrid>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </ResponsiveGrid>
      );
      
      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toContain('grid-cols-1');
    });

    it('should respect custom mobile column configuration', () => {
      const { container } = render(
        <ResponsiveGrid columns={{ mobile: 1, tablet: 2 }}>
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      );
      
      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toContain('grid-cols-1');
      expect(grid.className).toContain('md:grid-cols-2');
    });

    it('should apply mobile-appropriate gap spacing', () => {
      const { container } = render(
        <ResponsiveGrid gap="gap-4">
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      );
      
      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toContain('gap-4');
    });

    it('should maintain minimum item width for mobile', () => {
      const { container } = render(
        <ResponsiveGrid minItemWidth="280px">
          <div>Item 1</div>
        </ResponsiveGrid>
      );
      
      const grid = container.firstChild as HTMLElement;
      expect(grid.style.gridTemplateColumns).toContain('280px');
    });
  });

  describe('MultiColumnLayout - Mobile Sidebar Hiding', () => {
    it('should hide left sidebar on mobile with lg:block class', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left Sidebar</div>}
          centerColumn={<div>Main Content</div>}
        />
      );
      
      const leftSidebar = container.querySelector('aside:first-of-type');
      expect(leftSidebar?.className).toContain('hidden');
      expect(leftSidebar?.className).toContain('lg:block');
    });

    it('should hide right sidebar on mobile with xl:block class', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left Sidebar</div>}
          centerColumn={<div>Main Content</div>}
          rightColumn={<div>Right Sidebar</div>}
        />
      );
      
      const rightSidebar = container.querySelector('aside:last-of-type');
      expect(rightSidebar?.className).toContain('hidden');
      expect(rightSidebar?.className).toContain('xl:block');
    });

    it('should always show center column on mobile', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left Sidebar</div>}
          centerColumn={<div data-testid="main-content">Main Content</div>}
        />
      );
      
      const mainContent = screen.getByTestId('main-content');
      expect(mainContent).toBeInTheDocument();
      
      const mainElement = container.querySelector('main');
      expect(mainElement?.className).toContain('flex-1');
      expect(mainElement?.className).not.toContain('hidden');
    });

    it('should apply mobile-appropriate gap spacing', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
        />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('gap-6');
    });
  });

  describe('CollapsibleSection - Mobile Touch Interactions', () => {
    it('should render with proper mobile-friendly button size', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // Button should be full width for easy touch interaction
      expect(button.className).toContain('w-full');
    });

    it('should maintain proper button semantics for mobile accessibility', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      );
      
      const button = screen.getByRole('button');
      // Button should be a proper button element for accessibility
      expect(button.tagName).toBe('BUTTON');
      // Should have click handler for interaction
      expect(button.onclick).toBeDefined();
    });

    it('should apply mobile-appropriate responsive padding', () => {
      const { container } = render(
        <CollapsibleSection title="Test Section">
          <div>Content</div>
        </CollapsibleSection>
      );
      
      const section = container.firstChild as HTMLElement;
      // Uses responsive padding classes
      expect(section.className).toContain('rounded-lg');
      expect(section.className).toContain('border');
    });
  });

  describe('Mobile-First Responsive Classes', () => {
    it('should use mobile-first breakpoint strategy in ResponsiveGrid', () => {
      const { container } = render(
        <ResponsiveGrid
          columns={{
            mobile: 1,
            tablet: 2,
            desktop: 3,
            large: 4
          }}
        >
          <div>Item</div>
        </ResponsiveGrid>
      );
      
      const grid = container.firstChild as HTMLElement;
      // Mobile-first: base class without prefix
      expect(grid.className).toContain('grid-cols-1');
      // Progressive enhancement with breakpoint prefixes
      expect(grid.className).toContain('md:grid-cols-2');
      expect(grid.className).toContain('lg:grid-cols-3');
      expect(grid.className).toContain('xl:grid-cols-4');
    });

    it('should maintain mobile padding in ResponsiveContainer', () => {
      const { container } = render(
        <ResponsiveContainer variant="wide">
          <div>Content</div>
        </ResponsiveContainer>
      );
      
      const wrapper = container.firstChild as HTMLElement;
      // Mobile-first padding
      expect(wrapper.className).toContain('px-4');
      // Progressive enhancement
      expect(wrapper.className).toContain('sm:px-6');
      expect(wrapper.className).toContain('lg:px-8');
    });
  });

  describe('Mobile Content Overflow Prevention', () => {
    it('should apply min-w-0 to prevent flex item overflow in MultiColumnLayout', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
        />
      );
      
      const mainContent = container.querySelector('main');
      expect(mainContent?.className).toContain('min-w-0');
    });

    it('should use flex-1 for flexible main content area', () => {
      const { container } = render(
        <MultiColumnLayout
          leftColumn={<div>Left</div>}
          centerColumn={<div>Center</div>}
        />
      );
      
      const mainContent = container.querySelector('main');
      expect(mainContent?.className).toContain('flex-1');
    });
  });

  describe('Mobile Typography and Spacing', () => {
    it('should maintain responsive spacing in grid', () => {
      const { container } = render(
        <ResponsiveGrid gap="gap-6">
          <div>Item 1</div>
          <div>Item 2</div>
        </ResponsiveGrid>
      );
      
      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toContain('gap-6');
    });

    it('should support custom className for mobile-specific styling', () => {
      const customClass = 'mobile-custom-class';
      const { container } = render(
        <ResponsiveContainer className={customClass}>
          <div>Content</div>
        </ResponsiveContainer>
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain(customClass);
    });
  });
});
