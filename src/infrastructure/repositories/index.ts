/**
 * Infrastructure Layer - Repository Implementations Index
 * 
 * This file exports all repository implementations that provide
 * data access following Clean Architecture principles.
 */

export { ProductRepository } from './ProductRepository';
export { OrderRepository } from './OrderRepository';
export { SellerRepository } from './SellerRepository';

// Re-export interfaces for convenience
export type {
  IProductRepository,
  IOrderRepository,
  ISellerRepository,
  RepositoryResult,
  PaginatedResult
} from '@/domain/repositories';