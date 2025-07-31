import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/lib/breakpoints';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  mobileLayout?: React.ReactNode;
  tabletLayout?: React.ReactNode;
  desktopLayout?: React.ReactNode;
  className?: string;
}

export const ResponsiveLayout = ({
  children,
  mobileLayout,
  tabletLayout,
  desktopLayout,
  className
}: ResponsiveLayoutProps) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  if (isMobile && mobileLayout) {
    return <div className={cn('mobile-layout', className)}>{mobileLayout}</div>;
  }

  if (isTablet && tabletLayout) {
    return <div className={cn('tablet-layout', className)}>{tabletLayout}</div>;
  }

  if (isDesktop && desktopLayout) {
    return <div className={cn('desktop-layout', className)}>{desktopLayout}</div>;
  }

  return <div className={cn('default-layout', className)}>{children}</div>;
};

// Responsive Grid Component
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', number>>;
  gap?: number;
  className?: string;
  autoFit?: boolean;
  minWidth?: string;
}

export const ResponsiveGrid = ({ 
  children, 
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6 },
  gap = 4,
  className,
  autoFit = false,
  minWidth = '250px'
}: ResponsiveGridProps) => {
  const { breakpoint } = useResponsive();
  const currentCols = cols[breakpoint] || cols.md || 3;

  if (autoFit) {
    return (
      <div 
        className={cn(`grid gap-${gap}`, className)}
        style={{ 
          gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
          gap: `${gap * 0.25}rem`
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div 
      className={cn(`grid gap-${gap}`, className)}
      style={{ 
        gridTemplateColumns: `repeat(${currentCols}, minmax(0, 1fr))`,
        gap: `${gap * 0.25}rem`
      }}
    >
      {children}
    </div>
  );
};

// Responsive Container Component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  center?: boolean;
}

export const ResponsiveContainer = ({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  center = true
}: ResponsiveContainerProps) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-6 py-4',
    lg: 'px-8 py-6',
    xl: 'px-12 py-8'
  };

  return (
    <div 
      className={cn(
        center && 'mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
};

// Responsive Stack Component
interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

export const ResponsiveStack = ({
  children,
  className,
  direction = 'vertical',
  spacing = 'md',
  align = 'start',
  justify = 'start',
  wrap = false
}: ResponsiveStackProps) => {
  const directionClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col'
  };

  const spacingClasses = {
    none: '',
    sm: direction === 'horizontal' ? 'space-x-2' : 'space-y-2',
    md: direction === 'horizontal' ? 'space-x-4' : 'space-y-4',
    lg: direction === 'horizontal' ? 'space-x-6' : 'space-y-6',
    xl: direction === 'horizontal' ? 'space-x-8' : 'space-y-8'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  return (
    <div 
      className={cn(
        'flex',
        directionClasses[direction],
        spacingClasses[spacing],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
};

// Responsive Hide/Show Components
interface ResponsiveVisibilityProps {
  children: React.ReactNode;
  className?: string;
}

export const HideOnMobile = ({ children, className }: ResponsiveVisibilityProps) => {
  const { isMobile } = useResponsive();
  if (isMobile) return null;
  return <div className={className}>{children}</div>;
};

export const ShowOnMobile = ({ children, className }: ResponsiveVisibilityProps) => {
  const { isMobile } = useResponsive();
  if (!isMobile) return null;
  return <div className={className}>{children}</div>;
};

export const HideOnTablet = ({ children, className }: ResponsiveVisibilityProps) => {
  const { isTablet } = useResponsive();
  if (isTablet) return null;
  return <div className={className}>{children}</div>;
};

export const ShowOnTablet = ({ children, className }: ResponsiveVisibilityProps) => {
  const { isTablet } = useResponsive();
  if (!isTablet) return null;
  return <div className={className}>{children}</div>;
};

export const HideOnDesktop = ({ children, className }: ResponsiveVisibilityProps) => {
  const { isDesktop } = useResponsive();
  if (isDesktop) return null;
  return <div className={className}>{children}</div>;
};

export const ShowOnDesktop = ({ children, className }: ResponsiveVisibilityProps) => {
  const { isDesktop } = useResponsive();
  if (!isDesktop) return null;
  return <div className={className}>{children}</div>;
};

// Responsive Text Component
interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  sizes?: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', string>>;
  defaultSize?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const ResponsiveText = ({
  children,
  className,
  sizes = { xs: 'xs', sm: 'sm', md: 'base', lg: 'lg', xl: 'xl', '2xl': '2xl' },
  defaultSize = 'base',
  as: Component = 'p'
}: ResponsiveTextProps) => {
  const { breakpoint } = useResponsive();
  const currentSize = sizes[breakpoint] || defaultSize;

  const textClasses = Object.entries(sizes).map(([bp, size]) => {
    const prefix = bp === 'xs' ? '' : `${bp}:`;
    return `${prefix}text-${size}`;
  });

  return (
    <Component
      className={cn(
        `text-${defaultSize}`,
        textClasses.join(' '),
        className
      )}
    >
      {children}
    </Component>
  );
};

// Responsive Spacing Component
interface ResponsiveSpacingProps {
  children?: React.ReactNode;
  className?: string;
  spacing?: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', number>>;
  direction?: 'horizontal' | 'vertical' | 'both';
  defaultSpacing?: number;
}

export const ResponsiveSpacing = ({
  children,
  className,
  spacing = { xs: 2, sm: 4, md: 6, lg: 8, xl: 10, '2xl': 12 },
  direction = 'vertical',
  defaultSpacing = 6
}: ResponsiveSpacingProps) => {
  const { breakpoint } = useResponsive();
  const currentSpacing = spacing[breakpoint] || defaultSpacing;

  const spacingClasses = Object.entries(spacing).map(([bp, size]) => {
    const prefix = bp === 'xs' ? '' : `${bp}:`;
    const directionClass = direction === 'horizontal' ? 'w' : direction === 'vertical' ? 'h' : 'w h';
    return `${prefix}${directionClass}-${size}`;
  });

  return (
    <div 
      className={cn(
        direction === 'horizontal' ? `w-${defaultSpacing}` : 
        direction === 'vertical' ? `h-${defaultSpacing}` : 
        `w-${defaultSpacing} h-${defaultSpacing}`,
        spacingClasses.join(' '),
        className
      )}
    >
      {children}
    </div>
  );
}; 