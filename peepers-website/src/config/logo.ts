/**
 * Centralized logo configuration following DRY principles
 * Single source of truth for all logo-related settings
 */

export interface LogoSize {
  width: number;
  height: number;
}

export interface LogoConfig {
  sizes: Record<'sm' | 'md' | 'lg' | 'xl', LogoSize>;
  paths: {
    full: string;
    icon: string;
  };
  fallback: {
    full: string;
    icon: string;
  };
  alt: {
    full: string;
    icon: string;
  };
}

/**
 * Logo configuration object
 * Centralized configuration following SOLID principles
 */
export const LOGO_CONFIG: LogoConfig = {
  sizes: {
    sm: { width: 120, height: 45 },
    md: { width: 160, height: 60 },
    lg: { width: 200, height: 75 },
    xl: { width: 280, height: 105 },
  },
  paths: {
    full: '/logo-full.png',
    icon: '/logo-icon.png',
  },
  fallback: {
    full: '👑 Peepers',
    icon: '👑P',
  },
  alt: {
    full: 'Peepers - Crowned Frog Logo',
    icon: 'Peepers Logo Icon',
  },
};

/**
 * Utility function to get logo size configuration
 * @param size - The size key
 * @returns LogoSize object
 */
export function getLogoSize(size: keyof LogoConfig['sizes']): LogoSize {
  return LOGO_CONFIG.sizes[size];
}

/**
 * Utility function to get logo path
 * @param variant - The logo variant
 * @returns Logo path string
 */
export function getLogoPath(variant: keyof LogoConfig['paths']): string {
  return LOGO_CONFIG.paths[variant];
}

/**
 * Utility function to get fallback text
 * @param variant - The logo variant
 * @returns Fallback text string
 */
export function getLogoFallback(variant: keyof LogoConfig['fallback']): string {
  return LOGO_CONFIG.fallback[variant];
}

/**
 * Utility function to get alt text
 * @param variant - The logo variant
 * @returns Alt text string
 */
export function getLogoAlt(variant: keyof LogoConfig['alt']): string {
  return LOGO_CONFIG.alt[variant];
}
