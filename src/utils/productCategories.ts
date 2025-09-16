import { ProductSummary } from '@/types/product';

export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  count: number;
  subcategories?: ProductSubcategory[];
}

export interface ProductSubcategory {
  id: string;
  name: string;
  description: string;
  count: number;
}

export interface CategorizedProduct extends ProductSummary {
  category: string;
  subcategory?: string;
  badges: ProductBadge[];
  powerRating?: number;
  length?: string;
  compatibility?: string[];
}

export interface ProductBadge {
  type: 'turbo' | 'ultra' | 'gaming' | 'premium' | 'free-shipping' | 'low-stock' | 'new';
  label: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  priceRange?: [number, number];
  length?: string;
  powerRating?: string;
  compatibility?: string;
  inStock?: boolean;
  freeShipping?: boolean;
  search?: string;
}

export interface SortOption {
  value: string;
  label: string;
  description: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'relevance', label: 'Relevância', description: 'Produtos em destaque primeiro' },
  { value: 'price-asc', label: 'Menor preço', description: 'Do mais barato ao mais caro' },
  { value: 'price-desc', label: 'Maior preço', description: 'Do mais caro ao mais barato' },
  { value: 'stock', label: 'Disponibilidade', description: 'Maior estoque primeiro' },
  { value: 'name', label: 'Nome A-Z', description: 'Ordem alfabética' },
];

export const PRICE_RANGES = [
  { min: 0, max: 30, label: 'Até R$ 30' },
  { min: 30, max: 50, label: 'R$ 30 - R$ 50' },
  { min: 50, max: 100, label: 'R$ 50 - R$ 100' },
  { min: 100, max: 1000, label: 'Acima de R$ 100' },
];

export const CABLE_LENGTHS = [
  { value: 'short', label: 'Curto (≤30cm)', description: 'Ideal para uso próximo' },
  { value: 'medium', label: 'Médio (1m)', description: 'Uso geral' },
  { value: 'long', label: 'Longo (≥2m)', description: 'Maior alcance' },
];

export const POWER_RATINGS = [
  { value: 'standard', label: 'Padrão', description: 'Até 20W' },
  { value: 'turbo', label: 'Turbo', description: '30W - 60W' },
  { value: 'ultra', label: 'Ultra', description: '60W+' },
];

export function categorizeProduct(product: ProductSummary): CategorizedProduct {
  const title = product.title.toLowerCase();
  const badges: ProductBadge[] = [];
  
  // Detectar categoria principal
  let category = 'outros';
  let subcategory: string | undefined;
  let powerRating: number | undefined;
  let length: string | undefined;
  const compatibility: string[] = [];

  // Categorização de cabos e carregadores
  if (title.includes('cabo') || title.includes('carregador')) {
    category = 'cabos-carregadores';
    
    // Subcategorias por tipo de conector
    if (title.includes('tipo c') || title.includes('usb-c') || title.includes('usb c')) {
      subcategory = 'tipo-c';
      compatibility.push('Android', 'Samsung', 'Xiaomi');
    } else if (title.includes('micro usb') || title.includes('v8')) {
      subcategory = 'micro-usb';
      compatibility.push('Android Antigo', 'Controles');
    } else if (title.includes('lightning') || title.includes('iphone')) {
      subcategory = 'lightning';
      compatibility.push('iPhone', 'iPad');
    } else if (title.includes('usb') && title.includes('tipo b')) {
      subcategory = 'usb-b';
      compatibility.push('Impressoras');
    }

    // Detectar uso gaming
    if (title.includes('ps4') || title.includes('ps5') || title.includes('xbox') || 
        title.includes('controle') || title.includes('gamer') || title.includes('gaming') ||
        title.includes('rgb')) {
      category = 'gaming';
      subcategory = 'cabos-controle';
      compatibility.push('PS4', 'PS5', 'Xbox');
    }

    // Detectar potência
    if (title.includes('240w')) powerRating = 240;
    else if (title.includes('100w')) powerRating = 100;
    else if (title.includes('65w')) powerRating = 65;
    else if (title.includes('60w')) powerRating = 60;
    else if (title.includes('30w')) powerRating = 30;
    else if (title.includes('27w')) powerRating = 27;
    else if (title.includes('20w')) powerRating = 20;
    else if (title.includes('turbo') || title.includes('rápido')) powerRating = 18;

    // Detectar comprimento
    if (title.includes('20 cm') || title.includes('20cm') || title.includes('30 cm') || title.includes('30cm')) {
      length = 'short';
    } else if (title.includes('1m') || title.includes('1 metro')) {
      length = 'medium';
    } else if (title.includes('2m') || title.includes('3m') || title.includes('2 metro') || title.includes('3 metro')) {
      length = 'long';
    }
  }

  // Gaming e acessórios
  else if (title.includes('mouse') || title.includes('gaming') || title.includes('gamer')) {
    category = 'gaming';
    subcategory = 'perifericos';
    compatibility.push('PC', 'Mac');
  }

  // Casa e organização
  else if (title.includes('caixa') || title.includes('organiz') || title.includes('medidor') || 
           title.includes('xícara') || title.includes('receita')) {
    category = 'casa-lifestyle';
    subcategory = 'organizacao';
  }

  // Livros
  else if (title.includes('livro')) {
    category = 'casa-lifestyle';
    subcategory = 'livros';
  }

  // Filtros e saúde
  else if (title.includes('cigibud') || title.includes('filtro')) {
    category = 'casa-lifestyle';
    subcategory = 'saude-bem-estar';
  }

  // Carregadores sem fio e power banks
  else if (title.includes('carregador sem fio') || title.includes('wireless') || title.includes('power bank')) {
    category = 'acessorios-premium';
    subcategory = 'carregamento';
    compatibility.push('iPhone', 'Samsung', 'Universal');
  }

  // Braçadeiras e acessórios esportivos
  else if (title.includes('braçadeira') || title.includes('corrida') || title.includes('academia')) {
    category = 'acessorios-premium';
    subcategory = 'esportivos';
    compatibility.push('Universal');
  }

  // Gerar badges baseado nas características
  
  // Badge de potência
  if (powerRating) {
    if (powerRating >= 60) {
      badges.push({ type: 'ultra', label: 'Ultra Rápido', color: 'purple' });
    } else if (powerRating >= 30) {
      badges.push({ type: 'turbo', label: 'Turbo', color: 'blue' });
    }
  }

  // Badge gaming
  if (category === 'gaming' || title.includes('gamer') || title.includes('rgb')) {
    badges.push({ type: 'gaming', label: 'Gaming', color: 'purple' });
  }

  // Badge premium
  if (title.includes('premium') || title.includes('pro') || powerRating && powerRating >= 100) {
    badges.push({ type: 'premium', label: 'Premium', color: 'orange' });
  }

  // Badge frete grátis
  if (product.shipping?.free_shipping) {
    badges.push({ type: 'free-shipping', label: 'Frete Grátis', color: 'green' });
  }

  // Badge estoque baixo
  if (product.available_quantity < 10) {
    badges.push({ type: 'low-stock', label: 'Últimas Unidades', color: 'red' });
  }

  // Badge novo (sempre novo no ML)
  if (product.condition === 'new') {
    badges.push({ type: 'new', label: 'Novo', color: 'green' });
  }

  return {
    ...product,
    category,
    subcategory,
    badges,
    powerRating,
    length,
    compatibility,
  };
}

export function getProductCategories(products: CategorizedProduct[]): ProductCategory[] {
  const categoryMap = new Map<string, ProductCategory>();

  // Inicializar categorias principais
  const categories = [
    {
      id: 'cabos-carregadores',
      name: 'Cabos e Carregadores',
      icon: '🔌',
      description: 'Cabos USB, carregadores e adaptadores',
      count: 0,
      subcategories: [
        { id: 'tipo-c', name: 'USB Tipo C', description: 'Para Android modernos', count: 0 },
        { id: 'micro-usb', name: 'Micro USB V8', description: 'Para dispositivos antigos', count: 0 },
        { id: 'lightning', name: 'Lightning', description: 'Para iPhone e iPad', count: 0 },
        { id: 'usb-b', name: 'USB-B', description: 'Para impressoras', count: 0 },
      ]
    },
    {
      id: 'gaming',
      name: 'Gaming & Controles',
      icon: '🎮',
      description: 'Acessórios para games e controles',
      count: 0,
      subcategories: [
        { id: 'cabos-controle', name: 'Cabos para Controles', description: 'PS4, PS5, Xbox', count: 0 },
        { id: 'perifericos', name: 'Periféricos', description: 'Mouse, teclados gaming', count: 0 },
      ]
    },
    {
      id: 'acessorios-premium',
      name: 'Acessórios Premium',
      icon: '⚡',
      description: 'Produtos de alta qualidade e tecnologia',
      count: 0,
      subcategories: [
        { id: 'carregamento', name: 'Carregamento Avançado', description: 'Sem fio, power banks', count: 0 },
        { id: 'esportivos', name: 'Esportivos', description: 'Para exercícios e atividades', count: 0 },
      ]
    },
    {
      id: 'casa-lifestyle',
      name: 'Casa & Lifestyle',
      icon: '🏠',
      description: 'Produtos para casa e bem-estar',
      count: 0,
      subcategories: [
        { id: 'organizacao', name: 'Organização', description: 'Caixas e organizadores', count: 0 },
        { id: 'livros', name: 'Livros', description: 'Literatura e conhecimento', count: 0 },
        { id: 'saude-bem-estar', name: 'Saúde & Bem-estar', description: 'Filtros e produtos saudáveis', count: 0 },
      ]
    },
    {
      id: 'outros',
      name: 'Outros',
      icon: '📦',
      description: 'Produtos diversos',
      count: 0,
      subcategories: []
    }
  ];

  // Inicializar o mapa
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat });
  });

  // Contar produtos por categoria
  products.forEach(product => {
    const category = categoryMap.get(product.category);
    if (category) {
      category.count++;
      
      if (product.subcategory && category.subcategories) {
        const subcategory = category.subcategories.find(sub => sub.id === product.subcategory);
        if (subcategory) {
          subcategory.count++;
        }
      }
    }
  });

  return Array.from(categoryMap.values()).filter(cat => cat.count > 0);
}

export function filterProducts(products: CategorizedProduct[], filters: ProductFilters): CategorizedProduct[] {
  return products.filter(product => {
    // Filtro de categoria
    if (filters.category && product.category !== filters.category) {
      return false;
    }

    // Filtro de subcategoria
    if (filters.subcategory && product.subcategory !== filters.subcategory) {
      return false;
    }

    // Filtro de preço
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      if (product.price < min || product.price > max) {
        return false;
      }
    }

    // Filtro de comprimento
    if (filters.length && product.length !== filters.length) {
      return false;
    }

    // Filtro de potência
    if (filters.powerRating && product.powerRating) {
      if (filters.powerRating === 'standard' && product.powerRating >= 30) return false;
      if (filters.powerRating === 'turbo' && (product.powerRating < 30 || product.powerRating >= 60)) return false;
      if (filters.powerRating === 'ultra' && product.powerRating < 60) return false;
    }

    // Filtro de compatibilidade
    if (filters.compatibility && product.compatibility) {
      if (!product.compatibility.some(comp => comp.toLowerCase().includes(filters.compatibility!.toLowerCase()))) {
        return false;
      }
    }

    // Filtro de estoque
    if (filters.inStock && product.available_quantity <= 0) {
      return false;
    }

    // Filtro de frete grátis
    if (filters.freeShipping && !product.shipping?.free_shipping) {
      return false;
    }

    // Filtro de busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!product.title.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    return true;
  });
}

export function sortProducts(products: CategorizedProduct[], sortBy: string): CategorizedProduct[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    
    case 'stock':
      return sorted.sort((a, b) => b.available_quantity - a.available_quantity);
    
    case 'name':
      return sorted.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
    
    case 'relevance':
    default:
      // Ordenação por relevância: Premium > Gaming > Turbo > Estoque alto > Preço
      return sorted.sort((a, b) => {
        // 1. Produtos premium primeiro
        const aIsPremium = a.badges.some(badge => badge.type === 'premium');
        const bIsPremium = b.badges.some(badge => badge.type === 'premium');
        if (aIsPremium !== bIsPremium) return bIsPremium ? 1 : -1;

        // 2. Produtos gaming
        const aIsGaming = a.badges.some(badge => badge.type === 'gaming');
        const bIsGaming = b.badges.some(badge => badge.type === 'gaming');
        if (aIsGaming !== bIsGaming) return bIsGaming ? 1 : -1;

        // 3. Produtos turbo
        const aIsTurbo = a.badges.some(badge => badge.type === 'turbo' || badge.type === 'ultra');
        const bIsTurbo = b.badges.some(badge => badge.type === 'turbo' || badge.type === 'ultra');
        if (aIsTurbo !== bIsTurbo) return bIsTurbo ? 1 : -1;

        // 4. Maior estoque
        if (a.available_quantity !== b.available_quantity) {
          return b.available_quantity - a.available_quantity;
        }

        // 5. Menor preço
        return a.price - b.price;
      });
  }
}

export function getRecommendedProducts(products: CategorizedProduct[]): CategorizedProduct[] {
  return products
    .filter(product => 
      product.shipping?.free_shipping || 
      product.badges.some(badge => badge.type === 'premium' || badge.type === 'ultra') ||
      product.price > 100
    )
    .sort((a, b) => {
      // Priorizar frete grátis
      if (a.shipping?.free_shipping !== b.shipping?.free_shipping) {
        return b.shipping?.free_shipping ? 1 : -1;
      }
      
      // Depois por valor
      return b.price - a.price;
    })
    .slice(0, 4);
}