/**
 * Badge Component - Tailwind-based badge
 */

import { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function Badge({ children, className = '', variant = 'default' }: BadgeProps) {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}