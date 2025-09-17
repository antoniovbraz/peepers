import React from 'react';

// ==================== UTILITY FUNCTIONS ====================

const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ==================== AVATAR TYPES ====================

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type AvatarVariant = 'circular' | 'rounded' | 'square';

// ==================== AVATAR VARIANTS ====================

const getAvatarClasses = (
  size: AvatarSize = 'md',
  variant: AvatarVariant = 'circular'
): string => {
  // Base classes
  const baseClasses = [
    'inline-flex items-center justify-center',
    'bg-gradient-to-br from-brand-primary-400 to-brand-primary-600',
    'text-white font-medium',
    'overflow-hidden',
    'border-2 border-white shadow-sm',
  ];

  // Size classes
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
    '2xl': 'h-20 w-20 text-xl',
  };

  // Variant classes
  const variantClasses = {
    circular: 'rounded-full',
    rounded: 'rounded-lg',
    square: 'rounded-none',
  };

  return cn(
    ...baseClasses,
    sizeClasses[size],
    variantClasses[variant]
  );
};

// ==================== AVATAR PROPS ====================

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  fallbackIcon?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  badge?: React.ReactNode;
  badgePosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

// ==================== AVATAR COMPONENT ====================

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className = '',
      src,
      alt,
      name = '',
      size = 'md',
      variant = 'circular',
      fallbackIcon,
      loading = false,
      onClick,
      badge,
      badgePosition = 'top-right',
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    // Reset error state when src changes
    React.useEffect(() => {
      setImageError(false);
      setImageLoaded(false);
    }, [src]);

    const avatarClasses = cn(
      getAvatarClasses(size, variant),
      onClick && 'cursor-pointer hover:opacity-80 transition-opacity duration-200',
      loading && 'animate-pulse',
      className
    );

    // Badge positioning classes
    const badgePositionClasses = {
      'top-right': 'top-0 right-0',
      'bottom-right': 'bottom-0 right-0',
      'top-left': 'top-0 left-0',
      'bottom-left': 'bottom-0 left-0',
    };

    // Default fallback icon
    const defaultIcon = (
      <svg
        className="h-1/2 w-1/2"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          fillRule="evenodd"
          d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
          clipRule="evenodd"
        />
      </svg>
    );

    const shouldShowImage = src && !imageError && !loading;
    const shouldShowInitials = name && !shouldShowImage;
    const shouldShowIcon = !shouldShowImage && !shouldShowInitials;

    return (
      <div className="relative inline-block">
        <div
          ref={ref}
          className={avatarClasses}
          onClick={onClick}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          onKeyDown={onClick ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick();
            }
          } : undefined}
          {...props}
        >
          {/* Loading State */}
          {loading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-inherit" />
          )}

          {/* Image */}
          {shouldShowImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt || name || 'Avatar'}
                className={cn(
                  'h-full w-full object-cover',
                  !imageLoaded && 'opacity-0'
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-inherit" />
              )}
            </>
          )}

          {/* Initials */}
          {shouldShowInitials && (
            <span className="text-current">
              {getInitials(name)}
            </span>
          )}

          {/* Fallback Icon */}
          {shouldShowIcon && (
            <span className="text-current">
              {fallbackIcon || defaultIcon}
            </span>
          )}
        </div>

        {/* Badge */}
        {badge && (
          <div className={cn(
            'absolute -translate-x-1/2 -translate-y-1/2',
            badgePositionClasses[badgePosition]
          )}>
            {badge}
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// ==================== AVATAR GROUP COMPONENT ====================

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  max?: number;
  size?: AvatarSize;
  spacing?: 'tight' | 'normal' | 'loose';
  showTooltip?: boolean;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      className = '',
      children,
      max = 5,
      size = 'md',
      spacing = 'normal',
      showTooltip = false,
      ...props
    },
    ref
  ) => {
    const childrenArray = React.Children.toArray(children);
    const hasMore = childrenArray.length > max;
    const visibleChildren = hasMore ? childrenArray.slice(0, max - 1) : childrenArray;
    const extraCount = hasMore ? childrenArray.length - (max - 1) : 0;

    // Spacing classes
    const spacingClasses = {
      tight: '-space-x-1',
      normal: '-space-x-2',
      loose: '-space-x-3',
    };

    const groupClasses = cn(
      'flex items-center',
      spacingClasses[spacing],
      className
    );

    return (
      <div ref={ref} className={groupClasses} {...props}>
        {/* Visible Avatars */}
        {visibleChildren.map((child, index) => (
          <div key={index} className="relative ring-2 ring-white rounded-full">
            {child}
          </div>
        ))}

        {/* Extra Count Avatar */}
        {hasMore && (
          <div className="relative">
            <Avatar
              size={size}
              name={`+${extraCount}`}
              className="ring-2 ring-white bg-gray-100 text-gray-600"
              title={showTooltip ? `+${extraCount} more` : undefined}
            />
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

// ==================== EXPORTS ====================

export { Avatar, AvatarGroup };
export type { AvatarSize, AvatarVariant };