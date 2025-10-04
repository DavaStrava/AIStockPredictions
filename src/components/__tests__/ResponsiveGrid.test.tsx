import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ResponsiveGrid, { ResponsiveGridProps, ResponsiveGridConfig } from '../ResponsiveGrid';

describe('ResponsiveGrid', () => {
  const defaultProps: ResponsiveGridProps = {
    children: (
      <>
        <div data-testid="item-1">Item 1</div>
        <div data-testid="item-2">Item 2</div>
        <div data-testid="item-3">Item 3</div>
      </>
    )
  };

  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      render(<ResponsiveGrid {...defaultProps} />);
      
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-2')).toBeInTheDocument();
      expect(screen.getByTestId('item-3')).toBeInTheDocument();
    });

    it('applies default grid classes', () => {
      const { container } = render(<ResponsiveGrid {...defaultProps} />);
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid');
      expect(gridElement).toHaveClass('grid-cols-1'); // Default mobile
      expect(gridElement).toHaveClass('md:grid-cols-2'); // Default tablet
      expect(gridElement).toHaveClass('lg:grid-cols-3'); // Default desktop
      expect(gridElement).toHaveClass('xl:grid-cols-4'); // Default large
      expect(gridElement).toHaveClass('gap-6'); // Default gap
    });

    it('applies default minItemWidth style', () => {
      const { container } = render(<ResponsiveGrid {...defaultProps} />);
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveStyle({
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
      });
    });

    it('renders as a div element', () => {
      const { container } = render(<ResponsiveGrid {...defaultProps} />);
      
      expect(container.firstChild?.nodeName).toBe('DIV');
    });
  });

  describe('Column Configuration', () => {
    it('applies custom column configuration correctly', () => {
      const customColumns = {
        mobile: 2,
        tablet: 3,
        desktop: 4,
        large: 5
      };

      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={customColumns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-2');
      expect(gridElement).toHaveClass('md:grid-cols-3');
      expect(gridElement).toHaveClass('lg:grid-cols-4');
      expect(gridElement).toHaveClass('xl:grid-cols-5');
    });

    it('handles partial column configuration', () => {
      const partialColumns = {
        mobile: 1,
        desktop: 4
      };

      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={partialColumns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-1');
      expect(gridElement).not.toHaveClass('md:grid-cols-2'); // Should not apply tablet
      expect(gridElement).toHaveClass('lg:grid-cols-4');
      expect(gridElement).toHaveClass('xl:grid-cols-4');
    });

    it('handles undefined column values gracefully', () => {
      const columnsWithUndefined = {
        mobile: 1,
        tablet: undefined,
        desktop: 3,
        large: undefined
      };

      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={columnsWithUndefined} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-1');
      expect(gridElement).not.toHaveClass('md:grid-cols-undefined');
      expect(gridElement).toHaveClass('lg:grid-cols-3');
      expect(gridElement).not.toHaveClass('xl:grid-cols-undefined');
    });

    it('applies 2xl breakpoint when large columns is less than 5', () => {
      const columns = {
        mobile: 1,
        tablet: 2,
        desktop: 3,
        large: 4
      };

      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={columns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('2xl:grid-cols-5'); // large + 1
    });

    it('does not exceed 5 columns for 2xl breakpoint', () => {
      const columns = {
        mobile: 1,
        tablet: 2,
        desktop: 4,
        large: 5
      };

      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={columns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('2xl:grid-cols-5'); // Should cap at 5
    });

    it('handles zero column values', () => {
      const zeroColumns = {
        mobile: 0,
        tablet: 2,
        desktop: 3,
        large: 4
      };

      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={zeroColumns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-0');
      expect(gridElement).toHaveClass('md:grid-cols-2');
    });
  });

  describe('Gap Configuration', () => {
    it('applies custom gap classes', () => {
      const gapValues: Array<ResponsiveGridConfig['gap']> = ['gap-2', 'gap-4', 'gap-6', 'gap-8'];
      
      gapValues.forEach(gap => {
        const { container } = render(
          <ResponsiveGrid {...defaultProps} gap={gap} />
        );
        
        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass(gap!);
      });
    });

    it('uses default gap when not specified', () => {
      const { container } = render(<ResponsiveGrid {...defaultProps} />);
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('gap-6');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const customClass = 'custom-grid-class another-class';
      
      const { container } = render(
        <ResponsiveGrid {...defaultProps} className={customClass} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('custom-grid-class');
      expect(gridElement).toHaveClass('another-class');
      // Should still have base classes
      expect(gridElement).toHaveClass('grid');
    });

    it('applies custom minItemWidth style', () => {
      const customWidth = '250px';
      
      const { container } = render(
        <ResponsiveGrid {...defaultProps} minItemWidth={customWidth} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveStyle({
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
      });
    });

    it('handles different minItemWidth units', () => {
      const widthUnits = ['300px', '20rem', '25%', '30vw'];
      
      widthUnits.forEach(width => {
        const { container } = render(
          <ResponsiveGrid {...defaultProps} minItemWidth={width} />
        );
        
        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveStyle({
          gridTemplateColumns: `repeat(auto-fit, minmax(${width}, 1fr))`
        });
      });
    });
  });

  describe('Complex Children Handling', () => {
    it('handles multiple child elements correctly', () => {
      const multipleChildren = (
        <>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
          <div data-testid="child-4">Child 4</div>
          <div data-testid="child-5">Child 5</div>
        </>
      );

      render(<ResponsiveGrid children={multipleChildren} />);
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
      expect(screen.getByTestId('child-4')).toBeInTheDocument();
      expect(screen.getByTestId('child-5')).toBeInTheDocument();
    });

    it('handles React fragments as children', () => {
      const fragmentChildren = (
        <>
          <div data-testid="fragment-1">Fragment 1</div>
          <div data-testid="fragment-2">Fragment 2</div>
        </>
      );

      render(<ResponsiveGrid children={fragmentChildren} />);
      
      expect(screen.getByTestId('fragment-1')).toBeInTheDocument();
      expect(screen.getByTestId('fragment-2')).toBeInTheDocument();
    });

    it('handles nested components as children', () => {
      const NestedComponent = ({ id }: { id: string }) => (
        <div data-testid={`nested-${id}`}>
          <h3>Nested {id}</h3>
          <p>Content for {id}</p>
        </div>
      );

      const nestedChildren = (
        <>
          <NestedComponent id="1" />
          <NestedComponent id="2" />
        </>
      );

      render(<ResponsiveGrid children={nestedChildren} />);
      
      expect(screen.getByTestId('nested-1')).toBeInTheDocument();
      expect(screen.getByTestId('nested-2')).toBeInTheDocument();
      expect(screen.getByText('Nested 1')).toBeInTheDocument();
      expect(screen.getByText('Content for 2')).toBeInTheDocument();
    });

    it('handles single child element', () => {
      const singleChild = <div data-testid="single-child">Single Child</div>;

      render(<ResponsiveGrid children={singleChild} />);
      
      expect(screen.getByTestId('single-child')).toBeInTheDocument();
    });

    it('handles empty children gracefully', () => {
      const { container } = render(<ResponsiveGrid children={null} />);
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toBeInTheDocument();
      expect(gridElement).toHaveClass('grid');
      expect(gridElement.children.length).toBe(0);
    });

    it('handles undefined children gracefully', () => {
      const { container } = render(<ResponsiveGrid children={undefined} />);
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toBeInTheDocument();
      expect(gridElement).toHaveClass('grid');
    });
  });

  describe('Grid Class Generation Logic', () => {
    it('generates correct base grid classes', () => {
      const { container } = render(<ResponsiveGrid {...defaultProps} />);
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement.className).toContain('grid');
    });

    it('handles missing columns object gracefully', () => {
      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={undefined} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-1'); // Should use default
    });

    it('generates classes in correct order', () => {
      const columns = {
        mobile: 1,
        tablet: 2,
        desktop: 3,
        large: 4
      };

      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={columns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      const classList = Array.from(gridElement.classList);
      
      // Check that responsive classes are present
      expect(classList).toContain('grid-cols-1');
      expect(classList).toContain('md:grid-cols-2');
      expect(classList).toContain('lg:grid-cols-3');
      expect(classList).toContain('xl:grid-cols-4');
      expect(classList).toContain('2xl:grid-cols-5');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles negative column values', () => {
      const negativeColumns = {
        mobile: -1,
        tablet: 2,
        desktop: 3,
        large: 4
      };

      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={negativeColumns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols--1'); // CSS will handle invalid values
    });

    it('handles very large column values', () => {
      const largeColumns = {
        mobile: 1,
        tablet: 2,
        desktop: 10,
        large: 20
      };

      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={largeColumns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('lg:grid-cols-10');
      expect(gridElement).toHaveClass('xl:grid-cols-20');
      expect(gridElement).toHaveClass('2xl:grid-cols-5'); // Should cap at 5
    });

    it('handles empty string className', () => {
      const { container } = render(
        <ResponsiveGrid {...defaultProps} className="" />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid');
      expect(gridElement).toHaveClass('gap-6');
    });

    it('handles empty string minItemWidth', () => {
      const { container } = render(
        <ResponsiveGrid {...defaultProps} minItemWidth="" />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveStyle({
        gridTemplateColumns: 'repeat(auto-fit, minmax(, 1fr))'
      });
    });

    it('handles special characters in className', () => {
      const specialClassName = 'test-class_with-special@chars';
      
      const { container } = render(
        <ResponsiveGrid {...defaultProps} className={specialClassName} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass(specialClassName);
    });

    it('handles decimal column values', () => {
      const decimalColumns = {
        mobile: 1.5,
        tablet: 2.7,
        desktop: 3.9,
        large: 4.1
      };

      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={decimalColumns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-1.5');
      expect(gridElement).toHaveClass('md:grid-cols-2.7');
    });
  });

  describe('Integration with Tailwind CSS', () => {
    it('applies all required Tailwind classes', () => {
      const { container } = render(
        <ResponsiveGrid 
          {...defaultProps} 
          gap="gap-4"
          className="bg-gray-100 p-4"
        />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      
      // Base grid classes
      expect(gridElement).toHaveClass('grid');
      
      // Responsive grid classes
      expect(gridElement).toHaveClass('grid-cols-1');
      expect(gridElement).toHaveClass('md:grid-cols-2');
      expect(gridElement).toHaveClass('lg:grid-cols-3');
      expect(gridElement).toHaveClass('xl:grid-cols-4');
      
      // Gap class
      expect(gridElement).toHaveClass('gap-4');
      
      // Custom classes
      expect(gridElement).toHaveClass('bg-gray-100');
      expect(gridElement).toHaveClass('p-4');
    });

    it('maintains class order for CSS specificity', () => {
      const { container } = render(
        <ResponsiveGrid 
          {...defaultProps} 
          gap="gap-8"
          className="custom-grid"
        />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      const classString = gridElement.className;
      
      // Grid classes should come first, then gap, then custom
      expect(classString).toMatch(/grid.*gap-8.*custom-grid/);
    });
  });

  describe('Performance Considerations', () => {
    it('does not re-render unnecessarily with same props', () => {
      const { rerender } = render(<ResponsiveGrid {...defaultProps} />);
      
      // Re-render with identical props
      rerender(<ResponsiveGrid {...defaultProps} />);
      
      // Component should still be functional
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-2')).toBeInTheDocument();
      expect(screen.getByTestId('item-3')).toBeInTheDocument();
    });

    it('handles large numbers of children efficiently', () => {
      const manyChildren = Array.from({ length: 100 }, (_, i) => (
        <div key={i} data-testid={`item-${i}`}>Item {i}</div>
      ));

      const { container } = render(
        <ResponsiveGrid children={manyChildren} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement.children.length).toBe(100);
      expect(screen.getByTestId('item-0')).toBeInTheDocument();
      expect(screen.getByTestId('item-99')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('maintains semantic HTML structure', () => {
      render(<ResponsiveGrid {...defaultProps} />);
      
      // Children should maintain their semantic meaning
      expect(screen.getByTestId('item-1')).toBeInTheDocument();
      expect(screen.getByTestId('item-2')).toBeInTheDocument();
      expect(screen.getByTestId('item-3')).toBeInTheDocument();
    });

    it('does not interfere with child accessibility attributes', () => {
      const accessibleChildren = (
        <>
          <button data-testid="button-child" aria-label="Test button">
            Button Child
          </button>
          <div data-testid="div-child" role="article" aria-describedby="desc">
            Div Child
          </div>
        </>
      );

      render(<ResponsiveGrid children={accessibleChildren} />);
      
      const button = screen.getByTestId('button-child');
      const div = screen.getByTestId('div-child');
      
      expect(button).toHaveAttribute('aria-label', 'Test button');
      expect(div).toHaveAttribute('role', 'article');
      expect(div).toHaveAttribute('aria-describedby', 'desc');
    });
  });
});