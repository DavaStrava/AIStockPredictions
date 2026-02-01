/**
 * Render Helpers for React Component Testing
 *
 * This module provides utilities for rendering React components in tests
 * with common providers (QueryClient, etc.) pre-configured.
 */

import React from 'react';
import { render, RenderOptions, RenderResult, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Options for renderWithProviders
 */
export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

/**
 * Extended render result with user event instance
 */
export interface ExtendedRenderResult extends RenderResult {
  user: ReturnType<typeof userEvent.setup>;
}

/**
 * Create a new QueryClient for testing with optimized settings
 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Render a component with all required providers for testing.
 *
 * @example
 * const { getByText, user } = renderWithProviders(<MyComponent />);
 * await user.click(getByText('Submit'));
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {}
): ExtendedRenderResult {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const user = userEvent.setup();

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    user,
  };
}

/**
 * Render and wait for async effects to settle.
 *
 * @example
 * const { getByText } = await renderAsync(<AsyncComponent />);
 */
export async function renderAsync(
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {}
): Promise<ExtendedRenderResult> {
  const result = renderWithProviders(ui, options);

  // Wait for any pending effects
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  return result;
}

/**
 * Create a custom render function with pre-configured options.
 *
 * @example
 * const renderWithAuth = createCustomRender({ queryClient: myClient });
 * const { getByText } = renderWithAuth(<MyComponent />);
 */
export function createCustomRender(
  defaultOptions: Partial<RenderWithProvidersOptions>
): (ui: React.ReactElement, options?: RenderWithProvidersOptions) => ExtendedRenderResult {
  return (ui, options = {}) => renderWithProviders(ui, { ...defaultOptions, ...options });
}

/**
 * Wait for an element and click it.
 *
 * @example
 * await waitAndClick(screen, 'Submit');
 */
export async function waitAndClick(
  container: typeof screen,
  textOrMatcher: string | RegExp
): Promise<void> {
  const user = userEvent.setup();
  const element = await waitFor(() => container.getByText(textOrMatcher));
  await user.click(element);
}

/**
 * Wait for an element and type into it.
 *
 * @example
 * await waitAndType(screen, 'Email', 'test@example.com');
 */
export async function waitAndType(
  container: typeof screen,
  labelText: string | RegExp,
  value: string
): Promise<void> {
  const user = userEvent.setup();
  const input = await waitFor(() => container.getByLabelText(labelText));
  await user.clear(input);
  await user.type(input, value);
}

/**
 * Fill a form with the given values.
 *
 * @example
 * await fillForm(screen, {
 *   'Email': 'test@example.com',
 *   'Password': 'secret123',
 * });
 */
export async function fillForm(
  container: typeof screen,
  values: Record<string, string>
): Promise<void> {
  for (const [label, value] of Object.entries(values)) {
    await waitAndType(container, label, value);
  }
}

/**
 * Select an option from a select element.
 *
 * @example
 * await selectOption(screen, 'Country', 'USA');
 */
export async function selectOption(
  container: typeof screen,
  labelText: string | RegExp,
  optionText: string
): Promise<void> {
  const user = userEvent.setup();
  const select = await waitFor(() => container.getByLabelText(labelText));
  await user.selectOptions(select, optionText);
}

// Re-export testing-library utilities for convenience
export { screen, waitFor, within, act, userEvent };
