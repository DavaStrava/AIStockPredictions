import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ResponsiveGrid from '../ResponsiveGrid';
import ResponsiveContainer from '../ResponsiveContainer';
import ErrorBoundary from '../ErrorBoundary';
import React from 'react';

// Mock console methods to suppress error logs during tests
const mockConsole = () => {
  const originalError = console.error;
  const originalWarn = console.warn;

  beforeEach(() => {
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });
};

describe('Responsive Layout Error Handling', () => {
  mockConsole();

  describe('ResponsiveGrid Error Recovery', () => {
    it('should gracefully handle invalid column configurations', () => {
      const invalidConfigs = [
        { mobile: -1, tablet: 2, desktop: 3, large: 4 },
        { mobile: 0, tablet: 2, desktop: 3, large: 4 },
        { mobile: 1.5, tablet: 2.7, desktop: 3.9, large: 4.1 },
        { mobile: 999, tablet: 1000, desktop: 1001, large: 1002 },
      ];

      invalidConfigs.forEach((columns, index) => {
        expect(() => {
          const { container } = render(
            <ResponsiveGrid columns={columns}>
              <div data-testid={`invalid-test-${index}`}>Test Item</div>
            </ResponsiveGrid>
          );

          // Component should still render
          expect(screen.getByTestId(`invalid-test-${index}`)).toBeInTheDocument();

          // Grid classes should still be applied (even if invalid)
          const gridElement = container.firstChild as HTMLElement;
          expect(gridElement).toHaveClass('grid');
        }).not.toThrow();
      });
    });

    it('should handle malformed CSS class generation', () => {
      const MalformedGrid = () => {
        // Simulate a scenario where column values might be undefined or null
        const columns = {
          mobile: undefined as any,
          tablet: null as any,
          desktop: 3,
          large: 4
        };

        return (
          <ResponsiveGrid columns={columns}>
            <div data-testid="malformed-item">Malformed Test</div>
          </ResponsiveGrid>
        );
      };

      expect(() => {
        render(<MalformedGrid />);
      }).not.toThrow();

      expect(screen.getByTestId('malformed-item')).toBeInTheDocument();
    });

    it('should recover from CSS parsing errors', () => {
      const { container } = render(
        <ResponsiveGrid
          minItemWidth="invalid-css-value"
          gap={'invalid-gap' as any}
          className="invalid-class-with-special-chars!@#$%"
        >
          <div data-testid="css-error-item">CSS Error Test</div>
        </ResponsiveGrid>
      );

      // Component should still render despite invalid CSS
      expect(screen.getByTestId('css-error-item')).toBeInTheDocument();

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid');
    });

    it('should handle children that throw during render', () => {
      const ErrorThrowingChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('Child render error');
        }
        return <div data-testid="safe-child">Safe Child</div>;
      };

      // Test with error boundary
      expect(() => {
        render(
          <ErrorBoundary>
            <ResponsiveGrid>
              <ErrorThrowingChild shouldThrow={false} />
              <div data-testid="stable-child">Stable Child</div>
            </ResponsiveGrid>
          </ErrorBoundary>
        );
      }).not.toThrow();

      expect(screen.getByTestId('safe-child')).toBeInTheDocument();
      expect(screen.getByTestId('stable-child')).toBeInTheDocument();

      // Test error case
      expect(() => {
        render(
          <ErrorBoundary>
            <ResponsiveGrid>
              <ErrorThrowingChild shouldThrow={true} />
              <div data-testid="stable-child-2">Stable Child 2</div>
            </ResponsiveGrid>
          </ErrorBoundary>
        );
      }).not.toThrow();

      // Error boundary should catch the error and show fallback UI
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('ResponsiveContainer Error Recovery', () => {
    it('should handle invalid variant values gracefully', () => {
      const invalidVariants = ['invalid', '', null, undefined, 123, {}] as any[];

      invalidVariants.forEach((variant, index) => {
        expect(() => {
          render(
            <ResponsiveContainer variant={variant}>
              <div data-testid={`variant-test-${index}`}>Variant Test</div>
            </ResponsiveContainer>
          );
        }).not.toThrow();

        expect(screen.getByTestId(`variant-test-${index}`)).toBeInTheDocument();
      });
    });

    it('should recover from className conflicts', () => {
      const conflictingClasses = [
        'max-w-full max-w-none', // Conflicting max-width
        'px-4 px-8 px-12', // Multiple padding values
        'mx-auto mx-0', // Conflicting margin
        '!important-class', // CSS with !important
        'class-with-unicode-🚀', // Unicode characters
      ];

      conflictingClasses.forEach((className, index) => {
        expect(() => {
          render(
            <ResponsiveContainer className={className}>
              <div data-testid={`conflict-test-${index}`}>Conflict Test</div>
            </ResponsiveContainer>
          );
        }).not.toThrow();

        expect(screen.getByTestId(`conflict-test-${index}`)).toBeInTheDocument();
      });
    });

    it('should handle deeply nested content without performance issues', () => {
      const DeepNesting = ({ depth }: { depth: number }) => {
        if (depth === 0) {
          return <div data-testid="deep-content">Deep Content</div>;
        }
        return (
          <div>
            <DeepNesting depth={depth - 1} />
          </div>
        );
      };

      const startTime = performance.now();

      expect(() => {
        render(
          <ResponsiveContainer>
            <DeepNesting depth={50} />
          </ResponsiveContainer>
        );
      }).not.toThrow();

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(screen.getByTestId('deep-content')).toBeInTheDocument();
      expect(renderTime).toBeLessThan(100); // Should render quickly even with deep nesting
    });
  });

  describe('Layout Degradation Scenarios', () => {
    it('should fallback to mobile layout when CSS Grid is not supported', () => {
      // Mock CSS.supports to return false for grid
      const originalSupports = CSS.supports;
      CSS.supports = vi.fn((property: string) => {
        if (property.includes('grid')) return false;
        return originalSupports.call(CSS, property);
      });

      const { container } = render(
        <ResponsiveGrid
          columns={{
            mobile: 1,
            tablet: 2,
            desktop: 3,
            large: 4
          }}
        >
          <div>Fallback Item 1</div>
          <div>Fallback Item 2</div>
        </ResponsiveGrid>
      );

      const gridElement = container.firstChild as HTMLElement;

      // Should still have grid classes (Tailwind provides fallbacks)
      expect(gridElement).toHaveClass('grid');
      expect(gridElement).toHaveClass('grid-cols-1');

      // Restore CSS.supports
      CSS.supports = originalSupports;
    });

    it('should handle viewport size detection failures', () => {
      // Mock matchMedia to throw an error
      const originalMatchMedia = window.matchMedia;
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn(() => {
          throw new Error('matchMedia not supported');
        }),
      });

      expect(() => {
        render(
          <ResponsiveGrid>
            <div data-testid="viewport-test">Viewport Test</div>
          </ResponsiveGrid>
        );
      }).not.toThrow();

      expect(screen.getByTestId('viewport-test')).toBeInTheDocument();

      // Restore matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: originalMatchMedia,
      });
    });

    it('should maintain functionality during rapid viewport changes', () => {
      const { container } = render(
        <ResponsiveGrid>
          <div data-testid="viewport-change-test">Viewport Change Test</div>
        </ResponsiveGrid>
      );

      const gridElement = container.firstChild as HTMLElement;

      // Simulate rapid viewport changes
      for (let i = 0; i < 10; i++) {
        fireEvent(window, new Event('resize'));

        // Grid should remain functional
        expect(gridElement).toHaveClass('grid');
        expect(screen.getByTestId('viewport-change-test')).toBeInTheDocument();
      }
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should clean up event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <ResponsiveGrid>
          <div>Memory Test</div>
        </ResponsiveGrid>
      );

      // Component should not add window event listeners by default
      // (ResponsiveGrid is purely CSS-based)
      expect(addEventListenerSpy).not.toHaveBeenCalled();

      unmount();

      // No cleanup needed since no listeners were added
      expect(removeEventListenerSpy).not.toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should handle component unmounting during state updates', () => {
      const AsyncComponent = () => {
        const [mounted, setMounted] = React.useState(true);

        React.useEffect(() => {
          const timer = setTimeout(() => {
            if (mounted) {
              setMounted(false);
            }
          }, 50);

          return () => clearTimeout(timer);
        }, [mounted]);

        if (!mounted) return null;

        return <div data-testid="async-component">Async Component</div>;
      };

      const { unmount } = render(
        <ResponsiveGrid>
          <AsyncComponent />
        </ResponsiveGrid>
      );

      // Unmount before async operation completes
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('should handle rapid mount/unmount cycles', () => {
      const TestComponent = ({ show }: { show: boolean }) => {
        if (!show) return null;

        return (
          <ResponsiveGrid>
            <div data-testid="cycle-test">Cycle Test</div>
          </ResponsiveGrid>
        );
      };

      const { rerender } = render(<TestComponent show={true} />);

      // Rapid mount/unmount cycles
      for (let i = 0; i < 5; i++) {
        rerender(<TestComponent show={false} />);
        expect(screen.queryByTestId('cycle-test')).not.toBeInTheDocument();

        rerender(<TestComponent show={true} />);
        expect(screen.getByTestId('cycle-test')).toBeInTheDocument();
      }
    });
  });

  describe('Accessibility Error Recovery', () => {
    it('should maintain accessibility when children have invalid ARIA attributes', () => {
      const InvalidAriaChild = () => (
        <div
          data-testid="invalid-aria"
          aria-labelledby="non-existent-id"
          aria-describedby=""
          role="invalid-role"
          tabIndex={-999}
        >
          Invalid ARIA Child
        </div>
      );

      expect(() => {
        render(
          <ResponsiveGrid>
            <InvalidAriaChild />
            <div data-testid="valid-child">Valid Child</div>
          </ResponsiveGrid>
        );
      }).not.toThrow();

      expect(screen.getByTestId('invalid-aria')).toBeInTheDocument();
      expect(screen.getByTestId('valid-child')).toBeInTheDocument();
    });

    it('should handle focus management errors gracefully', () => {
      const FocusErrorChild = () => {
        const handleClick = () => {
          // Attempt to focus non-existent element
          const element = document.getElementById('non-existent');
          element?.focus();
        };

        return (
          <button onClick={handleClick} data-testid="focus-error-button">
            Focus Error Button
          </button>
        );
      };

      render(
        <ResponsiveGrid>
          <FocusErrorChild />
        </ResponsiveGrid>
      );

      const button = screen.getByTestId('focus-error-button');

      // Clicking should not throw an error
      expect(() => {
        fireEvent.click(button);
      }).not.toThrow();
    });

    it('should maintain keyboard navigation with problematic children', () => {
      const ProblematicKeyboardChild = () => (
        <div
          data-testid="problematic-keyboard"
          onKeyDown={(e) => {
            // Problematic key handler that might throw
            if (e.key === 'Enter') {
              throw new Error('Keyboard handler error');
            }
          }}
          tabIndex={0}
        >
          Problematic Keyboard Child
        </div>
      );

      render(
        <ResponsiveGrid>
          <ProblematicKeyboardChild />
          <button data-testid="safe-button">Safe Button</button>
        </ResponsiveGrid>
      );

      const problematicElement = screen.getByTestId('problematic-keyboard');
      const safeButton = screen.getByTestId('safe-button');

      // Focus should work normally
      problematicElement.focus();
      expect(document.activeElement).toBe(problematicElement);

      // Tab navigation should continue to work
      fireEvent.keyDown(problematicElement, { key: 'Tab' });

      // Safe button should still be accessible
      safeButton.focus();
      expect(document.activeElement).toBe(safeButton);
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should handle missing CSS features gracefully', () => {
      // Mock CSS features as unsupported
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = vi.fn(() => ({
        display: 'block', // Simulate no grid support
        gridTemplateColumns: 'none',
      } as any));

      expect(() => {
        render(
          <ResponsiveGrid>
            <div data-testid="compat-test">Compatibility Test</div>
          </ResponsiveGrid>
        );
      }).not.toThrow();

      expect(screen.getByTestId('compat-test')).toBeInTheDocument();

      // Restore getComputedStyle
      window.getComputedStyle = originalGetComputedStyle;
    });

    it('should work with different document modes', () => {
      // Mock different document modes
      const originalDocumentMode = (document as any).documentMode;

      // Simulate IE compatibility mode
      (document as any).documentMode = 8;

      expect(() => {
        render(
          <ResponsiveGrid>
            <div data-testid="ie-compat-test">IE Compatibility Test</div>
          </ResponsiveGrid>
        );
      }).not.toThrow();

      expect(screen.getByTestId('ie-compat-test')).toBeInTheDocument();

      // Restore document mode
      (document as any).documentMode = originalDocumentMode;
    });
  });
});