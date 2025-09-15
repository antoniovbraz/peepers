'use client';

import { useEffect, useState } from 'react';

interface SafeHydrationProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente para evitar problemas de hydration
 * Só renderiza children após hydration completa
 */
export default function SafeHydration({ children, fallback = null }: SafeHydrationProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}