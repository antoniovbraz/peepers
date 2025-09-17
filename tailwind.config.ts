import type { Config } from "tailwindcss";
import { tokens } from "./src/styles/tokens";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Override default theme with our design tokens
    colors: tokens.colors,
    spacing: tokens.spacing,
    fontFamily: tokens.typography.fontFamily,
    fontSize: tokens.typography.fontSize,
    fontWeight: tokens.typography.fontWeight,
    letterSpacing: tokens.typography.letterSpacing,
    lineHeight: tokens.typography.lineHeight,
    borderRadius: tokens.borders.borderRadius,
    borderWidth: tokens.borders.borderWidth,
    boxShadow: tokens.shadows.boxShadow,
    transitionDuration: tokens.animations.transitionDuration,
    transitionTimingFunction: tokens.animations.transitionTimingFunction,
    keyframes: tokens.animations.keyframes,
    zIndex: tokens.zIndex,
    screens: tokens.breakpoints,
    
    extend: {
      // Legacy colors for backward compatibility
      colors: {
        // Keep existing primary/secondary structure for smooth migration
        primary: {
          DEFAULT: tokens.colors.brand.primary[600],  // #0D6832
          light: tokens.colors.brand.primary[500],    // #15884A
          dark: tokens.colors.brand.primary[700],     // #0A5429
          50: tokens.colors.brand.primary[50],
          100: tokens.colors.brand.primary[100],
          200: tokens.colors.brand.primary[200],
          300: tokens.colors.brand.primary[300],
          400: tokens.colors.brand.primary[400],
          500: tokens.colors.brand.primary[500],
          600: tokens.colors.brand.primary[600],
          700: tokens.colors.brand.primary[700],
          800: tokens.colors.brand.primary[800],
          900: tokens.colors.brand.primary[900],
          950: tokens.colors.brand.primary[950],
        },
        secondary: {
          DEFAULT: tokens.colors.brand.secondary[400], // #E0C81A
          light: tokens.colors.brand.secondary[300],   // #F7DB32
          dark: tokens.colors.brand.secondary[600],    // #C4AF10
          50: tokens.colors.brand.secondary[50],
          100: tokens.colors.brand.secondary[100],
          200: tokens.colors.brand.secondary[200],
          300: tokens.colors.brand.secondary[300],
          400: tokens.colors.brand.secondary[400],
          500: tokens.colors.brand.secondary[500],
          600: tokens.colors.brand.secondary[600],
          700: tokens.colors.brand.secondary[700],
          800: tokens.colors.brand.secondary[800],
          900: tokens.colors.brand.secondary[900],
          950: tokens.colors.brand.secondary[950],
        },
        accent: {
          DEFAULT: tokens.colors.brand.accent[600],    // #DC2626
          light: tokens.colors.brand.accent[500],      // #EF4444
          dark: tokens.colors.brand.accent[700],       // #B91C1C
          50: tokens.colors.brand.accent[50],
          100: tokens.colors.brand.accent[100],
          200: tokens.colors.brand.accent[200],
          300: tokens.colors.brand.accent[300],
          400: tokens.colors.brand.accent[400],
          500: tokens.colors.brand.accent[500],
          600: tokens.colors.brand.accent[600],
          700: tokens.colors.brand.accent[700],
          800: tokens.colors.brand.accent[800],
          900: tokens.colors.brand.accent[900],
          950: tokens.colors.brand.accent[950],
        },
        
        // Design system semantic colors
        success: tokens.colors.semantic.success,
        warning: tokens.colors.semantic.warning,
        error: tokens.colors.semantic.error,
        info: tokens.colors.semantic.info,
        
        // Neutral system
        gray: tokens.colors.neutral,
        
        // Brand system aliases
        brand: tokens.colors.brand,
        
        // Legacy support (will be deprecated)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      
      // Component-specific utilities using our design tokens
      height: {
        'button-sm': tokens.components.button.height.sm,
        'button-md': tokens.components.button.height.md,
        'button-lg': tokens.components.button.height.lg,
        'input-sm': tokens.components.input.height.sm,
        'input-md': tokens.components.input.height.md,
        'input-lg': tokens.components.input.height.lg,
      },

      // Custom animations using our tokens
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin': 'spin 1s linear infinite',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
      },

      // Brand gradient backgrounds
      backgroundImage: {
        'gradient-primary': `linear-gradient(135deg, ${tokens.colors.brand.primary[500]} 0%, ${tokens.colors.brand.primary[600]} 100%)`,
        'gradient-secondary': `linear-gradient(135deg, ${tokens.colors.brand.secondary[300]} 0%, ${tokens.colors.brand.secondary[400]} 100%)`,
        'gradient-accent': `linear-gradient(135deg, ${tokens.colors.brand.accent[500]} 0%, ${tokens.colors.brand.accent[600]} 100%)`,
        'gradient-success': `linear-gradient(135deg, ${tokens.colors.semantic.success[400]} 0%, ${tokens.colors.semantic.success[600]} 100%)`,
        'gradient-hero': `linear-gradient(135deg, ${tokens.colors.brand.primary[50]} 0%, ${tokens.colors.brand.secondary[50]} 100%)`,
      },
    },
  },
  plugins: [
    // Convert to proper ES6 imports instead of require
  ],
} satisfies Config;