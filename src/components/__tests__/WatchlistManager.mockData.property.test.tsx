/**
 * Property Test: Mock Data Toggle Behavior
 * 
 * Feature: codebase-cleanup, Property 3: Mock Data Toggle Behavior
 * Validates: Requirements 2.2, 2.3
 * 
 * This test verifies that when useMockData=true, the WatchlistManager component
 * does not make any network requests to /api/watchlists endpoints and uses
 * in-memory mock data for all CRUD operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import WatchlistManager from '../WatchlistManager';

// Track all fetch calls
let fetchCalls: string[] = [];

// Mock fetch globally to track calls
const originalFetch = global.fetch;

describe('Property 3: Mock Data Toggle Behavior', () => {
  beforeEach(() => {
    fetchCalls = [];
    
    // Mock fetch to track all calls
    global.fetch = vi.fn().mockImplementation((url: string) => {
      fetchCalls.push(url);
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });
    });

    // Mock window.confirm for delete operations
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  /**
   * Property: No network requests when useMockData=true
   * 
   * For any rendering of WatchlistManager with useMockData=true,
   * no fetch calls should be made to /api/watchlists endpoints.
   */
  it('does not make network requests when useMockData=true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // dummy arbitrary to run multiple times
        async () => {
          cleanup();
          fetchCalls = [];
          
          render(<WatchlistManager useMockData={true} />);

          // Wait for component to finish loading
          await waitFor(() => {
            expect(screen.queryByText(/Loading watchlists/i)).not.toBeInTheDocument();
          });

          // Verify no fetch calls were made
          const watchlistApiCalls = fetchCalls.filter(url => 
            url.includes('/api/watchlists')
          );
          
          expect(watchlistApiCalls.length).toBe(0);

          cleanup();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Create operation does not make network requests in mock mode
   * 
   * For any watchlist name, creating a watchlist with useMockData=true
   * should not make any network requests.
   */
  it('create operation does not make network requests in mock mode', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        async (watchlistName) => {
          cleanup();
          fetchCalls = [];
          
          render(<WatchlistManager useMockData={true} />);

          // Wait for component to load
          await waitFor(() => {
            expect(screen.queryByText(/Loading watchlists/i)).not.toBeInTheDocument();
          });

          // Clear any calls from initial render
          fetchCalls = [];

          // Click create button
          const createButton = screen.getByText('Create Watchlist');
          fireEvent.click(createButton);

          // Fill in the form
          const nameInput = screen.getByPlaceholderText('Watchlist name');
          fireEvent.change(nameInput, { target: { value: watchlistName } });

          // Submit the form
          const submitButton = screen.getByText('Create');
          fireEvent.click(submitButton);

          // Verify no fetch calls were made for create
          const watchlistApiCalls = fetchCalls.filter(url => 
            url.includes('/api/watchlists')
          );
          
          expect(watchlistApiCalls.length).toBe(0);

          cleanup();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Delete operation does not make network requests in mock mode
   * 
   * For any watchlist deletion with useMockData=true,
   * no network requests should be made.
   */
  it('delete operation does not make network requests in mock mode', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // dummy arbitrary
        async () => {
          cleanup();
          fetchCalls = [];
          
          render(<WatchlistManager useMockData={true} />);

          // Wait for component to load with mock data
          await waitFor(() => {
            expect(screen.queryByText(/Loading watchlists/i)).not.toBeInTheDocument();
          });

          // Clear any calls from initial render
          fetchCalls = [];

          // Find and click a delete button (✕)
          const deleteButtons = screen.getAllByText('✕');
          if (deleteButtons.length > 0) {
            fireEvent.click(deleteButtons[0]);
          }

          // Verify no fetch calls were made for delete
          const watchlistApiCalls = fetchCalls.filter(url => 
            url.includes('/api/watchlists')
          );
          
          expect(watchlistApiCalls.length).toBe(0);

          cleanup();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Add stock operation does not make network requests in mock mode
   * 
   * For any stock symbol, adding it to a watchlist with useMockData=true
   * should not make any network requests.
   */
  it('add stock operation does not make network requests in mock mode', async () => {
    const validSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN'];
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...validSymbols),
        async (symbol) => {
          cleanup();
          fetchCalls = [];
          
          render(<WatchlistManager useMockData={true} />);

          // Wait for component to load with mock data
          await waitFor(() => {
            expect(screen.queryByText(/Loading watchlists/i)).not.toBeInTheDocument();
          });

          // Clear any calls from initial render
          fetchCalls = [];

          // Find an add symbol input and add button
          const addInputs = screen.getAllByPlaceholderText('Add symbol');
          const addButtons = screen.getAllByText('Add');
          
          if (addInputs.length > 0 && addButtons.length > 0) {
            fireEvent.change(addInputs[0], { target: { value: symbol } });
            fireEvent.click(addButtons[0]);
          }

          // Verify no fetch calls were made for add stock
          const watchlistApiCalls = fetchCalls.filter(url => 
            url.includes('/api/watchlists')
          );
          
          expect(watchlistApiCalls.length).toBe(0);

          cleanup();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Remove stock operation does not make network requests in mock mode
   * 
   * For any stock removal with useMockData=true,
   * no network requests should be made.
   */
  it('remove stock operation does not make network requests in mock mode', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // dummy arbitrary
        async () => {
          cleanup();
          fetchCalls = [];
          
          render(<WatchlistManager useMockData={true} />);

          // Wait for component to load with mock data
          await waitFor(() => {
            expect(screen.queryByText(/Loading watchlists/i)).not.toBeInTheDocument();
          });

          // Clear any calls from initial render
          fetchCalls = [];

          // Find and click a remove button for a stock
          const removeButtons = screen.getAllByText('Remove');
          if (removeButtons.length > 0) {
            fireEvent.click(removeButtons[0]);
          }

          // Verify no fetch calls were made for remove stock
          const watchlistApiCalls = fetchCalls.filter(url => 
            url.includes('/api/watchlists')
          );
          
          expect(watchlistApiCalls.length).toBe(0);

          cleanup();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Mock mode displays mock data indicator
   * 
   * When useMockData=true, the component should display an indicator
   * that mock mode is active.
   */
  it('displays mock mode indicator when useMockData=true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // dummy arbitrary
        async () => {
          cleanup();
          
          render(<WatchlistManager useMockData={true} />);

          // Wait for component to load
          await waitFor(() => {
            expect(screen.queryByText(/Loading watchlists/i)).not.toBeInTheDocument();
          });

          // Verify mock mode indicator is displayed
          const mockModeIndicators = screen.getAllByText(/Mock mode/i);
          expect(mockModeIndicators.length).toBeGreaterThan(0);

          cleanup();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Mock data is loaded when useMockData=true
   * 
   * When useMockData=true, the component should display the predefined
   * mock watchlists (Tech Stocks, Blue Chips).
   */
  it('loads predefined mock data when useMockData=true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(), // dummy arbitrary
        async () => {
          cleanup();
          
          render(<WatchlistManager useMockData={true} />);

          // Wait for component to load
          await waitFor(() => {
            expect(screen.queryByText(/Loading watchlists/i)).not.toBeInTheDocument();
          });

          // Verify mock watchlists are displayed (use getAllByText since there might be multiple)
          const techStocksElements = screen.getAllByText('Tech Stocks');
          const blueChipsElements = screen.getAllByText('Blue Chips');
          
          expect(techStocksElements.length).toBeGreaterThan(0);
          expect(blueChipsElements.length).toBeGreaterThan(0);

          cleanup();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
