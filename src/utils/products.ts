import { API_ENDPOINTS } from '@/config/routes';
import type { MLProduct } from '@/types/ml';

/**
 * Fetches products from the unified v1 API
 * @param limit - Maximum number of products to fetch
 * @returns Promise with products array
 */
export async function fetchProducts(limit?: number): Promise<MLProduct[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  // ✅ NEW: Use unified v1 endpoint with public format
  const url = new URL(API_ENDPOINTS.PRODUCTS, baseUrl);
  url.searchParams.set('format', 'minimal'); // Public-friendly format
  if (limit) {
    url.searchParams.set('limit', limit.toString());
  }
  
  const response = await fetch(url.toString(), {
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Falha ao carregar produtos');
  }
  
  const data = await response.json();
  
  // ✅ NEW: Handle v1 API response format  
  const products = data.data?.products || data.products || [];
  
  return limit ? products.slice(0, limit) : products;
}

/**
 * Generates a review count based on product ID
 * @param productId - Product ID string
 * @returns Generated review count
 */
export function generateReviewCount(productId?: string): number {
  if (!productId) return 50;
  return (parseInt(productId.toString().slice(-2), 10) || 0) + 50;
}

/**
 * Validates if a product has required fields
 * @param product - Product object to validate
 * @returns Boolean indicating if product is valid
 */
export function isValidProduct(product: unknown): product is MLProduct {
  return !!(product && typeof product === 'object' && 'id' in product && 'title' in product);
}

/**
 * Generates correct Mercado Livre product URL
 * @param product - Product with id and optional permalink
 * @returns Mercado Livre product URL
 */
export function getMercadoLivreUrl(product: MLProduct): string {
  // Use permalink if available
  if (product.permalink && typeof product.permalink === 'string') {
    return product.permalink;
  }
  
  // Fallback: construct URL from ID
  if (product.id && typeof product.id === 'string') {
    // Handle different ID formats
    const cleanId = product.id.replace(/^MLB-?/, ''); // Remove MLB prefix if present
    return `https://produto.mercadolivre.com.br/MLB-${cleanId}`;
  }
  
  // Last resort: fallback to general ML URL
  return 'https://www.mercadolivre.com.br';
}