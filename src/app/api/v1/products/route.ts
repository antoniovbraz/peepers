import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';
import { checkRateLimit } from '@/lib/utils';
import { validateInput, PaginationSchema, ProductFilterSchema } from '@/lib/validation';
import { MLProduct, MLPicture, MLAttribute } from '@/types/ml';

// Formatted product types
interface FormattedProductBase {
  id: string;
  title: string;
  price: number;
  thumbnail: string;
  available_quantity: number;
  condition: string;
  status: string;
  shipping: {
    free_shipping: boolean;
  };
  permalink: string;
}

interface FormattedProductFull extends FormattedProductBase {
  currency_id: string;
  seller_id: number;
  category_id: string;
  sold_quantity: number;
  date_created: string;
  last_updated: string;
  pictures?: MLPicture[];
  attributes?: MLAttribute[];
}

type FormattedProduct = FormattedProductBase | FormattedProductFull;

// Query parameters interface
interface ProductQueryParams {
  // Pagination
  page?: string;
  limit?: string;

  // Filters
  categoryId?: string;
  condition?: string;
  priceMin?: string;
  priceMax?: string;
  status?: string;
  freeShipping?: string;

  // Options
  format?: 'full' | 'minimal' | 'summary';
  authenticated?: string;
  includeDetails?: string;
  sortBy?: string;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryParams: ProductQueryParams = Object.fromEntries(url.searchParams);

    // Determine request type and apply appropriate rate limiting
    const isPublic = queryParams.authenticated !== 'true';
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Different rate limits for public vs authenticated requests
    const rateLimitKey = isPublic ? `public-products:${clientIP}` : `auth-products:${clientIP}`;
    const rateLimitConfig = isPublic
      ? { requests: 500, windowMs: 15 * 60 * 1000 } // 500 req/15min for public
      : { requests: 1000, windowMs: 60 * 1000 };   // 1000 req/min for authenticated

    const rateLimit = await checkRateLimit(
      rateLimitKey,
      rateLimitConfig.requests,
      rateLimitConfig.windowMs
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
        }
      );
    }

    // Validate pagination parameters
    const paginationValidation = validateInput(PaginationSchema, {
      page: queryParams.page || '1',
      limit: queryParams.limit || '50'
    });

    if (!paginationValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid pagination parameters',
          details: paginationValidation.error
        },
        { status: 400 }
      );
    }

    // Validate filter parameters
    const filterValidation = validateInput(ProductFilterSchema, queryParams);
    if (!filterValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid filter parameters',
          details: filterValidation.error
        },
        { status: 400 }
      );
    }

    // Check authentication for non-public requests
    if (!isPublic) {
      const userId = request.cookies.get('user_id')?.value;
      if (!userId) {
        return NextResponse.json({
          error: 'Unauthorized',
          message: 'Authentication required for this request type'
        }, { status: 401 });
      }
    }

    // Get products from cache
    const cachedProducts = await cache.getAllProducts();

    if (!cachedProducts || cachedProducts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No products available',
        message: 'Products cache is empty. Please try again later.',
        data: {
          products: [],
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      }, { status: 404 });
    }

    // Apply filters
    let filteredProducts = applyFilters(cachedProducts, queryParams);

    // Apply sorting
    filteredProducts = applySorting(filteredProducts, queryParams.sortBy);

    // Apply pagination
    const page = parseInt(queryParams.page || '1');
    const limit = parseInt(queryParams.limit || '50');
    const offset = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    // Format response based on requested format
    const formattedProducts = formatProducts(paginatedProducts, queryParams.format, isPublic);

    const response = {
      success: true,
      message: `${filteredProducts.length} products found`,
      data: {
        products: formattedProducts,
        total: filteredProducts.length,
        page,
        limit,
        totalPages: Math.ceil(filteredProducts.length / limit),
        hasNext: offset + limit < filteredProducts.length,
        hasPrev: page > 1
      },
      meta: {
        source: 'cache',
        format: queryParams.format || 'summary',
        authenticated: !isPublic,
        rateLimit: {
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Products API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request'
    }, { status: 500 });
  }
}

// Helper functions
function applyFilters(products: MLProduct[], filters: ProductQueryParams): MLProduct[] {
  return products.filter(product => {
    // Category filter
    if (filters.categoryId && product.category_id !== filters.categoryId) {
      return false;
    }

    // Condition filter
    if (filters.condition && product.condition !== filters.condition) {
      return false;
    }

    // Price range filter
    if (filters.priceMin && product.price < parseFloat(filters.priceMin)) {
      return false;
    }
    if (filters.priceMax && product.price > parseFloat(filters.priceMax)) {
      return false;
    }

    // Status filter
    if (filters.status && product.status !== filters.status) {
      return false;
    }

    // Free shipping filter
    if (filters.freeShipping === 'true' && !product.shipping?.free_shipping) {
      return false;
    }

    return true;
  });
}

function applySorting(products: MLProduct[], sortBy?: string): MLProduct[] {
  if (!sortBy) return products;

  return [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'date_desc':
        return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
      case 'relevance':
      default:
        return b.sold_quantity - a.sold_quantity; // Sort by popularity
    }
  });
}

function formatProducts(products: MLProduct[], format?: string, isPublic: boolean = true): FormattedProduct[] {
  return products.map(product => {
    const baseProduct = {
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.pictures && product.pictures.length > 0
        ? product.pictures[0].secure_url || product.pictures[0].url
        : product.secure_thumbnail || product.thumbnail,
      available_quantity: product.available_quantity,
      condition: product.condition,
      status: product.status,
      shipping: {
        free_shipping: product.shipping?.free_shipping || false
      },
      permalink: product.permalink
    };

    // For public requests, limit information
    if (isPublic && format !== 'full') {
      return baseProduct;
    }

    // For authenticated requests or full format, include more details
    return {
      ...baseProduct,
      currency_id: product.currency_id,
      seller_id: product.seller_id,
      category_id: product.category_id,
      sold_quantity: product.sold_quantity,
      date_created: product.date_created,
      last_updated: product.last_updated,
      ...(format === 'full' && {
        pictures: product.pictures,
        attributes: product.attributes
      })
    };
  });
}