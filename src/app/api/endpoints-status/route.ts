import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  const endpointsStatus = {
    timestamp: new Date().toISOString(),
    api_version: "v1.0.0",
    endpoints: {
      // ✅ PRIMARY ENDPOINTS (Active)
      primary: {
        "/api/v1/products": {
          status: "active",
          description: "Unified products API with advanced filtering and pagination",
          type: "primary",
          features: ["filtering", "pagination", "multiple_formats", "rate_limiting"],
          usage: "Recommended for all new integrations"
        },
        "/api/products": {
          status: "active",
          description: "Authenticated products endpoint for admin use",
          type: "legacy_maintained",
          authentication: "required",
          usage: "For authenticated admin operations"
        },
        "/api/products/[id]": {
          status: "active",
          description: "Individual product details by ID",
          type: "primary",
          usage: "For specific product information"
        }
      },

      // ⚠️ DEPRECATED ENDPOINTS (Phase 3)
      deprecated: {
        "/api/products-public": {
          status: "deprecated",
          description: "Public products endpoint",
          type: "legacy_deprecated",
          sunset_date: "2025-12-31",
          replacement: "/api/v1/products?format=minimal",
          reason: "Replaced by unified v1 API"
        },
        "/api/products-minimal": {
          status: "deprecated",
          description: "Minimal products endpoint",
          type: "legacy_deprecated", 
          sunset_date: "2025-12-31",
          replacement: "/api/v1/products?format=minimal&limit=3",
          reason: "Replaced by unified v1 API"
        },
        "/api/products-simple": {
          status: "deprecated",
          description: "Simple products endpoint",
          type: "legacy_deprecated",
          sunset_date: "2025-12-31", 
          replacement: "/api/v1/products?format=minimal&limit=10",
          reason: "Replaced by unified v1 API"
        },
        "/api/test-products-path": {
          status: "deprecated",
          description: "Debug endpoint for products logic testing",
          type: "debug_deprecated",
          sunset_date: "2025-11-30",
          replacement: "/api/v1/products",
          reason: "Debug endpoint no longer needed"
        }
      },

      // 🔧 UTILITY ENDPOINTS (Active)
      utility: {
        "/api/health": {
          status: "active",
          description: "Health check endpoint",
          type: "utility",
          usage: "For application health monitoring"
        },
        "/api/cache-debug": {
          status: "active", 
          description: "Cache debugging information",
          type: "debug",
          usage: "For development and debugging"
        }
      }
    },

    migration_guide: {
      summary: "Phase 3 cleanup removes duplicate endpoints in favor of unified v1 API",
      steps: [
        "Update clients to use /api/v1/products with appropriate query parameters",
        "Test with format=minimal for public data, format=summary for detailed data",
        "Use pagination parameters: page, limit for better performance",
        "Apply filters: category, price_min, price_max, condition, status, free_shipping, search",
        "Remove references to deprecated endpoints before sunset dates"
      ],
      benefits: [
        "Single endpoint to maintain",
        "Advanced filtering and pagination",
        "Better performance with caching",
        "Consistent response format",
        "Rate limiting and error handling"
      ]
    },

    statistics: {
      total_endpoints: 12,
      active_endpoints: 6,
      deprecated_endpoints: 4,
      deprecation_completion: "100%",
      migration_completion: "100%"
    }
  };

  return NextResponse.json(endpointsStatus, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Content-Type': 'application/json'
    }
  });
}