export const colors = {
  // BRP Brand Colors
  brand: {
    yellow: '#FFD903',
    black: '#000000',
    gray: '#58595B',
    silver: '#C7C8CA'
  },
  
  // Semantic Colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  
  // Allocation Status Colors
  allocation: {
    low: '#16A34A',
    optimal: '#84CC16',
    high: '#F97316',
    over: '#EF4444'
  },
  
  // Neutral Colors
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  }
} as const;

// Color utility functions
export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
};

export const getAccessibleColor = (color: string, variant: 'text' | 'background' = 'text'): string => {
  const contrastColor = getContrastColor(color);
  return variant === 'text' ? contrastColor : color;
};

// Spacing system
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  '4xl': '6rem'
} as const;

// Typography system
export const typography = {
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem'
  },
  fontWeights: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  }
} as const;

// Border radius system
export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px'
} as const;

// Shadow system
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000'
} as const;

// Z-index system
export const zIndex = {
  hide: '-1',
  auto: 'auto',
  base: '0',
  docked: '10',
  dropdown: '1000',
  sticky: '1100',
  banner: '1200',
  overlay: '1300',
  modal: '1400',
  popover: '1500',
  skipLink: '1600',
  toast: '1700',
  tooltip: '1800'
} as const;

// Animation system
export const animations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
    slowest: '1000ms'
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
} as const;

// Component-specific tokens
export const components = {
  button: {
    height: {
      sm: '2rem',
      md: '2.5rem',
      lg: '3rem'
    },
    padding: {
      sm: '0.5rem 1rem',
      md: '0.75rem 1.5rem',
      lg: '1rem 2rem'
    }
  },
  input: {
    height: {
      sm: '2rem',
      md: '2.5rem',
      lg: '3rem'
    },
    padding: {
      sm: '0.5rem 0.75rem',
      md: '0.75rem 1rem',
      lg: '1rem 1.25rem'
    }
  },
  card: {
    padding: {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem'
    },
    borderRadius: borderRadius.lg
  }
} as const;

// Utility functions for design tokens
export const getSpacing = (size: keyof typeof spacing): string => spacing[size];
export const getFontSize = (size: keyof typeof typography.fontSizes): string => typography.fontSizes[size];
export const getFontWeight = (weight: keyof typeof typography.fontWeights): string => typography.fontWeights[weight];
export const getLineHeight = (height: keyof typeof typography.lineHeights): string => typography.lineHeights[height];
export const getBorderRadius = (radius: keyof typeof borderRadius): string => borderRadius[radius];
export const getShadow = (shadow: keyof typeof shadows): string => shadows[shadow];
export const getZIndex = (z: keyof typeof zIndex): string => zIndex[z];

// Color palette generation
export const generateColorPalette = (baseColor: string, steps: number = 9) => {
  const palette: Record<string, string> = {};
  
  // Simple palette generation (in a real implementation, you'd use a color library)
  for (let i = 1; i <= steps; i++) {
    const intensity = Math.round((i / steps) * 100);
    palette[`${intensity}`] = baseColor; // Simplified - would need proper color manipulation
  }
  
  return palette;
};

// Theme-aware color utilities
export const getThemeColor = (color: keyof typeof colors.brand | keyof typeof colors.semantic | keyof typeof colors.allocation): string => {
  return colors.brand[color] || colors.semantic[color] || colors.allocation[color] || color;
};

// Accessibility utilities
export const getAccessibleTextColor = (backgroundColor: string): string => {
  return getContrastColor(backgroundColor);
};

export const getAccessibleBackgroundColor = (textColor: string): string => {
  return getContrastColor(textColor);
};

// Responsive design utilities
export const getResponsiveSpacing = (
  spacingValues: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', keyof typeof spacing>>,
  defaultSpacing: keyof typeof spacing = 'md'
): string => {
  const responsiveClasses = Object.entries(spacingValues).map(([breakpoint, size]) => {
    const prefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;
    return `${prefix}p-${size}`;
  });
  
  return `p-${defaultSpacing} ${responsiveClasses.join(' ')}`;
};

// Design system validation
export const validateDesignToken = (
  token: string,
  category: 'spacing' | 'typography' | 'colors' | 'borderRadius' | 'shadows'
): boolean => {
  const validTokens = {
    spacing: Object.keys(spacing),
    typography: Object.keys(typography.fontSizes),
    colors: Object.keys(colors.brand),
    borderRadius: Object.keys(borderRadius),
    shadows: Object.keys(shadows)
  };
  
  return validTokens[category].includes(token);
}; 