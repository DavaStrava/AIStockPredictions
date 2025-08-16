/**
 * CollapsibleSection Component - A reusable UI component for expandable content sections
 * 
 * This component demonstrates several important React and UI design patterns:
 * 
 * 1. CLIENT-SIDE RENDERING: The 'use client' directive tells Next.js this component
 *    needs to run in the browser because it uses interactive features like state
 *    management and event handlers.
 * 
 * 2. COMPOUND COMPONENT PATTERN: This component acts as a container that can wrap
 *    any content (children), making it highly reusable across different contexts.
 * 
 * 3. CONTROLLED COMPONENT: The expand/collapse state is managed internally,
 *    but can be initialized via props, giving users control over default behavior.
 * 
 * 4. ACCESSIBILITY: Uses semantic HTML (button for interaction) and proper
 *    ARIA patterns for screen readers and keyboard navigation.
 * 
 * 5. RESPONSIVE DESIGN: Built with Tailwind CSS classes that adapt to different
 *    screen sizes and support dark mode theming.
 */
'use client';

import { useState, ReactNode } from 'react';

/**
 * TypeScript Interface Definition - Component Props Contract
 * 
 * This interface defines the "contract" for what data this component expects.
 * It demonstrates several TypeScript patterns:
 * 
 * REQUIRED vs OPTIONAL PROPERTIES:
 * - Required: title, children (must be provided)
 * - Optional: subtitle?, icon?, defaultExpanded?, className?, badge?
 *   The ? makes these properties optional with default values
 * 
 * UNION TYPES: badge can be either string OR number
 * This flexibility allows displaying text labels or numeric counts
 * 
 * REACT TYPES: ReactNode is React's type for anything that can be rendered
 * (components, strings, numbers, arrays of elements, etc.)
 */
interface CollapsibleSectionProps {
  title: string;                    // Main heading text (required)
  subtitle?: string;                // Optional descriptive text below title
  icon?: string;                    // Optional emoji or icon character
  children: ReactNode;              // Content to show/hide (required)
  defaultExpanded?: boolean;        // Whether section starts open (default: true)
  className?: string;               // Additional CSS classes for customization
  badge?: string | number;          // Optional badge showing count or status
}

/**
 * CollapsibleSection Functional Component
 * 
 * DESTRUCTURING PATTERN: The function parameters use object destructuring
 * to extract individual props from the props object. This is cleaner than
 * accessing props.title, props.subtitle, etc.
 * 
 * DEFAULT PARAMETERS: We provide default values directly in the destructuring:
 * - defaultExpanded = true: Section starts open by default
 * - className = '': Empty string if no additional classes provided
 * 
 * This pattern makes the component more user-friendly by reducing required props.
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
   * - Manages the expand/collapse state of the section
   * - Returns [currentValue, setterFunction] array (destructured here)
   * - Initialized with defaultExpanded prop value
   * - When state changes, React automatically re-renders the component
   * 
   * This is the "controlled component" pattern - the component controls its own state
   * but allows external configuration through props.
   */
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  /**
   * COMPONENT RENDER METHOD
   * 
   * This return statement defines what the component renders to the DOM.
   * It demonstrates several important React and web development concepts.
   */
  return (
    {/* 
      CONTAINER DIV - Main wrapper element
      
      TEMPLATE LITERAL PATTERN: Uses backticks (`) to combine multiple CSS classes
      - Base styles: bg-white dark:bg-gray-800 (white background, dark gray in dark mode)
      - Shape: rounded-lg border (rounded corners with border)
      - Border colors: border-gray-200 dark:border-gray-700 (light/dark theme support)
      - Custom classes: ${className} allows parent components to add additional styling
      
      This pattern makes components flexible while maintaining consistent base styling.
    */}
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* 
        INTERACTIVE HEADER BUTTON
        
        ACCESSIBILITY PATTERN: Uses a <button> element for the clickable header
        - Semantic HTML: Screen readers understand this is interactive
        - Keyboard accessible: Can be focused and activated with Enter/Space
        - Full width: w-full makes entire header area clickable (better UX)
        
        EVENT HANDLING: onClick uses arrow function with state setter
        - !isExpanded toggles the current state (true becomes false, false becomes true)
        - This triggers a re-render with the new state
      */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
      >
        <div className="flex items-center space-x-3">
          {icon && <span className="text-xl">{icon}</span>}
          <div className="text-left">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {badge && (
            <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {badge}
            </span>
          )}
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

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          {children}
        </div>
      )}
    </div>
  );
}