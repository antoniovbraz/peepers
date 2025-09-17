import React from 'react';

// ==================== UTILITY FUNCTIONS ====================

const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// ==================== STACK TYPES ====================

type StackDirection = 'vertical' | 'horizontal';
type StackSpacing = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type StackAlign = 'start' | 'center' | 'end' | 'stretch';
type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

// ==================== STACK VARIANTS ====================

const getStackClasses = (
  direction: StackDirection = 'vertical',
  spacing: StackSpacing = 'md',
  align: StackAlign = 'stretch',
  justify: StackJustify = 'start'
): string => {
  // Base classes
  const baseClasses = ['flex'];

  // Direction classes
  const directionClasses = {
    vertical: 'flex-col',
    horizontal: 'flex-row',
  };

  // Spacing classes (gap)
  const spacingClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    '2xl': 'gap-12',
  };

  // Align classes (cross-axis)
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  // Justify classes (main-axis)
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  return cn(
    ...baseClasses,
    directionClasses[direction],
    spacingClasses[spacing],
    alignClasses[align],
    justifyClasses[justify]
  );
};

// ==================== STACK PROPS ====================

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: StackDirection;
  spacing?: StackSpacing;
  align?: StackAlign;
  justify?: StackJustify;
  children: React.ReactNode;
  as?: React.ElementType;
  wrap?: boolean;
}

// ==================== STACK COMPONENT ====================

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      className = '',
      direction = 'vertical',
      spacing = 'md',
      align = 'stretch',
      justify = 'start',
      children,
      as: Component = 'div',
      wrap = false,
      ...props
    },
    ref
  ) => {
    const stackClasses = cn(
      getStackClasses(direction, spacing, align, justify),
      wrap && 'flex-wrap',
      className
    );

    return (
      <Component ref={ref} className={stackClasses} {...props}>
        {children}
      </Component>
    );
  }
);

Stack.displayName = 'Stack';

// ==================== VSTACK COMPONENT ====================

export type VStackProps = Omit<StackProps, 'direction'>;

const VStack = React.forwardRef<HTMLDivElement, VStackProps>(
  (props, ref) => {
    return <Stack ref={ref} direction="vertical" {...props} />;
  }
);

VStack.displayName = 'VStack';

// ==================== HSTACK COMPONENT ====================

export type HStackProps = Omit<StackProps, 'direction'>;

const HStack = React.forwardRef<HTMLDivElement, HStackProps>(
  (props, ref) => {
    return <Stack ref={ref} direction="horizontal" {...props} />;
  }
);

HStack.displayName = 'HStack';

// ==================== SPACER COMPONENT ====================

export interface SpacerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: StackSpacing;
  as?: React.ElementType;
}

const Spacer = React.forwardRef<HTMLDivElement, SpacerProps>(
  (
    {
      className = '',
      size = 'md',
      as: Component = 'div',
      ...props
    },
    ref
  ) => {
    // Height/width classes for spacer
    const sizeClasses = {
      none: '',
      xs: 'h-1 w-1',
      sm: 'h-2 w-2',
      md: 'h-4 w-4',
      lg: 'h-6 w-6',
      xl: 'h-8 w-8',
      '2xl': 'h-12 w-12',
    };

    const spacerClasses = cn('flex-shrink-0', sizeClasses[size], className);

    return <Component ref={ref} className={spacerClasses} {...props} />;
  }
);

Spacer.displayName = 'Spacer';

// ==================== DIVIDER COMPONENT ====================

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  thickness?: 'thin' | 'medium' | 'thick';
  color?: 'gray' | 'primary' | 'secondary';
  spacing?: StackSpacing;
}

const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  (
    {
      className = '',
      orientation = 'horizontal',
      variant = 'solid',
      thickness = 'thin',
      color = 'gray',
      spacing = 'md',
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses = ['border-0'];

    // Orientation classes
    const orientationClasses = {
      horizontal: 'w-full h-px',
      vertical: 'h-full w-px',
    };

    // Variant classes
    const variantClasses = {
      solid: 'bg-current',
      dashed: 'border-dashed border-t border-current bg-transparent',
      dotted: 'border-dotted border-t border-current bg-transparent',
    };

    // Thickness classes
    const thicknessClasses = {
      thin: orientation === 'horizontal' ? 'h-px' : 'w-px',
      medium: orientation === 'horizontal' ? 'h-0.5' : 'w-0.5',
      thick: orientation === 'horizontal' ? 'h-1' : 'w-1',
    };

    // Color classes
    const colorClasses = {
      gray: 'text-gray-200',
      primary: 'text-brand-primary-200',
      secondary: 'text-brand-secondary-200',
    };

    // Spacing classes
    const spacingClasses = {
      none: '',
      xs: orientation === 'horizontal' ? 'my-1' : 'mx-1',
      sm: orientation === 'horizontal' ? 'my-2' : 'mx-2',
      md: orientation === 'horizontal' ? 'my-4' : 'mx-4',
      lg: orientation === 'horizontal' ? 'my-6' : 'mx-6',
      xl: orientation === 'horizontal' ? 'my-8' : 'mx-8',
      '2xl': orientation === 'horizontal' ? 'my-12' : 'mx-12',
    };

    const dividerClasses = cn(
      ...baseClasses,
      orientationClasses[orientation],
      variantClasses[variant],
      thicknessClasses[thickness],
      colorClasses[color],
      spacingClasses[spacing],
      className
    );

    return <hr ref={ref} className={dividerClasses} {...props} />;
  }
);

Divider.displayName = 'Divider';

// ==================== EXPORTS ====================

export { Stack, VStack, HStack, Spacer, Divider };
export type { 
  StackDirection, 
  StackSpacing, 
  StackAlign, 
  StackJustify 
};