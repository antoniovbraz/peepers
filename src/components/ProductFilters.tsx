'use client';

import { useState } from 'react';
import { 
  ProductFilters, 
  ProductCategory, 
  PRICE_RANGES, 
  CABLE_LENGTHS, 
  POWER_RATINGS 
} from '@/utils/productCategories';

interface ProductFiltersComponentProps {
  categories: ProductCategory[];
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  totalProducts: number;
  filteredCount: number;
}

export default function ProductFiltersComponent({
  categories,
  filters,
  onFiltersChange,
  totalProducts,
  filteredCount
}: ProductFiltersComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const updateFilter = (key: keyof ProductFilters, value: string | number | boolean | [number, number] | undefined) => {
    const newFilters = { ...filters, [key]: value };
    if (value === '' || value === undefined || value === null) {
      delete newFilters[key];
    }
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
    setSearchTerm('');
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    updateFilter('search', value || undefined);
  };

  const activeFilterCount = Object.keys(filters).length;
  const selectedCategory = categories.find(cat => cat.id === filters.category);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Header com busca e controles principais */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Busca */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peepers-primary-500 focus:border-transparent"
            />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Resultados e controles */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {filteredCount} de {totalProducts} produtos
            </span>
            
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-peepers-primary-600 hover:text-peepers-primary-700 font-medium"
              >
                Limpar filtros ({activeFilterCount})
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg 
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Filtros Avançados
            </button>
          </div>
        </div>
      </div>

      {/* Filtros rápidos - sempre visíveis */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          {/* Categorias principais */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateFilter('category', undefined)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                !filters.category 
                  ? 'bg-peepers-primary-100 text-peepers-primary-700 border border-peepers-primary-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => updateFilter('category', category.id)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1 ${
                  filters.category === category.id
                    ? 'bg-peepers-primary-100 text-peepers-primary-700 border border-peepers-primary-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
                <span className="text-xs opacity-70">({category.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros avançados - expansível */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Subcategorias */}
          {selectedCategory?.subcategories && selectedCategory.subcategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategoria em {selectedCategory.name}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateFilter('subcategory', undefined)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    !filters.subcategory 
                      ? 'bg-peepers-secondary-100 text-peepers-secondary-700 border border-peepers-secondary-200' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Todas
                </button>
                {selectedCategory.subcategories.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => updateFilter('subcategory', sub.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      filters.subcategory === sub.id
                        ? 'bg-peepers-secondary-100 text-peepers-secondary-700 border border-peepers-secondary-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {sub.name} ({sub.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Faixa de preço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Faixa de Preço
              </label>
              <select
                value={filters.priceRange ? `${filters.priceRange[0]}-${filters.priceRange[1]}` : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const [min, max] = e.target.value.split('-').map(Number);
                    updateFilter('priceRange', [min, max]);
                  } else {
                    updateFilter('priceRange', undefined);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peepers-primary-500 focus:border-transparent"
              >
                <option value="">Qualquer preço</option>
                {PRICE_RANGES.map(range => (
                  <option key={`${range.min}-${range.max}`} value={`${range.min}-${range.max}`}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Comprimento do cabo */}
            {(filters.category === 'cabos-carregadores' || filters.category === 'gaming') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comprimento
                </label>
                <select
                  value={filters.length || ''}
                  onChange={(e) => updateFilter('length', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peepers-primary-500 focus:border-transparent"
                >
                  <option value="">Qualquer comprimento</option>
                  {CABLE_LENGTHS.map(length => (
                    <option key={length.value} value={length.value}>
                      {length.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Potência */}
            {(filters.category === 'cabos-carregadores' || filters.category === 'gaming') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Potência
                </label>
                <select
                  value={filters.powerRating || ''}
                  onChange={(e) => updateFilter('powerRating', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peepers-primary-500 focus:border-transparent"
                >
                  <option value="">Qualquer potência</option>
                  {POWER_RATINGS.map(power => (
                    <option key={power.value} value={power.value}>
                      {power.label} - {power.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Compatibilidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compatibilidade
              </label>
              <select
                value={filters.compatibility || ''}
                onChange={(e) => updateFilter('compatibility', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peepers-primary-500 focus:border-transparent"
              >
                <option value="">Todos os dispositivos</option>
                <option value="iPhone">iPhone</option>
                <option value="Android">Android</option>
                <option value="Samsung">Samsung</option>
                <option value="Xiaomi">Xiaomi</option>
                <option value="PS4">PlayStation 4</option>
                <option value="PS5">PlayStation 5</option>
                <option value="Xbox">Xbox</option>
                <option value="PC">PC</option>
                <option value="Impressora">Impressoras</option>
              </select>
            </div>
          </div>

          {/* Filtros booleanos */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.freeShipping || false}
                onChange={(e) => updateFilter('freeShipping', e.target.checked || undefined)}
                className="rounded border-gray-300 text-peepers-primary-600 focus:ring-peepers-primary-500"
              />
              <span className="text-sm text-gray-700">Apenas frete grátis</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.inStock || false}
                onChange={(e) => updateFilter('inStock', e.target.checked || undefined)}
                className="rounded border-gray-300 text-peepers-primary-600 focus:ring-peepers-primary-500"
              />
              <span className="text-sm text-gray-700">Apenas em estoque</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}