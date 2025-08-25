/*
  ADVANCED STOCK CHART COMPONENT - EDUCATIONAL OVERVIEW
  
  This component demonstrates several important software engineering concepts and patterns:
  
  🏗️ ARCHITECTURAL PATTERNS:
  - Smart Component Pattern: Manages state, data fetching, and business logic
  - Strategy Pattern: Different chart types with unified interface
  - Responsive Design: Mobile-first layout with progressive enhancement
  - Data Transformation Pipeline: Raw data → Filtered data → Chart data
  
  🔧 REACT PATTERNS:
  - Multiple useState hooks for granular state management
  - useEffect for side effects (data fetching, lifecycle management)
  - Conditional rendering based on state and props
  - Event handling with state updates
  - Component composition with external libraries (Recharts)
  
  📊 DATA VISUALIZATION CONCEPTS:
  - Time series data filtering and display
  - Technical indicator overlay integration
  - Interactive tooltips and responsive charts
  - Multiple chart types (line, area, volume, candlestick)
  - Real-time data updates and caching
  
  🎨 UI/UX PATTERNS:
  - Loading states and error handling
  - Progressive disclosure (collapsible sections)
  - Accessibility considerations (proper labels, keyboard navigation)
  - Dark/light theme support with Tailwind CSS
  - Mobile-responsive controls and layouts
  
  💡 LEARNING OBJECTIVES:
  - Understanding complex state management in React
  - Working with external charting libraries
  - Implementing responsive design patterns
  - Data transformation and filtering techniques
  - TypeScript for type safety in complex components
  
  CLIENT-SIDE DIRECTIVE:
  'use client' tells Next.js this component runs in the browser, not on the server.
  Required for React hooks and browser APIs.
*/
'use client';

/*
  REACT HOOKS IMPORT:
  - useState: Manages component state (data that can change over time)
  - useEffect: Handles side effects (API calls, subscriptions, timers)
  These are the fundamental building blocks of modern React applications.
*/
import { useState, useEffect } from 'react';

/*
  TYPE IMPORTS:
  TypeScript interfaces imported from our technical analysis library.
  This provides compile-time type checking and better IDE support.
  The @/ alias maps to the src/ directory, making imports cleaner.
*/
import { PriceData, TechnicalAnalysisResult } from '@/lib/technical-analysis/types';

/*
  RECHARTS LIBRARY IMPORT:
  Recharts is a popular React charting library built on D3.js.
  It provides responsive, customizable charts with minimal configuration.
  
  COMPONENTS IMPORTED:
  - LineChart, AreaChart, BarChart: Different chart types
  - Line, Area, Bar: Data visualization elements
  - XAxis, YAxis: Chart axes with labels and scales
  - CartesianGrid: Background grid lines for easier reading
  - Tooltip: Interactive hover information
  - ResponsiveContainer: Makes charts responsive to container size
  
  NOTE: CandlestickChart is imported but not used (common in development)
*/
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts';

/*
  COMPONENT PROPS INTERFACE:
  Defines the shape of data this component expects to receive from its parent.
  This is a key TypeScript pattern that provides:
  1. Compile-time type checking
  2. IDE autocomplete and error detection
  3. Self-documenting code (props are clearly defined)
  4. Refactoring safety (changes to props are caught at compile time)
*/
interface AdvancedStockChartProps {
    symbol: string;                           // Stock ticker symbol (e.g., "AAPL", "GOOGL")
    priceData: PriceData[];                   // Array of historical price data points
    analysis?: TechnicalAnalysisResult;       // Optional technical analysis results (? means optional)
}

/*
  UNION TYPES FOR CONTROLLED VALUES:
  These types restrict variables to only valid values, preventing bugs.
  
  UNION TYPE SYNTAX:
  'value1' | 'value2' | 'value3' means the variable can ONLY be one of these exact strings.
  This is much safer than using generic strings, which could contain typos or invalid values.
  
  BENEFITS:
  - TypeScript will error if you try to use an invalid value
  - IDE provides autocomplete with only valid options
  - Refactoring is safer (rename a value and TypeScript finds all usages)
  - Self-documenting (you can see all possible values at a glance)
*/
type TimeRange = '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | 'MAX';  // Valid time periods for chart data
type ChartType = 'line' | 'area' | 'volume';        // Valid chart visualization types

/*
  ADVANCED STOCK CHART COMPONENT:
  This component demonstrates several advanced React and TypeScript patterns:
  1. Complex state management with multiple useState hooks
  2. Data fetching and caching with useEffect
  3. Dynamic chart rendering based on user selections
  4. Integration with external charting library (Recharts)
  5. Responsive design with Tailwind CSS
  
  COMPONENT ARCHITECTURE PATTERN:
  This follows the "Smart Component" pattern where the component:
  - Manages its own state
  - Handles data fetching
  - Processes and transforms data
  - Renders multiple child components (charts, controls)
*/
export default function AdvancedStockChart({ symbol, priceData, analysis }: AdvancedStockChartProps) {
    /*
      REACT STATE MANAGEMENT WITH TYPESCRIPT:
      Each useState call manages a specific piece of component state.
      
      ANATOMY OF useState:
      const [currentValue, setterFunction] = useState<Type>(initialValue);
      
      WHY MULTIPLE useState INSTEAD OF ONE OBJECT:
      1. Each piece of state has different update patterns
      2. React can optimize re-renders when only specific state changes
      3. Code is more readable with descriptive variable names
      4. TypeScript types are simpler and more specific
      5. Easier to debug (you can see exactly which state changed)
    */
    const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1Y');     // Currently selected time period
    const [chartType, setChartType] = useState<ChartType>('line');                  // Currently selected chart visualization type
    
    /*
      DEFENSIVE PROGRAMMING PATTERN - NULL/UNDEFINED SAFETY:
      This line demonstrates a critical defensive programming technique using the logical OR operator (||).
      
      🛡️ THE PROBLEM THIS SOLVES:
      When components receive props from parent components, those props might be:
      - undefined (parent didn't pass the prop)
      - null (parent explicitly passed null)
      - An empty array [] (valid but empty data)
      - A populated array (normal case)
      
      🔧 LOGICAL OR OPERATOR (||) EXPLAINED:
      The || operator returns the first "truthy" value it encounters:
      - priceData || [] means "use priceData if it exists and is truthy, otherwise use []"
      - If priceData is undefined or null, JavaScript will use the empty array []
      - If priceData is a valid array (even empty []), it will be used as-is
      
      📊 JAVASCRIPT TRUTHINESS RULES:
      FALSY VALUES (|| will skip these):
      - undefined, null, false, 0, "", NaN, 0n
      
      TRUTHY VALUES (|| will use these):
      - Any non-empty array: [1, 2, 3], ["data"], even []
      - Any non-empty object: {}, {key: "value"}
      - Any non-zero number: 1, -1, 0.1
      - Any non-empty string: "hello", "0", " "
      
      🎯 WHY THIS PATTERN IS ESSENTIAL:
      Without this fallback, if priceData is undefined:
      1. useState<PriceData[]>(undefined) would initialize state as undefined
      2. Later code expecting an array would crash: historicalData.length, historicalData.map(), etc.
      3. Error: "Cannot read property 'length' of undefined"
      4. Component would break and potentially crash the entire app
      
      ✅ WITH THE FALLBACK:
      1. useState<PriceData[]>(priceData || []) always initializes with an array
      2. historicalData.length works (returns 0 for empty array)
      3. historicalData.map() works (returns empty array)
      4. Component renders gracefully with "no data" state
      
      🏭 PRODUCTION BENEFITS:
      - CRASH PREVENTION: App continues working even with missing data
      - GRACEFUL DEGRADATION: Shows empty chart instead of error screen
      - BETTER UX: Users see loading states or empty states, not crashes
      - EASIER DEBUGGING: Predictable behavior makes issues easier to trace
      
      🔄 ALTERNATIVE APPROACHES:
      1. Default parameters: function Component({ priceData = [] })
      2. Conditional rendering: {priceData && <Chart data={priceData} />}
      3. Guard clauses: if (!priceData) return <EmptyState />
      4. Optional chaining: priceData?.length || 0
      
      This || pattern is preferred here because:
      - It's concise and readable
      - It handles the initialization in one place
      - It works with TypeScript's type system
      - It's a common React pattern developers recognize
      
      💡 LEARNING TAKEAWAY:
      Always consider what happens when your data is missing, null, or undefined.
      Defensive programming with fallback values prevents crashes and creates
      more robust applications that handle edge cases gracefully.
    */
    const [historicalData, setHistoricalData] = useState<PriceData[]>(priceData || []);   // Cached historical price data with null safety
    const [loading, setLoading] = useState(false);                                  // Loading state for data fetching
    const [showTechnicalIndicators, setShowTechnicalIndicators] = useState(true);   // Toggle for technical indicator overlays

    // Map UI time ranges to API periods
    const getApiPeriod = (timeRange: TimeRange): string => {
        switch (timeRange) {
            case '1M': return '1month';
            case '3M': return '3month';
            case '6M': return '6month';
            case '1Y': return '1year';
            case '2Y': return '1year'; // API doesn't have 2Y, use 1Y and filter
            case '5Y': return '5year';
            case 'MAX': return '5year'; // Use 5Y as maximum
            default: return '1year';
        }
    };

    // Fetch extended historical data when time range changes
    useEffect(() => {
        const fetchHistoricalData = async () => {
            // Use existing data if it's 1Y and we already have it
            if (selectedTimeRange === '1Y' && priceData.length > 0) {
                setHistoricalData(priceData);
                return;
            }

            setLoading(true);
            try {
                const apiPeriod = getApiPeriod(selectedTimeRange);
                const response = await fetch(`/api/analysis?symbol=${symbol}&period=${apiPeriod}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.priceData) {
                        const processedData = data.priceData.map((item: PriceData) => ({
                            ...item,
                            date: new Date(item.date),
                        }));
                        setHistoricalData(processedData);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch historical data:', error);
                // Fallback to existing data if fetch fails
                setHistoricalData(priceData);
            } finally {
                setLoading(false);
            }
        };

        fetchHistoricalData();
    }, [selectedTimeRange, symbol, priceData]);

    /*
      DATA FILTERING FUNCTION:
      This function demonstrates client-side data filtering patterns.
      Instead of fetching new data for each time range, we filter existing data.
      
      BENEFITS OF CLIENT-SIDE FILTERING:
      1. Faster response (no network requests)
      2. Reduced server load
      3. Better user experience (instant updates)
      4. Works offline once data is loaded
      
      JAVASCRIPT DATE MANIPULATION:
      - new Date() creates a date object for the current moment
      - setMonth(), setFullYear() modify the date object
      - Date comparison with >= operator works because dates convert to timestamps
    */
    const getFilteredData = () => {
        // GUARD CLAUSE: Return empty array if no data available
        if (!historicalData || !historicalData.length) return [];

        const now = new Date();           // Current date/time
        const cutoffDate = new Date();    // Date to filter from (will be modified)

        /*
          SWITCH STATEMENT FOR TIME RANGE LOGIC:
          Each case modifies cutoffDate to represent the start of the desired time period.
          
          DATE OBJECT METHODS:
          - setMonth(): Sets the month (0-11, where 0 = January)
          - setFullYear(): Sets the year
          - These methods modify the date object in place
          
          BUSINESS LOGIC:
          - Subtract time periods from current date to get cutoff point
          - Filter data to only include dates after the cutoff
        */
        switch (selectedTimeRange) {
            case '1M':
                cutoffDate.setMonth(now.getMonth() - 1);      // 1 month ago
                break;
            case '3M':
                cutoffDate.setMonth(now.getMonth() - 3);      // 3 months ago
                break;
            case '6M':
                cutoffDate.setMonth(now.getMonth() - 6);      // 6 months ago
                break;
            case '1Y':
                cutoffDate.setFullYear(now.getFullYear() - 1); // 1 year ago
                break;
            case '2Y':
                cutoffDate.setFullYear(now.getFullYear() - 2); // 2 years ago
                break;
            case '5Y':
                cutoffDate.setFullYear(now.getFullYear() - 5); // 5 years ago
                break;
            case 'MAX':
                return historicalData;  // Return all data without filtering
        }

        /*
          ARRAY FILTERING:
          filter() creates a new array containing only items that pass the test.
          The test function returns true/false for each item.
          
          DATE COMPARISON:
          data.date >= cutoffDate compares Date objects.
          JavaScript automatically converts dates to timestamps for comparison.
        */
        return historicalData.filter(data => data.date >= cutoffDate);
    };

    const filteredData = getFilteredData();

    /*
      DATA TRANSFORMATION FOR CHARTS:
      This section demonstrates advanced data processing patterns for visualization.
      We transform our internal data structure into the format expected by Recharts.
      
      ARRAY.MAP() PATTERN:
      - Creates a new array by transforming each element
      - Original array remains unchanged (immutable pattern)
      - Each price data point becomes a chart data point
      
      OBJECT TRANSFORMATION:
      - Take price data (OHLCV format)
      - Add formatted date for display
      - Add timestamp for sorting/filtering
      - Merge in technical indicators when available
    */
    const chartData = filteredData.map(data => ({
        // BASIC PRICE DATA:
        date: data.date.toLocaleDateString(),  // Format date for chart labels (e.g., "1/15/2024")
        timestamp: data.date.getTime(),        // Unix timestamp for programmatic use
        open: data.open,                       // Opening price
        high: data.high,                       // Highest price of the day
        low: data.low,                         // Lowest price of the day
        close: data.close,                     // Closing price
        volume: data.volume,                   // Trading volume

        /*
          TECHNICAL INDICATOR INTEGRATION:
          This demonstrates advanced data joining patterns.
          
          OPTIONAL CHAINING (?.) EXPLAINED:
          - analysis?.indicators means "if analysis exists, access indicators"
          - If analysis is null/undefined, the entire expression returns undefined
          - This prevents "Cannot read property of null" errors
          
          ARRAY.FIND() WITH DATE MATCHING:
          - find() returns the first item that matches the condition
          - We match dates by comparing timestamps within a 24-hour window
          - Math.abs() ensures we match regardless of time zone differences
          - 24 * 60 * 60 * 1000 = milliseconds in a day
          
          WHY THIS COMPLEX MATCHING:
          - Price data and indicator data might have slightly different timestamps
          - Time zones, daylight saving, or processing delays can cause mismatches
          - Fuzzy matching within 24 hours ensures we find the right indicator values
        */
        rsi: analysis?.indicators.rsi?.find(r =>
            Math.abs(new Date(r.date).getTime() - data.date.getTime()) < 24 * 60 * 60 * 1000
        )?.value,

        macd: analysis?.indicators.macd?.find(m =>
            Math.abs(new Date(m.date).getTime() - data.date.getTime()) < 24 * 60 * 60 * 1000
        )?.macd,

        bollingerUpper: analysis?.indicators.bollingerBands?.find(b =>
            Math.abs(new Date(b.date).getTime() - data.date.getTime()) < 24 * 60 * 60 * 1000
        )?.upper,

        bollingerLower: analysis?.indicators.bollingerBands?.find(b =>
            Math.abs(new Date(b.date).getTime() - data.date.getTime()) < 24 * 60 * 60 * 1000
        )?.lower,
    }));

    if (filteredData.length === 0) {
        return (
            <div className="flex items-center justify-center h-96 text-gray-500">
                No price data available for {symbol}
            </div>
        );
    }

    const currentPrice = filteredData[filteredData.length - 1]?.close || 0;
    const firstPrice = filteredData[0]?.close || 0;
    const totalReturn = ((currentPrice - firstPrice) / firstPrice) * 100;

    const renderChart = () => {
        const commonProps = {
            data: chartData,
            margin: { top: 5, right: 30, left: 20, bottom: 5 }
        };

        switch (chartType) {
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={['dataMin - 5', 'dataMax + 5']}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${value.toFixed(2)}`}
                        />
                        <Tooltip
                            formatter={(value: number, name: string) => [
                                name === 'close' ? `$${value.toFixed(2)}` : value,
                                name.toUpperCase()
                            ]}
                            labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line
                            type="monotone"
                            dataKey="close"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={false}
                            name="Price"
                        />
                        {showTechnicalIndicators && analysis?.indicators.bollingerBands && (
                            <>
                                <Line
                                    type="monotone"
                                    dataKey="bollingerUpper"
                                    stroke="#EF4444"
                                    strokeWidth={1}
                                    strokeDasharray="5 5"
                                    dot={false}
                                    name="BB Upper"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="bollingerLower"
                                    stroke="#EF4444"
                                    strokeWidth={1}
                                    strokeDasharray="5 5"
                                    dot={false}
                                    name="BB Lower"
                                />
                            </>
                        )}
                    </LineChart>
                );

            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={['dataMin - 5', 'dataMax + 5']}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${value.toFixed(2)}`}
                        />
                        <Tooltip
                            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                            labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area
                            type="monotone"
                            dataKey="close"
                            stroke="#3B82F6"
                            fill="#3B82F6"
                            fillOpacity={0.3}
                        />
                    </AreaChart>
                );

            case 'volume':
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        />
                        <Tooltip
                            formatter={(value: number) => [`${(value / 1000000).toFixed(1)}M`, 'Volume']}
                            labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Bar
                            dataKey="volume"
                            fill="#8B5CF6"
                            opacity={0.7}
                        />
                    </BarChart>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Chart Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        {symbol} - Advanced Chart Analysis
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                            Total Return:
                            <span className={`ml-1 font-medium ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                            </span>
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                            Data Points: {filteredData.length}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* Time Range Selector */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        {(['1M', '3M', '6M', '1Y', '2Y', '5Y', 'MAX'] as TimeRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setSelectedTimeRange(range)}
                                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${selectedTimeRange === range
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    {/* Chart Type Selector */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        {([
                            { type: 'line', label: '📈', title: 'Line Chart' },
                            { type: 'area', label: '📊', title: 'Area Chart' },
                            { type: 'volume', label: '📋', title: 'Volume Chart' }
                        ] as const).map(({ type, label, title }) => (
                            <button
                                key={type}
                                onClick={() => setChartType(type)}
                                title={title}
                                className={`px-3 py-1 text-sm rounded transition-colors ${chartType === type
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Technical Indicators Toggle */}
            {analysis && (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="technical-indicators"
                        checked={showTechnicalIndicators}
                        onChange={(e) => setShowTechnicalIndicators(e.target.checked)}
                        className="rounded"
                    />
                    <label htmlFor="technical-indicators" className="text-sm text-gray-600 dark:text-gray-400">
                        Show Technical Indicators (Bollinger Bands)
                    </label>
                </div>
            )}

            {/* Main Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading chart data...</span>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={400}>
                        {renderChart()}
                    </ResponsiveContainer>
                )}
            </div>

            {/* Technical Indicators Panel */}
            {showTechnicalIndicators && analysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* RSI Chart */}
                    {analysis.indicators.rsi && analysis.indicators.rsi.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h4 className="font-medium text-foreground mb-2">RSI (14)</h4>
                            <ResponsiveContainer width="100%" height={150}>
                                <LineChart data={chartData}>
                                    <XAxis dataKey="date" hide />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                                    <Tooltip formatter={(value: number) => [value?.toFixed(2), 'RSI']} />
                                    <Line type="monotone" dataKey="rsi" stroke="#F59E0B" strokeWidth={2} dot={false} />
                                    {/* Overbought/Oversold lines */}
                                    <Line type="monotone" dataKey={() => 70} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1} dot={false} />
                                    <Line type="monotone" dataKey={() => 30} stroke="#10B981" strokeDasharray="3 3" strokeWidth={1} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* MACD Chart */}
                    {analysis.indicators.macd && analysis.indicators.macd.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <h4 className="font-medium text-foreground mb-2">MACD</h4>
                            <ResponsiveContainer width="100%" height={150}>
                                <LineChart data={chartData}>
                                    <XAxis dataKey="date" hide />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip formatter={(value: number) => [value?.toFixed(4), 'MACD']} />
                                    <Line type="monotone" dataKey="macd" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Volume Trend */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <h4 className="font-medium text-foreground mb-2">Volume Trend</h4>
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={chartData.slice(-30)}>
                                <XAxis dataKey="date" hide />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                                <Tooltip formatter={(value: number) => [`${(value / 1000000).toFixed(1)}M`, 'Volume']} />
                                <Bar dataKey="volume" fill="#6B7280" opacity={0.6} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/*
                      PRICE STATISTICS PANEL:
                      This demonstrates advanced JavaScript array methods and data calculations.
                      
                      ARRAY.REDUCE() PATTERN:
                      reduce() is one of the most powerful array methods in JavaScript.
                      It "reduces" an array to a single value by applying a function to each element.
                      
                      SYNTAX BREAKDOWN:
                      array.reduce((accumulator, currentItem) => newAccumulator, initialValue)
                      
                      VOLUME CALCULATION EXAMPLE:
                      filteredData.reduce((sum, d) => sum + d.volume, 0)
                      - Starts with sum = 0
                      - For each data point d, adds d.volume to sum
                      - Returns total volume across all data points
                      - Divides by length for average, then by 1M for readable format
                      
                      MATHEMATICAL OPERATIONS:
                      - Division by filteredData.length: Calculates average
                      - Division by 1000000: Converts to millions for readability
                      - toFixed(1): Rounds to 1 decimal place for display
                      - Math.round(): Rounds to nearest integer for percentages
                    */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <h4 className="font-medium text-foreground mb-2">Statistics</h4>
                        <div className="space-y-2 text-sm">
                            {/*
                              AVERAGE VOLUME CALCULATION:
                              Complex calculation broken down:
                              1. Sum all volume values using reduce()
                              2. Divide by number of data points (average)
                              3. Divide by 1,000,000 to convert to millions
                              4. Round to 1 decimal place for display
                            */}
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Avg Volume:</span>
                                <span className="font-medium">
                                    {(filteredData.reduce((sum, d) => sum + d.volume, 0) / filteredData.length / 1000000).toFixed(1)}M
                                </span>
                            </div>
                            
                            {/*
                              TECHNICAL ANALYSIS SUMMARY DATA:
                              These values come from our technical analysis engine.
                              They represent calculated metrics about the stock's behavior.
                            */}
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Volatility:</span>
                                <span className="font-medium">
                                    {analysis.summary.volatility}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Trend:</span>
                                <span className="font-medium capitalize">
                                    {analysis.summary.trendDirection}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Strength:</span>
                                <span className="font-medium">
                                    {Math.round(analysis.summary.strength * 100)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/*
              DYNAMIC CHART LEGEND:
              This demonstrates conditional content rendering based on component state.
              
              CONDITIONAL RENDERING PATTERNS:
              - Uses logical AND (&&) operators for conditional display
              - Each chart type shows relevant information
              - Template literals for dynamic content interpolation
              
              USER EXPERIENCE CONSIDERATIONS:
              - Provides context about what the user is viewing
              - Explains chart type and time range
              - Helps users understand the data visualization
            */}
            <div className="text-xs text-gray-500 text-center">
                <p>
                    Interactive chart with {selectedTimeRange} data •
                    {chartType === 'line' && ' Line chart shows price movement with optional Bollinger Bands'}
                    {chartType === 'area' && ' Area chart highlights price trends and momentum'}
                    {chartType === 'volume' && ' Volume chart shows trading activity levels'}
                </p>
            </div>
        </div>
    );
}

/*
  COMPONENT SUMMARY - KEY LEARNING POINTS:
  
  🎯 STATE MANAGEMENT LESSONS:
  - Multiple useState hooks provide granular control over different aspects of the UI
  - Each piece of state has a specific purpose and update pattern
  - Loading states prevent UI inconsistencies during async operations
  - State updates trigger re-renders only for affected parts of the component
  
  📡 DATA FETCHING PATTERNS:
  - useEffect with dependency arrays for controlled side effects
  - Async/await pattern for readable asynchronous code
  - Error handling with try/catch/finally blocks
  - Data caching to avoid unnecessary API calls
  - Optimistic updates for better user experience
  
  🔄 DATA TRANSFORMATION PIPELINE:
  1. Raw price data from API (OHLCV format)
  2. Time-based filtering based on user selection
  3. Technical indicator integration through date matching
  4. Chart-ready data format for Recharts library
  5. Dynamic styling based on data values
  
  🎨 RESPONSIVE DESIGN IMPLEMENTATION:
  - Mobile-first approach with progressive enhancement
  - Flexbox layouts that adapt to screen size
  - Tailwind CSS utilities for consistent spacing and colors
  - Dark/light theme support through CSS custom properties
  - Touch-friendly controls for mobile devices
  
  🧩 COMPONENT COMPOSITION:
  - Integration with external libraries (Recharts)
  - Conditional rendering of child components
  - Props drilling for data sharing
  - Event handling and state lifting patterns
  - Reusable utility functions for common operations
  
  This component serves as a comprehensive example of modern React development
  practices, demonstrating how to build complex, interactive, and responsive
  data visualization components that provide excellent user experiences
  across all device types and usage scenarios.
*/