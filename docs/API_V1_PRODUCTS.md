# API v1 Products Endpoint

## Overview

The unified `/api/v1/products` endpoint consolidates all product-related functionality from the previous 15+ endpoints into a single, well-structured API with comprehensive filtering, pagination, and formatting options.

## Endpoint

```
GET /api/v1/products
```

## Query Parameters

### Pagination
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50, max: 100)

### Filters
- `categoryId` (string, optional): Filter by category ID
- `condition` (string, optional): Filter by condition ('new', 'used', 'not_specified')
- `priceMin` (number, optional): Minimum price filter
- `priceMax` (number, optional): Maximum price filter
- `status` (string, optional): Filter by status ('active', 'paused', 'closed')
- `freeShipping` (boolean, optional): Filter by free shipping availability

### Options
- `format` (string, optional): Response format ('summary', 'minimal', 'full') - default: 'summary'
- `authenticated` (boolean, optional): Request authenticated data - default: false
- `sortBy` (string, optional): Sort order ('price_asc', 'price_desc', 'date_desc', 'relevance')

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "X products found",
  "data": {
    "products": [
      {
        "id": "string",
        "title": "string",
        "price": "number",
        "thumbnail": "string",
        "available_quantity": "number",
        "condition": "string",
        "status": "string",
        "shipping": {
          "free_shipping": "boolean"
        },
        "permalink": "string",
        // Additional fields for authenticated requests or full format
        "currency_id": "string",
        "seller_id": "number",
        "category_id": "string",
        "sold_quantity": "number",
        "date_created": "string",
        "last_updated": "string",
        "pictures": "array",
        "attributes": "array"
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number",
    "totalPages": "number",
    "hasNext": "boolean",
    "hasPrev": "boolean"
  },
  "meta": {
    "source": "cache",
    "format": "summary",
    "authenticated": false,
    "rateLimit": {
      "remaining": "number",
      "resetTime": "number"
    }
  }
}
```

### Error Responses

#### Rate Limiting (429)
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": "number"
}
```

#### Validation Error (400)
```json
{
  "error": "Invalid filter parameters",
  "details": "object"
}
```

#### No Products (404)
```json
{
  "success": false,
  "error": "No products available",
  "message": "Products cache is empty. Please try again later.",
  "data": {
    "products": [],
    "total": 0,
    "page": 1,
    "limit": 50,
    "totalPages": 0,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### Unauthorized (401)
```json
{
  "error": "Unauthorized",
  "message": "Authentication required for this request type"
}
```

## Rate Limiting

- **Public requests**: 500 requests per 15 minutes
- **Authenticated requests**: 1000 requests per minute
- Rate limit headers included in response

## Authentication

- Public access available without authentication
- Authenticated requests require valid session cookie
- Use `authenticated=true` for full product data access

## Examples

### Basic Request
```bash
curl "http://localhost:3000/api/v1/products"
```

### Filtered Request
```bash
curl "http://localhost:3000/api/v1/products?categoryId=electronics&priceMin=100&priceMax=500&sortBy=price_asc"
```

### Paginated Request
```bash
curl "http://localhost:3000/api/v1/products?page=2&limit=20"
```

### Full Format Request
```bash
curl "http://localhost:3000/api/v1/products?format=full&authenticated=true"
```

## Migration Guide

### From Old Endpoints

| Old Endpoint | New Equivalent |
|-------------|----------------|
| `/api/products-public` | `/api/v1/products` |
| `/api/products` | `/api/v1/products?authenticated=true` |
| `/api/products?limit=X` | `/api/v1/products?limit=X` |
| `/api/products?page=X` | `/api/v1/products?page=X` |
| `/api/products?category=X` | `/api/v1/products?categoryId=X` |
| `/api/products?sort=price_asc` | `/api/v1/products?sortBy=price_asc` |

### Breaking Changes

1. **Parameter names**: Some query parameters have been renamed for consistency
   - `category` → `categoryId`
   - `sort` → `sortBy`

2. **Response structure**: Unified response format with consistent structure
   - All responses now include `success`, `data`, and `meta` fields
   - Pagination info moved to `data` object

3. **Authentication**: Explicit `authenticated` parameter required for full access

## Performance

- **Caching**: All data served from Redis cache
- **Filtering**: Server-side filtering for optimal performance
- **Pagination**: Efficient pagination with metadata
- **Rate limiting**: Prevents abuse while allowing fair usage

## Error Handling

- Comprehensive error responses with detailed messages
- Proper HTTP status codes
- Rate limiting with retry information
- Input validation with specific error details