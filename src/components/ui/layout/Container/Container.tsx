import React from 'react';

// ==================== UTILITY FUNCTIONS ====================

const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// ==================== CONTAINER TYPES ====================

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
type ContainerPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

// ==================== CONTAINER VARIANTS ====================

const getContainerClasses = (
  size: ContainerSize = 'lg',
  padding: ContainerPadding = 'md',
  centered: boolean = true
): string => {
  // Base classes
  const baseClasses = ['w-full'];

  // Size classes
  const sizeClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'px-4',
    md: 'px-6',
    lg: 'px-8',
    xl: 'px-12',
  };

  // Additional classes
  const additionalClasses = [];
  
  if (centered) {
    additionalClasses.push('mx-auto');
  }

  return cn(
    ...baseClasses,
    sizeClasses[size],
    paddingClasses[padding],
    ...additionalClasses
  );
};

// ==================== CONTAINER PROPS ====================

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  padding?: ContainerPadding;
  centered?: boolean;
  children: React.ReactNode;
  as?: React.ElementType;
}

// ==================== CONTAINER COMPONENT ====================

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      className = '',
      size = 'lg',
      padding = 'md',
      centered = true,
      children,
      as: Component = 'div',
      ...props
    },
    ref
  ) => {
    const containerClasses = cn(
      getContainerClasses(size, padding, centered),
      className
    );

    return (
      <Component ref={ref} className={containerClasses} {...props}>
        {children}
      </Component>
    );
  }
);

Container.displayName = 'Container';

// ==================== SECTION COMPONENT ====================

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'transparent' | 'white' | 'gray' | 'primary' | 'secondary';
  as?: React.ElementType;
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    {
      className = '',
      children,
      spacing = 'md',
      background = 'transparent',
      as: Component = 'section',
      ...props
    },
    ref
  ) => {
    // Spacing classes
    const spacingClasses = {
      none: '',
      sm: 'py-8',
      md: 'py-12',
      lg: 'py-16',
      xl: 'py-24',
    };

    // Background classes
    const backgroundClasses = {
      transparent: '',
      white: 'bg-white',
      gray: 'bg-gray-50',
      primary: 'bg-brand-primary-50',
      secondary: 'bg-brand-secondary-50',
    };

    const sectionClasses = cn(
      spacingClasses[spacing],
      backgroundClasses[background],
      className
    );

    return (
      <Component ref={ref} className={sectionClasses} {...props}>
        {children}
      </Component>
    );
  }
);

Section.displayName = 'Section';

// ==================== EXPORTS ====================

export { Container, Section };
export type { ContainerSize, ContainerPadding };