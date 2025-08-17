/**
 * MockWatchlistManager Component - A Complete CRUD Interface for Stock Watchlists
 * 
 * This component demonstrates several important React and web development concepts:
 * 
 * 1. CLIENT-SIDE RENDERING: The 'use client' directive tells Next.js this component
 *    needs to run in the browser because it uses interactive features like state
 *    management, event handlers, and dynamic UI updates.
 * 
 * 2. CRUD OPERATIONS: Create, Read, Update, Delete functionality for managing
 *    watchlists and their associated stock symbols. This is a fundamental pattern
 *    in most web applications for data management.
 * 
 * 3. STATE MANAGEMENT: Uses React's useState hook to manage complex application
 *    state including lists, forms, loading states, and user interactions.
 * 
 * 4. MOCK DATA PATTERN: Provides a working interface without requiring a backend
 *    database, useful for development, testing, and demonstrations.
 * 
 * 5. RESPONSIVE DESIGN: Uses Tailwind CSS classes to create layouts that work
 *    on both desktop and mobile devices with grid systems and breakpoints.
 */
'use client';

import { useState, useEffect } from 'react';

/**
 * Watchlist Interface - TypeScript Type Definition
 * 
 * This interface defines the structure of a watchlist object, providing:
 * - TYPE SAFETY: Ensures all watchlist objects have consistent structure
 * - INTELLISENSE: Enables autocomplete and error checking in IDEs
 * - DOCUMENTATION: Serves as living documentation of the data model
 * - OPTIONAL PROPERTIES: The '?' makes description optional (can be undefined)
 * 
 * Benefits of TypeScript interfaces:
 * - Catch errors at compile time rather than runtime
 * - Make code more maintainable and self-documenting
 * - Enable better refactoring and IDE support
 */
interface Watchlist {
  id: string;           // Unique identifier for the watchlist
  name: string;         // User-defined name (e.g., "Tech Stocks")
  description?: string; // Optional description (? means it can be undefined)
  stocks: string[];     // Array of stock symbols (e.g., ["AAPL", "GOOGL"])
}

export default function MockWatchlistManager() {
  /**
   * STATE MANAGEMENT with React Hooks
   * 
   * React's useState hook allows components to have internal state that persists
   * between re-renders. Each useState call returns [currentValue, setterFunction].
   * 
   * State Management Patterns Demonstrated:
   * - ARRAY STATE: Managing lists of complex objects (watchlists)
   * - BOOLEAN STATE: Controlling UI visibility (loading, showCreateForm)
   * - STRING STATE: Managing form inputs and user selections
   * - NULLABLE STATE: Handling optional selections (selectedWatchlist)
   * 
   * Why separate state variables instead of one big object?
   * - Each piece of state has different update patterns
   * - Smaller, focused updates are more efficient
   * - Easier to reason about individual state changes
   * - Better performance (React can optimize individual updates)
   */
  
  // Main data: Array of watchlist objects
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  
  // UI state: Controls loading spinner visibility
  const [loading, setLoading] = useState(true);
  
  // Form state: Controls create form visibility
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form inputs: Controlled components for new watchlist creation
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistDescription, setNewWatchlistDescription] = useState('');
  
  // Selection state: Tracks which watchlist is being modified
  const [selectedWatchlist, setSelectedWatchlist] = useState<string | null>(null);
  
  // Input state: For adding new stock symbols
  const [newSymbol, setNewSymbol] = useState('');

  /**
   * DATA INITIALIZATION with useEffect Hook
   * 
   * useEffect runs side effects in functional components. Here it's used for:
   * - COMPONENT MOUNTING: Runs once when component first renders (empty dependency array [])
   * - DATA LOADING SIMULATION: Mimics fetching data from an API or database
   * - LOADING STATE MANAGEMENT: Shows spinner while "loading" data
   * 
   * Key Concepts:
   * - SIDE EFFECTS: Operations that affect something outside the component
   * - DEPENDENCY ARRAY: [] means "run once on mount, never again"
   * - ASYNC SIMULATION: setTimeout mimics real-world API delays
   * - MOCK DATA: Realistic sample data for development and testing
   * 
   * In a real application, this would be an API call:
   * fetch('/api/watchlists').then(data => setWatchlists(data))
   */
  useEffect(() => {
    let isMounted = true;
    
    // Create realistic mock data that represents different investment strategies
    const mockWatchlists: Watchlist[] = [
      {
        id: '1',
        name: 'Tech Stocks',
        description: 'Major technology companies',
        stocks: ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'TSLA']
      },
      {
        id: '2',
        name: 'Blue Chips',
        description: 'Large cap dividend stocks',
        stocks: ['JNJ', 'PG', 'KO', 'PEP', 'WMT']
      },
      {
        id: '3',
        name: 'Growth Portfolio',
        description: 'High growth potential stocks',
        stocks: ['AMZN', 'META', 'CRM', 'NFLX']
      }
    ];
    
    // Simulate network delay to show loading state (realistic UX)
    // In real apps, this would be the time for API calls to complete
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setWatchlists(mockWatchlists);  // Update state with mock data
        setLoading(false);              // Hide loading spinner
      }
    }, 500);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []); // Empty dependency array = run once on component mount

  /**
   * CREATE OPERATION - Adding New Watchlists
   * 
   * This function demonstrates several important patterns:
   * 
   * 1. INPUT VALIDATION: Check if required fields are provided
   * 2. DATA SANITIZATION: Use trim() to remove whitespace
   * 3. UNIQUE ID GENERATION: Use timestamp for simple unique IDs
   * 4. IMMUTABLE UPDATES: Create new arrays instead of mutating existing ones
   * 5. FORM RESET: Clear inputs and hide form after successful creation
   * 6. OPTIMISTIC UPDATES: Update UI immediately (no waiting for server)
   * 
   * Why immutable updates?
   * - React detects changes by comparing object references
   * - Mutating existing objects can cause React to miss updates
   * - Immutable patterns make debugging easier and prevent bugs
   */
  const createWatchlist = () => {
    // INPUT VALIDATION: Ensure required field is not empty
    if (!newWatchlistName.trim()) return;
    
    // CREATE NEW OBJECT: Build the watchlist with validated data
    const newWatchlist: Watchlist = {
      id: Date.now().toString(),                                    // Simple unique ID (timestamp)
      name: newWatchlistName.trim(),                               // Remove whitespace
      description: newWatchlistDescription.trim() || undefined,    // Empty string becomes undefined
      stocks: []                                                   // Start with empty stock list
    };
    
    // IMMUTABLE UPDATE: Create new array with new item at the beginning
    // [...array] creates a copy, avoiding mutation of the original array
    setWatchlists([newWatchlist, ...watchlists]);
    
    // FORM RESET: Clear all form inputs and hide the form
    setNewWatchlistName('');
    setNewWatchlistDescription('');
    setShowCreateForm(false);
  };

  /**
   * UPDATE OPERATION - Adding Stocks to Existing Watchlists
   * 
   * This function demonstrates advanced array manipulation patterns:
   * 
   * 1. CONDITIONAL UPDATES: Only modify the target watchlist
   * 2. DUPLICATE PREVENTION: Check if stock already exists before adding
   * 3. DATA NORMALIZATION: Convert symbols to uppercase for consistency
   * 4. IMMUTABLE ARRAY UPDATES: Use map() and spread operator for safe updates
   * 5. NESTED OBJECT UPDATES: Update properties within objects in arrays
   * 
   * The map() pattern is crucial for React state updates:
   * - Creates a new array (React can detect the change)
   * - Only modifies the target item (efficient)
   * - Preserves all other items unchanged (safe)
   */
  const addStockToWatchlist = (watchlistId: string) => {
    // INPUT VALIDATION: Ensure symbol is provided
    if (!newSymbol.trim()) return;
    
    // DATA NORMALIZATION: Stock symbols are conventionally uppercase
    const symbol = newSymbol.trim().toUpperCase();
    
    // IMMUTABLE UPDATE PATTERN: Use map() to create new array with updated item
    setWatchlists(watchlists.map(w => 
      w.id === watchlistId 
        ? { 
            // OBJECT SPREAD: Copy all existing properties
            ...w, 
            // CONDITIONAL ARRAY UPDATE: Add symbol only if it doesn't exist
            stocks: w.stocks.includes(symbol) 
              ? w.stocks                    // Symbol exists, keep current array
              : [...w.stocks, symbol]       // Symbol new, add to copy of array
          }
        : w  // Not the target watchlist, return unchanged
    ));
    
    // FORM RESET: Clear the input field
    setNewSymbol('');
  };

  /**
   * DELETE OPERATION - Removing Stocks from Watchlists
   * 
   * This function shows the filter() method for removing items:
   * 
   * 1. ARRAY FILTERING: Use filter() to create new array without target item
   * 2. IMMUTABLE DELETION: Never mutate original arrays
   * 3. CONDITIONAL UPDATES: Only modify the target watchlist
   * 4. SIMPLE COMPARISON: Direct string comparison for removal
   * 
   * filter() vs splice():
   * - filter() creates new array (immutable, React-friendly)
   * - splice() modifies existing array (mutable, can cause React bugs)
   */
  const removeStockFromWatchlist = (watchlistId: string, symbol: string) => {
    // IMMUTABLE DELETION: Use map + filter pattern
    setWatchlists(watchlists.map(w => 
      w.id === watchlistId 
        ? { 
            ...w, 
            // FILTER OUT TARGET: Keep all stocks except the one to remove
            stocks: w.stocks.filter(s => s !== symbol) 
          }
        : w  // Not the target watchlist, return unchanged
    ));
  };

  /**
   * DELETE OPERATION - Removing Entire Watchlists
   * 
   * This function demonstrates:
   * 
   * 1. USER CONFIRMATION: Prevent accidental deletions with confirm dialog
   * 2. CASCADING UPDATES: Update related state when deleting items
   * 3. DEFENSIVE PROGRAMMING: Handle edge cases (selected item being deleted)
   * 4. SIMPLE FILTERING: Remove items by ID comparison
   * 
   * UX Considerations:
   * - Always confirm destructive actions
   * - Clean up related state to prevent orphaned references
   * - Provide clear feedback about what will be deleted
   */
  const deleteWatchlist = (watchlistId: string) => {
    // USER CONFIRMATION: Prevent accidental deletions
    // confirm() shows browser dialog - in production, use custom modal
    if (!confirm('Are you sure you want to delete this watchlist?')) return;
    
    // REMOVE FROM LIST: Filter out the target watchlist
    setWatchlists(watchlists.filter(w => w.id !== watchlistId));
    
    // CASCADING UPDATE: Clear selection if deleted item was selected
    // This prevents UI bugs from referencing non-existent items
    if (selectedWatchlist === watchlistId) {
      setSelectedWatchlist(null);
    }
  };

  /**
   * LOADING STATE HANDLING
   * 
   * This demonstrates important UX patterns:
   * 
   * 1. EARLY RETURN: Handle special states before main render
   * 2. LOADING INDICATORS: Show visual feedback during async operations
   * 3. ACCESSIBILITY: Provide text description for screen readers
   * 4. CSS ANIMATIONS: Use Tailwind's animate-spin for smooth loading spinner
   * 5. CONDITIONAL RENDERING: Different UI based on application state
   * 
   * Why show loading states?
   * - Users need feedback that something is happening
   * - Prevents confusion about whether the app is working
   * - Improves perceived performance
   * - Better accessibility for users with disabilities
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        {/* LOADING SPINNER: CSS animation with Tailwind classes */}
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        {/* ACCESSIBLE TEXT: Screen readers can announce loading state */}
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading watchlists...</span>
      </div>
    );
  }

  /**
   * MAIN COMPONENT RENDER
   * 
   * The return statement contains the JSX that defines the component's UI.
   * This demonstrates several important React and web development concepts:
   * 
   * 1. JSX SYNTAX: HTML-like syntax that gets compiled to JavaScript
   * 2. COMPONENT COMPOSITION: Building complex UIs from simple elements
   * 3. EVENT HANDLERS: onClick functions that respond to user interactions
   * 4. CONDITIONAL RENDERING: Show/hide elements based on state
   * 5. RESPONSIVE DESIGN: Tailwind classes that adapt to screen size
   * 6. ACCESSIBILITY: Semantic HTML and proper contrast ratios
   */
  return (
    <div className="space-y-6">
      {/* HEADER SECTION: Title and primary action */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">My Watchlists</h2>
          {/* INFORMATIONAL TEXT: Let users know this is a demo */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Mock version - data stored in browser memory
          </p>
        </div>
        {/* PRIMARY ACTION BUTTON: Most important user action */}
        <button
          onClick={() => setShowCreateForm(true)}  // EVENT HANDLER: Show form when clicked
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          Create Watchlist
        </button>
      </div>

      {/* 
        CONDITIONAL RENDERING: Create Watchlist Form
        
        This demonstrates the && operator for conditional rendering:
        - If showCreateForm is true, render the form
        - If showCreateForm is false, render nothing
        
        This is a common React pattern for showing/hiding UI elements
        based on state without using if/else statements in JSX.
      */}
      {showCreateForm && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
          <h3 className="font-medium text-foreground mb-3">Create New Watchlist</h3>
          <div className="space-y-3">
            {/* 
              CONTROLLED COMPONENTS: Form inputs managed by React state
              
              Key concepts:
              - value={state}: Input value comes from React state
              - onChange={handler}: Updates state when user types
              - This gives React full control over the input
              - Enables validation, formatting, and complex interactions
            */}
            <input
              type="text"
              placeholder="Watchlist name"
              value={newWatchlistName}                                    // CONTROLLED: Value from state
              onChange={(e) => setNewWatchlistName(e.target.value)}      // UPDATE: State on change
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newWatchlistDescription}                             // CONTROLLED: Value from state
              onChange={(e) => setNewWatchlistDescription(e.target.value)} // UPDATE: State on change
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-foreground"
            />
            {/* BUTTON GROUP: Primary and secondary actions */}
            <div className="flex gap-2">
              <button
                onClick={createWatchlist}  // SUBMIT ACTION: Create the watchlist
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}  // CANCEL ACTION: Hide form
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        RESPONSIVE GRID LAYOUT: Watchlists Display
        
        This demonstrates responsive design with Tailwind CSS:
        - grid-cols-1: 1 column on mobile (default)
        - md:grid-cols-2: 2 columns on medium screens (768px+)
        - lg:grid-cols-3: 3 columns on large screens (1024px+)
        
        This creates a layout that adapts to different screen sizes
        for optimal viewing on mobile, tablet, and desktop.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 
          ARRAY RENDERING: Display each watchlist
          
          The map() function is essential for rendering lists in React:
          - Takes an array and returns JSX for each item
          - Each item needs a unique 'key' prop for React's reconciliation
          - Creates dynamic UI that updates when the array changes
          
          Why keys matter:
          - React uses keys to track which items changed
          - Without keys, React may re-render unnecessarily
          - Keys should be stable and unique (IDs, not array indices)
        */}
        {watchlists.map((watchlist) => (
          <div
            key={watchlist.id}  // UNIQUE KEY: Required for React list rendering
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
          >
            {/* WATCHLIST HEADER: Name, description, and delete button */}
            <div className="flex justify-between items-start mb-3">
              <div>
                {/* DYNAMIC CONTENT: Display data from the watchlist object */}
                <h3 className="font-medium text-foreground">{watchlist.name}</h3>
                {/* 
                  CONDITIONAL RENDERING: Only show description if it exists
                  
                  The && operator is perfect for optional content:
                  - If watchlist.description is truthy, render the <p> element
                  - If watchlist.description is falsy (undefined/empty), render nothing
                */}
                {watchlist.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {watchlist.description}
                  </p>
                )}
              </div>
              {/* 
                DELETE BUTTON: Destructive action with visual cues
                
                UX considerations:
                - Red color indicates destructive action
                - Hover state provides feedback
                - Positioned away from main content to prevent accidents
                - Uses × symbol (universally understood for "close/delete")
              */}
              <button
                onClick={() => deleteWatchlist(watchlist.id)}  // PASS ID: Identify which to delete
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ✕
              </button>
            </div>

            {/* 
              NESTED ARRAY RENDERING: Display stocks within each watchlist
              
              This shows a common pattern of nested data rendering:
              - Outer map() for watchlists
              - Inner map() for stocks within each watchlist
              - Each level needs its own key prop
            */}
            <div className="space-y-2 mb-3">
              {watchlist.stocks.map((stock, index) => (
                <div
                  key={index}  // KEY: Using index since stock symbols might repeat across watchlists
                  className="flex justify-between items-center py-1 px-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                >
                  {/* STOCK SYMBOL: Display the stock ticker */}
                  <span className="font-medium text-foreground">{stock}</span>
                  {/* 
                    REMOVE BUTTON: Individual stock removal
                    
                    Note: This passes both watchlist ID and stock symbol
                    to identify exactly which stock to remove from which list
                  */}
                  <button
                    onClick={() => removeStockFromWatchlist(watchlist.id, stock)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              {/* 
                EMPTY STATE: Show helpful message when no stocks exist
                
                Empty states are important for UX:
                - Tell users what to expect
                - Provide guidance on next actions
                - Prevent confusion about whether something is broken
              */}
              {watchlist.stocks.length === 0 && (
                <p className="text-sm text-gray-500 italic">No stocks added yet</p>
              )}
            </div>

            {/* 
              ADD STOCK FORM: Inline form for each watchlist
              
              This demonstrates several advanced React patterns:
              - SHARED STATE: One input field state shared across multiple forms
              - FOCUS MANAGEMENT: Track which watchlist is being edited
              - KEYBOARD SHORTCUTS: Enter key to submit
              - REAL-TIME FORMATTING: Convert to uppercase as user types
            */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add symbol"
                  /* 
                    CONDITIONAL VALUE: Only show input value for the selected watchlist
                    This prevents the same text appearing in all input fields
                  */
                  value={selectedWatchlist === watchlist.id ? newSymbol : ''}
                  onChange={(e) => {
                    // FOCUS TRACKING: Remember which watchlist is being edited
                    setSelectedWatchlist(watchlist.id);
                    // REAL-TIME FORMATTING: Convert to uppercase for stock symbols
                    setNewSymbol(e.target.value.toUpperCase());
                  }}
                  /* 
                    KEYBOARD SHORTCUT: Submit on Enter key
                    
                    This improves UX by allowing keyboard-only interaction
                    Common pattern for form inputs
                  */
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addStockToWatchlist(watchlist.id);
                    }
                  }}
                  className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-foreground"
                />
                {/* SUBMIT BUTTON: Alternative to Enter key */}
                <button
                  onClick={() => addStockToWatchlist(watchlist.id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 
        EMPTY STATE: Show when no watchlists exist
        
        Empty states are crucial for good UX:
        - Explain why the screen is empty
        - Guide users toward their first action
        - Prevent confusion about whether the app is working
        - Use encouraging, helpful language
      */}
      {watchlists.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No watchlists yet. Create your first watchlist to get started!
          </p>
        </div>
      )}

      {/* 
        INFORMATIONAL BANNER: Explain mock mode limitations
        
        This demonstrates good communication patterns:
        - Clear visual distinction (blue background)
        - Icon for quick recognition
        - Explain current limitations
        - Provide path to full functionality
      */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          {/* VISUAL INDICATOR: Icon helps users quickly identify info messages */}
          <div className="text-blue-600 dark:text-blue-400 mr-2">ℹ️</div>
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Mock Mode</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              This is a demo version that stores data in memory. To enable persistent storage, install PostgreSQL and run the database setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * EDUCATIONAL SUMMARY: Key Concepts Demonstrated in MockWatchlistManager
 * 
 * This component serves as an excellent example of several important web development concepts:
 * 
 * 1. REACT PATTERNS:
 *    - Functional components with hooks (useState, useEffect)
 *    - Controlled components for form inputs
 *    - Conditional rendering with && operator
 *    - Array rendering with map() and keys
 *    - Event handling and state updates
 * 
 * 2. STATE MANAGEMENT:
 *    - Multiple useState hooks for different concerns
 *    - Immutable update patterns with spread operator
 *    - Cascading updates (cleaning up related state)
 *    - Form state management and validation
 * 
 * 3. USER EXPERIENCE:
 *    - Loading states and empty states
 *    - Confirmation dialogs for destructive actions
 *    - Keyboard shortcuts (Enter to submit)
 *    - Real-time input formatting
 *    - Clear visual hierarchy and feedback
 * 
 * 4. CRUD OPERATIONS:
 *    - Create: Add new watchlists with validation
 *    - Read: Display existing watchlists and stocks
 *    - Update: Add/remove stocks from watchlists
 *    - Delete: Remove watchlists with confirmation
 * 
 * 5. RESPONSIVE DESIGN:
 *    - CSS Grid with breakpoint-based columns
 *    - Flexible layouts that work on all screen sizes
 *    - Consistent spacing and typography
 *    - Dark mode support with CSS custom properties
 * 
 * 6. ACCESSIBILITY:
 *    - Semantic HTML structure
 *    - Proper contrast ratios for text
 *    - Keyboard navigation support
 *    - Screen reader friendly content
 * 
 * This component demonstrates how to build a complete, interactive feature
 * using modern React patterns while maintaining good UX and accessibility practices.
 */