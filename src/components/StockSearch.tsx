'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  type: string;
}

interface StockSearchProps {
  onSelectStock: (symbol: string) => void;
  placeholder?: string;
  className?: string;
}

export default function StockSearch({ 
  onSelectStock, 
  placeholder = "Search stocks (e.g., Apple, AAPL, Tesla...)",
  className = ""
}: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  /**
   * REF PATTERN - Direct DOM Access in React
   * 
   * React refs provide a way to access DOM elements directly, which is necessary
   * for certain operations that can't be handled through React's declarative model.
   * 
   * 🎯 THREE DIFFERENT REF USE CASES DEMONSTRATED:
   * 
   * 1. DOM ELEMENT ACCESS (searchRef, inputRef):
   *    - Access DOM methods like .contains(), .focus(), .blur()
   *    - Measure element dimensions or positions
   *    - Integrate with third-party libraries that need DOM elements
   * 
   * 2. MUTABLE VALUE STORAGE (debounceRef):
   *    - Store values that persist across renders but don't trigger re-renders
   *    - Similar to instance variables in class components
   *    - Perfect for timers, intervals, or any mutable reference
   * 
   * 🔧 TYPE SAFETY WITH REFS:
   * 
   * - `useRef<HTMLDivElement>(null)` - Typed for specific DOM element
   * - `useRef<NodeJS.Timeout>()` - Typed for timeout ID (no initial value)
   * - TypeScript ensures we can only call appropriate methods on each ref
   * 
   * 💡 REF vs STATE DIFFERENCES:
   * 
   * - Refs: Mutable, don't trigger re-renders, persist across renders
   * - State: Immutable, trigger re-renders, managed by React
   * 
   * 🚨 COMMON PITFALLS:
   * 
   * - Always check if ref.current exists before using (it can be null)
   * - Don't read/write refs during rendering (only in effects or event handlers)
   * - Use optional chaining (?.) for safe access: `inputRef.current?.focus()`
   */
  const searchRef = useRef<HTMLDivElement>(null);    // Container element for click-outside detection
  const inputRef = useRef<HTMLInputElement>(null);   // Input element for programmatic focus/blur
  const debounceRef = useRef<NodeJS.Timeout>();      // Timeout ID for debouncing (mutable value)

  /**
   * DEBOUNCED SEARCH PATTERN - Performance Optimization for User Input
   * 
   * Debouncing is a critical performance technique that prevents excessive API calls
   * as users type. Without debouncing, each keystroke would trigger a search request,
   * potentially causing hundreds of unnecessary API calls.
   * 
   * 🎯 HOW DEBOUNCING WORKS:
   * 
   * 1. USER TYPES: Each keystroke triggers this effect
   * 2. CLEAR PREVIOUS: Cancel any pending search from previous keystrokes
   * 3. SET NEW TIMER: Start a new 300ms countdown
   * 4. WAIT: If user keeps typing, timer gets reset (steps 1-3 repeat)
   * 5. EXECUTE: Only when user stops typing for 300ms does search execute
   * 
   * 📊 PERFORMANCE BENEFITS:
   * 
   * - Reduces API calls by ~90% for typical typing patterns
   * - Prevents server overload and rate limiting
   * - Improves user experience (no flickering results)
   * - Reduces bandwidth and costs
   * 
   * 🔧 IMPLEMENTATION DETAILS:
   * 
   * - `debounceRef` persists the timeout ID across renders
   * - `clearTimeout` cancels the previous search before setting a new one
   * - 300ms delay balances responsiveness vs performance
   * - Cleanup function prevents memory leaks and stale searches
   * 
   * 💡 ALTERNATIVE IMPLEMENTATIONS:
   * 
   * ```typescript
   * // Custom hook approach
   * const debouncedQuery = useDebounce(query, 300);
   * 
   * // Library approach (lodash)
   * const debouncedSearch = useMemo(() => debounce(performSearch, 300), []);
   * ```
   */
  // Debounced search
  useEffect(() => {
    // Clear any existing timeout to reset the debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't search for very short queries (performance + UX)
    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Set a new timeout - search will only execute if user stops typing
    debounceRef.current = setTimeout(() => {
      performSearch(query.trim());
    }, 300); // 300ms is a good balance between responsiveness and performance

    // Cleanup: cancel pending search if component unmounts or query changes
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]); // Re-run this effect whenever the query changes

  // Close results when clicking outside
  useEffect(() => {
    /**
     * HYDRATION GUARD PATTERN - Critical for Next.js SSR/SSG Applications
     * 
     * This guard prevents the effect from running during server-side rendering (SSR)
     * or static site generation (SSG), which is essential for several reasons:
     * 
     * 🔍 WHY THIS PATTERN IS NECESSARY:
     * 
     * 1. SERVER-SIDE SAFETY:
     *    - During SSR, there is no `window` object or DOM
     *    - `document.addEventListener` would throw an error on the server
     *    - This prevents hydration mismatches between server and client
     * 
     * 2. HYDRATION PROCESS:
     *    - Next.js first renders the component on the server (no window)
     *    - Then "hydrates" it on the client (window becomes available)
     *    - Without this guard, the server render would fail
     * 
     * 3. PERFORMANCE OPTIMIZATION:
     *    - Avoids unnecessary work during server rendering
     *    - Only runs DOM-dependent code when actually needed (client-side)
     * 
     * 🛡️ HOW THE GUARD WORKS:
     * 
     * - `typeof window === 'undefined'` is true on the server
     * - `typeof window === 'object'` is true in the browser
     * - Early return prevents the rest of the effect from executing
     * 
     * 💡 ALTERNATIVE APPROACHES:
     * 
     * ```typescript
     * // Method 1: Check for document directly
     * if (typeof document === 'undefined') return;
     * 
     * // Method 2: Use a mounted state
     * const [mounted, setMounted] = useState(false);
     * useEffect(() => setMounted(true), []);
     * if (!mounted) return;
     * 
     * // Method 3: Use Next.js dynamic imports with ssr: false
     * const ClientOnlyComponent = dynamic(() => import('./Component'), { ssr: false });
     * ```
     * 
     * 🎯 WHEN TO USE THIS PATTERN:
     * 
     * - Any useEffect that accesses browser-only APIs (document, window, localStorage)
     * - Event listeners that depend on the DOM
     * - Third-party libraries that expect a browser environment
     * - Measurements that require rendered DOM elements
     * 
     * This pattern is a fundamental best practice in Next.js applications and
     * demonstrates defensive programming for universal (isomorphic) JavaScript.
     */
    // Hydration guard - only run on client side
    if (typeof window === 'undefined') return;
    
    /**
     * CLICK-OUTSIDE DETECTION PATTERN
     * 
     * This is a common UI pattern for closing dropdowns, modals, and search results
     * when users click outside the component. Here's how it works:
     * 
     * 1. EVENT DELEGATION:
     *    - Listen on `document` to catch all clicks
     *    - Check if the click target is inside our component
     * 
     * 2. REF-BASED CONTAINMENT CHECK:
     *    - `searchRef.current.contains(event.target)` checks if the clicked
     *      element is a child of our search component
     *    - Returns false if clicked outside, triggering the close logic
     * 
     * 3. MOUSEDOWN vs CLICK:
     *    - Using 'mousedown' instead of 'click' for better UX
     *    - Mousedown fires before focus events, preventing race conditions
     *    - Ensures dropdown closes before other elements receive focus
     */
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    // Add the event listener to the document
    document.addEventListener('mousedown', handleClickOutside);
    
    /**
     * CLEANUP FUNCTION - Essential for Memory Management
     * 
     * The return function is the cleanup function that runs when:
     * - The component unmounts
     * - The effect dependencies change (none in this case)
     * - The component re-renders (though dependencies prevent this here)
     * 
     * Without cleanup:
     * - Event listeners would accumulate on each render
     * - Memory leaks would occur
     * - Stale closures could reference old state values
     * 
     * This is a critical pattern for any effect that creates subscriptions,
     * timers, or event listeners.
     */
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []); // Empty dependency array means this effect runs once after mount

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.data);
        setShowResults(true);
        setSelectedIndex(-1);
      } else {
        console.error('Search failed:', data.error);
        setResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStock = (symbol: string) => {
    setQuery(symbol);
    setShowResults(false);
    setSelectedIndex(-1);
    onSelectStock(symbol);
    inputRef.current?.blur();
  };

  /**
   * KEYBOARD NAVIGATION PATTERN - Accessibility and User Experience
   * 
   * This function implements keyboard navigation for the search dropdown,
   * which is essential for accessibility and power users. It follows
   * standard UI patterns that users expect from search interfaces.
   * 
   * 🎯 ACCESSIBILITY BENEFITS:
   * 
   * - Screen reader users can navigate without a mouse
   * - Keyboard-only users can use the interface efficiently
   * - Follows ARIA design patterns for combobox widgets
   * - Improves overall usability for all users
   * 
   * 🔧 NAVIGATION PATTERNS IMPLEMENTED:
   * 
   * - Arrow Down: Move to next item (wraps to first)
   * - Arrow Up: Move to previous item (wraps to last)
   * - Enter: Select current item or first item if none selected
   * - Escape: Close dropdown and remove focus
   * 
   * 💡 STATE MANAGEMENT DETAILS:
   * 
   * - `selectedIndex` tracks which item is highlighted (-1 = none)
   * - Circular navigation: after last item, goes to first (and vice versa)
   * - `preventDefault()` stops default browser behavior (scrolling, form submission)
   * 
   * 🎨 VISUAL FEEDBACK:
   * 
   * The selected index is used in the render to apply different styling:
   * ```typescript
   * className={index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}
   * ```
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only handle keyboard navigation when results are visible
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        // Prevent default scrolling behavior
        e.preventDefault();
        // Move to next item, or wrap to first item if at the end
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        // Prevent default scrolling behavior
        e.preventDefault();
        // Move to previous item, or wrap to last item if at the beginning
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
        
      case 'Enter':
        // Prevent form submission if this input is in a form
        e.preventDefault();
        // Select the highlighted item, or first item if none highlighted
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectStock(results[selectedIndex].symbol);
        } else if (results.length > 0) {
          // Fallback: select first result if no specific selection
          handleSelectStock(results[0].symbol);
        }
        break;
        
      case 'Escape':
        // Close the dropdown and remove focus from input
        setShowResults(false);
        setSelectedIndex(-1);
        // Optional chaining (?.) safely calls blur even if ref is null
        inputRef.current?.blur();
        break;
    }
  };

  /**
   * TEXT HIGHLIGHTING PATTERN - Search Result Enhancement
   * 
   * This function implements search term highlighting, a common UX pattern that
   * helps users quickly identify why a particular result matched their query.
   * It demonstrates several important JavaScript and React concepts.
   * 
   * 🎯 ALGORITHM BREAKDOWN:
   * 
   * 1. REGEX CREATION:
   *    - `(${query})` creates a capturing group around the search term
   *    - `gi` flags: 'g' = global (find all matches), 'i' = case-insensitive
   *    - Parentheses are crucial - they preserve the matched text in split()
   * 
   * 2. TEXT SPLITTING:
   *    - `split(regex)` breaks text at match boundaries
   *    - With capturing groups, split() includes the matched text in results
   *    - Example: "Apple Inc".split(/(app)/gi) → ["", "App", "le Inc"]
   * 
   * 3. CONDITIONAL RENDERING:
   *    - `regex.test(part)` checks if this part matches the search term
   *    - Matching parts get wrapped in highlighted <span> elements
   *    - Non-matching parts render as plain text
   * 
   * 🎨 STYLING CONSIDERATIONS:
   * 
   * - Uses Tailwind classes for light/dark theme support
   * - `bg-yellow-200 dark:bg-yellow-800` provides good contrast in both themes
   * - `font-semibold` makes highlighted text more prominent
   * 
   * 🔧 REACT PATTERNS DEMONSTRATED:
   * 
   * - Array.map() for rendering lists of elements
   * - Conditional JSX rendering with ternary operator
   * - Key prop for React's reconciliation algorithm
   * 
   * 💡 POTENTIAL IMPROVEMENTS:
   * 
   * ```typescript
   * // Escape special regex characters for safety
   * const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   * 
   * // Support multiple search terms
   * const terms = query.split(' ').filter(Boolean);
   * const regex = new RegExp(`(${terms.join('|')})`, 'gi');
   * ```
   * 
   * This pattern is widely used in search interfaces, autocomplete components,
   * and anywhere users need to quickly scan results for relevance.
   */
  const highlightMatch = (text: string, query: string) => {
    // Early return if no query to highlight
    if (!query) return text;
    
    // Create regex with capturing group for case-insensitive global matching
    const regex = new RegExp(`(${query})`, 'gi');
    
    // Split text by matches, preserving the matched text due to capturing group
    const parts = text.split(regex);
    
    // Map each part to either highlighted span or plain text
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800 font-semibold">
          {part}
        </span>
      ) : part
    );
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        {/* Clear Button */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowResults(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={`${result.symbol}-${result.exchange}`}
              onClick={() => handleSelectStock(result.symbol)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                index === selectedIndex 
                  ? 'bg-blue-50 dark:bg-blue-900/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-foreground">
                      {highlightMatch(result.symbol, query)}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                      {result.exchange}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                    {highlightMatch(result.name, query)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {showResults && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
            <p className="text-sm">No stocks found for "{query}"</p>
            <p className="text-xs mt-1">Try searching by company name or symbol</p>
          </div>
        </div>
      )}
    </div>
  );
}