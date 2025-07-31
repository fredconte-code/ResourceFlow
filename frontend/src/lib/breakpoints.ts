import { useState, useEffect } from 'react';

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

export const mediaQueries = {
  xs: `(min-width: ${breakpoints.xs})`,
  sm: `(min-width: ${breakpoints.sm})`,
  md: `(min-width: ${breakpoints.md})`,
  lg: `(min-width: ${breakpoints.lg})`,
  xl: `(min-width: ${breakpoints.xl})`,
  '2xl': `(min-width: ${breakpoints['2xl']})`
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Responsive hook
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('md');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= 1536) setBreakpoint('2xl');
      else if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else if (width >= 640) setBreakpoint('sm');
      else setBreakpoint('xs');

      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024);
      setIsLargeScreen(width >= 1280);
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return { 
    breakpoint, 
    isMobile, 
    isTablet, 
    isDesktop, 
    isLargeScreen,
    width: typeof window !== 'undefined' ? window.innerWidth : 1024
  };
};

// Responsive utility functions
export const getResponsiveValue = <T>(
  values: Partial<Record<Breakpoint, T>>,
  defaultValue: T
): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  const width = window.innerWidth;
  let currentBreakpoint: Breakpoint = 'md';
  
  if (width >= 1536) currentBreakpoint = '2xl';
  else if (width >= 1280) currentBreakpoint = 'xl';
  else if (width >= 1024) currentBreakpoint = 'lg';
  else if (width >= 768) currentBreakpoint = 'md';
  else if (width >= 640) currentBreakpoint = 'sm';
  else currentBreakpoint = 'xs';
  
  return values[currentBreakpoint] ?? defaultValue;
};

// Responsive class utilities
export const getResponsiveClasses = (
  classes: Partial<Record<Breakpoint, string>>,
  defaultClass: string = ''
): string => {
  const responsiveClasses = Object.entries(classes).map(([breakpoint, className]) => {
    if (breakpoint === 'xs') return className;
    if (breakpoint === 'sm') return `sm:${className}`;
    if (breakpoint === 'md') return `md:${className}`;
    if (breakpoint === 'lg') return `lg:${className}`;
    if (breakpoint === 'xl') return `xl:${className}`;
    if (breakpoint === '2xl') return `2xl:${className}`;
    return className;
  });
  
  return [defaultClass, ...responsiveClasses].filter(Boolean).join(' ');
};

// Responsive grid utilities
export const getResponsiveGrid = (
  cols: Partial<Record<Breakpoint, number>> = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6 },
  gap: number = 4
): string => {
  const gridClasses = Object.entries(cols).map(([breakpoint, colCount]) => {
    const prefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;
    return `${prefix}grid-cols-${colCount}`;
  });
  
  return `grid gap-${gap} ${gridClasses.join(' ')}`;
};

// Responsive spacing utilities
export const getResponsiveSpacing = (
  spacing: Partial<Record<Breakpoint, number>>,
  direction: 'p' | 'px' | 'py' | 'pt' | 'pr' | 'pb' | 'pl' | 'm' | 'mx' | 'my' | 'mt' | 'mr' | 'mb' | 'ml' = 'p'
): string => {
  const spacingClasses = Object.entries(spacing).map(([breakpoint, size]) => {
    const prefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;
    return `${prefix}${direction}-${size}`;
  });
  
  return spacingClasses.join(' ');
};

// Responsive text utilities
export const getResponsiveText = (
  sizes: Partial<Record<Breakpoint, string>>,
  defaultSize: string = 'base'
): string => {
  const textClasses = Object.entries(sizes).map(([breakpoint, size]) => {
    const prefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;
    return `${prefix}text-${size}`;
  });
  
  return `text-${defaultSize} ${textClasses.join(' ')}`;
};

// Responsive visibility utilities
export const getResponsiveVisibility = (
  visibility: Partial<Record<Breakpoint, 'visible' | 'hidden'>>,
  defaultVisibility: 'visible' | 'hidden' = 'visible'
): string => {
  const visibilityClasses = Object.entries(visibility).map(([breakpoint, visibility]) => {
    const prefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;
    return `${prefix}${visibility}`;
  });
  
  return `${defaultVisibility} ${visibilityClasses.join(' ')}`;
};

// Responsive display utilities
export const getResponsiveDisplay = (
  display: Partial<Record<Breakpoint, 'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid' | 'none'>>,
  defaultDisplay: 'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid' | 'none' = 'block'
): string => {
  const displayClasses = Object.entries(display).map(([breakpoint, display]) => {
    const prefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;
    return `${prefix}${display}`;
  });
  
  return `${defaultDisplay} ${displayClasses.join(' ')}`;
}; 