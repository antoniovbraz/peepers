import { z } from 'zod';

// Common validation schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sort: z.enum(['price_asc', 'price_desc', 'date_asc', 'date_desc']).optional(),
});

export const ProductFilterSchema = z.object({
  status: z.enum(['active', 'paused', 'closed']).optional(),
  condition: z.enum(['new', 'used', 'not_specified']).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  category: z.string().optional(),
});

export const SyncOptionsSchema = z.object({
  force: z.coerce.boolean().default(false),
  clear_cache: z.coerce.boolean().default(false),
  max_products: z.coerce.number().int().min(1).max(1000).default(100),
});

export const WebhookPayloadSchema = z.object({
  user_id: z.number().int().positive(),
  topic: z.string().min(1),
  resource: z.string().min(1),
  application_id: z.string().min(1),
  attempts: z.number().int().min(1),
  sent: z.string().datetime(),
  received: z.string().datetime(),
});

// Validation helper
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage = 'Invalid input data'
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: `${errorMessage}: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`
  };
}