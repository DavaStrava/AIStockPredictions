/**
 * useLayoutShiftPrevention Hook
 * 
 * Provides utilities to prevent Cumulative Layout Shift (CLS) during
 * responsive transitions and dynamic content loading.
 * 
 * Key Features:
 * - Tracks element dimensions before content changes
 * - Provides sizing hints for dynamic content
 * - Detects and handles responsive breakpoint changes
 * - Optimizes for Core Web Vitals (CLS metric)
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Breakpoint definitions matching Tailwind CSS defaults
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Get current breakpoint based on window width
 */
export function getCurrentBreakpoint(): Breakpoint | 'xs' {
  if (typeof window === 'undefined') return 'xs';
  
  const width = window.innerWidth;
  
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Hook to track current responsive breakpoint
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint | 'xs'>(() => 
    getCurrentBreakpoint()
  );

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getCurrentBreakpoint());
    };

    // Use ResizeObserver for better performance if available
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(document.body);
      
      return () => resizeObserver.disconnect();
    } else {
      // Fallback to window resize event
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return breakpoint;
}

/**
 * Hook to preserve element dimensions during content changes
 */
export function usePreservedDimensions<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const measureDimensions = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDimensions({
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  const clearDimensions = useCallback(() => {
    setDimensions(null);
  }, []);

  return {
    ref,
    dimensions,
    measureDimensions,
    clearDimensions,
    style: dimensions ? {
      minWidth: `${dimensions.width}px`,
      minHeight: `${dimensions.height}px`,
    } : undefined,
  };
}

/**
 * Hook to detect layout shifts and provide warnings
 */
export function useLayoutShiftDetection(enabled = true) {
  const [shifts, setShifts] = useState<number>(0);
  const [clsScore, setClsScore] = useState<number>(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    let cumulativeScore = 0;
    let shiftCount = 0;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            cumulativeScore += (entry as any).value;
            shiftCount += 1;
            setClsScore(cumulativeScore);
            setShifts(shiftCount);
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });

      return () => observer.disconnect();
    } catch (error) {
      console.warn('Layout shift detection not supported:', error);
    }
  }, [enabled]);

  return {
    shifts,
    clsScore,
    hasIssues: clsScore > 0.1, // Google's "good" threshold
    severity: clsScore < 0.1 ? 'good' : clsScore < 0.25 ? 'needs-improvement' : 'poor',
  };
}

/**
 * Hook to provide aspect ratio container for images and media
 */
export function useAspectRatio(aspectRatio: number = 16 / 9) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const height = containerWidth / aspectRatio;

  return {
    containerRef,
    containerStyle: {
      width: '100%',
      height: height > 0 ? `${height}px` : 'auto',
    },
    aspectRatio,
  };
}

/**
 * Hook to handle smooth transitions between breakpoints
 */
export function useResponsiveTransition(transitionDuration = 300) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const breakpoint = useBreakpoint();
  const previousBreakpoint = useRef(breakpoint);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (previousBreakpoint.current !== breakpoint) {
      setIsTransitioning(true);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, transitionDuration);

      previousBreakpoint.current = breakpoint;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [breakpoint, transitionDuration]);

  return {
    breakpoint,
    isTransitioning,
    transitionClass: isTransitioning ? 'transitioning' : '',
  };
}

/**
 * Hook to provide content sizing hints based on breakpoint
 */
export function useContentSizeHints() {
  const breakpoint = useBreakpoint();

  const getGridColumns = useCallback(() => {
    switch (breakpoint) {
      case '2xl': return 5;
      case 'xl': return 4;
      case 'lg': return 3;
      case 'md': return 2;
      default: return 1;
    }
  }, [breakpoint]);

  const getCardMinHeight = useCallback(() => {
    switch (breakpoint) {
      case '2xl':
      case 'xl': return '320px';
      case 'lg': return '300px';
      case 'md': return '280px';
      default: return '260px';
    }
  }, [breakpoint]);

  const getSidebarWidth = useCallback(() => {
    switch (breakpoint) {
      case '2xl': return '384px'; // w-96
      case 'xl': return '320px';  // w-80
      case 'lg': return '256px';  // w-64
      default: return '0px';      // hidden
    }
  }, [breakpoint]);

  return {
    breakpoint,
    gridColumns: getGridColumns(),
    cardMinHeight: getCardMinHeight(),
    sidebarWidth: getSidebarWidth(),
  };
}

/**
 * Hook to prevent horizontal scrolling during responsive transitions
 */
export function usePreventHorizontalScroll() {
  useEffect(() => {
    const preventScroll = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
      }
    };

    // Only prevent during transitions
    const style = document.createElement('style');
    style.textContent = `
      body.prevent-horizontal-scroll {
        overflow-x: hidden;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const enablePrevention = useCallback(() => {
    document.body.classList.add('prevent-horizontal-scroll');
  }, []);

  const disablePrevention = useCallback(() => {
    document.body.classList.remove('prevent-horizontal-scroll');
  }, []);

  return {
    enablePrevention,
    disablePrevention,
  };
}

/**
 * Main hook combining all layout shift prevention utilities
 */
export function useLayoutShiftPrevention(options: {
  enableDetection?: boolean;
  transitionDuration?: number;
} = {}) {
  const {
    enableDetection = process.env.NODE_ENV === 'development',
    transitionDuration = 300,
  } = options;

  const breakpointInfo = useResponsiveTransition(transitionDuration);
  const layoutShiftInfo = useLayoutShiftDetection(enableDetection);
  const sizeHints = useContentSizeHints();
  const scrollPrevention = usePreventHorizontalScroll();

  // Log warnings in development
  useEffect(() => {
    if (enableDetection && layoutShiftInfo.hasIssues) {
      console.warn(
        `Layout shift detected: CLS score ${layoutShiftInfo.clsScore.toFixed(4)} (${layoutShiftInfo.severity})`,
        `Total shifts: ${layoutShiftInfo.shifts}`
      );
    }
  }, [enableDetection, layoutShiftInfo]);

  return {
    ...breakpointInfo,
    ...layoutShiftInfo,
    ...sizeHints,
    ...scrollPrevention,
  };
}

export default useLayoutShiftPrevention;
