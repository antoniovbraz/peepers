# 📋 Componentes UI - Especificações Detalhadas

## 🎨 Design System

### Cores
```css
/* Peepers Brand Colors */
--peepers-green: #0D6832;      /* Verde principal do logo */
--peepers-green-light: #15884A;
--peepers-green-dark: #074D20;

--peepers-gold: #E0C81A;       /* Dourado da coroa */
--peepers-gold-light: #F7DB32;
--peepers-gold-dark: #C4AF10;

--accent-red: #DC2626;         /* Vermelho para promoções */
```

### Tipografia
```css
/* Font System */
--font-primary: 'Inter', system-ui, sans-serif;
--font-heading: 'Inter', system-ui, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

## 🧩 Componentes Base

### 1. Button Component
```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
}

// Variants:
// primary: bg-peepers-green text-white
// secondary: bg-peepers-gold text-black
// outline: border-peepers-green text-peepers-green
// ghost: text-peepers-green hover:bg-peepers-green/10
```

### 2. ProductCard Component
```tsx
interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    originalPrice?: number;
    thumbnail: string;
    permalink: string;
    discount?: string;
    freeShipping?: boolean;
  };
  size?: 'sm' | 'md' | 'lg';
}

// Features:
// - Responsive image with aspect-ratio
// - Discount badge (red)
// - Free shipping indicator
// - Mercado Livre CTA button
// - Hover effects
```

### 3. Badge Component
```tsx
interface BadgeProps {
  variant: 'promotion' | 'free-shipping' | 'official' | 'new';
  children: ReactNode;
}

// Variants:
// promotion: bg-red-600 text-white
// free-shipping: bg-green-600 text-white
// official: bg-peepers-green text-white
// new: bg-blue-600 text-white
```

## 📱 Layout Components

### 1. Header Layout
```tsx
// Structure:
// <header>
//   <Container>
//     <LogoSection />
//     <SearchBar />
//     <Navigation />
//     <Actions />
//   </Container>
// </header>

// Responsive behavior:
// Mobile: Logo + Menu toggle + Actions
// Desktop: Logo + Search + Navigation + Actions
```

### 2. Hero Section Layout
```tsx
// Structure:
// <section className="hero">
//   <Container>
//     <Row>
//       <Column span={6}>
//         <Badge />
//         <Heading />
//         <Paragraph />
//         <Button />
//       </Column>
//       <Column span={6}>
//         <Image />
//       </Column>
//     </Row>
//   </Container>
// </section>
```

### 3. ProductGrid Layout
```tsx
// Responsive grid:
// Mobile: grid-cols-2
// Tablet: grid-cols-3
// Desktop: grid-cols-4
// Large: grid-cols-5

// Features:
// - Auto-fit layout
// - Consistent spacing
// - Infinite scroll ready
// - Loading states
```

## 🎭 Animation Specifications

### Transitions
```css
/* Standard transitions */
.transition-default {
  transition-property: color, background-color, border-color, opacity;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover transitions */
.hover-lift {
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}
```

### Loading States
```tsx
// Skeleton components for loading
interface SkeletonProps {
  className?: string;
  variant: 'text' | 'rectangular' | 'circular';
}

// Usage in ProductGrid:
// Show skeleton cards while loading
// Fade in real content when loaded
```

## 🛍️ E-commerce Specific Components

### 1. PriceDisplay Component
```tsx
interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Features:
// - Formatted currency display
// - Strike-through for original price
// - Discount percentage calculation
// - Multiple size variants
```

### 2. MercadoLivreButton Component
```tsx
interface MLButtonProps {
  href: string;
  productTitle: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
}

// Features:
// - Mercado Livre branding
// - UTM tracking
// - External link handling
// - Analytics tracking
```

### 3. CategoryIcon Component
```tsx
interface CategoryIconProps {
  category: 'electronics' | 'mobile' | 'tablet' | 'audio' | 'accessories';
  size?: number;
}

// Icon mapping:
// electronics: 💻
// mobile: 📱
// tablet: 📱
// audio: 🎧
// accessories: ⌚
```

## 📊 State Management

### Loading States
```tsx
// Component states
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Error handling
interface ErrorState {
  message: string;
  code?: string;
  retry?: () => void;
}
```

### Filter States
```tsx
// Product filtering
interface FilterState {
  category?: string;
  priceRange?: [number, number];
  freeShipping?: boolean;
  sortBy?: 'price' | 'title' | 'newest';
  sortOrder?: 'asc' | 'desc';
}
```

## 🔍 Accessibility

### ARIA Labels
```tsx
// Required aria labels
aria-label="Buscar produtos"
aria-label="Ver produto no Mercado Livre"
aria-label="Filtrar por categoria"
aria-label="Ordenar produtos"
```

### Keyboard Navigation
```tsx
// Focusable elements
tabIndex={0}  // Interactive elements
tabIndex={-1} // Skip in tab order

// Focus management
role="button"
role="link"
role="navigation"
```

### Screen Reader Support
```tsx
// Image alt texts
alt="Produto: {productTitle}"
alt="Logo Peepers"
alt="Ícone da categoria {categoryName}"

// Live regions
aria-live="polite"  // Status updates
aria-live="assertive"  // Critical updates
```

## 📱 Responsive Design

### Breakpoint System
```css
/* Tailwind breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X Extra large devices */
```

### Component Adaptations
```tsx
// Header: Responsive navigation
// Mobile: Hamburger menu
// Desktop: Full navigation

// ProductGrid: Responsive columns
// Mobile: 2 columns
// Tablet: 3 columns
// Desktop: 4-5 columns

// Hero: Responsive layout
// Mobile: Stacked vertically
// Desktop: Side by side
```

## 🎨 Visual Hierarchy

### Spacing System
```css
/* Consistent spacing scale */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### Shadow System
```css
/* Elevation levels */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
```

---

**Versão**: 1.0  
**Data**: 15/09/2025  
**Status**: Especificação completa