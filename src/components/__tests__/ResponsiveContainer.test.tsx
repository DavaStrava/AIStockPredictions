import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ResponsiveContainer from '../ResponsiveContainer';

describe('ResponsiveContainer', () => {
  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      render(
        <ResponsiveContainer>
          <div data-testid="test-content">Test Content</div>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('renders as a div element', () => {
      const { container } = render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      expect(container.firstChild?.nodeName).toBe('DIV');
    });
  });

  describe('Base Classes', () => {
    it('always applies base responsive classes', () => {
      const { container } = render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
    });
  });

  describe('Variant Classes - Switch Statement Logic', () => {
    it('applies default wide variant classes when no variant specified', () => {
      const { container } = render(
        <ResponsiveContainer>
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('max-w-7xl', 'xl:max-w-none', 'xl:px-12', '2xl:px-16');
    });

    it('applies narrow variant classes correctly', () => {
      const { container } = render(
        <ResponsiveContainer variant="narrow">
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('max-w-4xl');
      // Should not have wide/full specific classes
      expect(wrapper).not.toHaveClass('xl:max-w-none', 'w-full');
    });

    it('applies wide variant classes correctly', () => {
      const { container } = render(
        <ResponsiveContainer variant="wide">
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('max-w-7xl', 'xl:max-w-none', 'xl:px-12', '2xl:px-16');
      // Should not have narrow/full specific classes
      expect(wrapper).not.toHaveClass('max-w-4xl', 'w-full');
    });

    it('applies full variant classes correctly', () => {
      const { container } = render(
        <ResponsiveContainer variant="full">
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('w-full', 'xl:px-12', '2xl:px-16');
      // Should not have narrow/wide specific classes
      expect(wrapper).not.toHaveClass('max-w-4xl', 'max-w-7xl', 'xl:max-w-none');
    });

    it('handles default case for invalid variant', () => {
      const { container } = render(
        <ResponsiveContainer variant={'invalid' as any}>
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      // Should fall back to wide variant classes
      expect(wrapper).toHaveClass('max-w-7xl', 'xl:max-w-none', 'xl:px-12', '2xl:px-16');
    });
  });

  describe('Custom ClassName Handling', () => {
    it('appends custom className to base and variant classes', () => {
      const { container } = render(
        <ResponsiveContainer className="custom-class another-class">
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class', 'another-class');
      // Should still have base classes
      expect(wrapper).toHaveClass('mx-auto', 'px-4');
      // Should still have variant classes (default wide)
      expect(wrapper).toHaveClass('max-w-7xl');
    });

    it('handles empty className gracefully', () => {
      const { container } = render(
        <ResponsiveContainer className="">
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      // Should still have base and variant classes
      expect(wrapper).toHaveClass('mx-auto', 'px-4', 'max-w-7xl');
    });

    it('handles undefined className gracefully', () => {
      const { container } = render(
        <ResponsiveContainer className={undefined}>
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      // Should still have base and variant classes
      expect(wrapper).toHaveClass('mx-auto', 'px-4', 'max-w-7xl');
    });
  });

  describe('Class Combination Logic', () => {
    it('combines base classes, width classes, and custom classes in correct order', () => {
      const { container } = render(
        <ResponsiveContainer variant="narrow" className="z-10 bg-white">
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;

      // Verify all expected classes are present
      expect(wrapper).toHaveClass('mx-auto', 'px-4', 'sm:px-6', 'lg:px-8'); // base classes
      expect(wrapper).toHaveClass('max-w-4xl'); // width classes for narrow
      expect(wrapper).toHaveClass('z-10', 'bg-white'); // custom classes
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles null children gracefully', () => {
      const { container } = render(
        <ResponsiveContainer>
          {null}
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('mx-auto');
    });

    it('handles multiple children correctly', () => {
      render(
        <ResponsiveContainer>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <span data-testid="child-3">Child 3</span>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('handles React fragments as children', () => {
      render(
        <ResponsiveContainer>
          <>
            <div data-testid="fragment-child-1">Fragment Child 1</div>
            <div data-testid="fragment-child-2">Fragment Child 2</div>
          </>
        </ResponsiveContainer>
      );

      expect(screen.getByTestId('fragment-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('fragment-child-2')).toBeInTheDocument();
    });
  });

  describe('Responsive Design Validation', () => {
    it('includes all necessary responsive padding classes for narrow variant', () => {
      const { container } = render(
        <ResponsiveContainer variant="narrow">
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });

    it('includes enhanced responsive padding for wide variant', () => {
      const { container } = render(
        <ResponsiveContainer variant="wide">
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('px-4', 'sm:px-6', 'lg:px-8', 'xl:px-12', '2xl:px-16');
    });

    it('includes enhanced responsive padding for full variant', () => {
      const { container } = render(
        <ResponsiveContainer variant="full">
          <div>Content</div>
        </ResponsiveContainer>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('px-4', 'sm:px-6', 'lg:px-8', 'xl:px-12', '2xl:px-16');
    });
  });
});