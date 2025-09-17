'use client';

import { ProductBadge } from '@/utils/productCategories';
import { Badge } from '@/components/ui/primitives/Badge';

// ==================== TYPES ====================

interface ProductBadgesNewProps {
  badges: ProductBadge[];
  className?: string;
}

// ==================== COMPONENT ====================

export default function ProductBadgesNew({ badges, className = '' }: ProductBadgesNewProps) {
  if (badges.length === 0) return null;

  const getBadgeVariant = (badge: ProductBadge): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'default' => {
    switch (badge.color) {
      case 'blue':
        return 'primary';
      case 'green':
        return 'success';
      case 'purple':
        return 'secondary';
      case 'orange':
        return 'warning';
      case 'red':
        return 'error';
      case 'yellow':
        return 'warning';
      default:
        return 'default';
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
      {badges.map((badge, index) => {
        const icon = getBadgeIcon(badge.type);
        
        return (
          <Badge
            key={`${badge.type}-${index}`}
            variant={getBadgeVariant(badge)}
            size="sm"
            className="shadow-sm"
          >
            {icon && <span className="mr-1">{icon}</span>}
            {badge.label}
          </Badge>
        );
      })}
    </div>
  );
}