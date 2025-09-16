'use client';

import { useEffect } from 'react';

interface PreloadResourcesProps {
  resources: Array<{
    href: string;
    as: 'image' | 'font' | 'script' | 'style';
    type?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
  }>;
}

export default function PreloadResources({ resources }: PreloadResourcesProps) {
  useEffect(() => {
    resources.forEach(({ href, as, type, crossOrigin }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = as;
      link.href = href;

      if (type) {
        link.type = type;
      }

      if (crossOrigin) {
        link.crossOrigin = crossOrigin;
      }

      // Only add if not already present
      const existingLink = document.querySelector(`link[rel="preload"][href="${href}"]`);
      if (!existingLink) {
        document.head.appendChild(link);
      }
    });
  }, [resources]);

  return null;
}