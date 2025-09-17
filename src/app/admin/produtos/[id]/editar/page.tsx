/**
 * Edit Product Page - v2.0
 * 
 * Page for editing existing products with pre-filled form
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProductForm from '@/components/admin/products/ProductForm';
import { ProductFormData } from '@/types/product-validation';

// Mock product data for editing
const mockProductData: ProductFormData = {
  title: 'iPhone 15 Pro Max 256GB Azul Titânio',
  description: 'iPhone 15 Pro Max com 256GB de armazenamento na cor azul titânio. Inclui carregador e fones de ouvido originais. Produto lacrado com garantia do fabricante.',
  category_id: 'MLB1051',
  price: '7899.99',
  available_quantity: '5',
  condition: 'new',
  listing_type_id: 'gold_special',
  pictures: [
    {
      id: '1',
      url: 'https://http2.mlstatic.com/D_Q_NP_123456_MLA.jpg',
    },
  ],
  free_shipping: true,
  dimensions: {
    width: '15.1',
    height: '0.8',
    length: '7.7',
    weight: '0.221',
  },
  warranty: '12 meses de garantia do fabricante',
  video_id: '',
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [productData, setProductData] = useState<ProductFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        
        // TODO: Implement actual API call to fetch product
        // const response = await fetch(`/api/admin/products/${productId}`);
        // if (!response.ok) {
        //   throw new Error('Failed to load product');
        // }
        // const data = await response.json();
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProductData(mockProductData);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const handleSubmit = async (data: ProductFormData) => {
    console.log('Updating product:', productId, data);
    
    try {
      // TODO: Implement actual API call to update product
      // const response = await fetch(`/api/admin/products/${productId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to update product');
      // }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success
      console.log('Product updated successfully');
      
      // Redirect to product detail after success
      setTimeout(() => {
        router.push(`/admin/produtos/${productId}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error updating product:', error);
      throw error; // Re-throw to be handled by form
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800">Erro ao carregar produto</h2>
        <p className="text-red-600 mt-2">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-yellow-800">Produto não encontrado</h2>
        <p className="text-yellow-600 mt-2">O produto solicitado não foi encontrado.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Produto</h1>
          <p className="text-gray-600">
            ID: {productId} • {productData.title}
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
        initialData={productData}
        onSubmit={handleSubmit}
        isEditing={true}
      />
    </div>
  );
}