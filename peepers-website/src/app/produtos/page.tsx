import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import ReloadButton from '@/components/ReloadButton';
import PeepersLogo from '@/components/PeepersLogo';
import { RefreshCw } from 'lucide-react';

// Componente para listar produtos
async function ProductsList() {
  try {
    // Buscar produtos reais da API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'https://peepers.vercel.app'}/api/products`, {
      cache: 'no-store' // Sempre buscar dados atualizados
    });
    
    if (!response.ok) {
      throw new Error('Falha ao carregar produtos');
    }
    
    const data = await response.json();
    const products = data.products || [];

    if (products.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mb-6">
            <PeepersLogo variant="icon" size="xl" className="mx-auto opacity-20 mb-4" />
          </div>
          <p className="text-gray-600 mb-4 text-lg">Nenhum produto encontrado.</p>
          <p className="text-sm text-gray-500 mb-6">
            Os produtos podem ainda estar sendo sincronizados do Mercado Livre.
          </p>
          <a 
            href="/api/ml/sync?action=sync"
            className="btn-primary inline-flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar Produtos
          </a>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product: any) => (
          <div key={product.id} className="card-hover group">
            <div className="aspect-square bg-gray-100 relative overflow-hidden rounded-t-lg">
              {product.thumbnail ? (
                <Image
                  src={product.thumbnail}
                  alt={product.title}
                  width={800}
                  height={800}
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
                  <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">Novo</span>
                </div>
              )}
              {product.shipping.free_shipping && (
                <div className="absolute top-3 right-3">
                  <span className="bg-yellow-400 text-green-900 px-2 py-1 rounded-full text-xs font-medium">Frete Grátis</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-green-700 transition-colors">
                {product.title}
              </h3>
              <p className="text-2xl font-bold text-green-700 mb-2">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(product.price)}
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">
                  {product.available_quantity} disponíveis
                </span>
                {product.installments && (
                  <span className="text-xs text-yellow-600 font-medium">
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
        <p className="text-gray-600 mb-4 text-lg">Erro ao carregar produtos.</p>
        <p className="text-sm text-gray-500 mb-6">
          Tente novamente em alguns instantes.
        </p>
        <ReloadButton className="btn-primary inline-flex items-center">
          <RefreshCw className="w-4 h-4 mr-2" />
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
        <div key={i} className="card-hover animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
          <div className="p-4">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProdutosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                <PeepersLogo variant="full" size="md" priority />
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/produtos" className="text-green-700 font-medium border-b-2 border-green-700 pb-1">
                Produtos
              </Link>
              <Link href="/sobre" className="text-gray-700 hover:text-green-700 transition-colors">
                Sobre
              </Link>
              <Link href="/contato" className="text-gray-700 hover:text-green-700 transition-colors">
                Contato
              </Link>
              <Link href="/blog" className="text-gray-700 hover:text-green-700 transition-colors">
                Blog
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-gray-500 hover:text-green-700 transition-colors">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Nossos Produtos
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Confira nossa seleção completa de produtos com qualidade garantida e preços especiais.
          </p>
        </div>

        {/* Filters Section */}
        <div className="card-hover p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <RefreshCw className="w-5 h-5 mr-2 text-green-700" />
                Filtros
              </h2>
            <button className="text-sm text-green-700 hover:text-green-800 font-medium">
              Limpar filtros
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors">
                <option>Todas as categorias</option>
                <option>Eletrônicos</option>
                <option>Informática</option>
                <option>Casa e Jardim</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors">
                <option>Qualquer preço</option>
                <option>Até R$ 100</option>
                <option>R$ 100 - R$ 500</option>
                <option>R$ 500 - R$ 1000</option>
                <option>Acima de R$ 1000</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condição
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors">
                <option>Todas</option>
                <option>Novo</option>
                <option>Usado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frete
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors">
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
            <button className="px-4 py-2 text-gray-500 hover:text-green-700 disabled:opacity-50 transition-colors" disabled>
              Anterior
            </button>
            <button className="px-4 py-2 bg-green-700 text-white rounded-lg font-medium shadow-sm">
              1
            </button>
            <button className="px-4 py-2 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
              2
            </button>
            <button className="px-4 py-2 text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
              3
            </button>
            <button className="px-4 py-2 text-gray-700 hover:text-green-700 transition-colors">
              Próximo
            </button>
          </nav>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <PeepersLogo variant="full" size="md" className="brightness-0 invert" />
              </div>
              <p className="text-gray-400 leading-relaxed">
                Sua loja oficial com produtos de qualidade e segurança garantida. Conectando você aos melhores produtos do Mercado Livre.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-yellow-400">Produtos</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/produtos" className="hover:text-yellow-400 transition-colors">Todos os Produtos</Link></li>
                <li><Link href="/produtos?condition=new" className="hover:text-yellow-400 transition-colors">Produtos Novos</Link></li>
                <li><Link href="/produtos?shipping=free" className="hover:text-yellow-400 transition-colors">Frete Grátis</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-yellow-400">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/sobre" className="hover:text-yellow-400 transition-colors">Sobre Nós</Link></li>
                <li><Link href="/contato" className="hover:text-yellow-400 transition-colors">Contato</Link></li>
                <li><Link href="/blog" className="hover:text-yellow-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-yellow-400">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/ajuda" className="hover:text-yellow-400 transition-colors">Central de Ajuda</Link></li>
                <li><Link href="/termos" className="hover:text-yellow-400 transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="hover:text-yellow-400 transition-colors">Privacidade</Link></li>
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
