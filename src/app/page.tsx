import { PAGES } from '@/config/routes';
import { Suspense } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ProductCard from '@/components/ProductCard';
import ProductsLoading from '@/components/ProductsLoading';
import ProductsError from '@/components/ProductsError';
import { API_ENDPOINTS } from '@/config/routes';
import { getMercadoLivreUrl } from '@/utils/products';
import type { MLProduct } from '@/types/ml';

// Componente para mostrar produtos em destaque
async function FeaturedProducts() {
  try {
    // Buscar produtos públicos (não requer autenticação)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS_PUBLIC}`, {
      cache: 'no-store' // Sempre buscar dados atualizados
    });
    
    if (!response.ok) {
      throw new Error('Falha ao carregar produtos');
    }
    
    const data = await response.json();
    const products = data.products || [];
    
    // Limitar a 6 produtos para destaque
    const featuredProducts = products.slice(0, 6);

    if (featuredProducts.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Produtos chegando em breve</h3>
            <p className="text-gray-600 mb-4">
              Nossa equipe está trabalhando para adicionar novos produtos incríveis.
            </p>
            <a
              href="https://www.mercadolivre.com.br/pagina/peepersshop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Visitar nossa loja ML
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredProducts.map((product: MLProduct, index: number) => {
          // Enhanced validation to prevent crashes
          if (!product || !product.id || typeof product.id !== 'string') {
            return null; // Skip invalid products
          }
          
          try {
            return (
              <ProductCard
                key={product.id || `product-${index}`}
                id={product.id}
                title={product.title || 'Produto sem título'}
                price={typeof product.price === 'number' ? product.price : 0}
                image={product.thumbnail || '/api/placeholder/300/300'}
                mercadoLivreLink={getMercadoLivreUrl(product)}
                rating={4.5}
                reviewCount={product.id ? (parseInt(product.id.toString().slice(-2), 10) || 0) + 50 : 50}
                badge={product.shipping?.free_shipping ? "Frete Grátis" : undefined}
                imageFit="contain"
              />
            );
          } catch (error) {
            console.warn('Error rendering product:', product.id, error);
            return null; // Skip problematic products
          }
        }).filter(Boolean)} {/* Filter out null values */}
      </div>
    );
  } catch {
    return <ProductsError />;
  }
}

// Loading component
// ...existing code...

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que escolher a Peepers?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Oferecemos produtos de qualidade com a segurança e praticidade do Mercado Livre.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Qualidade Garantida</h3>
              <p className="text-gray-600">
                Todos os nossos produtos passam por rigoroso controle de qualidade antes de serem disponibilizados.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-secondary/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-secondary/30 transition-colors">
                <svg className="w-10 h-10 text-secondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Compra Segura</h3>
              <p className="text-gray-600">
                Integração total com Mercado Livre para máxima segurança nas transações e proteção ao comprador.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-accent/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20 transition-colors">
                <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Entrega Rápida</h3>
              <p className="text-gray-600">
                Aproveitamos toda a logística do Mercado Livre para entregas ágeis e confiáveis em todo o Brasil.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Processo simples e seguro para sua compra em apenas 4 passos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold shadow-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Navegue</h3>
              <p className="text-gray-600 text-sm">
                Explore nosso catálogo e encontre o produto perfeito para você com facilidade
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold shadow-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Escolha</h3>
              <p className="text-gray-600 text-sm">
                Clique em &quot;Comprar no ML&quot; para ver todos os detalhes e especificações
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold shadow-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Mercado Livre</h3>
              <p className="text-gray-600 text-sm">
                Você será redirecionado para nosso perfil oficial no ML com segurança total
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-secondary text-black w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold shadow-lg">
                ✓
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Finalize</h3>
              <p className="text-gray-600 text-sm">
                Complete sua compra com toda segurança e proteção do Mercado Livre
              </p>
            </div>
          </div>
          
          <div className="text-center mt-16">
            <div className="bg-white border border-primary/20 rounded-2xl p-8 max-w-3xl mx-auto shadow-sm">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Por que usamos o Mercado Livre?</h4>
              <p className="text-gray-600">
                O Mercado Livre oferece proteção ao comprador, sistema de pagamento seguro, 
                rastreamento de entrega e suporte ao cliente 24/7. Você tem toda a segurança de uma 
                plataforma confiável e consolidada no mercado brasileiro, com mais de 20 anos de experiência.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-lg text-gray-600">
              Confira alguns dos nossos produtos mais populares e bem avaliados.
            </p>
          </div>
          
          <Suspense fallback={<ProductsLoading />}>
            <FeaturedProducts />
          </Suspense>
          
          <div className="text-center mt-16">
            <a
              href={PAGES.PRODUTOS}
              className="inline-flex items-center px-8 py-4 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-all duration-300 hover:scale-105"
            >
              Ver Todos os Produtos
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="text-xl font-bold">Peepers</span>
              </div>
              <p className="text-gray-400 mb-4">
                Sua loja oficial com produtos de qualidade e segurança garantida pelo Mercado Livre.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33zM9.75 15.02l5.75-3.27L9.75 8.48v6.54z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6">Produtos</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href={PAGES.PRODUTOS} className="hover:text-white transition-colors">Todos os Produtos</a></li>
                <li><a href="/produtos?condition=new" className="hover:text-white transition-colors">Produtos Novos</a></li>
                <li><a href="/produtos?shipping=free" className="hover:text-white transition-colors">Frete Grátis</a></li>
                <li><a href="https://www.mercadolivre.com.br/pagina/peepersshop" target="_blank" className="hover:text-white transition-colors">Loja no ML</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Empresa</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="/sobre" className="hover:text-white transition-colors">Sobre Nós</a></li>
                <li><a href="/contato" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="/carreiras" className="hover:text-white transition-colors">Carreiras</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Suporte</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="/ajuda" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="/termos" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="/privacidade" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="/devolucoes" className="hover:text-white transition-colors">Devoluções</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Peepers. Todos os direitos reservados. | Loja oficial no Mercado Livre</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
