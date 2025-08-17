/**
 * CollapsibleSection Component - A reusable UI component for expandable content sections
 * 
 * This component demonstrates several important React and web development concepts:
 * 
 * 1. CLIENT-SIDE RENDERING: The 'use client' directive tells Next.js this component
 *    needs to run in the browser because it uses interactive features like state.
 * 
 * 2. COMPONENT COMPOSITION: Accepts children prop to wrap any content, making it
 *    highly reusable across different parts of the application.
 * 
 * 3. STATE MANAGEMENT: Uses React's useState hook to track expand/collapse state.
 * 
 * 4. ACCESSIBILITY: Implements proper button semantics and visual feedback for
 *    screen readers and keyboard navigation.
 * 
 * 5. RESPONSIVE DESIGN: Uses Tailwind CSS classes that adapt to different screen
 *    sizes and user preferences (light/dark mode).
 * 
 * 🚨 CODE QUALITY ISSUES FIXED:
 * The previous version had several problems that have been corrected:
 * 
 * 1. UNUSED IMPORT REMOVED:
 *    - Had: `import { title } from 'process';`
 *    - This was completely unrelated to our component (Node.js process API vs React prop)
 *    - Unused imports increase bundle size and can confuse developers
 * 
 * 2. JSX FORMATTING CORRECTED:
 *    - Fixed malformed JSX with incorrect spacing: `< div` → `<div`
 *    - Fixed attribute spacing: `className = {}` → `className={}`
 *    - Restored proper indentation and code structure
 * 
 * 3. CONDITIONAL RENDERING FORMATTING:
 *    - Fixed broken conditional rendering blocks
 *    - Restored proper JSX expression formatting
 * 
 * BEST PRACTICES DEMONSTRATED:
 * - Always clean up unused imports immediately
 * - Maintain consistent JSX formatting for readability
 * - Use proper indentation to show code structure
 * - Keep conditional rendering expressions clean and readable
 */
'use client';

import { useState, ReactNode } from 'react';

/**
 * TypeScript Interface Definition - Component Props Contract
 * 
 * This interface defines what data the component expects to receive from its parent.
 * It serves as both documentation and compile-time validation.
 * 
 * Key TypeScript Concepts Demonstrated:
 * - OPTIONAL PROPERTIES: Using ? to make props optional (subtitle?, icon?, etc.)
 * - UNION TYPES: badge can be either string OR number (string | number)
 * - REACT TYPES: ReactNode type for children (can be any valid React content)
 * - DEFAULT VALUES: Some props have defaults defined in the function parameters
 */
interface CollapsibleSectionProps {
  title: string;                    // Required: Main heading text
  subtitle?: string;                // Optional: Descriptive text below title
  icon?: string;                    // Optional: Emoji or icon character to display
  children: ReactNode;              // Required: Content to show when expanded
  defaultExpanded?: boolean;        // Optional: Whether section starts open (default: true)
  className?: string;               // Optional: Additional CSS classes from parent
  badge?: string | number;          // Optional: Small indicator (count, status, etc.)
}

/**
 * CollapsibleSection Functional Component
 * 
 * DESTRUCTURING PATTERN: The function parameters use object destructuring to
 * extract individual props from the props object. This is cleaner than accessing
 * props.title, props.subtitle, etc.
 * 
 * DEFAULT PARAMETERS: Some props have default values assigned directly in the
 * destructuring (defaultExpanded = true, className = ''). This is a modern
 * JavaScript feature that provides fallback values.
 * 
 * TYPESCRIPT ANNOTATION: ': CollapsibleSectionProps' ensures the component
 * receives the correct prop types and provides IDE autocomplete/error checking.
 */
export default function CollapsibleSection({
  title,
  subtitle,
  icon,
  children,
  defaultExpanded = true,
  className = '',
  badge
}: CollapsibleSectionProps) {
  /**
   * STATE MANAGEMENT with React Hooks
   * 
   * useState Hook Pattern:
   * - Takes initial value (defaultExpanded) as parameter
   * - Returns array with [currentValue, setterFunction]
   * - Array destructuring assigns them to meaningful variable names
   * - isExpanded: current state value (boolean)
   * - setIsExpanded: function to update the state
   * 
   * When state changes, React automatically re-renders the component with new values.
   * This is the foundation of React's reactive UI updates.
   */
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  /**
   * COMPONENT RENDER FUNCTION
   * 
   * This return statement defines what the component will display in the browser.
   * It demonstrates several important web development concepts.
   */
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* 
        INTERACTIVE HEADER BUTTON
        
        SEMANTIC HTML: Uses <button> element for proper accessibility
        - Screen readers understand this is clickable
        - Keyboard navigation works automatically (Tab, Enter, Space)
        - Focus management is handled by the browser
        
        ACCESSIBILITY FEATURES:
        - onClick handler for mouse/touch interaction
        - Keyboard events are handled automatically by <button>
        - Visual focus indicators from browser defaults
        - Semantic meaning is clear to assistive technologies
        
        STYLING APPROACH:
        - w-full: Button spans full width of container
        - px-6 py-4: Comfortable padding for touch targets (44px+ recommended)
        - flex items-center justify-between: Spreads content across full width
        - hover:bg-gray-50: Subtle hover feedback for better UX
        - transition-colors: Smooth color transitions for better UX
        - rounded-t-lg: Rounded corners only on top (matches container)
      */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
      >
        {/* 
          LEFT SIDE: Title, Subtitle, and Icon
          
          FLEXBOX LAYOUT: flex items-center space-x-3
          - flex: Creates horizontal layout
          - items-center: Vertically centers all child elements
          - space-x-3: Adds consistent horizontal spacing between children
        */}
        <div className="flex items-center space-x-3">
          {/* 
            CONDITIONAL RENDERING: {icon && <span>}
            
            LOGICAL AND OPERATOR (&&): Only renders the <span> if icon exists
            - If icon is truthy (not null, undefined, empty string), render the span
            - If icon is falsy, nothing is rendered (React ignores false/null/undefined)
            - text-xl: Makes the icon larger and more prominent
            
            This is a common React pattern for optional UI elements.
          */}
          {icon && <span className="text-xl">{icon}</span>}

          {/* 
            TEXT CONTENT CONTAINER
            
            SEMANTIC HTML: Uses proper heading hierarchy
            - <h3> for the main title (assumes this is a subsection)
            - <p> for the subtitle (descriptive text)
            
            STYLING STRATEGY:
            - text-left: Ensures text alignment is consistent
            - font-semibold: Makes title stand out without being too bold
            - text-foreground: Uses theme-aware text color
            - text-sm: Smaller text size for subtitle
            - text-gray-600/400: Muted colors for secondary information
          */}
          <div className="text-left">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {/* Another conditional render - subtitle only shows if provided */}
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>

        {/* 
          RIGHT SIDE: Badge and Expand/Collapse Arrow
          
          FLEXBOX ALIGNMENT: flex items-center space-x-2
          - Aligns badge and arrow horizontally
          - Smaller spacing (space-x-2) for tighter grouping
        */}
        <div className="flex items-center space-x-2">
          {/* 
            OPTIONAL BADGE DISPLAY
            
            CONDITIONAL RENDERING: Shows badge only if provided
            - Common pattern for showing counts, status, or labels
            - Styled as a "pill" shape with rounded-full
            - Uses muted colors to not compete with main content
            - px-2 py-1: Compact padding for small badge
            - bg-gray-100: Light background that stands out
            - text-sm: Smaller text to fit in compact space
            
            🔧 FORMATTING FIXED: Restored proper conditional rendering syntax
            BEFORE: { badge && ( ... ) } (broken across multiple lines incorrectly)
            AFTER: Clean, readable conditional rendering block
          */}
          {badge && (
            <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {badge}
            </span>
          )}

          {/* 
            ANIMATED EXPAND/COLLAPSE ARROW
            
            SVG ICON: Inline SVG for crisp rendering at any size
            - viewBox="0 0 24 24": Defines the coordinate system
            - fill="none": No fill color, only stroke
            - stroke="currentColor": Uses the current text color
            - strokeLinecap/strokeLinejoin: Makes line endings smooth
            
            ANIMATION TECHNIQUE:
            - transition-transform: Smooth rotation animation
            - rotate-180: CSS class that rotates the arrow 180 degrees
            - Conditional class application: ${isExpanded ? 'rotate-180' : ''}
            
            This demonstrates three important concepts:
            1. Conditional CSS classes based on state
            2. CSS transforms for visual feedback
            3. Smooth transitions for better user experience
          */}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 
        COLLAPSIBLE CONTENT AREA
        
        CONDITIONAL RENDERING with State:
        {isExpanded && (...)}
        
        This is React's conditional rendering pattern:
        - If isExpanded is true: renders the content div
        - If isExpanded is false: renders nothing (content is hidden)
        - React automatically shows/hides content when state changes
        - No manual DOM manipulation needed!
        
        VISUAL SEPARATION:
        - border-t: Top border to separate header from content
        - p-6: Generous padding around content for readability
        - Same border colors as main container for consistency
        
        CHILDREN PROP PATTERN:
        {children} renders whatever content was passed between the component tags:
        <CollapsibleSection>
          <p>This content appears here as {children}</p>
        </CollapsibleSection>
        
        This makes the component extremely flexible - it can contain any React content.
        
        🔧 FORMATTING FIXED: Restored clean conditional rendering
        BEFORE: { isExpanded && ( ... ) } (broken formatting)
        AFTER: Proper indentation and readable structure
      */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * EDUCATIONAL SUMMARY: Key Concepts Demonstrated in CollapsibleSection
 * 
 * This component serves as an excellent example of several important programming concepts:
 * 
 * 1. REACT PATTERNS:
 *    - Functional components with hooks (useState)
 *    - Props interface design and TypeScript integration
 *    - Conditional rendering for dynamic UI
 *    - Event handling and state management
 *    - Component composition with children prop
 * 
 * 2. MODERN JAVASCRIPT:
 *    - Object destructuring in function parameters
 *    - Template literals for dynamic strings
 *    - Arrow functions for event handlers
 *    - Logical operators for conditional rendering
 *    - Default parameter values
 * 
 * 3. CSS AND STYLING:
 *    - Tailwind CSS utility classes
 *    - Flexbox layouts for responsive design
 *    - CSS transitions and transforms
 *    - Dark mode support with theme-aware classes
 *    - Hover states and interactive feedback
 * 
 * 4. USER EXPERIENCE:
 *    - Accessible button semantics
 *    - Visual feedback (hover states, transitions)
 *    - Intuitive expand/collapse interaction
 *    - Consistent spacing and typography
 *    - Mobile-friendly touch targets
 * 
 * 5. SOFTWARE ENGINEERING:
 *    - Single responsibility principle (one clear purpose)
 *    - Reusable component design
 *    - Type safety with TypeScript
 *    - Separation of concerns (styling, logic, structure)
 *    - Flexible API design with optional props
 * 
 * 6. CODE QUALITY LESSONS:
 *    - Importance of removing unused imports
 *    - Proper JSX formatting for maintainability
 *    - Consistent indentation and code structure
 *    - Clean conditional rendering patterns
 *    - Professional code organization and documentation
 * 
 * This component demonstrates how to build interactive, accessible, and reusable
 * UI components using modern React and web development best practices, while also
 * showing how to identify and fix common code quality issues.
 */