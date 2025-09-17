import React from 'react';

// ==================== UTILITY FUNCTIONS ====================

const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// ==================== BADGE TYPES ====================

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

// ==================== BADGE VARIANTS ====================

const getBadgeClasses = (
  variant: BadgeVariant = 'default',
  size: BadgeSize = 'md'
): string => {
  // Base classes
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-full',
    'border transition-all duration-200',
    'whitespace-nowrap',
  ];

  // Variant classes
  const variantClasses = {
    default: [
      'bg-gray-50 text-gray-700 border-gray-200',
      'hover:bg-gray-100 hover:border-gray-300',
    ],
    primary: [
      'bg-brand-primary-50 text-brand-primary-700 border-brand-primary-200',
      'hover:bg-brand-primary-100 hover:border-brand-primary-300',
    ],
    secondary: [
      'bg-brand-secondary-50 text-brand-secondary-700 border-brand-secondary-200',
      'hover:bg-brand-secondary-100 hover:border-brand-secondary-300',
    ],
    success: [
      'bg-success-50 text-success-700 border-success-200',
      'hover:bg-success-100 hover:border-success-300',
    ],
    warning: [
      'bg-warning-50 text-warning-700 border-warning-200',
      'hover:bg-warning-100 hover:border-warning-300',
    ],
    error: [
      'bg-error-50 text-error-700 border-error-200',
      'hover:bg-error-100 hover:border-error-300',
    ],
    info: [
      'bg-info-50 text-info-700 border-info-200',
      'hover:bg-info-100 hover:border-info-300',
    ],
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  return cn(
    ...baseClasses,
    ...variantClasses[variant],
    sizeClasses[size]
  );
};

// ==================== BADGE PROPS ====================

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}

// ==================== BADGE COMPONENT ====================

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      children,
      startIcon,
      endIcon,
      removable = false,
      onRemove,
      ...props
    },
    ref
  ) => {
    const badgeClasses = cn(getBadgeClasses(variant, size), className);

    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-3.5 w-3.5' : 'h-4 w-4';

    return (
      <span ref={ref} className={badgeClasses} {...props}>
        {/* Start Icon */}
        {startIcon && (
          <span className={cn('flex-shrink-0', iconSize)}>{startIcon}</span>
        )}

        {/* Children Content */}
        <span className="truncate">{children}</span>

        {/* End Icon */}
        {endIcon && !removable && (
          <span className={cn('flex-shrink-0', iconSize)}>{endIcon}</span>
        )}

        {/* Remove Button */}
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              'flex-shrink-0 ml-1 hover:bg-black hover:bg-opacity-10',
              'rounded-full p-0.5 transition-colors duration-200',
              'focus:outline-none focus:ring-1 focus:ring-current',
              iconSize
            )}
            aria-label="Remove"
          >
            <svg
              className="h-full w-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// ==================== BADGE DOT COMPONENT ====================

export interface BadgeDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const BadgeDot = React.forwardRef<HTMLSpanElement, BadgeDotProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      pulse = false,
      ...props
    },
    ref
  ) => {
    // Dot size classes
    const sizeClasses = {
      sm: 'h-2 w-2',
      md: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
    };

    // Variant classes for dots (using solid colors)
    const variantClasses = {
      default: 'bg-gray-400',
      primary: 'bg-brand-primary-500',
      secondary: 'bg-brand-secondary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
      info: 'bg-info-500',
    };

    const dotClasses = cn(
      'inline-block rounded-full',
      sizeClasses[size],
      variantClasses[variant],
      pulse && 'animate-pulse',
      className
    );

    return <span ref={ref} className={dotClasses} {...props} />;
  }
);

BadgeDot.displayName = 'BadgeDot';

// ==================== EXPORTS ====================

export { Badge, BadgeDot };
export type { BadgeVariant, BadgeSize };