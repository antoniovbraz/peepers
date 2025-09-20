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
  
  // Ensure HTTPS for security
  const secureUrl = ensureHttps(url);
  
  // ML image URLs can be resized by changing the size parameter
  const sizeMap = {
    thumbnail: 'I',
    small: 'D',
    medium: 'O',
    large: 'W'
  };
  
  // Replace the size in ML URLs
  if (secureUrl.includes('mlstatic.com')) {
    return secureUrl.replace(/\/[IDOW]\//, `/${sizeMap[size]}/`);
  }
  
  return secureUrl;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
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

export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error && error.name === 'TypeError' && error.message.includes('fetch')) {
    return new AppError('Erro de conexão. Verifique sua internet.', 503, 'NETWORK_ERROR');
  }

  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: number }).status;
    if (status === 404) {
      return new AppError('Recurso não encontrado.', 404, 'NOT_FOUND');
    }

    if (status === 429) {
      return new AppError('Muitas requisições. Tente novamente em alguns minutos.', 429, 'RATE_LIMIT');
    }
  }

  // Handle generic error cases
  const message = (error instanceof Error ? error.message : 'Erro interno do servidor.');
  const status = (error && typeof error === 'object' && 'status' in error && typeof (error as { status?: unknown }).status === 'number')
    ? (error as { status: number }).status
    : 500;

  return new AppError(message, status, 'INTERNAL_ERROR');
}

// Rate limiting utility
export async function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const { getKVClient } = await import('@/lib/cache');
  const kv = getKVClient();

  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Get current requests in window
    const requests = await kv.lrange(key, 0, -1);
    const validRequests = requests
      .map((timestamp: string) => parseInt(timestamp))
      .filter((timestamp: number) => timestamp > windowStart);

    const currentCount = validRequests.length;
    const remaining = Math.max(0, limit - currentCount);
    const allowed = currentCount < limit;

    if (allowed) {
      // Add current request timestamp
      await kv.lpush(key, now.toString());
      // Keep only requests within window
      await kv.ltrim(key, 0, limit - 1);
      // Set expiration
      await kv.expire(key, Math.ceil(windowMs / 1000));
    }

    const resetTime = windowStart + windowMs;

    return { allowed, remaining: remaining - 1, resetTime };
  } catch (error) {
    // If rate limiting fails, allow request to prevent blocking legitimate traffic
    console.warn('Rate limiting check failed:', error);
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
  }
}

/**
 * Converts HTTP URLs to HTTPS, particularly useful for Mercado Livre image URLs
 * @param url - The URL to convert
 * @returns The same URL with HTTPS protocol if it was HTTP
 */
export function ensureHttps(url: string): string {
  if (!url) return url;
  
  // Convert HTTP to HTTPS for ML static images
  if (url.startsWith('http://') && url.includes('mlstatic.com')) {
    return url.replace('http://', 'https://');
  }
  
  return url;
}

/**
 * Gets the best available image URL from product data
 * @param product - Product with thumbnail and pictures array
 * @returns The highest quality image URL available
 */
export function getBestImageUrl(product: { thumbnail?: string; pictures?: Array<{ secure_url: string; url: string }> }): string {
  // Priority: 1st picture secure_url > 1st picture url > thumbnail
  if (product.pictures && product.pictures.length > 0) {
    const firstPicture = product.pictures[0];
    return ensureHttps(firstPicture.secure_url || firstPicture.url);
  }
  
  // Fallback to thumbnail
  return ensureHttps(product.thumbnail || getPlaceholderImage());
}

/**
 * Returns a safe placeholder image as data URL to avoid 404 errors
 */
export function getPlaceholderImage(): string {
  // Simple gray placeholder SVG as data URL
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwSDE5MFYxOTBIMTcwVjE3MEgxMjBWMTUwSDE3MFYxMjBIMTAwVjEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEyMCAxMjBIMTcwVjE3MEgxMjBWMTIwWiIgZmlsbD0iI0Q1RDlEOSIvPgo8L3N2Zz4K';
}

/**
 * Helper function to handle image errors safely in React components
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>): void {
  const target = e.target as HTMLImageElement;
  if (target.src !== getPlaceholderImage()) {
    target.src = getPlaceholderImage();
    target.onerror = null; // Prevent infinite loop
  }
}
