import Link from 'next/link';
import { Suspense } from 'react';

// Componente para mostrar produtos em destaque
async function FeaturedProducts() {
  try {
    // Em produção, isso virá do cache/API
    // Por enquanto, vamos simular alguns produtos
    const mockProducts = [
      {
        id: 'MLB123456789',
        title: 'Produto de Exemplo 1',
        price: 99.99,
        currency_id: 'BRL',
        thumbnail: '/api/placeholder/300/300',
        condition: 'new',
        shipping: { free_shipping: true }
      },
      {
        id: 'MLB987654321',
        title: 'Produto de Exemplo 2',
        price: 149.99,
        currency_id: 'BRL',
        thumbnail: '/api/placeholder/300/300',
        condition: 'new',
        shipping: { free_shipping: false }
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Imagem do Produto</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {product.title}
              </h3>
              <p className="text-2xl font-bold text-green-600 mb-2">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(product.price)}
              </p>
              {product.shipping.free_shipping && (
                <p className="text-sm text-green-600 mb-3">Frete grátis</p>
              )}
              <Link
                href={`/produtos/${product.id}`}
                className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Ver Produto
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  } catch (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Erro ao carregar produtos em destaque.</p>
      </div>
    );
  }
}

// Loading component
function ProductsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-300"></div>
          <div className="p-4">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
            <div className="h-6 bg-gray-300 rounded w-1/2 mb-3"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                Peepers
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/produtos" className="text-gray-700 hover:text-gray-900">
                Produtos
              </Link>
              <Link href="/sobre" className="text-gray-700 hover:text-gray-900">
                Sobre
              </Link>
              <Link href="/contato" className="text-gray-700 hover:text-gray-900">
                Contato
              </Link>
              <Link href="/blog" className="text-gray-700 hover:text-gray-900">
                Blog
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Bem-vindo à Peepers
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Sua loja oficial com produtos de qualidade, integrada ao Mercado Livre
              para sua segurança e comodidade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/produtos"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Ver Produtos
              </Link>
              <Link
                href="/sobre"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Sobre Nós
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Por que escolher a Peepers?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Oferecemos produtos de qualidade com a segurança e praticidade do Mercado Livre.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Qualidade Garantida</h3>
              <p className="text-gray-600">
                Todos os nossos produtos passam por rigoroso controle de qualidade.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Compra Segura</h3>
              <p className="text-gray-600">
                Integração total com Mercado Livre para máxima segurança nas transações.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Entrega Rápida</h3>
              <p className="text-gray-600">
                Aproveitamos toda a logística do Mercado Livre para entregas ágeis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-lg text-gray-600">
              Confira alguns dos nossos produtos mais populares.
            </p>
          </div>
          
          <Suspense fallback={<ProductsLoading />}>
            <FeaturedProducts />
          </Suspense>
          
          <div className="text-center mt-12">
            <Link
              href="/produtos"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Ver Todos os Produtos
            </Link>
          </div>
        </div>
      </section>

      {/* API Status Section (for development) */}
      <section className="py-8 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status da Integração</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>API Mercado Livre: Configurada</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Cache Redis: Ativo</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>Webhooks: Aguardando configuração</span>
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <Link
                href="/api/ml/sync"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Status da Sincronização
              </Link>
              <Link
                href="/api/products"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                API de Produtos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Peepers</h3>
              <p className="text-gray-400">
                Sua loja oficial com produtos de qualidade e segurança garantida.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produtos</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/produtos" className="hover:text-white">Todos os Produtos</Link></li>
                <li><Link href="/produtos?condition=new" className="hover:text-white">Produtos Novos</Link></li>
                <li><Link href="/produtos?shipping=free" className="hover:text-white">Frete Grátis</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/sobre" className="hover:text-white">Sobre Nós</Link></li>
                <li><Link href="/contato" className="hover:text-white">Contato</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/ajuda" className="hover:text-white">Central de Ajuda</Link></li>
                <li><Link href="/termos" className="hover:text-white">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="hover:text-white">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Peepers. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
