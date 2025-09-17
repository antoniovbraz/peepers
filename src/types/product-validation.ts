/**
 * Product Validation Schemas - v2.0
 * 
 * Zod schemas for product validation
 * Compatible with Mercado Livre API requirements
 */

import { z } from 'zod';

// Basic product information schema
export const ProductBasicSchema = z.object({
  title: z
    .string()
    .min(10, 'Título deve ter pelo menos 10 caracteres')
    .max(60, 'Título deve ter no máximo 60 caracteres')
    .regex(/^[a-zA-Z0-9\s\-\.\,\(\)]+$/, 'Título contém caracteres inválidos'),
  
  description: z
    .string()
    .min(30, 'Descrição deve ter pelo menos 30 caracteres')
    .max(50000, 'Descrição muito longa'),
  
  category_id: z
    .string()
    .min(1, 'Categoria é obrigatória'),
  
  price: z
    .number()
    .min(0.01, 'Preço deve ser maior que zero')
    .max(999999.99, 'Preço muito alto'),
  
  currency_id: z
    .string()
    .default('BRL'),
  
  available_quantity: z
    .number()
    .int()
    .min(0, 'Quantidade deve ser positiva')
    .max(999999, 'Quantidade muito alta'),
  
  condition: z
    .enum(['new', 'used', 'not_specified'])
    .refine((val) => ['new', 'used', 'not_specified'].includes(val), {
      message: 'Condição inválida'
    }),
  
  listing_type_id: z
    .enum(['gold_special', 'gold_pro', 'gold', 'silver', 'bronze', 'free'])
    .refine((val) => ['gold_special', 'gold_pro', 'gold', 'silver', 'bronze', 'free'].includes(val), {
      message: 'Tipo de anúncio inválido'
    })
    .default('gold_special'),
});

// Product attributes schema
export const ProductAttributeSchema = z.object({
  id: z.string(),
  name: z.string(),
  value_id: z.string().optional(),
  value_name: z.string(),
  value_struct: z.any().optional(),
  values: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    struct: z.any().optional(),
  })).optional(),
  attribute_group_id: z.string().optional(),
  attribute_group_name: z.string().optional(),
});

// Product shipping schema
export const ProductShippingSchema = z.object({
  mode: z.enum(['me1', 'me2', 'not_specified']).default('me2'),
  local_pick_up: z.boolean().default(false),
  free_shipping: z.boolean().default(false),
  methods: z.array(z.any()).optional(),
  dimensions: z.object({
    width: z.string().optional(),
    height: z.string().optional(),
    length: z.string().optional(),
    weight: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
});

// Product pictures schema
export const ProductPictureSchema = z.object({
  id: z.string().optional(),
  url: z.string().url('URL da imagem inválida').optional(),
  secure_url: z.string().url('URL segura da imagem inválida').optional(),
  size: z.string().optional(),
  max_size: z.string().optional(),
  quality: z.string().optional(),
});

// Product variation schema
export const ProductVariationSchema = z.object({
  id: z.number().optional(),
  price: z.number().min(0.01, 'Preço da variação deve ser maior que zero'),
  attribute_combinations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    value_id: z.string().optional(),
    value_name: z.string(),
    value_struct: z.any().optional(),
  })),
  available_quantity: z.number().int().min(0, 'Quantidade deve ser positiva'),
  sold_quantity: z.number().int().min(0).default(0),
  picture_ids: z.array(z.string()).optional(),
});

// Complete product schema
export const ProductCompleteSchema = z.object({
  ...ProductBasicSchema.shape,
  
  attributes: z.array(ProductAttributeSchema).default([]),
  
  pictures: z
    .array(ProductPictureSchema)
    .min(1, 'Pelo menos uma imagem é obrigatória')
    .max(12, 'Máximo 12 imagens permitidas'),
  
  shipping: ProductShippingSchema.default({
    mode: 'me2',
    local_pick_up: false,
    free_shipping: false,
  }),
  
  variations: z.array(ProductVariationSchema).optional(),
  
  video_id: z.string().optional(),
  
  warranty: z.string().optional(),
  
  seller_custom_field: z.string().optional(),
  
  // Mercado Livre specific fields
  buying_mode: z.enum(['buy_it_now', 'auction']).default('buy_it_now'),
  
  automatic_relist: z.boolean().default(false),
  
  tags: z.array(z.string()).default([]),
  
  // Optional fields for updates
  id: z.string().optional(),
  status: z.enum(['active', 'paused', 'closed', 'under_review']).optional(),
  permalink: z.string().url().optional(),
});

// Form data schema (for React Hook Form)
export const ProductFormSchema = z.object({
  // Basic info
  title: z.string().min(10).max(60),
  description: z.string().min(30).max(50000),
  category_id: z.string().min(1),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Preço deve ser um número válido maior que zero'
  }),
  available_quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Quantidade deve ser um número válido'
  }),
  condition: z.enum(['new', 'used', 'not_specified']),
  listing_type_id: z.enum(['gold_special', 'gold_pro', 'gold', 'silver', 'bronze', 'free']),
  
  // Images (File objects for upload)
  pictures: z.array(z.object({
    file: z.any().optional(), // File object
    url: z.string().optional(),
    id: z.string().optional(),
  })).min(1, 'Pelo menos uma imagem é obrigatória'),
  
  // Shipping
  free_shipping: z.boolean(),
  dimensions: z.object({
    width: z.string().optional(),
    height: z.string().optional(),
    length: z.string().optional(),
    weight: z.string().optional(),
  }).optional(),
  
  // Advanced
  warranty: z.string().optional(),
  video_id: z.string().optional(),
});

// Type exports
export type ProductBasic = z.infer<typeof ProductBasicSchema>;
export type ProductAttribute = z.infer<typeof ProductAttributeSchema>;
export type ProductShipping = z.infer<typeof ProductShippingSchema>;
export type ProductPicture = z.infer<typeof ProductPictureSchema>;
export type ProductVariation = z.infer<typeof ProductVariationSchema>;
export type ProductComplete = z.infer<typeof ProductCompleteSchema>;
export type ProductFormData = z.infer<typeof ProductFormSchema>;

// Utility functions
export const validateProduct = (data: unknown) => {
  return ProductCompleteSchema.safeParse(data);
};

export const validateProductForm = (data: unknown) => {
  return ProductFormSchema.safeParse(data);
};

// Default values for forms
export const getDefaultProductForm = (): Partial<ProductFormData> => ({
  condition: 'new',
  listing_type_id: 'gold_special',
  free_shipping: false,
  pictures: [],
  price: '',
  available_quantity: '1',
});