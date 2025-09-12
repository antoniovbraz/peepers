import Link from 'next/link';
import { Suspense } from 'react';
import ReloadButton from '@/components/ReloadButton';
import PeepersLogo from '@/components/PeepersLogo';
import type { ProductSummary } from '@/types/product';

// Componente para listar produtos
async function ProductsList() {
  try {
    // Buscar produtos reais da API
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '';
    const response = await fetch(`${baseUrl}/api/products`, {
      cache: 'no-store' // Sempre buscar dados atualizados
    });
    
    if (!response.ok) {
      throw new Error('Falha ao carregar produtos');
    }
    
    const data: { products: ProductSummary[] } = await response.json();
    const products: ProductSummary[] = data.products || [];

    if (products.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mb-6">
            <PeepersLogo variant="icon" size="xl" className="mx-auto opacity-20 mb-4" />
          </div>
          <p className="text-peepers-neutral-600 mb-4 text-lg">Nenhum produto encontrado.</p>
          <p className="text-sm text-peepers-neutral-500 mb-6">
            Os produtos podem ainda estar sendo sincronizados do Mercado Livre.
          </p>
          <a 
            href="/api/ml/sync?action=sync"
            className="btn-primary inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sincronizar Produtos
          </a>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product: ProductSummary) => (
          <div key={product.id} className="card-peepers group">
            <div className="aspect-square bg-peepers-neutral-100 relative overflow-hidden rounded-t-lg">
              {product.thumbnail ? (
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PeepersLogo variant="icon" size="lg" className="opacity-20" />
                </div>
              )}
              {product.condition === 'new' && (
                <div className="absolute top-3 left-3">
                  <span className="badge-new">Novo</span>
                </div>
              )}
              {product.shipping.free_shipping && (
                <div className="absolute top-3 right-3">
                  <span className="badge-shipping">Frete Grátis</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-peepers-neutral-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-peepers-primary-600 transition-colors">
                {product.title}
              </h3>
              <p className="text-2xl font-bold text-peepers-primary-600 mb-2">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(product.price)}
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-peepers-neutral-600">
                  {product.available_quantity} disponíveis
                </span>
                {product.installments && (
                  <span className="text-xs text-peepers-secondary-600 font-medium">
                    {product.installments.quantity}x sem juros
                  </span>
                )}
              </div>
              <Link
                href={`/produtos/${product.id}`}
                className="btn-primary w-full text-center"
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
        <div className="mb-6">
          <PeepersLogo variant="icon" size="xl" className="mx-auto opacity-20 mb-4" />
        </div>
        <p className="text-peepers-neutral-600 mb-4 text-lg">Erro ao carregar produtos.</p>
        <p className="text-sm text-peepers-neutral-500 mb-6">
          Tente novamente em alguns instantes.
        </p>
        <ReloadButton className="btn-primary inline-flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Tentar Novamente
        </ReloadButton>
      </div>
    );
  }
}

// Loading component
function ProductsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="card-peepers animate-pulse">
          <div className="aspect-square bg-peepers-neutral-200 rounded-t-lg"></div>
          <div className="p-4">
            <div className="h-4 bg-peepers-neutral-200 rounded mb-2"></div>
            <div className="h-4 bg-peepers-neutral-200 rounded w-2/3 mb-2"></div>
            <div className="h-6 bg-peepers-neutral-200 rounded w-1/2 mb-3"></div>
            <div className="h-10 bg-peepers-neutral-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProdutosPage() {
  return (
    <div className="min-h-screen bg-peepers-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-peepers-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <PeepersLogo variant="full" size="md" />
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/produtos" className="text-peepers-primary-600 font-medium border-b-2 border-peepers-primary-600 pb-1">
                Produtos
              </Link>
              <Link href="/sobre" className="text-peepers-neutral-700 hover:text-peepers-primary-600 transition-colors">
                Sobre
              </Link>
              <Link href="/contato" className="text-peepers-neutral-700 hover:text-peepers-primary-600 transition-colors">
                Contato
              </Link>
              <Link href="/blog" className="text-peepers-neutral-700 hover:text-peepers-primary-600 transition-colors">
                Blog
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-peepers-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-peepers-neutral-500 hover:text-peepers-primary-600 transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <span className="text-peepers-neutral-400">/</span>
              </li>
              <li>
                <span className="text-peepers-neutral-900 font-medium">Produtos</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-peepers-neutral-900 mb-4">
            Nossos Produtos
          </h1>
          <p className="text-lg text-peepers-neutral-600 max-w-2xl mx-auto">
            Confira nossa seleção completa de produtos com qualidade garantida e preços especiais.
          </p>
        </div>

        {/* Filters Section */}
        <div className="card-peepers p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-peepers-neutral-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-peepers-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              Filtros
            </h2>
            <button className="text-sm text-peepers-primary-600 hover:text-peepers-primary-700 font-medium">
              Limpar filtros
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-peepers-neutral-700 mb-2">
                Categoria
              </label>
              <select className="input-peepers">
                <option>Todas as categorias</option>
                <option>Eletrônicos</option>
                <option>Informática</option>
                <option>Casa e Jardim</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-peepers-neutral-700 mb-2">
                Preço
              </label>
              <select className="input-peepers">
                <option>Qualquer preço</option>
                <option>Até R$ 100</option>
                <option>R$ 100 - R$ 500</option>
                <option>R$ 500 - R$ 1000</option>
                <option>Acima de R$ 1000</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-peepers-neutral-700 mb-2">
                Condição
              </label>
              <select className="input-peepers">
                <option>Todas</option>
                <option>Novo</option>
                <option>Usado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-peepers-neutral-700 mb-2">
                Frete
              </label>
              <select className="input-peepers">
                <option>Todos</option>
                <option>Frete grátis</option>
                <option>Retirada local</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <Suspense fallback={<ProductsLoading />}>
          <ProductsList />
        </Suspense>

        {/* Pagination */}
        <div className="mt-12 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button className="px-4 py-2 text-peepers-neutral-500 hover:text-peepers-primary-600 disabled:opacity-50 transition-colors" disabled>
              Anterior
            </button>
            <button className="px-4 py-2 bg-peepers-primary-600 text-white rounded-lg font-medium shadow-sm">
              1
            </button>
            <button className="px-4 py-2 text-peepers-neutral-700 hover:text-peepers-primary-600 hover:bg-peepers-primary-50 rounded-lg transition-colors">
              2
            </button>
            <button className="px-4 py-2 text-peepers-neutral-700 hover:text-peepers-primary-600 hover:bg-peepers-primary-50 rounded-lg transition-colors">
              3
            </button>
            <button className="px-4 py-2 text-peepers-neutral-700 hover:text-peepers-primary-600 transition-colors">
              Próximo
            </button>
          </nav>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-peepers-neutral-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <PeepersLogo variant="full" size="md" className="brightness-0 invert" />
              </div>
              <p className="text-peepers-neutral-400 leading-relaxed">
                Sua loja oficial com produtos de qualidade e segurança garantida. Conectando você aos melhores produtos do Mercado Livre.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-peepers-secondary-400">Produtos</h4>
              <ul className="space-y-2 text-peepers-neutral-400">
                <li><Link href="/produtos" className="hover:text-peepers-secondary-400 transition-colors">Todos os Produtos</Link></li>
                <li><Link href="/produtos?condition=new" className="hover:text-peepers-secondary-400 transition-colors">Produtos Novos</Link></li>
                <li><Link href="/produtos?shipping=free" className="hover:text-peepers-secondary-400 transition-colors">Frete Grátis</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-peepers-secondary-400">Empresa</h4>
              <ul className="space-y-2 text-peepers-neutral-400">
                <li><Link href="/sobre" className="hover:text-peepers-secondary-400 transition-colors">Sobre Nós</Link></li>
                <li><Link href="/contato" className="hover:text-peepers-secondary-400 transition-colors">Contato</Link></li>
                <li><Link href="/blog" className="hover:text-peepers-secondary-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-peepers-secondary-400">Suporte</h4>
              <ul className="space-y-2 text-peepers-neutral-400">
                <li><Link href="/ajuda" className="hover:text-peepers-secondary-400 transition-colors">Central de Ajuda</Link></li>
                <li><Link href="/termos" className="hover:text-peepers-secondary-400 transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="hover:text-peepers-secondary-400 transition-colors">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-peepers-neutral-800 mt-8 pt-8 text-center text-peepers-neutral-400">
            <p>&copy; 2025 Peepers. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
