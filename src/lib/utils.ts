import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency === 'BRL' ? 'BRL' : 'USD',
  }).format(price);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'agora mesmo';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''} atrás`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
  }

  return formatDate(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function getConditionLabel(condition: string): string {
  const conditions: Record<string, string> = {
    'new': 'Novo',
    'used': 'Usado',
    'not_specified': 'Não especificado'
  };
  
  return conditions[condition] || condition;
}

export function getShippingLabel(
  shipping: { free_shipping: boolean; local_pick_up: boolean }
): string {
  if (shipping.free_shipping) {
    return 'Frete grátis';
  }
  
  if (shipping.local_pick_up) {
    return 'Retirada local';
  }
  
  return 'Calcular frete';
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getImageUrl(url: string, size: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium'): string {
  if (!url) return '/images/placeholder-product.jpg';
  
  // ML image URLs can be resized by changing the size parameter
  const sizeMap = {
    thumbnail: 'I',
    small: 'D',
    medium: 'O',
    large: 'W'
  };
  
  // Replace the size in ML URLs
  if (url.includes('mlstatic.com')) {
    return url.replace(/\/[IDOW]\//, `/${sizeMap[size]}/`);
  }
  
  return url;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function generateProductUrl(product: { id: string; title: string }): string {
  const slug = slugify(product.title);
  return `/produtos/${product.id}/${slug}`;
}

export function extractProductIdFromUrl(url: string): string | null {
  const match = url.match(/\/produtos\/([^\/]+)/);
  return match ? match[1] : null;
}

// Error handling utilities
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleApiError(error: any): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new AppError('Erro de conexão. Verifique sua internet.', 503, 'NETWORK_ERROR');
  }
  
  if (error.status === 404) {
    return new AppError('Recurso não encontrado.', 404, 'NOT_FOUND');
  }
  
  if (error.status === 429) {
    return new AppError('Muitas requisições. Tente novamente em alguns minutos.', 429, 'RATE_LIMIT');
  }
  
  return new AppError(
    error.message || 'Erro interno do servidor.',
    error.status || 500,
    'INTERNAL_ERROR'
  );
}
