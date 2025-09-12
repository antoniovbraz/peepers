'use client';

import React from 'react';
import Image from 'next/image';
import { useImageLoader } from '@/hooks/useImageLoader';
import { LogoFallback } from '@/components/LogoFallback';
import { 
  getLogoSize, 
  getLogoPath, 
  getLogoAlt 
} from '@/config/logo';

interface PeepersLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  className?: string;
  priority?: boolean;
}

/**
 * Robust PeepersLogo component with intelligent fallback system
 * Follows SOLID principles:
 * - Single Responsibility: Handles logo display only
 * - Open/Closed: Extensible through props, closed for modification
 * - Liskov Substitution: Can be used anywhere a logo is needed
 * - Interface Segregation: Clean, focused interface
 * - Dependency Inversion: Depends on abstractions (hooks, config)
 * 
 * Follows DRY principles:
 * - Reuses configuration from centralized config
 * - Reuses image loading logic from custom hook
 * - Reuses fallback logic from dedicated component
 */
export default function PeepersLogo({ 
  size = 'md', 
  variant = 'full', 
  className = '',
  priority = false
}: PeepersLogoProps) {
  const logoPath = getLogoPath(variant);
  const logoSize = getLogoSize(size);
  const altText = getLogoAlt(variant);
  
  const { isLoaded, hasError, isLoading } = useImageLoader(logoPath);

  // Calculate dimensions based on variant
  const dimensions = variant === 'icon'
    ? { width: logoSize.height, height: logoSize.height } // Square for icon
    : logoSize; // Original aspect ratio for full logo

  // Map logical sizes to sensible Tailwind classes (keeps classes static for Tailwind scanning)
  const sizeClass = size === 'sm'
    ? 'w-36 h-12'
    : size === 'md'
    ? 'w-40 h-16'
    : size === 'lg'
    ? 'w-48 h-20'
    : 'w-64 h-24';

  // Show fallback if image failed to load or is still loading
  if (hasError || isLoading) {
    return (
      <LogoFallback
        variant={variant}
        size={size}
        className={className}
      />
    );
  }

  // Show image if successfully loaded
  return (
    <div className={`relative ${sizeClass} ${className}`}>
      <Image
        src={logoPath}
        alt={altText}
        width={logoSize.width}
        height={logoSize.height}
        className="object-contain w-full h-full"
        priority={priority}
        onError={() => {
          // Additional error handling - this should not be needed
          // due to useImageLoader, but provides extra safety
          console.warn(`Failed to load logo image: ${logoPath}`);
        }}
        onLoad={() => {
          // Optional: Add analytics or logging here
          console.log(`Successfully loaded logo: ${logoPath}`);
        }}
        // Optimize loading
        sizes={`${logoSize.width}px`}
        quality={90}
        // Accessibility improvements
        role="img"
        aria-label={altText}
      />
    </div>
  );
}

/**
 * Export named version for flexibility
 */
export { PeepersLogo };
