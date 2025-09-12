import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  currency_id: z.string(),
  available_quantity: z.number(),
  condition: z.string(),
  thumbnail: z.string(),
  pictures: z.array(z.object({
    id: z.string(),
    url: z.string(),
    secure_url: z.string(),
    size: z.string(),
    max_size: z.string(),
    quality: z.string()
  })),
  permalink: z.string(),
  status: z.string(),
  shipping: z.object({
    free_shipping: z.boolean(),
    local_pick_up: z.boolean()
  }),
  attributes: z.array(z.object({
    id: z.string(),
    name: z.string(),
    value_name: z.string().nullable(),
    value_struct: z.any().nullable()
  })),
  category_id: z.string(),
  sold_quantity: z.number().optional(),
  warranty: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export type Product = z.infer<typeof ProductSchema>;

export interface ProductQuestion {
  id: string;
  text: string;
  status: string;
  date_created: string;
  from: {
    nickname: string;
  };
  answer?: {
    text: string;
    date_created: string;
  };
}

export interface ProductWithQuestions extends Product {
  questions: ProductQuestion[];
}