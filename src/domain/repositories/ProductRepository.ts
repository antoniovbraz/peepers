import { Product, ProductQuery, PaginationParams } from '../entities/Product';

export interface ProductRepository {
  findAll(query?: Partial<ProductQuery>): Promise<{
    products: Product[];
    total: number;
    pagination: PaginationParams;
  }>;

  findById(id: string): Promise<Product | null>;

  findBySeller(sellerId: number, query?: Partial<ProductQuery>): Promise<{
    products: Product[];
    total: number;
    pagination: PaginationParams;
  }>;

  findPublic(query?: Partial<ProductQuery>): Promise<{
    products: Product[];
    total: number;
    pagination: PaginationParams;
  }>;

  save(product: Product): Promise<Product>;

  update(id: string, product: Partial<Product>): Promise<Product | null>;

  delete(id: string): Promise<boolean>;

  exists(id: string): Promise<boolean>;

  count(query?: Partial<ProductQuery>): Promise<number>;
}</content>
<parameter name="filePath">c:\Users\anton\OneDrive\Documents\Cline\peepers\src\domain\repositories\ProductRepository.ts