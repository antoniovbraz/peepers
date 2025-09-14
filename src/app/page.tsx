import Link from 'next/link';
import { Suspense } from 'react';
import Header from '@/components/Header';

// Componente para mostrar produtos em destaque
async function FeaturedProducts() {
  try {
    // Buscar produtos reais da API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/products`, {
      cache: 'no-store' // Sempre buscar dados atualizados
    });
    
    if (!response.ok) {
      throw new Error('Falha ao carregar produtos');
    }
    
    const data = await response.json();
    const products = data.products || [];
    
    // Limitar a 4 produtos para destaque
    const featuredProducts = products.slice(0, 4);

    if (featuredProducts.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Nenhum produto disponível no momento.</p>
          <p className="text-sm text-gray-500 mt-2">
            Nossa equipe está trabalhando para adicionar novos produtos em breve.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredProducts.map((product: any) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-gray-200 flex items-center justify-center overflow-hidden">
              {product.thumbnail && product.thumbnail !== '/api/placeholder/300/300' ? (
                <img 
                  src={product.thumbnail} 
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500">Imagem do Produto</span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {product.title}
              </h3>
              <p className="text-2xl font-bold text-green-600 mb-2">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: product.currency_id || 'BRL'
                }).format(product.price)}
              </p>
              {product.shipping?.free_shipping && (
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
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Peepers - Sua Loja Oficial
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-3 sm:mb-4 max-w-4xl mx-auto px-4">
              Produtos cuidadosamente selecionados, vendidos com a segurança e confiança do Mercado Livre
            </p>
            <p className="text-base sm:text-lg mb-6 sm:mb-8 max-w-3xl mx-auto opacity-90 px-4">
              Quando você escolhe um produto aqui, será redirecionado ao nosso perfil oficial no Mercado Livre para finalizar sua compra com total segurança
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 sm:mb-8 px-4">
              <Link
                href="/produtos"
                className="bg-white text-blue-600 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center"
              >
                Ver Produtos
              </Link>
              <Link
                href="#como-funciona"
                className="border-2 border-white text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors text-center"
              >
                Como Funciona
              </Link>
            </div>
            
            {/* Trust Signals */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 text-sm opacity-80 px-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Vendedor Oficial no ML</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" clipRule="evenodd" />
                </svg>
                <span>Compra 100% Segura</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1H3zM9 5a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V5z" />
                </svg>
                <span>Entrega via Mercado Livre</span>
              </div>
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

      {/* How It Works Section */}
      <section id="como-funciona" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Processo simples e seguro para sua compra
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Navegue</h3>
              <p className="text-gray-600 text-sm">
                Explore nosso catálogo e encontre o produto perfeito para você
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Escolha</h3>
              <p className="text-gray-600 text-sm">
                Clique em "Ver Produto" para ver todos os detalhes
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mercado Livre</h3>
              <p className="text-gray-600 text-sm">
                Você será redirecionado para nosso perfil oficial no ML
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                ✓
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Finalize</h3>
              <p className="text-gray-600 text-sm">
                Complete sua compra com toda segurança do Mercado Livre
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h4 className="font-semibold text-blue-900 mb-2">Por que usamos o Mercado Livre?</h4>
              <p className="text-blue-800 text-sm">
                O Mercado Livre oferece proteção ao comprador, sistema de pagamento seguro, 
                rastreamento de entrega e suporte ao cliente. Você tem toda a segurança de uma 
                plataforma confiável e consolidada no mercado brasileiro.
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
