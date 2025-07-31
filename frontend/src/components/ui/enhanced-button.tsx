import React from 'react';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';
import { colors } from '@/lib/design-system';

interface EnhancedButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
}

export const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  disabled,
  'aria-label': ariaLabel,
  ...props
}, ref) => {
  const variantStyles = {
    primary: 'bg-brand-yellow text-brand-black hover:bg-brand-yellow/90 focus:ring-brand-yellow/20',
    secondary: 'bg-brand-gray text-white hover:bg-brand-gray/80 focus:ring-brand-gray/20',
    success: 'bg-semantic-success text-white hover:bg-semantic-success/90 focus:ring-semantic-success/20',
    warning: 'bg-semantic-warning text-white hover:bg-semantic-warning/90 focus:ring-semantic-warning/20',
    error: 'bg-semantic-error text-white hover:bg-semantic-error/90 focus:ring-semantic-error/20',
    ghost: 'hover:bg-muted hover:text-muted-foreground focus:ring-muted/20',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-ring/20'
  };

  const sizeStyles = {
    xs: 'h-6 px-2 text-xs',
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-8 text-lg'
  };

  const iconSizeStyles = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6'
  };

  const isDisabled = disabled || loading;

  return (
    <Button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        'active:scale-95',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={isDisabled}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading && (
        <div 
          className={cn(
            'animate-spin rounded-full border-2 border-current border-t-transparent',
            iconSizeStyles[size]
          )}
          aria-hidden="true"
        />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className={cn('flex-shrink-0', iconSizeStyles[size])} aria-hidden="true">
          {icon}
        </span>
      )}
      {children && (
        <span className="flex-shrink-0">
          {children}
        </span>
      )}
      {!loading && icon && iconPosition === 'right' && (
        <span className={cn('flex-shrink-0', iconSizeStyles[size])} aria-hidden="true">
          {icon}
        </span>
      )}
    </Button>
  );
});

EnhancedButton.displayName = 'EnhancedButton';

// Specialized button components
export const PrimaryButton = React.forwardRef<HTMLButtonElement, Omit<EnhancedButtonProps, 'variant'>>(
  (props, ref) => <EnhancedButton ref={ref} variant="primary" {...props} />
);
PrimaryButton.displayName = 'PrimaryButton';

export const SecondaryButton = React.forwardRef<HTMLButtonElement, Omit<EnhancedButtonProps, 'variant'>>(
  (props, ref) => <EnhancedButton ref={ref} variant="secondary" {...props} />
);
SecondaryButton.displayName = 'SecondaryButton';

export const SuccessButton = React.forwardRef<HTMLButtonElement, Omit<EnhancedButtonProps, 'variant'>>(
  (props, ref) => <EnhancedButton ref={ref} variant="success" {...props} />
);
SuccessButton.displayName = 'SuccessButton';

export const WarningButton = React.forwardRef<HTMLButtonElement, Omit<EnhancedButtonProps, 'variant'>>(
  (props, ref) => <EnhancedButton ref={ref} variant="warning" {...props} />
);
WarningButton.displayName = 'WarningButton';

export const ErrorButton = React.forwardRef<HTMLButtonElement, Omit<EnhancedButtonProps, 'variant'>>(
  (props, ref) => <EnhancedButton ref={ref} variant="error" {...props} />
);
ErrorButton.displayName = 'ErrorButton';

export const GhostButton = React.forwardRef<HTMLButtonElement, Omit<EnhancedButtonProps, 'variant'>>(
  (props, ref) => <EnhancedButton ref={ref} variant="ghost" {...props} />
);
GhostButton.displayName = 'GhostButton';

export const OutlineButton = React.forwardRef<HTMLButtonElement, Omit<EnhancedButtonProps, 'variant'>>(
  (props, ref) => <EnhancedButton ref={ref} variant="outline" {...props} />
);
OutlineButton.displayName = 'OutlineButton';

// Icon button component
interface IconButtonProps extends Omit<EnhancedButtonProps, 'children' | 'icon' | 'iconPosition'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon,
  size = 'md',
  variant = 'ghost',
  className,
  ...props
}, ref) => {
  const iconSizeStyles = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-14 w-14'
  };

  return (
    <EnhancedButton
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        'p-0',
        iconSizeStyles[size],
        className
      )}
      {...props}
    >
      <span className="flex items-center justify-center" aria-hidden="true">
        {icon}
      </span>
    </EnhancedButton>
  );
});

IconButton.displayName = 'IconButton';

// Button group component
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const ButtonGroup = ({
  children,
  className,
  orientation = 'horizontal',
  size = 'md'
}: ButtonGroupProps) => {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
      role="group"
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            className: cn(
              child.props.className,
              // Remove border radius from middle buttons
              index > 0 && index < React.Children.count(children) - 1 && 'rounded-none',
              // Remove left border radius from first button
              index === 0 && orientation === 'horizontal' && 'rounded-r-none',
              // Remove right border radius from last button
              index === React.Children.count(children) - 1 && orientation === 'horizontal' && 'rounded-l-none',
              // Remove top border radius from first button in vertical orientation
              index === 0 && orientation === 'vertical' && 'rounded-b-none',
              // Remove bottom border radius from last button in vertical orientation
              index === React.Children.count(children) - 1 && orientation === 'vertical' && 'rounded-t-none'
            )
          });
        }
        return child;
      })}
    </div>
  );
};

ButtonGroup.displayName = 'ButtonGroup';

// Loading button component
interface LoadingButtonProps extends Omit<EnhancedButtonProps, 'loading'> {
  loadingText?: string;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(({
  children,
  loadingText,
  ...props
}, ref) => {
  return (
    <EnhancedButton
      ref={ref}
      loading={true}
      disabled={true}
      {...props}
    >
      {loadingText || children}
    </EnhancedButton>
  );
});

LoadingButton.displayName = 'LoadingButton'; 