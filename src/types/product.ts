export interface ProductSummary {
  id: string;
  title: string;
  thumbnail?: string;
  condition: 'new' | 'used' | 'not_specified';
  shipping: {
    free_shipping: boolean;
  };
  price: number;
  available_quantity: number;
  installments?: {
    quantity: number;
  };
  pictures?: Array<{
    id: string;
    url: string;
    secure_url: string;
    size: string;
    max_size: string;
    quality: string;
  }>;
}
