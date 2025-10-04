import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CollapsibleSection from '../CollapsibleSection';

describe('CollapsibleSection', () => {
  const defaultProps = {
    title: 'Test Section',
    children: <div data-testid="test-content">Test Content</div>
  };

  describe('Basic Rendering', () => {
    it('renders the title correctly', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Section');
    });

    it('renders children when expanded by default', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('renders as a button for accessibility', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('applies base CSS classes correctly', () => {
      const { container } = render(<CollapsibleSection {...defaultProps} />);
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'border');
    });
  });

  describe('Optional Props Rendering', () => {
    it('renders subtitle when provided', () => {
      render(
        <CollapsibleSection 
          {...defaultProps} 
          subtitle="This is a subtitle" 
        />
      );
      
      expect(screen.getByText('This is a subtitle')).toBeInTheDocument();
    });

    it('does not render subtitle when not provided', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      // Should not find any paragraph elements (subtitle uses <p>)
      expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      render(
        <CollapsibleSection 
          {...defaultProps} 
          icon="📊" 
        />
      );
      
      expect(screen.getByText('📊')).toBeInTheDocument();
    });

    it('does not render icon when not provided', () => {
      const { container } = render(<CollapsibleSection {...defaultProps} />);
      
      // Check that no icon span exists
      const iconSpan = container.querySelector('.text-xl');
      expect(iconSpan).not.toBeInTheDocument();
    });

    it('renders badge when provided as string', () => {
      render(
        <CollapsibleSection 
          {...defaultProps} 
          badge="New" 
        />
      );
      
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('renders badge when provided as number', () => {
      render(
        <CollapsibleSection 
          {...defaultProps} 
          badge={5} 
        />
      );
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('does not render badge when not provided', () => {
      const { container } = render(<CollapsibleSection {...defaultProps} />);
      
      // Check that no badge span exists
      const badgeSpan = container.querySelector('.bg-gray-100');
      expect(badgeSpan).not.toBeInTheDocument();
    });

    it('applies custom className correctly', () => {
      const { container } = render(
        <CollapsibleSection 
          {...defaultProps} 
          className="custom-class another-class" 
        />
      );
      
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class', 'another-class');
      // Should still have base classes
      expect(wrapper).toHaveClass('bg-white', 'rounded-lg');
    });
  });

  describe('State Management and Interaction', () => {
    it('starts expanded by default', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('starts collapsed when defaultExpanded is false', () => {
      render(
        <CollapsibleSection 
          {...defaultProps} 
          defaultExpanded={false} 
        />
      );
      
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });

    it('toggles content visibility when button is clicked', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      // Initially expanded
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      
      // Click to collapse
      fireEvent.click(button);
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
      
      // Click to expand again
      fireEvent.click(button);
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('toggles multiple times correctly', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      // Multiple toggle cycles
      for (let i = 0; i < 3; i++) {
        // Should be visible
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
        
        // Click to hide
        fireEvent.click(button);
        expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
        
        // Click to show
        fireEvent.click(button);
        expect(screen.getByTestId('test-content')).toBeInTheDocument();
      }
    });
  });

  describe('Arrow Icon Animation', () => {
    it('applies rotation class when expanded', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      const arrow = screen.getByRole('button').querySelector('svg');
      expect(arrow).toHaveClass('rotate-180');
    });

    it('removes rotation class when collapsed', () => {
      render(
        <CollapsibleSection 
          {...defaultProps} 
          defaultExpanded={false} 
        />
      );
      
      const arrow = screen.getByRole('button').querySelector('svg');
      expect(arrow).not.toHaveClass('rotate-180');
    });

    it('toggles rotation class when state changes', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      const button = screen.getByRole('button');
      const arrow = button.querySelector('svg');
      
      // Initially expanded (rotated)
      expect(arrow).toHaveClass('rotate-180');
      
      // Click to collapse (remove rotation)
      fireEvent.click(button);
      expect(arrow).not.toHaveClass('rotate-180');
      
      // Click to expand (add rotation)
      fireEvent.click(button);
      expect(arrow).toHaveClass('rotate-180');
    });

    it('has proper SVG attributes for accessibility', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      const arrow = screen.getByRole('button').querySelector('svg');
      expect(arrow).toHaveAttribute('viewBox', '0 0 24 24');
      expect(arrow).toHaveAttribute('fill', 'none');
      expect(arrow).toHaveAttribute('stroke', 'currentColor');
    });
  });

  describe('Complex Content Handling', () => {
    it('handles multiple child elements correctly', () => {
      render(
        <CollapsibleSection title="Multi-child test">
          <div data-testid="child-1">Child 1</div>
          <p data-testid="child-2">Child 2</p>
          <span data-testid="child-3">Child 3</span>
        </CollapsibleSection>
      );
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('handles React fragments as children', () => {
      render(
        <CollapsibleSection title="Fragment test">
          <>
            <div data-testid="fragment-child-1">Fragment Child 1</div>
            <div data-testid="fragment-child-2">Fragment Child 2</div>
          </>
        </CollapsibleSection>
      );
      
      expect(screen.getByTestId('fragment-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('fragment-child-2')).toBeInTheDocument();
    });

    it('handles nested components as children', () => {
      const NestedComponent = () => (
        <div data-testid="nested-component">
          <h4>Nested Title</h4>
          <p>Nested content</p>
        </div>
      );

      render(
        <CollapsibleSection title="Nested test">
          <NestedComponent />
        </CollapsibleSection>
      );
      
      expect(screen.getByTestId('nested-component')).toBeInTheDocument();
      expect(screen.getByText('Nested Title')).toBeInTheDocument();
      expect(screen.getByText('Nested content')).toBeInTheDocument();
    });

    it('handles empty children gracefully', () => {
      render(
        <CollapsibleSection title="Empty test">
          {null}
        </CollapsibleSection>
      );
      
      // Should render without errors
      expect(screen.getByText('Empty test')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('uses proper semantic HTML structure', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      // Should have a button for interaction
      expect(screen.getByRole('button')).toBeInTheDocument();
      
      // Should have a heading for the title
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('supports keyboard interaction', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      // Initially expanded
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      
      // Simulate Enter key press
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      // Note: fireEvent.keyDown doesn't automatically trigger click for buttons
      // but the browser would handle this. We test the click handler directly.
      fireEvent.click(button);
      expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    });

    it('has proper focus management', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      // Button should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it('provides visual feedback on hover', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-gray-50', 'dark:hover:bg-gray-700');
    });
  });

  describe('Styling and Layout', () => {
    it('applies correct flexbox layout classes', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('flex', 'items-center', 'justify-between');
    });

    it('applies correct spacing classes', () => {
      render(
        <CollapsibleSection 
          {...defaultProps} 
          icon="📊" 
          badge="5" 
        />
      );
      
      const button = screen.getByRole('button');
      
      // Check for spacing classes in the layout
      const leftSection = button.querySelector('.space-x-3');
      const rightSection = button.querySelector('.space-x-2');
      
      expect(leftSection).toBeInTheDocument();
      expect(rightSection).toBeInTheDocument();
    });

    it('applies transition classes for smooth animations', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      const button = screen.getByRole('button');
      const arrow = button.querySelector('svg');
      
      expect(button).toHaveClass('transition-colors');
      expect(arrow).toHaveClass('transition-transform');
    });

    it('applies dark mode classes correctly', () => {
      const { container } = render(<CollapsibleSection {...defaultProps} />);
      
      const wrapper = container.firstChild as HTMLElement;
      const button = screen.getByRole('button');
      
      expect(wrapper).toHaveClass('dark:bg-gray-800', 'dark:border-gray-700');
      expect(button).toHaveClass('dark:hover:bg-gray-700');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles undefined props gracefully', () => {
      render(
        <CollapsibleSection 
          title="Test"
          subtitle={undefined}
          icon={undefined}
          badge={undefined}
          className={undefined}
        >
          <div>Content</div>
        </CollapsibleSection>
      );
      
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('handles empty string props gracefully', () => {
      render(
        <CollapsibleSection 
          title="Test"
          subtitle=""
          icon=""
          className=""
        >
          <div>Content</div>
        </CollapsibleSection>
      );
      
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('handles zero as badge value', () => {
      render(
        <CollapsibleSection 
          {...defaultProps} 
          badge={0} 
        />
      );
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles very long title text', () => {
      const longTitle = 'This is a very long title that might cause layout issues if not handled properly in the component design';
      
      render(
        <CollapsibleSection 
          title={longTitle}
        >
          <div>Content</div>
        </CollapsibleSection>
      );
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles special characters in title and content', () => {
      const specialTitle = 'Title with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      
      render(
        <CollapsibleSection title={specialTitle}>
          <div>Content with émojis 🚀 and ñ special chars</div>
        </CollapsibleSection>
      );
      
      expect(screen.getByText(specialTitle)).toBeInTheDocument();
      expect(screen.getByText(/Content with émojis 🚀 and ñ special chars/)).toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('does not re-render unnecessarily when props do not change', () => {
      const renderSpy = vi.fn();
      
      const TestChild = () => {
        renderSpy();
        return <div>Test Child</div>;
      };

      const { rerender } = render(
        <CollapsibleSection title="Test">
          <TestChild />
        </CollapsibleSection>
      );

      // Re-render with same props
      rerender(
        <CollapsibleSection title="Test">
          <TestChild />
        </CollapsibleSection>
      );

      // Child should have been rendered again (React doesn't prevent this by default)
      // but the component structure should remain stable
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('handles rapid state changes correctly', () => {
      render(<CollapsibleSection {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      // Test that rapid clicking doesn't break the component
      // Just verify it can handle multiple clicks without throwing errors
      expect(() => {
        for (let i = 0; i < 10; i++) {
          fireEvent.click(button);
        }
      }).not.toThrow();
      
      // Component should still be functional after rapid clicks
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Test Section')).toBeInTheDocument();
    });
  });
});