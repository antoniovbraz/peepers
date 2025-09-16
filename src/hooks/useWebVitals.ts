import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';

export function useWebVitals() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page views
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Page view: ${pathname}`,
      level: 'info',
    });
  }, [pathname]);
}