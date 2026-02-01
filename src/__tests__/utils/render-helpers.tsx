/**
 * React Testing Library Render Helpers
 *
 * This module provides custom render functions that wrap components with
 * necessary providers (context, query client, etc.) for testing.
 */

import React, { type ReactElement, type PropsWithChildren } from 'react';
import { render, type RenderOptions, type RenderResult, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Options for renderWithProviders
 */
export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial route for testing */
  route?: string;
  /** Additional wrapper component */
  additionalWrapper?: React.ComponentType<PropsWithChildren>;
}

/**
 * Extended render result with user event setup
 */
export interface ExtendedRenderResult extends RenderResult {
  user: ReturnType<typeof userEvent.setup>;
}

/**
 * Default wrapper that provides necessary context for components.
 * This wrapper can be extended as the app grows to include more providers.
 */
function DefaultWrapper({ children }: PropsWithChildren): ReactElement {
  return <>{children}</>;
}

/**
 * Renders a component with all necessary providers and returns
 * a userEvent instance for simulating user interactions.
 *
 * This is the recommended way to render components in tests as it:
 * - Sets up userEvent properly (which handles act() automatically)
 * - Provides necessary context providers
 * - Returns both render result and user event instance
 *
 * @example
 * const { user, getByRole } = renderWithProviders(<MyComponent />);
 * await user.click(getByRole('button'));
 *
 * @example
 * // With additional wrapper
 * const { user } = renderWithProviders(<MyComponent />, {
 *   additionalWrapper: ({ children }) => (
 *     <MyContext.Provider value={mockValue}>{children}</MyContext.Provider>
 *   )
 * });
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
): ExtendedRenderResult {
  const { additionalWrapper: AdditionalWrapper, ...renderOptions } = options;

  function Wrapper({ children }: PropsWithChildren): ReactElement {
    const content = <DefaultWrapper>{children}</DefaultWrapper>;
    return AdditionalWrapper ? <AdditionalWrapper>{content}</AdditionalWrapper> : content;
  }

  const user = userEvent.setup();

  return {
    user,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Renders a component and waits for async operations to complete.
 * Useful for components that fetch data on mount.
 *
 * @example
 * const { getByText } = await renderAsync(<AsyncComponent />);
 * expect(getByText('Loaded')).toBeInTheDocument();
 *
 * @example
 * // Wait for specific element
 * const { user } = await renderAsync(<AsyncComponent />, {
 *   waitForElement: () => screen.findByText('Data loaded')
 * });
 */
export async function renderAsync(
  ui: ReactElement,
  options: RenderWithProvidersOptions & {
    waitForElement?: () => Promise<HTMLElement>;
    waitForLoadingToFinish?: boolean;
  } = {}
): Promise<ExtendedRenderResult> {
  const { waitForElement, waitForLoadingToFinish = true, ...renderOptions } = options;

  const result = renderWithProviders(ui, renderOptions);

  if (waitForElement) {
    await waitForElement();
  } else if (waitForLoadingToFinish) {
    // Wait for common loading indicators to disappear
    await waitFor(
      () => {
        const loadingElements = result.queryAllByText(/loading/i);
        expect(loadingElements.length).toBe(0);
      },
      { timeout: 5000 }
    ).catch(() => {
      // Silently continue if no loading elements found
    });
  }

  return result;
}

/**
 * Creates a custom render function with preset options.
 * Useful when many tests need the same setup.
 *
 * @example
 * // In test setup file
 * export const renderWithTradingContext = createCustomRender({
 *   additionalWrapper: ({ children }) => (
 *     <TradingContext.Provider value={mockTradingContext}>
 *       {children}
 *     </TradingContext.Provider>
 *   )
 * });
 *
 * // In test file
 * const { user } = renderWithTradingContext(<TradeForm />);
 */
export function createCustomRender(defaultOptions: RenderWithProvidersOptions) {
  return (ui: ReactElement, options: RenderWithProvidersOptions = {}): ExtendedRenderResult => {
    return renderWithProviders(ui, { ...defaultOptions, ...options });
  };
}

/**
 * Helper to wait for an element and then interact with it.
 *
 * @example
 * const { user } = renderWithProviders(<MyComponent />);
 * await waitAndClick(user, () => screen.findByRole('button', { name: 'Submit' }));
 */
export async function waitAndClick(
  user: ReturnType<typeof userEvent.setup>,
  findElement: () => Promise<HTMLElement>
): Promise<void> {
  const element = await findElement();
  await user.click(element);
}

/**
 * Helper to wait for an element and type into it.
 *
 * @example
 * const { user } = renderWithProviders(<MyForm />);
 * await waitAndType(user, () => screen.findByRole('textbox', { name: 'Email' }), 'test@example.com');
 */
export async function waitAndType(
  user: ReturnType<typeof userEvent.setup>,
  findElement: () => Promise<HTMLElement>,
  text: string
): Promise<void> {
  const element = await findElement();
  await user.clear(element);
  await user.type(element, text);
}

/**
 * Helper to fill a form with multiple fields.
 *
 * @example
 * const { user } = renderWithProviders(<LoginForm />);
 * await fillForm(user, {
 *   Email: 'test@example.com',
 *   Password: 'password123'
 * });
 */
export async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  fields: Record<string, string>,
  options: { getByLabel?: boolean } = { getByLabel: true }
): Promise<void> {
  for (const [label, value] of Object.entries(fields)) {
    const input = options.getByLabel
      ? screen.getByLabelText(new RegExp(label, 'i'))
      : screen.getByRole('textbox', { name: new RegExp(label, 'i') });
    await user.clear(input);
    await user.type(input, value);
  }
}

/**
 * Helper to select an option from a dropdown.
 *
 * @example
 * const { user } = renderWithProviders(<MyForm />);
 * await selectOption(user, 'Status', 'Active');
 */
export async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  selectLabel: string,
  optionText: string
): Promise<void> {
  const select = screen.getByRole('combobox', { name: new RegExp(selectLabel, 'i') });
  await user.selectOptions(select, optionText);
}

/**
 * Re-export common testing library utilities for convenience
 */
export { screen, waitFor, within, act } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
