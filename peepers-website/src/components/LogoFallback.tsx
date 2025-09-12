import React from 'react';
import { getLogoFallback, getLogoSize } from '@/config/logo';

interface LogoFallbackProps {
  variant: 'full' | 'icon';
  size: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Fallback component for logo display when images fail to load
 * Follows SOLID principles with single responsibility
 * Ensures consistent fallback behavior across the application
 */
export function LogoFallback({ variant, size, className = '' }: LogoFallbackProps) {
  const fallbackText = getLogoFallback(variant);
  const { height } = getLogoSize(size);
  
  // Map size to Tailwind classes (keeps classes static for Tailwind scanning)
  const sizeClass = size === 'sm'
    ? 'h-12 text-lg'
    : size === 'md'
    ? 'h-16 text-xl'
    : size === 'lg'
    ? 'h-20 text-2xl'
    : 'h-24 text-3xl';

  const weightClass = 'font-bold';
  const colorClass = 'text-primary-700';

  return (
    <div 
      className={[
        'flex items-center justify-center',
        sizeClass,
        weightClass,
        colorClass,
        className
      ].filter(Boolean).join(' ')}
      role="img"
      aria-label={`${fallbackText} (fallback)`}
      style={{ lineHeight: 1 }}
    >
      {fallbackText}
    </div>
  );
}
