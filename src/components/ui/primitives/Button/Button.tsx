import React from 'react';

// ==================== UTILITY FUNCTIONS ====================

// Simple className utility function
const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// ==================== BUTTON VARIANTS ====================

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon';

const getButtonClasses = (
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth: boolean = false,
  loading: boolean = false
): string => {
  // Base classes - applied to all buttons
  const baseClasses = [
    'inline-flex items-center justify-center gap-2',
    'rounded-md font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'whitespace-nowrap leading-none',
    'select-none',
  ];

  // Variant classes
  const variantClasses = {
    primary: [
      'bg-brand-primary-600 text-white shadow-sm',
      'hover:bg-brand-primary-700 hover:shadow-md',
      'active:bg-brand-primary-800',
      'focus:ring-brand-primary-500',
    ],
    secondary: [
      'bg-brand-secondary-400 text-brand-primary-900 shadow-sm',
      'hover:bg-brand-secondary-500 hover:shadow-md',
      'active:bg-brand-secondary-600',
      'focus:ring-brand-secondary-400',
    ],
    outline: [
      'border border-gray-300 bg-transparent text-gray-700 shadow-sm',
      'hover:bg-gray-50 hover:border-gray-400',
      'active:bg-gray-100',
      'focus:ring-gray-400',
    ],
    ghost: [
      'bg-transparent text-gray-700',
      'hover:bg-gray-100 hover:text-gray-900',
      'active:bg-gray-200',
      'focus:ring-gray-400',
    ],
    destructive: [
      'bg-error-600 text-white shadow-sm',
      'hover:bg-error-700 hover:shadow-md',
      'active:bg-error-800',
      'focus:ring-error-500',
    ],
    success: [
      'bg-success-600 text-white shadow-sm',
      'hover:bg-success-700 hover:shadow-md',
      'active:bg-success-800',
      'focus:ring-success-500',
    ],
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    xl: 'h-14 px-8 text-lg',
    icon: 'h-10 w-10 p-0',
  };

  // Additional classes
  const additionalClasses = [];
  
  if (fullWidth) {
    additionalClasses.push('w-full');
  }
  
  if (loading) {
    additionalClasses.push('cursor-not-allowed');
  }

  return cn(
    ...baseClasses,
    ...variantClasses[variant],
    sizeClasses[size],
    ...additionalClasses
  );
};

// ==================== BUTTON PROPS ====================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

// ==================== LOADING SPINNER ====================

const LoadingSpinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={cn('animate-spin h-4 w-4', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// ==================== BUTTON COMPONENT ====================

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    
    const buttonClasses = cn(
      getButtonClasses(variant, size, fullWidth, loading),
      className
    );
    
    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={isDisabled}
        {...props}
      >
        {loading && <LoadingSpinner className="mr-2" />}
        {!loading && leftIcon && (
          <span className="flex items-center justify-center mr-2">{leftIcon}</span>
        )}
        <span className="flex items-center justify-center">
          {children}
        </span>
        {!loading && rightIcon && (
          <span className="flex items-center justify-center ml-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ==================== EXPORTS ====================

export { Button };
export type { ButtonVariant, ButtonSize };