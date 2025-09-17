/**
 * New Product Page - v2.0
 * 
 * Page for creating new products with full form and validation
 */

'use client';

import { useRouter } from 'next/navigation';
import ProductForm from '@/components/admin/products/ProductForm';
import { ProductFormData } from '@/types/product-validation';

export default function NewProductPage() {
  const router = useRouter();

  const handleSubmit = async (data: ProductFormData) => {
    console.log('Creating product:', data);
    
    try {
      // TODO: Implement actual API call to create product
      // const response = await fetch('/api/admin/products', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to create product');
      // }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success
      console.log('Product created successfully');
      
      // Redirect to products list after success
      setTimeout(() => {
        router.push('/admin/produtos');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating product:', error);
      throw error; // Re-throw to be handled by form
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
          <p className="text-gray-600">
            Crie um novo produto para seu catálogo no Mercado Livre
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Voltar
        </button>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        isEditing={false}
      />
    </div>
  );
}