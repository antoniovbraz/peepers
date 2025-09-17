import React from 'react';

// ==================== UTILITY FUNCTIONS ====================

const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// ==================== GRID TYPES ====================

type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type GridGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ResponsiveCols {
  default?: GridCols;
  sm?: GridCols;
  md?: GridCols;
  lg?: GridCols;
  xl?: GridCols;
  '2xl'?: GridCols;
}

// ==================== GRID VARIANTS ====================

const getGridClasses = (
  cols: GridCols | ResponsiveCols = 1,
  gap: GridGap = 'md'
): string => {
  // Base classes
  const baseClasses = ['grid'];

  // Gap classes
  const gapClasses = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  // Columns classes
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
    10: 'grid-cols-10',
    11: 'grid-cols-11',
    12: 'grid-cols-12',
  };

  // Responsive classes
  const responsiveClasses = [];

  if (typeof cols === 'number') {
    responsiveClasses.push(colsClasses[cols]);
  } else {
    // Handle responsive object
    if (cols.default) responsiveClasses.push(colsClasses[cols.default]);
    if (cols.sm) responsiveClasses.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) responsiveClasses.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) responsiveClasses.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) responsiveClasses.push(`xl:grid-cols-${cols.xl}`);
    if (cols['2xl']) responsiveClasses.push(`2xl:grid-cols-${cols['2xl']}`);
  }

  return cn(
    ...baseClasses,
    gapClasses[gap],
    ...responsiveClasses
  );
};

// ==================== GRID PROPS ====================

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: GridCols | ResponsiveCols;
  gap?: GridGap;
  children: React.ReactNode;
  as?: React.ElementType;
}

// ==================== GRID COMPONENT ====================

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      className = '',
      cols = 1,
      gap = 'md',
      children,
      as: Component = 'div',
      ...props
    },
    ref
  ) => {
    const gridClasses = cn(getGridClasses(cols, gap), className);

    return (
      <Component ref={ref} className={gridClasses} {...props}>
        {children}
      </Component>
    );
  }
);

Grid.displayName = 'Grid';

// ==================== GRID ITEM TYPES ====================

type GridColSpan = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'auto' | 'full';

interface ResponsiveColSpan {
  default?: GridColSpan;
  sm?: GridColSpan;
  md?: GridColSpan;
  lg?: GridColSpan;
  xl?: GridColSpan;
  '2xl'?: GridColSpan;
}

// ==================== GRID ITEM PROPS ====================

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  colSpan?: GridColSpan | ResponsiveColSpan;
  children: React.ReactNode;
  as?: React.ElementType;
}

// ==================== GRID ITEM COMPONENT ====================

const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  (
    {
      className = '',
      colSpan,
      children,
      as: Component = 'div',
      ...props
    },
    ref
  ) => {
    // Col span classes
    const colSpanClasses = {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4',
      5: 'col-span-5',
      6: 'col-span-6',
      7: 'col-span-7',
      8: 'col-span-8',
      9: 'col-span-9',
      10: 'col-span-10',
      11: 'col-span-11',
      12: 'col-span-12',
      auto: 'col-auto',
      full: 'col-span-full',
    };

    // Handle responsive col span
    const responsiveClasses = [];

    if (colSpan) {
      if (typeof colSpan === 'string' || typeof colSpan === 'number') {
        responsiveClasses.push(colSpanClasses[colSpan]);
      } else {
        // Handle responsive object
        if (colSpan.default) responsiveClasses.push(colSpanClasses[colSpan.default]);
        if (colSpan.sm) responsiveClasses.push(`sm:col-span-${colSpan.sm}`);
        if (colSpan.md) responsiveClasses.push(`md:col-span-${colSpan.md}`);
        if (colSpan.lg) responsiveClasses.push(`lg:col-span-${colSpan.lg}`);
        if (colSpan.xl) responsiveClasses.push(`xl:col-span-${colSpan.xl}`);
        if (colSpan['2xl']) responsiveClasses.push(`2xl:col-span-${colSpan['2xl']}`);
      }
    }

    const itemClasses = cn(...responsiveClasses, className);

    return (
      <Component ref={ref} className={itemClasses} {...props}>
        {children}
      </Component>
    );
  }
);

GridItem.displayName = 'GridItem';

// ==================== AUTO GRID COMPONENT ====================

export interface AutoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  minItemWidth?: string;
  gap?: GridGap;
  children: React.ReactNode;
  as?: React.ElementType;
}

const AutoGrid = React.forwardRef<HTMLDivElement, AutoGridProps>(
  (
    {
      className = '',
      minItemWidth = '250px',
      gap = 'md',
      children,
      as: Component = 'div',
      ...props
    },
    ref
  ) => {
    // Gap classes
    const gapClasses = {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    };

    const autoGridClasses = cn(
      'grid',
      gapClasses[gap],
      className
    );

    const gridStyle = {
      gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
    };

    return (
      <Component 
        ref={ref} 
        className={autoGridClasses} 
        style={gridStyle}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

AutoGrid.displayName = 'AutoGrid';

// ==================== EXPORTS ====================

export { Grid, GridItem, AutoGrid };
export type { GridCols, GridGap, GridColSpan, ResponsiveCols, ResponsiveColSpan };