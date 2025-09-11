// Peepers Brand Theme Configuration
// Based on the crowned frog logo: green frog with golden crown

export const peepersTheme = {
  colors: {
    // Primary brand colors from logo
    primary: {
      50: '#f0f9f0',
      100: '#dcf2dc',
      200: '#bce5bc',
      300: '#8dd18d',
      400: '#5cb85c',
      500: '#2d5a27', // Main frog green
      600: '#1f4a1f',
      700: '#1a3d1a',
      800: '#143014',
      900: '#0f260f',
    },
    
    // Secondary - Golden crown
    secondary: {
      50: '#fefcf0',
      100: '#fef7d9',
      200: '#fdedb3',
      300: '#fce083',
      400: '#f9d051',
      500: '#f1c40f', // Crown gold
      600: '#d4a017',
      700: '#b8860b',
      800: '#9a6f0a',
      900: '#7d5a08',
    },
    
    // Neutral grays
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // Typography
  fonts: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
  },
  
  // Spacing scale
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  // Border radius
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  // Animation durations
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
} as const;

// CSS Custom Properties for dynamic theming
export const cssVariables = `
  :root {
    --color-primary-50: ${peepersTheme.colors.primary[50]};
    --color-primary-100: ${peepersTheme.colors.primary[100]};
    --color-primary-200: ${peepersTheme.colors.primary[200]};
    --color-primary-300: ${peepersTheme.colors.primary[300]};
    --color-primary-400: ${peepersTheme.colors.primary[400]};
    --color-primary-500: ${peepersTheme.colors.primary[500]};
    --color-primary-600: ${peepersTheme.colors.primary[600]};
    --color-primary-700: ${peepersTheme.colors.primary[700]};
    --color-primary-800: ${peepersTheme.colors.primary[800]};
    --color-primary-900: ${peepersTheme.colors.primary[900]};
    
    --color-secondary-50: ${peepersTheme.colors.secondary[50]};
    --color-secondary-100: ${peepersTheme.colors.secondary[100]};
    --color-secondary-200: ${peepersTheme.colors.secondary[200]};
    --color-secondary-300: ${peepersTheme.colors.secondary[300]};
    --color-secondary-400: ${peepersTheme.colors.secondary[400]};
    --color-secondary-500: ${peepersTheme.colors.secondary[500]};
    --color-secondary-600: ${peepersTheme.colors.secondary[600]};
    --color-secondary-700: ${peepersTheme.colors.secondary[700]};
    --color-secondary-800: ${peepersTheme.colors.secondary[800]};
    --color-secondary-900: ${peepersTheme.colors.secondary[900]};
  }
`;

// Utility functions
export const getColor = (color: keyof typeof peepersTheme.colors, shade?: number) => {
  const colorObj = peepersTheme.colors[color];
  if (typeof colorObj === 'string') return colorObj;
  if (shade && typeof colorObj === 'object') return colorObj[shade as keyof typeof colorObj];
  return colorObj;
};

export type PeepersTheme = typeof peepersTheme;
