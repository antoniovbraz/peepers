import React from 'react';

// ==================== UTILITY FUNCTIONS ====================

const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// ==================== FLEX TYPES ====================

type FlexDirection = 'row' | 'row-reverse' | 'col' | 'col-reverse';
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type FlexAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
type FlexGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// ==================== FLEX VARIANTS ====================

const getFlexClasses = (
  direction: FlexDirection = 'row',
  wrap: FlexWrap = 'nowrap',
  align: FlexAlign = 'stretch',
  justify: FlexJustify = 'start',
  gap: FlexGap = 'none'
): string => {
  // Base classes
  const baseClasses = ['flex'];

  // Direction classes
  const directionClasses = {
    row: 'flex-row',
    'row-reverse': 'flex-row-reverse',
    col: 'flex-col',
    'col-reverse': 'flex-col-reverse',
  };

  // Wrap classes
  const wrapClasses = {
    nowrap: 'flex-nowrap',
    wrap: 'flex-wrap',
    'wrap-reverse': 'flex-wrap-reverse',
  };

  // Align classes (cross-axis)
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    baseline: 'items-baseline',
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

  // Gap classes
  const gapClasses = {
    none: '',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    '2xl': 'gap-12',
  };

  return cn(
    ...baseClasses,
    directionClasses[direction],
    wrapClasses[wrap],
    alignClasses[align],
    justifyClasses[justify],
    gapClasses[gap]
  );
};

// ==================== FLEX PROPS ====================

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: FlexDirection;
  wrap?: FlexWrap;
  align?: FlexAlign;
  justify?: FlexJustify;
  gap?: FlexGap;
  children: React.ReactNode;
  as?: React.ElementType;
}

// ==================== FLEX COMPONENT ====================

const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      className = '',
      direction = 'row',
      wrap = 'nowrap',
      align = 'stretch',
      justify = 'start',
      gap = 'none',
      children,
      as: Component = 'div',
      ...props
    },
    ref
  ) => {
    const flexClasses = cn(
      getFlexClasses(direction, wrap, align, justify, gap),
      className
    );

    return (
      <Component ref={ref} className={flexClasses} {...props}>
        {children}
      </Component>
    );
  }
);

Flex.displayName = 'Flex';

// ==================== FLEX ITEM TYPES ====================

type FlexGrow = 0 | 1 | 'auto';
type FlexShrink = 0 | 1;
type FlexBasis = 'auto' | 'full' | 'px' | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 64;
type FlexOrder = 'first' | 'last' | 'none' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// ==================== FLEX ITEM PROPS ====================

export interface FlexItemProps extends React.HTMLAttributes<HTMLDivElement> {
  grow?: FlexGrow;
  shrink?: FlexShrink;
  basis?: FlexBasis;
  order?: FlexOrder;
  align?: 'auto' | FlexAlign;
  children: React.ReactNode;
  as?: React.ElementType;
}

// ==================== FLEX ITEM COMPONENT ====================

const FlexItem = React.forwardRef<HTMLDivElement, FlexItemProps>(
  (
    {
      className = '',
      grow,
      shrink,
      basis,
      order,
      align,
      children,
      as: Component = 'div',
      ...props
    },
    ref
  ) => {
    // Classes arrays
    const classes = [];

    // Grow classes
    if (grow !== undefined) {
      const growClasses = {
        0: 'flex-grow-0',
        1: 'flex-grow',
        auto: 'flex-auto',
      };
      classes.push(growClasses[grow]);
    }

    // Shrink classes
    if (shrink !== undefined) {
      const shrinkClasses = {
        0: 'flex-shrink-0',
        1: 'flex-shrink',
      };
      classes.push(shrinkClasses[shrink]);
    }

    // Basis classes
    if (basis !== undefined) {
      const basisClasses = {
        auto: 'basis-auto',
        full: 'basis-full',
        px: 'basis-px',
        0: 'basis-0',
        1: 'basis-1',
        2: 'basis-2',
        3: 'basis-3',
        4: 'basis-4',
        5: 'basis-5',
        6: 'basis-6',
        8: 'basis-8',
        10: 'basis-10',
        12: 'basis-12',
        16: 'basis-16',
        20: 'basis-20',
        24: 'basis-24',
        32: 'basis-32',
        40: 'basis-40',
        48: 'basis-48',
        56: 'basis-56',
        64: 'basis-64',
      };
      classes.push(basisClasses[basis]);
    }

    // Order classes
    if (order !== undefined) {
      const orderClasses = {
        first: 'order-first',
        last: 'order-last',
        none: 'order-none',
        1: 'order-1',
        2: 'order-2',
        3: 'order-3',
        4: 'order-4',
        5: 'order-5',
        6: 'order-6',
        7: 'order-7',
        8: 'order-8',
        9: 'order-9',
        10: 'order-10',
        11: 'order-11',
        12: 'order-12',
      };
      classes.push(orderClasses[order]);
    }

    // Align self classes
    if (align !== undefined) {
      const alignClasses = {
        auto: 'self-auto',
        start: 'self-start',
        center: 'self-center',
        end: 'self-end',
        baseline: 'self-baseline',
        stretch: 'self-stretch',
      };
      classes.push(alignClasses[align]);
    }

    const itemClasses = cn(...classes, className);

    return (
      <Component ref={ref} className={itemClasses} {...props}>
        {children}
      </Component>
    );
  }
);

FlexItem.displayName = 'FlexItem';

// ==================== CENTER COMPONENT ====================

export interface CenterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: React.ElementType;
  inline?: boolean;
}

const Center = React.forwardRef<HTMLDivElement, CenterProps>(
  (
    {
      className = '',
      children,
      as: Component = 'div',
      inline = false,
      ...props
    },
    ref
  ) => {
    const centerClasses = cn(
      inline ? 'inline-flex' : 'flex',
      'items-center justify-center',
      className
    );

    return (
      <Component ref={ref} className={centerClasses} {...props}>
        {children}
      </Component>
    );
  }
);

Center.displayName = 'Center';

// ==================== EXPORTS ====================

export { Flex, FlexItem, Center };
export type { 
  FlexDirection,
  FlexWrap,
  FlexAlign,
  FlexJustify,
  FlexGap,
  FlexGrow,
  FlexShrink,
  FlexBasis,
  FlexOrder
};