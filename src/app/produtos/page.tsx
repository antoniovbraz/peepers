import Link from 'next/link';
import { Suspense } from 'react';

// Componente para listar produtos
async function ProductsList() {
  try {
    // Por enquanto, vamos simular produtos
    // Em produção, isso virá da API /api/products
    const mockProducts = [
      {
        id: 'MLB123456789',
        title: 'Smartphone Samsung Galaxy A54 128GB',
        price: 1299.99,
        currency_id: 'BRL',
        thumbnail: '/api/placeholder/300/300',
        condition: 'new',
        shipping: { free_shipping: true },
        available_quantity: 10
      },
      {
        id: 'MLB987654321',
        title: 'Notebook Lenovo IdeaPad 3 Intel Core i5',
        price: 2499.99,
        currency_id: 'BRL',
        thumbnail: '/api/placeholder/300/300',
        condition: 'new',
        shipping: { free_shipping: true },
        available_quantity: 5
      },
      {
        id: 'MLB456789123',
        title: 'Fone de Ouvido Bluetooth JBL Tune 510BT',
        price: 199.99,
        currency_id: 'BRL',
        thumbnail: '/api/placeholder/300/300',
        condition: 'new',
        shipping: { free_shipping: false },
        available_quantity: 25
      },
      {
        id: 'MLB789123456',
        title: 'Smart TV LG 50" 4K UHD',
        price: 1899.99,
        currency_id: 'BRL',
        thumbnail: '/api/placeholder/300/300',
        condition: 'new',
        shipping: { free_shipping: true },
        available_quantity: 3
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">Imagem do Produto</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                {product.title}
              </h3>
              <p className="text-2xl font-bold text-green-600 mb-2">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(product.price)}
              </p>
              <div className="flex items-center justify-between mb-3">
                {product.shipping.free_shipping && (
                  <span className="text-sm text-green-600 font-medium">Frete grátis</span>
                )}
                <span className="text-sm text-gray-500">
                  {product.available_quantity} disponíveis
                </span>
              </div>
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
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Erro ao carregar produtos.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }
}

// Loading component
function ProductsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
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

export default function ProdutosPage() {
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
              <Link href="/produtos" className="text-blue-600 font-medium">
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

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-700">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Nossos Produtos
          </h1>
          <p className="text-lg text-gray-600">
            Confira nossa seleção completa de produtos com qualidade garantida.
          </p>
        </div>

        {/* Filters Section (placeholder) */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2">
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
              <select className="w-full border border-gray-300 rounded-md px-3 py-2">
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
              <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                <option>Todas</option>
                <option>Novo</option>
                <option>Usado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frete
              </label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2">
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

        {/* Pagination (placeholder) */}
        <div className="mt-12 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50" disabled>
              Anterior
            </button>
            <button className="px-3 py-2 bg-blue-600 text-white rounded">
              1
            </button>
            <button className="px-3 py-2 text-gray-700 hover:text-gray-900">
              2
            </button>
            <button className="px-3 py-2 text-gray-700 hover:text-gray-900">
              3
            </button>
            <button className="px-3 py-2 text-gray-700 hover:text-gray-900">
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
