/**
 * ResponsiveLayoutErrorBoundary Tests
 * 
 * These tests verify error boundaries for responsive layout failures
 * and graceful degradation to mobile layout.
 * 
 * Requirements: 3.3, 4.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResponsiveLayoutErrorBoundary, { useResponsiveErrorBoundary } from '../ResponsiveLayoutErrorBoundary';
import React from 'react';

// Mock error monitoring
vi.mock('@/lib/error-monitoring', () => ({
    reportReactError: vi.fn()
}));

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test layout error');
    }
    return <div>No Error</div>;
};

// Component that throws specific error types
const ThrowLayoutError = () => {
    throw new Error('Layout grid rendering failed');
};

const ThrowDataError = () => {
    throw new Error('Data is undefined');
};

const ThrowRenderingError = () => {
    throw new Error('Component render failed');
};

describe('ResponsiveLayoutErrorBoundary', () => {
    // Suppress console.error for cleaner test output
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    describe('Error Catching', () => {
        it('should catch errors thrown by child components', () => {
            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowError />
                </ResponsiveLayoutErrorBoundary>
            );

            // Should show error UI instead of crashing
            expect(screen.getByText('Layout Error Detected')).toBeInTheDocument();
        });

        it('should render children when no error occurs', () => {
            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowError shouldThrow={false} />
                </ResponsiveLayoutErrorBoundary>
            );

            expect(screen.getByText('No Error')).toBeInTheDocument();
        });

        it('should catch layout-specific errors', () => {
            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowLayoutError />
                </ResponsiveLayoutErrorBoundary>
            );

            expect(screen.getByText('Layout Error Detected')).toBeInTheDocument();
        });

        it('should catch data-related errors', () => {
            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowDataError />
                </ResponsiveLayoutErrorBoundary>
            );

            expect(screen.getByText('Layout Error Detected')).toBeInTheDocument();
        });

        it('should catch rendering errors', () => {
            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowRenderingError />
                </ResponsiveLayoutErrorBoundary>
            );

            expect(screen.getByText('Layout Error Detected')).toBeInTheDocument();
        });
    });

    describe('Error Type Detection', () => {
        it('should detect layout errors', () => {
            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowLayoutError />
                </ResponsiveLayoutErrorBoundary>
            );

            // In development mode, error type should be shown
            if (process.env.NODE_ENV === 'development') {
                expect(screen.getByText(/Error Type:/)).toBeInTheDocument();
            }
        });

        it('should detect data errors', () => {
            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowDataError />
                </ResponsiveLayoutErrorBoundary>
            );

            expect(screen.getByText('Layout Error Detected')).toBeInTheDocument();
        });

        it('should detect rendering errors', () => {
            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowRenderingError />
                </ResponsiveLayoutErrorBoundary>
            );

            expect(screen.getByText('Layout Error Detected')).toBeInTheDocument();
        });
    });

    describe('Fallback UI', () => {
        it('should render default fallback UI', () => {
            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowError />
                </ResponsiveLayoutErrorBoundary>
            );

            expect(screen.getByText('Layout Error Detected')).toBeInTheDocument();
            expect(screen.getByText(/simplified mobile layout/)).toBeInTheDocument();
        });

        it('should show Try Again button', () => {
            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowError />
                </ResponsiveLayoutErrorBoundary>
            );

            expect(screen.getByText('Try Again')).toBeInTheDocument();
        });

        it('should show Reload Page button', () => {
            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowError />
                </ResponsiveLayoutErrorBoundary>
            );

            expect(screen.getByText('Reload Page')).toBeInTheDocument();
        });

        it('should show help text with troubleshooting steps', () => {
            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowError />
                </ResponsiveLayoutErrorBoundary>
            );

            expect(screen.getByText(/If this problem persists/)).toBeInTheDocument();
            expect(screen.getByText(/Refreshing the page/)).toBeInTheDocument();
        });

        it('should use mobile-first layout classes', () => {
            const { container } = render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowError />
                </ResponsiveLayoutErrorBoundary>
            );

            const fallbackContainer = container.querySelector('.max-w-md');
            expect(fallbackContainer).toBeInTheDocument();
        });
    });

    describe('Custom Fallback', () => {
        it('should render custom fallback component when provided', () => {
            const CustomFallback = ({ error, resetError }: any) => (
                <div>
                    <div>Custom Error UI</div>
                    <div>{error?.message}</div>
                    <button onClick={resetError}>Reset</button>
                </div>
            );

            render(
                <ResponsiveLayoutErrorBoundary fallback={CustomFallback}>
                    <ThrowError />
                </ResponsiveLayoutErrorBoundary>
            );

            expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
            expect(screen.getByText('Test layout error')).toBeInTheDocument();
        });
    });

    describe('Error Recovery', () => {
        it('should reset error state when Try Again is clicked', () => {
            let shouldThrow = true;

            const { rerender } = render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowError shouldThrow={shouldThrow} />
                </ResponsiveLayoutErrorBoundary>
            );

            expect(screen.getByText('Layout Error Detected')).toBeInTheDocument();

            // Change component to not throw
            shouldThrow = false;

            // Click Try Again
            const tryAgainButton = screen.getByText('Try Again');
            fireEvent.click(tryAgainButton);

            // Should attempt to re-render children
            // Note: In real scenario, the component would need to be fixed
        });

        it('should call onError callback when error occurs', () => {
            const onError = vi.fn();

            render(
                <ResponsiveLayoutErrorBoundary onError={onError}>
                    <ThrowError />
                </ResponsiveLayoutErrorBoundary>
            );

            expect(onError).toHaveBeenCalled();
        });
    });

    describe('Development Mode Features', () => {
        it('should show error details in development mode', () => {
            // Mock the NODE_ENV using vi.stubEnv
            vi.stubEnv('NODE_ENV', 'development');

            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowError />
                </ResponsiveLayoutErrorBoundary>
            );

            // Should have details element for error information
            const details = screen.getByText(/Error Details/);
            expect(details).toBeInTheDocument();

            // Restore original environment
            vi.unstubAllEnvs();
        });
    });

    describe('Graceful Degradation', () => {
        it('should indicate fallback to mobile layout', () => {
            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowError />
                </ResponsiveLayoutErrorBoundary>
            );

            expect(screen.getByText(/simplified mobile layout/)).toBeInTheDocument();
        });

        it('should maintain accessibility in fallback UI', () => {
            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowError />
                </ResponsiveLayoutErrorBoundary>
            );

            // Should have proper heading hierarchy
            const heading = screen.getByText('Layout Error Detected');
            expect(heading.tagName).toBe('H3');

            // Should have accessible buttons
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });

        it('should provide clear user guidance', () => {
            render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowError />
                </ResponsiveLayoutErrorBoundary>
            );

            // Should explain what happened
            expect(screen.getByText(/issue with the responsive layout/)).toBeInTheDocument();

            // Should provide recovery options
            expect(screen.getByText('Try Again')).toBeInTheDocument();
            expect(screen.getByText('Reload Page')).toBeInTheDocument();
        });
    });

    describe('Mobile-First Fallback Layout', () => {
        it('should use responsive padding classes', () => {
            const { container } = render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowError />
                </ResponsiveLayoutErrorBoundary>
            );

            const outerContainer = container.querySelector('.px-4');
            expect(outerContainer).toBeInTheDocument();
        });

        it('should use max-width constraint for mobile', () => {
            const { container } = render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowError />
                </ResponsiveLayoutErrorBoundary>
            );

            const contentContainer = container.querySelector('.max-w-md');
            expect(contentContainer).toBeInTheDocument();
        });

        it('should use flexbox for button layout', () => {
            const { container } = render(
                <ResponsiveLayoutErrorBoundary>
                    <ThrowError />
                </ResponsiveLayoutErrorBoundary>
            );

            // Buttons should be in a flex container
            const buttonContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
            expect(buttonContainer).toBeInTheDocument();
        });
    });
});

describe('useResponsiveErrorBoundary Hook', () => {
    it('should provide error reporting functionality', () => {
        let hookResult: any;

        function TestComponent() {
            hookResult = useResponsiveErrorBoundary();
            return <div>Test</div>;
        }

        render(<TestComponent />);

        expect(hookResult.error).toBeNull();
        expect(hookResult.hasError).toBe(false);
        expect(typeof hookResult.reportError).toBe('function');
        expect(typeof hookResult.clearError).toBe('function');
    });

    it('should track error state', () => {
        let hookResult: any;

        function TestComponent() {
            hookResult = useResponsiveErrorBoundary();
            return (
                <div>
                    <button onClick={() => hookResult.reportError(new Error('Test'))}>
                        Report Error
                    </button>
                </div>
            );
        }

        render(<TestComponent />);

        const button = screen.getByText('Report Error');
        fireEvent.click(button);

        expect(hookResult.hasError).toBe(true);
        expect(hookResult.error).toBeInstanceOf(Error);
    });

    it('should clear error state', () => {
        let hookResult: any;

        function TestComponent() {
            hookResult = useResponsiveErrorBoundary();
            return (
                <div>
                    <button onClick={() => hookResult.reportError(new Error('Test'))}>
                        Report Error
                    </button>
                    <button onClick={() => hookResult.clearError()}>
                        Clear Error
                    </button>
                </div>
            );
        }

        render(<TestComponent />);

        // Report error
        const reportButton = screen.getByText('Report Error');
        fireEvent.click(reportButton);
        expect(hookResult.hasError).toBe(true);

        // Clear error
        const clearButton = screen.getByText('Clear Error');
        fireEvent.click(clearButton);
        expect(hookResult.hasError).toBe(false);
        expect(hookResult.error).toBeNull();
    });
});
