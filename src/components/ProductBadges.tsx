'use client';

import { ProductBadge } from '@/utils/productCategories';

interface ProductBadgesProps {
  badges: ProductBadge[];
  className?: string;
}

export default function ProductBadges({ badges, className = '' }: ProductBadgesProps) {
  if (badges.length === 0) return null;

  const getBadgeStyles = (badge: ProductBadge) => {
    const baseStyles = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
    
    switch (badge.color) {
      case 'blue':
        return `${baseStyles} bg-blue-100 text-blue-800`;
      case 'green':
        return `${baseStyles} bg-green-100 text-green-800`;
      case 'purple':
        return `${baseStyles} bg-purple-100 text-purple-800`;
      case 'orange':
        return `${baseStyles} bg-orange-100 text-orange-800`;
      case 'red':
        return `${baseStyles} bg-red-100 text-red-800`;
      case 'yellow':
        return `${baseStyles} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseStyles} bg-gray-100 text-gray-800`;
    }
  };

  const getBadgeIcon = (type: ProductBadge['type']) => {
    switch (type) {
      case 'turbo':
        return '⚡';
      case 'ultra':
        return '🚀';
      case 'gaming':
        return '🎮';
      case 'premium':
        return '⭐';
      case 'free-shipping':
        return '📦';
      case 'low-stock':
        return '⚠️';
      case 'new':
        return '🆕';
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {badges.map((badge, index) => (
        <span
          key={`${badge.type}-${index}`}
          className={getBadgeStyles(badge)}
          title={`${badge.label}`}
        >
          {getBadgeIcon(badge.type) && (
            <span className="mr-1">{getBadgeIcon(badge.type)}</span>
          )}
          {badge.label}
        </span>
      ))}
    </div>
  );
}