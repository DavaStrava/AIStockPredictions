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
        {/* 
          LEFT SIDE - Title, Subtitle, and Icon
          
          FLEXBOX LAYOUT: Uses CSS Flexbox for horizontal alignment
          - flex items-center: Vertically centers all items
          - space-x-3: Adds consistent spacing between child elements
          
          This creates a clean, aligned layout regardless of content size.
        */}
        <div className="flex items-center space-x-3">
          {/* 
            CONDITIONAL RENDERING: {icon && <span>} pattern
            
            This is a common React pattern for optional content:
            - If icon exists (truthy), render the <span>
            - If icon is undefined/null/empty (falsy), render nothing
            - Prevents empty elements from affecting layout
          */}
          {icon && <span className="text-xl">{icon}</span>}
          
          {/* 
            TEXT CONTENT CONTAINER
            
            SEMANTIC HTML: Uses proper heading hierarchy
            - <h3> for the main title (semantic importance)
            - <p> for descriptive subtitle text
            - text-left ensures left alignment even in flex container
          */}
          <div className="text-left">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {/* 
              CONDITIONAL SUBTITLE: Only renders if subtitle prop is provided
              
              TYPOGRAPHY CLASSES:
              - text-sm: Smaller font size than title
              - text-gray-600 dark:text-gray-400: Muted color that adapts to theme
              
              This creates visual hierarchy - title is prominent, subtitle is secondary
            */}
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
        {/* 
          RIGHT SIDE - Badge and Expand/Collapse Arrow
          
          FLEXBOX ALIGNMENT: Centers badge and arrow horizontally
          - flex items-center: Vertical alignment
          - space-x-2: Consistent spacing between elements
        */}
        <div className="flex items-center space-x-2">
          {/* 
            OPTIONAL BADGE DISPLAY
            
            CONDITIONAL RENDERING: Shows badge only if provided
            Badge can display counts, status, or other metadata
            
            PILL DESIGN: rounded-full creates a pill-shaped badge
            - px-2 py-1: Padding for comfortable text spacing
            - bg-gray-100 dark:bg-gray-700: Background adapts to theme
            - text-sm: Smaller text to not compete with title
          */}
          {badge && (
            <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {badge}
            </span>
          )}
          
          {/* 
            ANIMATED EXPAND/COLLAPSE ARROW
            
            SVG ICON: Uses inline SVG for crisp rendering at any size
            - viewBox="0 0 24 24": Defines coordinate system for the icon
            - stroke="currentColor": Uses current text color (inherits from parent)
            - fill="none": Outline style icon (not filled)
            
            DYNAMIC STYLING: Template literal combines static and dynamic classes
            - Static: w-5 h-5 text-gray-400 transition-transform (size, color, animation)
            - Dynamic: ${isExpanded ? 'rotate-180' : ''} (conditional rotation)
            
            CSS TRANSITIONS: transition-transform creates smooth rotation animation
            When isExpanded changes, the arrow smoothly rotates 180 degrees
          */}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {/* 
              SVG PATH: Defines the arrow shape
              - strokeLinecap="round": Rounded line endings
              - strokeLinejoin="round": Rounded line connections  
              - strokeWidth={2}: Line thickness
              - d="M19 9l-7 7-7-7": Path coordinates for downward arrow
              
              The path draws a "V" shape pointing down, which becomes up when rotated 180°
            */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 
        COLLAPSIBLE CONTENT AREA
        
        CONDITIONAL RENDERING: {isExpanded && (...)} pattern
        - Only renders content when isExpanded is true
        - When state changes, React automatically adds/removes this element
        - This creates the expand/collapse behavior
        
        PERFORMANCE NOTE: When collapsed, the children components are completely
        unmounted from the DOM, which can save memory for complex content.
      */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          {/* 
            VISUAL SEPARATION: border-t creates a line between header and content
            - border-gray-200 dark:border-gray-700: Theme-aware border color
            - p-6: Generous padding for comfortable reading
            
            CHILDREN PROP: {children} renders whatever content was passed in
            This makes the component extremely flexible - it can contain:
            - Simple text
            - Complex components
            - Forms, charts, lists, etc.
            - Any valid React content
            
            This is the "composition pattern" - instead of trying to anticipate
            all possible content types, we let the parent decide what to render.
          */}
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * EDUCATIONAL SUMMARY: Key Concepts Demonstrated in CollapsibleSection
 * 
 * This component serves as an excellent example of several important concepts:
 * 
 * 1. REACT PATTERNS:
 *    - Functional components with hooks (useState)
 *    - Props interface design and TypeScript integration
 *    - Conditional rendering for dynamic UI
 *    - Event handling and state management
 *    - Children prop for composition
 * 
 * 2. TYPESCRIPT BENEFITS:
 *    - Interface definitions prevent runtime errors
 *    - Optional properties with default values
 *    - Union types for flexible prop types
 *    - IntelliSense support in IDEs
 * 
 * 3. CSS AND STYLING:
 *    - Tailwind CSS utility classes
 *    - Responsive design patterns
 *    - Dark mode support
 *    - CSS transitions for smooth animations
 *    - Flexbox for layout management
 * 
 * 4. USER EXPERIENCE:
 *    - Accessibility with semantic HTML
 *    - Visual feedback (hover states, transitions)
 *    - Intuitive interaction patterns
 *    - Consistent spacing and typography
 * 
 * 5. SOFTWARE ENGINEERING:
 *    - Reusable component design
 *    - Separation of concerns
 *    - Composition over inheritance
 *    - Predictable state management
 *    - Clean, readable code structure
 * 
 * This component demonstrates how to build flexible, accessible, and maintainable
 * UI components that can be reused across different parts of an application.
 */