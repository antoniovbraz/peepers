import { PAGES } from '@/config/routes';
import Link from 'next/link';
import { Suspense, lazy } from 'react';
import Header from '@/components/Header';
import ProductsLoading from '@/components/ProductsLoading';

// Lazy load the heavy ProductsClient component
const ProductsClient = lazy(() => import('./ProductsClient'));

export default function ProdutosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-gray-500 hover:text-primary transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium">Produtos</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nossos Produtos
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Confira nossa seleção completa de produtos com qualidade garantida e preços especiais.
          </p>
          <div className="mt-6 flex justify-center">
            <a
              href="https://www.mercadolivre.com.br/pagina/peepersshop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors"
            >
              Visitar Nossa Loja ML
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* Products Grid */}
        <Suspense fallback={<ProductsLoading count={8} />}>
          <ProductsClient />
        </Suspense>
      </main>

      {/* Trust Signals Section */}
      <section className="bg-white border-t border-peepers-neutral-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-peepers-neutral-900 mb-2">
              Compre com Total Segurança
            </h3>
            <p className="text-peepers-neutral-600">
              Todos os produtos são vendidos através do nosso perfil oficial no Mercado Livre
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-semibold text-peepers-neutral-900 mb-1">Vendedor Oficial</h4>
              <p className="text-sm text-peepers-neutral-600">Perfil verificado no ML</p>
            </div>
            
            <div>
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-semibold text-peepers-neutral-900 mb-1">Pagamento Seguro</h4>
              <p className="text-sm text-peepers-neutral-600">Proteção do comprador ML</p>
            </div>
            
            <div>
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1H3zM9 5a2 2 0 012-2h3a2 2 0 012 2v3a2 2 0 01-2 2h-3a2 2 0 01-2-2V5z" />
                </svg>
              </div>
              <h4 className="font-semibold text-peepers-neutral-900 mb-1">Entrega Rastreada</h4>
              <p className="text-sm text-peepers-neutral-600">Logística completa ML</p>
            </div>
            
            <div>
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-semibold text-peepers-neutral-900 mb-1">Suporte Completo</h4>
              <p className="text-sm text-peepers-neutral-600">Atendimento via ML</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
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
            </div>
            <div>
              <h4 className="font-bold mb-6">Produtos</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href={PAGES.PRODUTOS} className="hover:text-white transition-colors">Todos os Produtos</Link></li>
                <li><Link href="/produtos?condition=new" className="hover:text-white transition-colors">Produtos Novos</Link></li>
                <li><Link href="/produtos?shipping=free" className="hover:text-white transition-colors">Frete Grátis</Link></li>
                <li><a href="https://www.mercadolivre.com.br/pagina/peepersshop" target="_blank" className="hover:text-white transition-colors">Loja no ML</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Empresa</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/sobre" className="hover:text-white transition-colors">Sobre Nós</Link></li>
                <li><Link href="/contato" className="hover:text-white transition-colors">Contato</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/carreiras" className="hover:text-white transition-colors">Carreiras</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Suporte</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/ajuda" className="hover:text-white transition-colors">Central de Ajuda</Link></li>
                <li><Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
                <li><Link href="/devolucoes" className="hover:text-white transition-colors">Devoluções</Link></li>
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