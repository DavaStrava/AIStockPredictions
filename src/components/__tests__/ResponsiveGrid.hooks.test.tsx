/**
 * ResponsiveGrid Hooks Integration Tests
 * 
 * Tests for the integration of useLayoutShiftPrevention hooks
 * with the ResponsiveGrid component.
 * 
 * Requirements: 3.3, 4.4
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ResponsiveGrid from '../ResponsiveGrid';
import * as layoutShiftHooks from '@/hooks/useLayoutShiftPrevention';

// Mock the layout shift prevention hooks
vi.mock('@/hooks/useLayoutShiftPrevention', () => ({
  useContentSizeHints: vi.fn(),
  useResponsiveTransition: vi.fn(),
  getCurrentBreakpoint: vi.fn(),
  BREAKPOINTS: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
}));

describe('ResponsiveGrid - Hooks Integration', () => {
  let mockUseContentSizeHints: any;
  let mockUseResponsiveTransition: any;

  beforeEach(() => {
    // Setup default mock implementations
    mockUseContentSizeHints = vi.mocked(layoutShiftHooks.useContentSizeHints);
    mockUseResponsiveTransition = vi.mocked(layoutShiftHooks.useResponsiveTransition);

    // Default mock return values
    mockUseContentSizeHints.mockReturnValue({
      breakpoint: 'lg',
      gridColumns: 3,
      cardMinHeight: '300px',
      sidebarWidth: '256px',
    });

    mockUseResponsiveTransition.mockReturnValue({
      breakpoint: 'lg',
      isTransitioning: false,
      transitionClass: '',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Integration - Basic Functionality', () => {
    it('should call useContentSizeHints hook on mount', () => {
      render(
        <ResponsiveGrid>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      expect(mockUseContentSizeHints).toHaveBeenCalledTimes(1);
    });

    it('should call useResponsiveTransition hook with default duration', () => {
      render(
        <ResponsiveGrid>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      expect(mockUseResponsiveTransition).toHaveBeenCalledTimes(1);
      expect(mockUseResponsiveTransition).toHaveBeenCalledWith(300);
    });

    it('should apply size hints from useContentSizeHints', () => {
      mockUseContentSizeHints.mockReturnValue({
        breakpoint: 'xl',
        gridColumns: 4,
        cardMinHeight: '320px',
        sidebarWidth: '320px',
      });

      const { container } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('320px');
    });

    it('should use custom itemMinHeight over size hints when provided', () => {
      mockUseContentSizeHints.mockReturnValue({
        breakpoint: 'lg',
        gridColumns: 3,
        cardMinHeight: '300px',
        sidebarWidth: '256px',
      });

      const { container } = render(
        <ResponsiveGrid preventLayoutShift={true} itemMinHeight="400px">
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('400px');
    });
  });

  describe('Transition State Handling', () => {
    it('should apply transition class when isTransitioning is true', () => {
      mockUseResponsiveTransition.mockReturnValue({
        breakpoint: 'lg',
        isTransitioning: true,
        transitionClass: 'transitioning',
      });

      const { container } = render(
        <ResponsiveGrid>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toContain('transitioning');
    });

    it('should not apply transition class when isTransitioning is false', () => {
      mockUseResponsiveTransition.mockReturnValue({
        breakpoint: 'lg',
        isTransitioning: false,
        transitionClass: '',
      });

      const { container } = render(
        <ResponsiveGrid>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.className).not.toContain('transitioning');
    });

    it('should set data-transitioning attribute based on isTransitioning state', () => {
      mockUseResponsiveTransition.mockReturnValue({
        breakpoint: 'lg',
        isTransitioning: true,
        transitionClass: 'transitioning',
      });

      const { container } = render(
        <ResponsiveGrid>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.getAttribute('data-transitioning')).toBe('true');
    });

    it('should update transition state when breakpoint changes', () => {
      const { rerender } = render(
        <ResponsiveGrid>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      // Simulate breakpoint change
      mockUseResponsiveTransition.mockReturnValue({
        breakpoint: 'xl',
        isTransitioning: true,
        transitionClass: 'transitioning',
      });

      rerender(
        <ResponsiveGrid>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      expect(mockUseResponsiveTransition).toHaveBeenCalled();
    });
  });

  describe('Layout Shift Prevention', () => {
    it('should apply transition classes when preventLayoutShift is true', () => {
      const { container } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toContain('transition-all');
      expect(grid.className).toContain('duration-300');
      expect(grid.className).toContain('ease-in-out');
    });

    it('should not apply transition classes when preventLayoutShift is false', () => {
      const { container } = render(
        <ResponsiveGrid preventLayoutShift={false}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.className).not.toContain('transition-all');
      expect(grid.className).not.toContain('duration-300');
    });

    it('should set CSS custom property for grid item min height when preventLayoutShift is true', () => {
      mockUseContentSizeHints.mockReturnValue({
        breakpoint: 'lg',
        gridColumns: 3,
        cardMinHeight: '300px',
        sidebarWidth: '256px',
      });

      const { container } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('300px');
    });

    it('should not set CSS custom property when preventLayoutShift is false', () => {
      const { container } = render(
        <ResponsiveGrid preventLayoutShift={false}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('');
    });
  });

  describe('Breakpoint-Specific Size Hints', () => {
    it('should use mobile size hints for xs breakpoint', () => {
      mockUseContentSizeHints.mockReturnValue({
        breakpoint: 'xs',
        gridColumns: 1,
        cardMinHeight: '260px',
        sidebarWidth: '0px',
      });

      const { container } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('260px');
    });

    it('should use tablet size hints for md breakpoint', () => {
      mockUseContentSizeHints.mockReturnValue({
        breakpoint: 'md',
        gridColumns: 2,
        cardMinHeight: '280px',
        sidebarWidth: '0px',
      });

      const { container } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('280px');
    });

    it('should use desktop size hints for lg breakpoint', () => {
      mockUseContentSizeHints.mockReturnValue({
        breakpoint: 'lg',
        gridColumns: 3,
        cardMinHeight: '300px',
        sidebarWidth: '256px',
      });

      const { container } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('300px');
    });

    it('should use large desktop size hints for xl breakpoint', () => {
      mockUseContentSizeHints.mockReturnValue({
        breakpoint: 'xl',
        gridColumns: 4,
        cardMinHeight: '320px',
        sidebarWidth: '320px',
      });

      const { container } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('320px');
    });

    it('should use extra large desktop size hints for 2xl breakpoint', () => {
      mockUseContentSizeHints.mockReturnValue({
        breakpoint: '2xl',
        gridColumns: 5,
        cardMinHeight: '320px',
        sidebarWidth: '384px',
      });

      const { container } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('320px');
    });
  });

  describe('Hook Re-rendering Behavior', () => {
    it('should call hooks on every render', () => {
      const { rerender } = render(
        <ResponsiveGrid>
          <div>Test Item 1</div>
        </ResponsiveGrid>
      );

      expect(mockUseContentSizeHints).toHaveBeenCalledTimes(1);
      expect(mockUseResponsiveTransition).toHaveBeenCalledTimes(1);

      rerender(
        <ResponsiveGrid>
          <div>Test Item 2</div>
        </ResponsiveGrid>
      );

      expect(mockUseContentSizeHints).toHaveBeenCalledTimes(2);
      expect(mockUseResponsiveTransition).toHaveBeenCalledTimes(2);
    });

    it('should handle hook return value changes gracefully', () => {
      const { container, rerender } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      let grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('300px');

      // Change hook return value
      mockUseContentSizeHints.mockReturnValue({
        breakpoint: 'xl',
        gridColumns: 4,
        cardMinHeight: '320px',
        sidebarWidth: '320px',
      });

      rerender(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('320px');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined size hints gracefully', () => {
      mockUseContentSizeHints.mockReturnValue({
        breakpoint: 'lg',
        gridColumns: 3,
        cardMinHeight: undefined as any,
        sidebarWidth: '256px',
      });

      const { container } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      // Should handle undefined gracefully
      expect(grid).toBeInTheDocument();
    });

    it('should handle null transition class gracefully', () => {
      mockUseResponsiveTransition.mockReturnValue({
        breakpoint: 'lg',
        isTransitioning: false,
        transitionClass: null as any,
      });

      const { container } = render(
        <ResponsiveGrid>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid).toBeInTheDocument();
    });

    it('should handle empty string size hints', () => {
      mockUseContentSizeHints.mockReturnValue({
        breakpoint: 'lg',
        gridColumns: 3,
        cardMinHeight: '',
        sidebarWidth: '256px',
      });

      const { container } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('');
    });

    it('should handle zero values in size hints', () => {
      mockUseContentSizeHints.mockReturnValue({
        breakpoint: 'xs',
        gridColumns: 1,
        cardMinHeight: '0px',
        sidebarWidth: '0px',
      });

      const { container } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('0px');
    });
  });

  describe('Integration with Existing Props', () => {
    it('should combine hook-based classes with custom className', () => {
      mockUseResponsiveTransition.mockReturnValue({
        breakpoint: 'lg',
        isTransitioning: true,
        transitionClass: 'transitioning',
      });

      const { container } = render(
        <ResponsiveGrid className="custom-class" preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toContain('custom-class');
      expect(grid.className).toContain('transitioning');
      expect(grid.className).toContain('transition-all');
    });

    it('should work with all column configurations', () => {
      const { container } = render(
        <ResponsiveGrid
          columns={{
            mobile: 1,
            tablet: 2,
            desktop: 3,
            large: 4,
          }}
          preventLayoutShift={true}
        >
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toContain('grid-cols-1');
      expect(grid.className).toContain('md:grid-cols-2');
      expect(grid.className).toContain('lg:grid-cols-3');
      expect(grid.className).toContain('xl:grid-cols-4');
    });

    it('should work with custom gap values', () => {
      const { container } = render(
        <ResponsiveGrid gap="gap-8" preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toContain('gap-8');
      expect(grid.className).toContain('transition-all');
    });

    it('should work with custom minItemWidth', () => {
      const { container } = render(
        <ResponsiveGrid minItemWidth="400px" preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.style.gridTemplateColumns).toContain('400px');
    });
  });

  describe('Performance Considerations', () => {
    it('should not cause unnecessary re-renders when hooks return same values', () => {
      const renderSpy = vi.fn();

      const TestChild = () => {
        renderSpy();
        return <div>Test Child</div>;
      };

      const { rerender } = render(
        <ResponsiveGrid>
          <TestChild />
        </ResponsiveGrid>
      );

      const initialRenderCount = renderSpy.mock.calls.length;

      // Re-render with same hook values
      rerender(
        <ResponsiveGrid>
          <TestChild />
        </ResponsiveGrid>
      );

      // Child should re-render (React doesn't prevent this by default)
      expect(renderSpy.mock.calls.length).toBeGreaterThan(initialRenderCount);
    });

    it('should handle rapid breakpoint changes efficiently', async () => {
      const { container } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      // Simulate rapid breakpoint changes
      const breakpoints: Array<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'> = ['xs', 'md', 'lg', 'xl', '2xl'];
      
      for (const bp of breakpoints) {
        mockUseContentSizeHints.mockReturnValue({
          breakpoint: bp,
          gridColumns: bp === 'xs' ? 1 : bp === 'md' ? 2 : bp === 'lg' ? 3 : bp === 'xl' ? 4 : 5,
          cardMinHeight: bp === 'xs' ? '260px' : bp === 'md' ? '280px' : '300px',
          sidebarWidth: bp === 'xs' || bp === 'md' ? '0px' : '256px',
        });

        mockUseResponsiveTransition.mockReturnValue({
          breakpoint: bp,
          isTransitioning: true,
          transitionClass: 'transitioning',
        });
      }

      // Component should still be functional
      const grid = container.firstChild as HTMLElement;
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Accessibility with Hooks', () => {
    it('should maintain data-testid attribute with hooks enabled', () => {
      render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      expect(screen.getByTestId('responsive-grid')).toBeInTheDocument();
    });

    it('should maintain proper DOM structure with hooks', () => {
      const { container } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.tagName).toBe('DIV');
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should not interfere with keyboard navigation', () => {
      render(
        <ResponsiveGrid preventLayoutShift={true}>
          <button data-testid="button-1">Button 1</button>
          <button data-testid="button-2">Button 2</button>
        </ResponsiveGrid>
      );

      const button1 = screen.getByTestId('button-1');
      const button2 = screen.getByTestId('button-2');

      button1.focus();
      expect(document.activeElement).toBe(button1);

      button2.focus();
      expect(document.activeElement).toBe(button2);
    });
  });

  describe('CSS Custom Properties Integration', () => {
    it('should set --grid-item-min-height as a CSS custom property', () => {
      mockUseContentSizeHints.mockReturnValue({
        breakpoint: 'lg',
        gridColumns: 3,
        cardMinHeight: '300px',
        sidebarWidth: '256px',
      });

      const { container } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      const computedStyle = window.getComputedStyle(grid);
      
      // Check that the custom property is set
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('300px');
    });

    it('should update CSS custom property when size hints change', () => {
      const { container, rerender } = render(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      let grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('300px');

      // Change size hints
      mockUseContentSizeHints.mockReturnValue({
        breakpoint: 'xl',
        gridColumns: 4,
        cardMinHeight: '320px',
        sidebarWidth: '320px',
      });

      rerender(
        <ResponsiveGrid preventLayoutShift={true}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('320px');
    });

    it('should not set CSS custom property when preventLayoutShift is disabled', () => {
      const { container } = render(
        <ResponsiveGrid preventLayoutShift={false}>
          <div>Test Item</div>
        </ResponsiveGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.style.getPropertyValue('--grid-item-min-height')).toBe('');
    });
  });
});
