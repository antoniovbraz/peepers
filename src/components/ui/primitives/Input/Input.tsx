import React from 'react';

// ==================== UTILITY FUNCTIONS ====================

const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// ==================== INPUT TYPES ====================

type InputVariant = 'default' | 'error' | 'success';
type InputSize = 'sm' | 'md' | 'lg';

// ==================== INPUT VARIANTS ====================

const getInputClasses = (
  variant: InputVariant = 'default',
  size: InputSize = 'md',
  fullWidth: boolean = false
): string => {
  // Base classes
  const baseClasses = [
    'flex rounded-md border transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
    'placeholder:text-gray-400',
    'font-normal',
  ];

  // Variant classes
  const variantClasses = {
    default: [
      'border-gray-300 bg-white text-gray-900',
      'hover:border-gray-400',
      'focus:border-brand-primary-500 focus:ring-brand-primary-200',
    ],
    error: [
      'border-error-300 bg-white text-gray-900',
      'hover:border-error-400',
      'focus:border-error-500 focus:ring-error-200',
    ],
    success: [
      'border-success-300 bg-white text-gray-900',
      'hover:border-success-400',
      'focus:border-success-500 focus:ring-success-200',
    ],
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-4 text-base',
  };

  // Additional classes
  const additionalClasses = [];
  
  if (fullWidth) {
    additionalClasses.push('w-full');
  }

  return cn(
    ...baseClasses,
    ...variantClasses[variant],
    sizeClasses[size],
    ...additionalClasses
  );
};

// ==================== INPUT PROPS ====================

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  fullWidth?: boolean;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

// ==================== INPUT COMPONENT ====================

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      containerClassName = '',
      variant = 'default',
      size = 'md',
      fullWidth = true,
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      id,
      required = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    // Generate ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine variant based on error state
    const inputVariant = errorMessage ? 'error' : variant;
    
    const inputClasses = cn(
      getInputClasses(inputVariant, size, fullWidth),
      leftIcon ? 'pl-10' : '',
      rightIcon ? 'pr-10' : '',
      className
    );

    const containerClasses = cn(
      'relative',
      fullWidth && 'w-full',
      containerClassName
    );

    return (
      <div className={containerClasses}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-2',
              errorMessage ? 'text-error-700' : 'text-gray-700',
              disabled && 'text-gray-400'
            )}
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className={cn(
                'h-4 w-4',
                errorMessage ? 'text-error-400' : 'text-gray-400'
              )}>
                {leftIcon}
              </span>
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            disabled={disabled}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className={cn(
                'h-4 w-4',
                errorMessage ? 'text-error-400' : 'text-gray-400'
              )}>
                {rightIcon}
              </span>
            </div>
          )}
        </div>

        {/* Helper Text / Error Message */}
        {(helperText || errorMessage) && (
          <p className={cn(
            'mt-2 text-xs',
            errorMessage ? 'text-error-600' : 'text-gray-500'
          )}>
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ==================== EXPORTS ====================

export { Input };
export type { InputVariant, InputSize };