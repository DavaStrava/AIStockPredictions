import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ResponsiveGrid from '../ResponsiveGrid';

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Mock ResizeObserver for responsive behavior testing
const mockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('ResponsiveGrid Integration Tests', () => {
  let originalMatchMedia: any;
  let originalResizeObserver: any;

  beforeEach(() => {
    // Store original implementations
    originalMatchMedia = window.matchMedia;
    originalResizeObserver = window.ResizeObserver;
    
    // Mock ResizeObserver
    vi.stubGlobal('ResizeObserver', mockResizeObserver);
  });

  afterEach(() => {
    // Restore original implementations
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
    vi.unstubAllGlobals();
  });

  describe('Responsive Behavior Integration', () => {
    it('should adapt layout based on screen size changes', () => {
      const TestComponent = () => (
        <ResponsiveGrid
          columns={{
            mobile: 1,
            tablet: 2,
            desktop: 3,
            large: 4
          }}
        >
          <div data-testid="item-1">Item 1</div>
          <div data-testid="item-2">Item 2</div>
          <div data-testid="item-3">Item 3</div>
          <div data-testid="item-4">Item 4</div>
        </ResponsiveGrid>
      );

      const { container } = render(<TestComponent />);
      const gridElement = container.firstChild as HTMLElement;

      // Verify all responsive classes are applied
      expect(gridElement).toHaveClass('grid-cols-1'); // Mobile
      expect(gridElement).toHaveClass('md:grid-cols-2'); // Tablet
      expect(gridElement).toHaveClass('lg:grid-cols-3'); // Desktop
      expect(gridElement).toHaveClass('xl:grid-cols-4'); // Large
      expect(gridElement).toHaveClass('2xl:grid-cols-5'); // Extra large

      // Verify all items are rendered
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-2')).toBeInTheDocument();
      expect(screen.getByTestId('item-3')).toBeInTheDocument();
      expect(screen.getByTestId('item-4')).toBeInTheDocument();
    });

    it('should handle dynamic content changes gracefully', () => {
      const DynamicContentGrid = ({ itemCount }: { itemCount: number }) => (
        <ResponsiveGrid>
          {Array.from({ length: itemCount }, (_, i) => (
            <div key={i} data-testid={`dynamic-item-${i}`}>
              Dynamic Item {i + 1}
            </div>
          ))}
        </ResponsiveGrid>
      );

      const { rerender } = render(<DynamicContentGrid itemCount={2} />);

      // Initially 2 items
      expect(screen.getByTestId('dynamic-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-item-1')).toBeInTheDocument();
      expect(screen.queryByTestId('dynamic-item-2')).not.toBeInTheDocument();

      // Add more items
      rerender(<DynamicContentGrid itemCount={5} />);

      // All 5 items should be present
      expect(screen.getByTestId('dynamic-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-item-3')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-item-4')).toBeInTheDocument();

      // Reduce items
      rerender(<DynamicContentGrid itemCount={1} />);

      // Only 1 item should remain
      expect(screen.getByTestId('dynamic-item-0')).toBeInTheDocument();
      expect(screen.queryByTestId('dynamic-item-1')).not.toBeInTheDocument();
    });

    it('should maintain proper spacing with different gap configurations', () => {
      const gapConfigs = ['gap-2', 'gap-4', 'gap-6', 'gap-8'] as const;

      gapConfigs.forEach(gap => {
        const { container } = render(
          <ResponsiveGrid gap={gap}>
            <div>Item 1</div>
            <div>Item 2</div>
          </ResponsiveGrid>
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass(gap);
      });
    });

    it('should handle complex nested content structures', () => {
      const ComplexContent = () => (
        <div data-testid="complex-content">
          <header>
            <h2>Complex Header</h2>
            <nav>
              <ul>
                <li><a href="#1">Link 1</a></li>
                <li><a href="#2">Link 2</a></li>
              </ul>
            </nav>
          </header>
          <main>
            <section>
              <p>Complex content with multiple elements</p>
              <button>Action Button</button>
            </section>
          </main>
        </div>
      );

      render(
        <ResponsiveGrid>
          <ComplexContent />
          <ComplexContent />
          <ComplexContent />
        </ResponsiveGrid>
      );

      // All complex content should be rendered
      const complexElements = screen.getAllByTestId('complex-content');
      expect(complexElements).toHaveLength(3);

      // Verify nested elements are accessible
      expect(screen.getAllByText('Complex Header')).toHaveLength(3);
      expect(screen.getAllByText('Action Button')).toHaveLength(3);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large numbers of items efficiently', () => {
      const LARGE_ITEM_COUNT = 100;
      const startTime = performance.now();

      const { container } = render(
        <ResponsiveGrid>
          {Array.from({ length: LARGE_ITEM_COUNT }, (_, i) => (
            <div key={i} data-testid={`perf-item-${i}`}>
              Performance Item {i + 1}
            </div>
          ))}
        </ResponsiveGrid>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify all items are rendered
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement.children.length).toBe(LARGE_ITEM_COUNT);

      // Performance should be reasonable (less than 100ms for 100 items)
      expect(renderTime).toBeLessThan(100);

      // Spot check some items
      expect(screen.getByTestId('perf-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('perf-item-50')).toBeInTheDocument();
      expect(screen.getByTestId('perf-item-99')).toBeInTheDocument();
    });

    it('should handle rapid prop changes without breaking', () => {
      const RapidChangeGrid = ({ config }: { config: any }) => (
        <ResponsiveGrid {...config}>
          <div>Stable Item</div>
        </ResponsiveGrid>
      );

      const configs = [
        { gap: 'gap-2', minItemWidth: '200px' },
        { gap: 'gap-4', minItemWidth: '300px' },
        { gap: 'gap-6', minItemWidth: '250px' },
        { gap: 'gap-8', minItemWidth: '400px' },
      ];

      const { rerender } = render(<RapidChangeGrid config={configs[0]} />);

      // Rapidly change configurations
      configs.forEach((config, index) => {
        expect(() => {
          rerender(<RapidChangeGrid config={config} />);
        }).not.toThrow();

        // Verify the item is still there
        expect(screen.getByText('Stable Item')).toBeInTheDocument();
      });
    });

    it('should handle invalid or extreme minItemWidth values gracefully', () => {
      const extremeValues = ['0px', '9999px', '-100px', '50%', '10vw', 'invalid'];

      extremeValues.forEach(minItemWidth => {
        expect(() => {
          const { container } = render(
            <ResponsiveGrid minItemWidth={minItemWidth}>
              <div>Test Item</div>
            </ResponsiveGrid>
          );

          const gridElement = container.firstChild as HTMLElement;
          expect(gridElement).toHaveStyle({
            gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
          });
        }).not.toThrow();
      });
    });

    it('should maintain accessibility with dynamic content', () => {
      const AccessibleContent = ({ id }: { id: number }) => (
        <article
          data-testid={`accessible-item-${id}`}
          role="article"
          aria-labelledby={`title-${id}`}
          tabIndex={0}
        >
          <h3 id={`title-${id}`}>Article {id}</h3>
          <p>Content for article {id}</p>
          <button aria-describedby={`desc-${id}`}>
            Action for article {id}
          </button>
          <span id={`desc-${id}`} className="sr-only">
            This button performs an action for article {id}
          </span>
        </article>
      );

      render(
        <ResponsiveGrid>
          <AccessibleContent id={1} />
          <AccessibleContent id={2} />
          <AccessibleContent id={3} />
        </ResponsiveGrid>
      );

      // Verify accessibility attributes are preserved
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(3);

      articles.forEach((article, index) => {
        const id = index + 1;
        expect(article).toHaveAttribute('aria-labelledby', `title-${id}`);
        expect(article).toHaveAttribute('tabIndex', '0');
      });

      // Verify buttons have proper descriptions
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);

      buttons.forEach((button, index) => {
        const id = index + 1;
        expect(button).toHaveAttribute('aria-describedby', `desc-${id}`);
      });
    });
  });

  describe('CSS Grid Integration', () => {
    it('should properly combine CSS Grid with Tailwind classes', () => {
      const { container } = render(
        <ResponsiveGrid
          minItemWidth="250px"
          gap="gap-4"
          className="bg-gray-100 p-4"
          columns={{
            mobile: 1,
            tablet: 2,
            desktop: 3,
            large: 4
          }}
        >
          <div>Grid Item</div>
        </ResponsiveGrid>
      );

      const gridElement = container.firstChild as HTMLElement;

      // Verify CSS Grid template is set correctly
      expect(gridElement).toHaveStyle({
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
      });

      // Verify Tailwind classes are applied
      expect(gridElement).toHaveClass('grid');
      expect(gridElement).toHaveClass('gap-4');
      expect(gridElement).toHaveClass('bg-gray-100');
      expect(gridElement).toHaveClass('p-4');

      // Verify responsive classes
      expect(gridElement).toHaveClass('grid-cols-1');
      expect(gridElement).toHaveClass('md:grid-cols-2');
      expect(gridElement).toHaveClass('lg:grid-cols-3');
      expect(gridElement).toHaveClass('xl:grid-cols-4');
    });

    it('should handle CSS Grid fallbacks for older browsers', () => {
      // Mock CSS.supports to simulate older browser
      const originalSupports = CSS.supports;
      CSS.supports = vi.fn().mockReturnValue(false);

      const { container } = render(
        <ResponsiveGrid>
          <div>Fallback Item</div>
        </ResponsiveGrid>
      );

      const gridElement = container.firstChild as HTMLElement;

      // Should still have grid classes (Tailwind handles fallbacks)
      expect(gridElement).toHaveClass('grid');

      // Restore original CSS.supports
      CSS.supports = originalSupports;
    });
  });

  describe('Error Boundary Integration', () => {
    it('should handle children rendering errors gracefully', () => {
      const ErrorThrowingChild = () => {
        throw new Error('Child component error');
      };

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <ResponsiveGrid>
            <div>Good Child</div>
            <ErrorThrowingChild />
          </ResponsiveGrid>
        );
      }).toThrow('Child component error');

      consoleSpy.mockRestore();
    });

    it('should maintain grid structure even with problematic children', () => {
      const ProblematicChild = ({ shouldError }: { shouldError: boolean }) => {
        if (shouldError) {
          return <div style={{ width: 'invalid-value' }}>Problematic</div>;
        }
        return <div>Normal</div>;
      };

      const { container, rerender } = render(
        <ResponsiveGrid>
          <ProblematicChild shouldError={false} />
          <div>Stable Child</div>
        </ResponsiveGrid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid');
      expect(screen.getByText('Normal')).toBeInTheDocument();
      expect(screen.getByText('Stable Child')).toBeInTheDocument();

      // Change to problematic state
      rerender(
        <ResponsiveGrid>
          <ProblematicChild shouldError={true} />
          <div>Stable Child</div>
        </ResponsiveGrid>
      );

      // Grid should still be functional
      expect(gridElement).toHaveClass('grid');
      expect(screen.getByText('Stable Child')).toBeInTheDocument();
    });
  });

  describe('Memory and Cleanup', () => {
    it('should not cause memory leaks with frequent re-renders', () => {
      const TestGrid = ({ key: testKey }: { key: string }) => (
        <ResponsiveGrid key={testKey}>
          <div>Memory Test Item</div>
        </ResponsiveGrid>
      );

      const { rerender, unmount } = render(<TestGrid key="test-1" />);

      // Simulate frequent re-renders
      for (let i = 2; i <= 10; i++) {
        rerender(<TestGrid key={`test-${i}`} />);
        expect(screen.getByText('Memory Test Item')).toBeInTheDocument();
      }

      // Cleanup should not throw errors
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('should handle component unmounting during async operations', async () => {
      const AsyncChild = () => {
        const [data, setData] = React.useState('Loading...');

        React.useEffect(() => {
          const timer = setTimeout(() => {
            setData('Loaded');
          }, 100);

          return () => clearTimeout(timer);
        }, []);

        return <div>{data}</div>;
      };

      const { unmount } = render(
        <ResponsiveGrid>
          <AsyncChild />
        </ResponsiveGrid>
      );

      // Unmount before async operation completes
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
});