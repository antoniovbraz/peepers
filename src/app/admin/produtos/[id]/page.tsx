/**
 * Product Detail Page - v2.0
 * 
 * Detailed view of a single product with analytics and actions
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import { handleImageError } from '@/lib/utils';

interface ProductDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  pictures: string[];
  status: 'active' | 'paused' | 'closed';
  available_quantity: number;
  condition: string;
  visits: number;
  questions: number;
  sold_quantity: number;
  permalink: string;
  category: string;
  listing_type: string;
  free_shipping: boolean;
  warranty: string;
  created_date: string;
  last_updated: string;
}

// Mock product detail data
const mockProductDetail: ProductDetail = {
  id: 'MLB123456789',
  title: 'iPhone 15 Pro Max 256GB Azul Titânio',
  description: 'iPhone 15 Pro Max com 256GB de armazenamento na cor azul titânio. Inclui carregador e fones de ouvido originais. Produto lacrado com garantia do fabricante.\n\nCaracterísticas:\n• Tela Super Retina XDR de 6,7 polegadas\n• Chip A17 Pro\n• Sistema de câmera Pro com teleobjetiva\n• Action Button\n• Conector USB-C\n• Resistente a respingos, água e poeira',
  price: 7899.99,
  thumbnail: 'https://http2.mlstatic.com/D_Q_NP_123456_MLA.jpg',
  pictures: [
    'https://http2.mlstatic.com/D_Q_NP_123456_MLA.jpg',
    'https://http2.mlstatic.com/D_Q_NP_123457_MLA.jpg',
    'https://http2.mlstatic.com/D_Q_NP_123458_MLA.jpg',
  ],
  status: 'active',
  available_quantity: 5,
  condition: 'Novo',
  visits: 1247,
  questions: 8,
  sold_quantity: 23,
  permalink: 'https://produto.mercadolivre.com.br/MLB-123456789-iphone-15-pro-max-256gb-azul-titanio',
  category: 'Celulares e Telefones',
  listing_type: 'Ouro Premium',
  free_shipping: true,
  warranty: '12 meses de garantia do fabricante',
  created_date: '2025-09-10T10:00:00Z',
  last_updated: '2025-09-17T14:30:00Z',
};

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        
        // TODO: Implement actual API call
        // const response = await fetch(`/api/admin/products/${productId}`);
        // if (!response.ok) throw new Error('Product not found');
        // const data = await response.json();
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProduct(mockProductDetail);
        
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

  const handleStatusToggle = async () => {
    if (!product) return;
    
    const newStatus = product.status === 'active' ? 'paused' : 'active';
    
    try {
      // TODO: Implement API call to update status
      // await fetch(`/api/admin/products/${productId}/status`, {
      //   method: 'PATCH',
      //   body: JSON.stringify({ status: newStatus }),
      // });
      
      setProduct({ ...product, status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      // TODO: Implement API call to delete product
      // await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      
      router.push('/admin/produtos');
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'paused':
        return 'Pausado';
      case 'closed':
        return 'Finalizado';
      default:
        return status;
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

  if (error || !product) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800">
          {error || 'Produto não encontrado'}
        </h2>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Voltar para produtos
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
          <p className="text-gray-600">ID: {product.id}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleStatusToggle}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              product.status === 'active'
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {product.status === 'active' ? (
              <>
                <PauseIcon className="h-4 w-4" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                <span>Ativar</span>
              </>
            )}
          </button>
          
          <Link
            href={`/admin/produtos/${product.id}/editar`}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
            <span>Editar</span>
          </Link>
          
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
            <span>Excluir</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Images */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagens</h2>
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={product.pictures[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </div>
              {product.pictures.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {product.pictures.map((picture, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        currentImageIndex === index
                          ? 'border-green-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={picture}
                        alt={`${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Descrição</h2>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-line text-gray-700">{product.description}</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Status</h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(product.status)}`}>
                {getStatusText(product.status)}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Preço:</span>
                <span className="font-medium">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Disponível:</span>
                <span className="font-medium">{product.available_quantity} unidades</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vendidos:</span>
                <span className="font-medium">{product.sold_quantity} unidades</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Condição:</span>
                <span className="font-medium">{product.condition}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Categoria:</span>
                <span className="font-medium">{product.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frete grátis:</span>
                <span className="font-medium">{product.free_shipping ? 'Sim' : 'Não'}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <a
                href={product.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                <span>Ver no Mercado Livre</span>
              </a>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">Visualizações</span>
                </div>
                <span className="font-semibold text-gray-900">{product.visits}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ChartBarIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">Perguntas</span>
                </div>
                <span className="font-semibold text-gray-900">{product.questions}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p>Criado: {new Date(product.created_date).toLocaleDateString('pt-BR')}</p>
                  <p>Atualizado: {new Date(product.last_updated).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}