import Link from 'next/link';
import { Suspense } from 'react';
import { CheckCircle, Lock, Zap, Truck, ArrowRight } from 'lucide-react';

// Componente para mostrar produtos em destaque
async function FeaturedProducts() {
  try {
    // Em produção, isso virá do cache/API
    // Por enquanto, vamos simular alguns produtos
    const mockProducts = [
      {
        id: 'MLB123456789',
        title: 'Produto Premium de Qualidade',
        price: 199.99,
        currency_id: 'BRL',
        thumbnail: '/api/placeholder/300/300',
        condition: 'new',
        shipping: { free_shipping: true }
      },
      {
        id: 'MLB987654321',
        title: 'Produto Exclusivo Peepers',
        price: 149.99,
        currency_id: 'BRL',
        thumbnail: '/api/placeholder/300/300',
        condition: 'new',
        shipping: { free_shipping: true }
      },
      {
        id: 'MLB456789123',
        title: 'Produto Mais Vendido',
        price: 89.99,
        currency_id: 'BRL',
        thumbnail: '/api/placeholder/300/300',
        condition: 'new',
        shipping: { free_shipping: false }
      },
      {
        id: 'MLB789123456',
        title: 'Produto em Oferta Especial',
        price: 299.99,
        currency_id: 'BRL',
        thumbnail: '/api/placeholder/300/300',
        condition: 'new',
        shipping: { free_shipping: true }
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-soft border border-accent-100 overflow-hidden hover:shadow-medium hover:scale-105 transition-all duration-300 group">
            <div className="aspect-square bg-gradient-to-br from-accent-50 to-accent-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-brand-gradient opacity-5"></div>
              <span className="text-accent-500 font-medium z-10">Imagem do Produto</span>
              <div className="absolute top-3 right-3">
                <span className="bg-secondary-500 text-accent-900 text-xs font-bold px-2 py-1 rounded-full">
                  NOVO
                </span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-accent-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
                {product.title}
              </h3>
              <p className="text-2xl font-bold text-primary-600 mb-3">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(product.price)}
              </p>
              {product.shipping.free_shipping && (
                <div className="flex items-center text-sm text-primary-600 mb-4">
                  <Truck className="w-4 h-4 mr-1" />
                  Frete grátis
                </div>
              )}
              <Link
                href={`/produtos/${product.id}`}
                className="block w-full bg-brand-gradient text-white text-center py-3 px-4 rounded-lg font-medium shadow-brand hover:shadow-large transform hover:scale-105 transition-all duration-200"
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
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <CheckCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Erro ao carregar produtos em destaque.</p>
          <p className="text-red-500 text-sm mt-2">Tente novamente em alguns instantes.</p>
        </div>
      </div>
    );
  }
}

// Loading component
function ProductsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-soft overflow-hidden animate-pulse">
          <div className="aspect-square bg-accent-200"></div>
          <div className="p-5">
            <div className="h-4 bg-accent-200 rounded mb-3"></div>
            <div className="h-4 bg-accent-200 rounded w-2/3 mb-3"></div>
            <div className="h-6 bg-accent-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-accent-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-brand-gradient text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Bem-vindo à{' '}
                <span className="text-secondary-400">Peepers</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-100 leading-relaxed">
                Sua loja oficial com produtos de qualidade, integrada ao Mercado Livre 
                para sua segurança e comodidade.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/produtos"
                  className="bg-secondary-500 text-accent-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-secondary-400 transform hover:scale-105 transition-all duration-200 shadow-large"
                >
                  Ver Produtos
                </Link>
                <Link
                  href="/sobre"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary-600 transition-all duration-200"
                >
                  Sobre Nós
                </Link>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="relative">
                <div className="w-96 h-96 bg-white/10 rounded-full absolute -top-10 -right-10 animate-bounce-soft"></div>
                <div className="w-64 h-64 bg-secondary-400/20 rounded-full absolute top-20 right-20"></div>
                <div className="relative z-10 text-center p-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                    <h3 className="text-2xl font-bold mb-4">100% Seguro</h3>
                    <p className="text-primary-100">Integração completa com Mercado Livre</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-accent-900 mb-6">
              Por que escolher a Peepers?
            </h2>
            <p className="text-xl text-accent-600 max-w-3xl mx-auto leading-relaxed">
              Oferecemos produtos de qualidade com a segurança e praticidade do Mercado Livre.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-primary-100 to-primary-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="text-primary-600 w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-accent-900 mb-4">Qualidade Garantida</h3>
              <p className="text-accent-600 leading-relaxed">
                Todos os nossos produtos passam por rigoroso controle de qualidade 
                antes de chegar até você.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-secondary-100 to-secondary-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Lock className="text-secondary-700 w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-accent-900 mb-4">Compra Segura</h3>
              <p className="text-accent-600 leading-relaxed">
                Integração total com Mercado Livre para máxima segurança 
                em todas as suas transações.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="text-blue-600 w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-accent-900 mb-4">Entrega Rápida</h3>
              <p className="text-accent-600 leading-relaxed">
                Aproveitamos toda a logística do Mercado Livre 
                para entregas ágeis e confiáveis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-accent-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-accent-900 mb-6">
              Produtos em Destaque
            </h2>
            <p className="text-xl text-accent-600 leading-relaxed">
              Confira alguns dos nossos produtos mais populares e bem avaliados.
            </p>
          </div>
          
          <Suspense fallback={<ProductsLoading />}>
            <FeaturedProducts />
          </Suspense>
          
          <div className="text-center mt-12">
            <Link
              href="/produtos"
              className="inline-flex items-center bg-brand-gradient text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-brand hover:shadow-large transform hover:scale-105 transition-all duration-200"
            >
              Ver Todos os Produtos
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-3xl p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-accent-900 mb-6">
                  Integração Completa com Mercado Livre
                </h3>
                <p className="text-accent-600 mb-8 leading-relaxed">
                  Nossa plataforma está totalmente integrada ao Mercado Livre, 
                  garantindo que você tenha acesso a todos os benefícios e 
                  proteções da maior plataforma de e-commerce da América Latina.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-accent-700 font-medium">API Mercado Livre: Ativa</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-accent-700 font-medium">Cache Redis: Ativo</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-accent-700 font-medium">Webhooks: Configurando</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-accent-700 font-medium">SSL: Seguro</span>
                  </div>
                </div>
                <div className="mt-8">
                  <Link
                    href="/api/ml/sync"
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Verificar Status da API
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-2xl p-8 shadow-medium">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-accent-900 mb-2">Proteção Total</h4>
                  <p className="text-accent-600">
                    Todas as transações são protegidas pelo Mercado Pago
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
