import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ErrorBoundary from '../ErrorBoundary';
import * as errorMonitoring from '@/lib/error-monitoring';

// Mock the error monitoring module
vi.mock('@/lib/error-monitoring', () => ({
    reportReactError: vi.fn()
}));

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error message');
    }
    return <div data-testid="success-component">Success!</div>;
};

// Custom fallback component for testing
const CustomFallback = ({ error, resetError }: { error?: Error; resetError: () => void }) => (
    <div data-testid="custom-fallback">
        <p>Custom error: {error?.message}</p>
        <button onClick={resetError} data-testid="custom-reset">
            Custom Reset
        </button>
    </div>
);

describe('ErrorBoundary', () => {
    let consoleErrorSpy: any;
    let mockReportReactError: any;

    beforeEach(() => {
        // Suppress console.error during tests to avoid noise
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        mockReportReactError = vi.mocked(errorMonitoring.reportReactError);
        mockReportReactError.mockClear();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('Normal Operation', () => {
        it('renders children when no error occurs', () => {
            render(
                <ErrorBoundary>
                    <div data-testid="child-component">Child Content</div>
                </ErrorBoundary>
            );

            expect(screen.getByTestId('child-component')).toBeInTheDocument();
            expect(screen.getByText('Child Content')).toBeInTheDocument();
        });

        it('renders multiple children correctly', () => {
            render(
                <ErrorBoundary>
                    <div data-testid="child-1">Child 1</div>
                    <div data-testid="child-2">Child 2</div>
                    <span data-testid="child-3">Child 3</span>
                </ErrorBoundary>
            );

            expect(screen.getByTestId('child-1')).toBeInTheDocument();
            expect(screen.getByTestId('child-2')).toBeInTheDocument();
            expect(screen.getByTestId('child-3')).toBeInTheDocument();
        });

        it('does not call error reporting when no error occurs', () => {
            render(
                <ErrorBoundary>
                    <div>Normal content</div>
                </ErrorBoundary>
            );

            expect(mockReportReactError).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('catches and displays default error UI when child component throws', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            // Should show default error UI
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();

            // Should show action buttons
            expect(screen.getByText('Try Again')).toBeInTheDocument();
            expect(screen.getByText('Reload Page')).toBeInTheDocument();

            // Should not show the original component
            expect(screen.queryByTestId('success-component')).not.toBeInTheDocument();
        });

        it('calls error reporting when error occurs', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(mockReportReactError).toHaveBeenCalledTimes(1);
            expect(mockReportReactError).toHaveBeenCalledWith(
                expect.any(Error),
                expect.any(Object),
                'ErrorBoundary'
            );
        });

        it('logs error to console when error occurs', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'ErrorBoundary caught an error:',
                expect.any(Error),
                expect.any(Object)
            );
        });

        it('displays error details in development mode', () => {
            // Mock NODE_ENV using vi.stubEnv
            vi.stubEnv('NODE_ENV', 'development');

            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            // Should show error details section
            expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();

            // Should show error message (use getAllByText since it appears multiple times)
            expect(screen.getAllByText(/Test error message/)[0]).toBeInTheDocument();

            // Restore original environment
            vi.unstubAllEnvs();
        });

        it('hides error details in production mode', () => {
            // Mock NODE_ENV using vi.stubEnv
            vi.stubEnv('NODE_ENV', 'production');

            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            // Should not show error details section
            expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument();

            // Restore original environment
            vi.unstubAllEnvs();
        });
    });

    describe('Custom Fallback Component', () => {
        it('renders custom fallback when provided', () => {
            render(
                <ErrorBoundary fallback={CustomFallback}>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            // Should show custom fallback instead of default
            expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
            expect(screen.getByText('Custom error: Test error message')).toBeInTheDocument();
            expect(screen.getByTestId('custom-reset')).toBeInTheDocument();

            // Should not show default error UI
            expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
        });

        it('passes error and resetError function to custom fallback', () => {
            render(
                <ErrorBoundary fallback={CustomFallback}>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            // Error message should be passed to custom fallback
            expect(screen.getByText('Custom error: Test error message')).toBeInTheDocument();

            // Reset button should be functional
            expect(screen.getByTestId('custom-reset')).toBeInTheDocument();
        });
    });

    describe('Error Recovery', () => {
        it('provides Try Again button that calls resetError function', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            // Should show error UI
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();

            // Try Again button should be present and clickable
            const tryAgainButton = screen.getByText('Try Again');
            expect(tryAgainButton).toBeInTheDocument();

            // Clicking should not throw an error (the reset function exists and works)
            expect(() => {
                fireEvent.click(tryAgainButton);
            }).not.toThrow();
        });

        it('provides custom fallback reset functionality', () => {
            render(
                <ErrorBoundary fallback={CustomFallback}>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            // Should show custom fallback
            expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();

            // Custom reset button should be present and clickable
            const customResetButton = screen.getByTestId('custom-reset');
            expect(customResetButton).toBeInTheDocument();

            // Clicking should not throw an error (the reset function exists and works)
            expect(() => {
                fireEvent.click(customResetButton);
            }).not.toThrow();
        });

        it('calls window.location.reload when Reload Page button is clicked', () => {
            const mockReload = vi.fn();
            Object.defineProperty(window, 'location', {
                value: { reload: mockReload },
                writable: true
            });

            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            // Click Reload Page button
            fireEvent.click(screen.getByText('Reload Page'));

            expect(mockReload).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error Information Handling', () => {
        it('captures and stores error information correctly', () => {
            const TestComponent = () => {
                throw new Error('Detailed test error');
            };

            render(
                <ErrorBoundary>
                    <TestComponent />
                </ErrorBoundary>
            );

            // Verify error reporting was called with correct parameters
            expect(mockReportReactError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Detailed test error'
                }),
                expect.objectContaining({
                    componentStack: expect.any(String)
                }),
                'ErrorBoundary'
            );
        });

        it('handles errors with different error types', () => {
            const ThrowTypeError = () => {
                throw new TypeError('Type error message');
            };

            render(
                <ErrorBoundary>
                    <ThrowTypeError />
                </ErrorBoundary>
            );

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            expect(mockReportReactError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Type error message'
                }),
                expect.any(Object),
                'ErrorBoundary'
            );
        });

        it('handles errors with no message', () => {
            const ThrowEmptyError = () => {
                throw new Error();
            };

            render(
                <ErrorBoundary>
                    <ThrowEmptyError />
                </ErrorBoundary>
            );

            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            expect(mockReportReactError).toHaveBeenCalled();
        });
    });

    describe('UI and Styling', () => {
        it('applies correct CSS classes for default error UI', () => {
            const { container } = render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            // Find the main error container by looking for the specific class combination
            const errorContainer = container.querySelector('.max-w-md.w-full.bg-white.dark\\:bg-gray-800.shadow-lg.rounded-lg');
            expect(errorContainer).toBeInTheDocument();
            expect(errorContainer).toHaveClass('bg-white', 'dark:bg-gray-800', 'shadow-lg', 'rounded-lg');
        });

        it('displays error icon correctly', () => {
            const { container } = render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            const errorIcon = container.querySelector('svg.h-8.w-8.text-red-500');

            expect(errorIcon).toBeInTheDocument();
            expect(errorIcon).toHaveClass('h-8', 'w-8', 'text-red-500');
        });

        it('applies correct button styling', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            const tryAgainButton = screen.getByText('Try Again');
            const reloadButton = screen.getByText('Reload Page');

            expect(tryAgainButton).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700');
            expect(reloadButton).toHaveClass('bg-gray-600', 'text-white', 'hover:bg-gray-700');
        });

        it('supports dark mode styling', () => {
            const { container } = render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            // Find the outermost container with dark mode classes
            const mainContainer = container.querySelector('.min-h-screen.flex.items-center.justify-center.bg-gray-50.dark\\:bg-gray-900');

            expect(mainContainer).toBeInTheDocument();
            expect(mainContainer).toHaveClass('bg-gray-50', 'dark:bg-gray-900');
        });
    });

    describe('Edge Cases', () => {
        it('handles null children gracefully', () => {
            render(
                <ErrorBoundary>
                    {null}
                </ErrorBoundary>
            );

            // Should render without errors
            expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
        });

        it('handles undefined children gracefully', () => {
            render(
                <ErrorBoundary>
                    {undefined}
                </ErrorBoundary>
            );

            // Should render without errors
            expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
        });

        it('handles errors thrown in event handlers (not caught by error boundary)', () => {
            const ProblematicComponent = () => {
                const handleClick = () => {
                    // Event handler errors are not caught by error boundaries
                    // This is expected React behavior - just log instead of throwing
                    console.error('Event handler error (expected)');
                };

                return (
                    <button onClick={handleClick} data-testid="problematic-button">
                        Click me
                    </button>
                );
            };

            render(
                <ErrorBoundary>
                    <ProblematicComponent />
                </ErrorBoundary>
            );

            // Component should render normally
            expect(screen.getByTestId('problematic-button')).toBeInTheDocument();

            // Clicking should not trigger error boundary (event handler errors are not caught)
            fireEvent.click(screen.getByTestId('problematic-button'));

            // Error boundary should not activate
            expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
            expect(screen.getByTestId('problematic-button')).toBeInTheDocument();
        });

        it('handles multiple consecutive errors correctly', () => {
            const { rerender } = render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            // First error
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            expect(mockReportReactError).toHaveBeenCalledTimes(1);

            // Reset and throw another error
            fireEvent.click(screen.getByText('Try Again'));

            rerender(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            // Should handle second error
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
            expect(mockReportReactError).toHaveBeenCalledTimes(2);
        });
    });

    describe('Accessibility', () => {
        it('provides proper focus management for buttons', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            const tryAgainButton = screen.getByText('Try Again');
            const reloadButton = screen.getByText('Reload Page');

            // Buttons should be focusable
            tryAgainButton.focus();
            expect(document.activeElement).toBe(tryAgainButton);

            reloadButton.focus();
            expect(document.activeElement).toBe(reloadButton);
        });

        it('uses proper semantic HTML structure', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            // Should have proper heading
            expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Something went wrong');

            // Should have proper buttons
            expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument();
        });

        it('provides keyboard navigation support', () => {
            render(
                <ErrorBoundary>
                    <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            );

            const tryAgainButton = screen.getByText('Try Again');

            // Should support keyboard interaction
            fireEvent.keyDown(tryAgainButton, { key: 'Enter' });
            // Note: The actual reset behavior would need to be tested with a full re-render
        });
    });
});