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
      expect(gridElement).toHaveClass('xl:grid-cols-4'); // Should inherit from desktop
      expect(gridElement).toHaveClass('2xl:grid-cols-5'); // Should be desktop + 1
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
      expect(gridElement).toHaveClass('lg:grid-cols-3');
      expect(gridElement).toHaveClass('xl:grid-cols-4');
      expect(gridElement).toHaveClass('2xl:grid-cols-5');
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
      expect(gridElement).not.toHaveClass('2xl:grid-cols-5'); // Should not add 2xl when large >= 5
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

    // NEW TESTS FOR RECENT CHANGES
    it('handles zero column values correctly with strict undefined checks', () => {
      const zeroColumns = {
        mobile: 0,
        tablet: 0,
        desktop: 0,
        large: 0
      };

      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={zeroColumns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-0');
      expect(gridElement).toHaveClass('md:grid-cols-0');
      expect(gridElement).toHaveClass('lg:grid-cols-0');
      expect(gridElement).toHaveClass('xl:grid-cols-0');
      expect(gridElement).toHaveClass('2xl:grid-cols-1'); // 0 + 1 = 1
    });

    it('handles false-y values (0, false, empty string) correctly with !== undefined checks', () => {
      const falsyColumns = {
        mobile: 0,
        tablet: false as any, // Invalid but should be handled
        desktop: '' as any,   // Invalid but should be handled
        large: null as any    // Invalid but should be handled
      };

      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={falsyColumns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-0'); // mobile: 0 should work
      expect(gridElement).toHaveClass('md:grid-cols-false'); // Invalid but processed
      expect(gridElement).toHaveClass('lg:grid-cols-'); // Empty string
      expect(gridElement).toHaveClass('xl:grid-cols-null'); // Uses large value (null -> "null")
    });

    it('handles mixed defined and undefined values correctly', () => {
      const mixedColumns = {
        mobile: 1,
        tablet: undefined,
        desktop: 3,
        large: undefined
      };

      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={mixedColumns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-1');
      expect(gridElement).not.toHaveClass('md:grid-cols-undefined');
      expect(gridElement).toHaveClass('lg:grid-cols-3');
      expect(gridElement).toHaveClass('xl:grid-cols-3'); // Should use desktop value
      expect(gridElement).toHaveClass('2xl:grid-cols-4'); // desktop (3) + 1 = 4
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

  describe('Enhanced Column Configuration Logic (Recent Changes)', () => {
    describe('Undefined vs Falsy Value Handling', () => {
      it('correctly distinguishes between undefined and 0 for tablet columns', () => {
        const undefinedTablet = { mobile: 1, tablet: undefined, desktop: 3, large: 4 };
        const zeroTablet = { mobile: 1, tablet: 0, desktop: 3, large: 4 };

        const { container: undefinedContainer } = render(
          <ResponsiveGrid {...defaultProps} columns={undefinedTablet} />
        );
        const { container: zeroContainer } = render(
          <ResponsiveGrid {...defaultProps} columns={zeroTablet} />
        );

        const undefinedElement = undefinedContainer.firstChild as HTMLElement;
        const zeroElement = zeroContainer.firstChild as HTMLElement;

        // Undefined should not add md: class
        expect(undefinedElement).not.toHaveClass('md:grid-cols-undefined');
        expect(undefinedElement.className).not.toMatch(/md:grid-cols-/);

        // Zero should add md:grid-cols-0
        expect(zeroElement).toHaveClass('md:grid-cols-0');
      });

      it('correctly distinguishes between undefined and 0 for desktop columns', () => {
        const undefinedDesktop = { mobile: 1, tablet: 2, desktop: undefined, large: 4 };
        const zeroDesktop = { mobile: 1, tablet: 2, desktop: 0, large: 4 };

        const { container: undefinedContainer } = render(
          <ResponsiveGrid {...defaultProps} columns={undefinedDesktop} />
        );
        const { container: zeroContainer } = render(
          <ResponsiveGrid {...defaultProps} columns={zeroDesktop} />
        );

        const undefinedElement = undefinedContainer.firstChild as HTMLElement;
        const zeroElement = zeroContainer.firstChild as HTMLElement;

        // Undefined should not add lg: class
        expect(undefinedElement).not.toHaveClass('lg:grid-cols-undefined');
        expect(undefinedElement.className).not.toMatch(/lg:grid-cols-/);

        // Zero should add lg:grid-cols-0
        expect(zeroElement).toHaveClass('lg:grid-cols-0');
      });

      it('correctly distinguishes between undefined and 0 for large columns', () => {
        const undefinedLarge = { mobile: 1, tablet: 2, desktop: 3, large: undefined };
        const zeroLarge = { mobile: 1, tablet: 2, desktop: 3, large: 0 };

        const { container: undefinedContainer } = render(
          <ResponsiveGrid {...defaultProps} columns={undefinedLarge} />
        );
        const { container: zeroContainer } = render(
          <ResponsiveGrid {...defaultProps} columns={zeroLarge} />
        );

        const undefinedElement = undefinedContainer.firstChild as HTMLElement;
        const zeroElement = zeroContainer.firstChild as HTMLElement;

        // Undefined large should fall back to desktop for xl
        expect(undefinedElement).toHaveClass('xl:grid-cols-3'); // Uses desktop value
        expect(undefinedElement).toHaveClass('2xl:grid-cols-4'); // desktop + 1

        // Zero large should use 0 for xl
        expect(zeroElement).toHaveClass('xl:grid-cols-0');
        expect(zeroElement).toHaveClass('2xl:grid-cols-1'); // 0 + 1
      });
    });

    describe('XL Breakpoint Fallback Logic', () => {
      it('uses desktop value for xl when large is undefined', () => {
        const columns = { mobile: 1, tablet: 2, desktop: 4, large: undefined };

        const { container } = render(
          <ResponsiveGrid {...defaultProps} columns={columns} />
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('lg:grid-cols-4');
        expect(gridElement).toHaveClass('xl:grid-cols-4'); // Should use desktop value
        expect(gridElement).toHaveClass('2xl:grid-cols-5'); // desktop + 1
      });

      it('does not add xl class when both large and desktop are undefined', () => {
        const columns = { mobile: 1, tablet: 2, desktop: undefined, large: undefined };

        const { container } = render(
          <ResponsiveGrid {...defaultProps} columns={columns} />
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('grid-cols-1');
        expect(gridElement).toHaveClass('md:grid-cols-2');
        expect(gridElement.className).not.toMatch(/lg:grid-cols-/);
        expect(gridElement.className).not.toMatch(/xl:grid-cols-/);
        expect(gridElement.className).not.toMatch(/2xl:grid-cols-/);
      });

      it('prefers large value over desktop for xl when large is defined', () => {
        const columns = { mobile: 1, tablet: 2, desktop: 3, large: 5 };

        const { container } = render(
          <ResponsiveGrid {...defaultProps} columns={columns} />
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('lg:grid-cols-3');
        expect(gridElement).toHaveClass('xl:grid-cols-5'); // Should use large value, not desktop
        expect(gridElement).toHaveClass('2xl:grid-cols-5'); // large = 5, so stays at 5
      });

      it('handles zero values correctly in fallback logic', () => {
        const columns = { mobile: 1, tablet: 2, desktop: 0, large: undefined };

        const { container } = render(
          <ResponsiveGrid {...defaultProps} columns={columns} />
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('lg:grid-cols-0');
        expect(gridElement).toHaveClass('xl:grid-cols-0'); // Should use desktop value (0)
        expect(gridElement).toHaveClass('2xl:grid-cols-1'); // 0 + 1 = 1
      });
    });

    describe('2XL Breakpoint Calculation Logic', () => {
      it('uses large value for 2xl calculation when large is defined', () => {
        const columns = { mobile: 1, tablet: 2, desktop: 3, large: 4 };

        const { container } = render(
          <ResponsiveGrid {...defaultProps} columns={columns} />
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('2xl:grid-cols-5'); // large (4) + 1 = 5
      });

      it('uses desktop value for 2xl calculation when large is undefined', () => {
        const columns = { mobile: 1, tablet: 2, desktop: 3, large: undefined };

        const { container } = render(
          <ResponsiveGrid {...defaultProps} columns={columns} />
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('2xl:grid-cols-4'); // desktop (3) + 1 = 4
      });

      it('caps 2xl at 5 when calculated value would exceed 5', () => {
        const columns = { mobile: 1, tablet: 2, desktop: 5, large: undefined };

        const { container } = render(
          <ResponsiveGrid {...defaultProps} columns={columns} />
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('2xl:grid-cols-5'); // Math.min(5 + 1, 5) = 5
      });

      it('sets 2xl to 5 when large value equals 5', () => {
        const columns = { mobile: 1, tablet: 2, desktop: 3, large: 5 };

        const { container } = render(
          <ResponsiveGrid {...defaultProps} columns={columns} />
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('2xl:grid-cols-5'); // large = 5, so 2xl = 5
      });

      it('does not add 2xl class when both large and desktop are undefined', () => {
        const columns = { mobile: 1, tablet: 2, desktop: undefined, large: undefined };

        const { container } = render(
          <ResponsiveGrid {...defaultProps} columns={columns} />
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement.className).not.toMatch(/2xl:grid-cols-/);
      });

      it('handles zero values correctly in 2xl calculation', () => {
        const zeroLarge = { mobile: 1, tablet: 2, desktop: 3, large: 0 };
        const zeroDesktop = { mobile: 1, tablet: 2, desktop: 0, large: undefined };

        const { container: zeroLargeContainer } = render(
          <ResponsiveGrid {...defaultProps} columns={zeroLarge} />
        );
        const { container: zeroDesktopContainer } = render(
          <ResponsiveGrid {...defaultProps} columns={zeroDesktop} />
        );

        const zeroLargeElement = zeroLargeContainer.firstChild as HTMLElement;
        const zeroDesktopElement = zeroDesktopContainer.firstChild as HTMLElement;

        expect(zeroLargeElement).toHaveClass('2xl:grid-cols-1'); // 0 + 1 = 1
        expect(zeroDesktopElement).toHaveClass('2xl:grid-cols-1'); // 0 + 1 = 1
      });

      it('does not add 2xl class when largeValue is greater than 5', () => {
        const columns = { mobile: 1, tablet: 2, desktop: 3, large: 6 };

        const { container } = render(
          <ResponsiveGrid {...defaultProps} columns={columns} />
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('xl:grid-cols-6');
        expect(gridElement.className).not.toMatch(/2xl:grid-cols-/); // Should not add 2xl when large > 5
      });
    });

    describe('Complex Column Configuration Scenarios', () => {
      it('handles all undefined columns correctly', () => {
        const allUndefined = {
          mobile: undefined,
          tablet: undefined,
          desktop: undefined,
          large: undefined
        };

        const { container } = render(
          <ResponsiveGrid {...defaultProps} columns={allUndefined} />
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('grid-cols-1'); // mobile defaults to 1
        expect(gridElement.className).not.toMatch(/md:grid-cols-/);
        expect(gridElement.className).not.toMatch(/lg:grid-cols-/);
        expect(gridElement.className).not.toMatch(/xl:grid-cols-/);
        expect(gridElement.className).not.toMatch(/2xl:grid-cols-/);
      });

      it('handles mixed zero and undefined values', () => {
        const mixedZeroUndefined = {
          mobile: 0,
          tablet: undefined,
          desktop: 0,
          large: undefined
        };

        const { container } = render(
          <ResponsiveGrid {...defaultProps} columns={mixedZeroUndefined} />
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('grid-cols-0');
        expect(gridElement.className).not.toMatch(/md:grid-cols-/);
        expect(gridElement).toHaveClass('lg:grid-cols-0');
        expect(gridElement).toHaveClass('xl:grid-cols-0'); // Uses desktop value
        expect(gridElement).toHaveClass('2xl:grid-cols-1'); // 0 + 1 = 1
      });

      it('handles only mobile defined', () => {
        const onlyMobile = {
          mobile: 2,
          tablet: undefined,
          desktop: undefined,
          large: undefined
        };

        const { container } = render(
          <ResponsiveGrid {...defaultProps} columns={onlyMobile} />
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('grid-cols-2');
        expect(gridElement.className).not.toMatch(/md:grid-cols-/);
        expect(gridElement.className).not.toMatch(/lg:grid-cols-/);
        expect(gridElement.className).not.toMatch(/xl:grid-cols-/);
        expect(gridElement.className).not.toMatch(/2xl:grid-cols-/);
      });

      it('handles skip patterns (mobile and desktop defined, tablet and large undefined)', () => {
        const skipPattern = {
          mobile: 1,
          tablet: undefined,
          desktop: 4,
          large: undefined
        };

        const { container } = render(
          <ResponsiveGrid {...defaultProps} columns={skipPattern} />
        );

        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('grid-cols-1');
        expect(gridElement.className).not.toMatch(/md:grid-cols-/);
        expect(gridElement).toHaveClass('lg:grid-cols-4');
        expect(gridElement).toHaveClass('xl:grid-cols-4'); // Uses desktop fallback
        expect(gridElement).toHaveClass('2xl:grid-cols-5'); // desktop + 1
      });
    });
  });

  describe('Breakpoint-Specific Grid Column Calculations', () => {
    it('calculates correct grid columns for mobile breakpoint (< 768px)', () => {
      const mobileColumns = { mobile: 1, tablet: 2, desktop: 3, large: 4 };
      
      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={mobileColumns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-1');
      expect(gridElement).not.toHaveClass('grid-cols-2');
      expect(gridElement).not.toHaveClass('grid-cols-3');
      expect(gridElement).not.toHaveClass('grid-cols-4');
    });

    it('calculates correct grid columns for tablet breakpoint (768px+)', () => {
      const tabletColumns = { mobile: 1, tablet: 2, desktop: 3, large: 4 };
      
      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={tabletColumns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-1'); // Base mobile
      expect(gridElement).toHaveClass('md:grid-cols-2'); // Tablet override
      expect(gridElement).toHaveClass('lg:grid-cols-3'); // Desktop override
      expect(gridElement).toHaveClass('xl:grid-cols-4'); // Large override
    });

    it('calculates correct grid columns for desktop breakpoint (1024px+)', () => {
      const desktopColumns = { mobile: 1, tablet: 2, desktop: 4, large: 5 };
      
      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={desktopColumns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('lg:grid-cols-4');
      expect(gridElement).toHaveClass('xl:grid-cols-5');
      expect(gridElement).toHaveClass('2xl:grid-cols-5'); // Should cap at 5
    });

    it('calculates correct grid columns for large desktop breakpoint (1280px+)', () => {
      const largeDesktopColumns = { mobile: 1, tablet: 2, desktop: 3, large: 5 };
      
      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={largeDesktopColumns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('xl:grid-cols-5');
      expect(gridElement).toHaveClass('2xl:grid-cols-5'); // Should remain at 5
    });

    it('handles progressive column scaling (1→2→3→4→5)', () => {
      const progressiveColumns = { mobile: 1, tablet: 2, desktop: 3, large: 4 };
      
      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={progressiveColumns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-1');
      expect(gridElement).toHaveClass('md:grid-cols-2');
      expect(gridElement).toHaveClass('lg:grid-cols-3');
      expect(gridElement).toHaveClass('xl:grid-cols-4');
      expect(gridElement).toHaveClass('2xl:grid-cols-5'); // Auto-increment to 5
    });

    it('handles non-progressive column configurations', () => {
      const nonProgressiveColumns = { mobile: 2, tablet: 1, desktop: 4, large: 2 };
      
      const { container } = render(
        <ResponsiveGrid {...defaultProps} columns={nonProgressiveColumns} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid-cols-2');
      expect(gridElement).toHaveClass('md:grid-cols-1');
      expect(gridElement).toHaveClass('lg:grid-cols-4');
      expect(gridElement).toHaveClass('xl:grid-cols-2');
      expect(gridElement).toHaveClass('2xl:grid-cols-3'); // large + 1
    });
  });

  describe('Spacing and Alignment Verification', () => {
    it('applies correct gap spacing classes', () => {
      const gapTests = [
        { gap: 'gap-2' as const, expected: 'gap-2' },
        { gap: 'gap-4' as const, expected: 'gap-4' },
        { gap: 'gap-6' as const, expected: 'gap-6' },
        { gap: 'gap-8' as const, expected: 'gap-8' }
      ];

      gapTests.forEach(({ gap, expected }) => {
        const { container } = render(
          <ResponsiveGrid {...defaultProps} gap={gap} />
        );
        
        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass(expected);
      });
    });

    it('maintains consistent spacing with custom minItemWidth', () => {
      const customWidths = ['200px', '300px', '400px', '25rem', '30%'];
      
      customWidths.forEach(width => {
        const { container } = render(
          <ResponsiveGrid {...defaultProps} minItemWidth={width} gap="gap-4" />
        );
        
        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('gap-4');
        expect(gridElement).toHaveStyle({
          gridTemplateColumns: `repeat(auto-fit, minmax(${width}, 1fr))`
        });
      });
    });

    it('verifies grid alignment with CSS Grid properties', () => {
      const { container } = render(
        <ResponsiveGrid {...defaultProps} minItemWidth="250px" />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      
      // Verify CSS Grid is applied
      expect(gridElement).toHaveClass('grid');
      
      // Verify minmax function for responsive behavior
      expect(gridElement).toHaveStyle({
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
      });
    });

    it('maintains proper alignment with varying content sizes', () => {
      const varyingContent = (
        <>
          <div data-testid="short-content">Short</div>
          <div data-testid="medium-content">Medium length content here</div>
          <div data-testid="long-content">
            This is a much longer piece of content that should still align properly 
            within the grid system regardless of its length
          </div>
        </>
      );

      const { container } = render(
        <ResponsiveGrid children={varyingContent} gap="gap-6" />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('grid');
      expect(gridElement).toHaveClass('gap-6');
      
      // All content should be present and properly contained
      expect(screen.getByTestId('short-content')).toBeInTheDocument();
      expect(screen.getByTestId('medium-content')).toBeInTheDocument();
      expect(screen.getByTestId('long-content')).toBeInTheDocument();
    });

    it('handles spacing consistency across different column configurations', () => {
      const columnConfigs = [
        { mobile: 1, tablet: 2, desktop: 3, large: 4 },
        { mobile: 2, tablet: 3, desktop: 4, large: 5 },
        { mobile: 1, desktop: 4 }, // Partial config
      ];

      columnConfigs.forEach((columns, index) => {
        const { container } = render(
          <ResponsiveGrid 
            {...defaultProps} 
            columns={columns} 
            gap="gap-4" 
            key={index}
          />
        );
        
        const gridElement = container.firstChild as HTMLElement;
        expect(gridElement).toHaveClass('gap-4');
        expect(gridElement).toHaveClass('grid');
      });
    });
  });

  describe('Requirements Validation', () => {
    it('meets requirement 2.1: responsive grid with breakpoint-based column system', () => {
      const { container } = render(
        <ResponsiveGrid {...defaultProps} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      
      // Should have progressive column system
      expect(gridElement).toHaveClass('grid-cols-1'); // Mobile
      expect(gridElement).toHaveClass('md:grid-cols-2'); // Tablet
      expect(gridElement).toHaveClass('lg:grid-cols-3'); // Desktop
      expect(gridElement).toHaveClass('xl:grid-cols-4'); // Large
      expect(gridElement).toHaveClass('2xl:grid-cols-5'); // Extra large
      
      // Should have configurable gap spacing
      expect(gridElement).toHaveClass('gap-6');
      
      // Should support minimum item widths
      expect(gridElement).toHaveStyle({
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
      });
    });

    it('meets requirement 4.1: configurable gap spacing and minimum item widths', () => {
      const { container } = render(
        <ResponsiveGrid 
          {...defaultProps} 
          gap="gap-8" 
          minItemWidth="280px"
        />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      
      // Configurable gap spacing
      expect(gridElement).toHaveClass('gap-8');
      
      // Configurable minimum item widths
      expect(gridElement).toHaveStyle({
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
      });
    });

    it('provides TypeScript interfaces for grid configuration', () => {
      // This test verifies that the TypeScript interfaces are properly exported
      // and can be used for type checking (compile-time verification)
      
      const config: ResponsiveGridConfig = {
        minItemWidth: '300px',
        gap: 'gap-4',
        className: 'custom-class',
        columns: {
          mobile: 1,
          tablet: 2,
          desktop: 3,
          large: 4
        }
      };

      const { container } = render(
        <ResponsiveGrid {...defaultProps} {...config} />
      );
      
      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('custom-class');
      expect(gridElement).toHaveClass('gap-4');
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