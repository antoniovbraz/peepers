'use client';

import { useState } from 'react';
import { 
  type ProductFilters, 
  ProductCategory, 
  PRICE_RANGES, 
  CABLE_LENGTHS, 
  POWER_RATINGS 
} from '@/utils/productCategories';

// Design System Imports
import { Button } from '@/components/ui/primitives/Button';
import { Input } from '@/components/ui/primitives/Input';
import { Badge } from '@/components/ui/primitives/Badge';
import { Container, Section } from '@/components/ui/layout/Container';
import { VStack, HStack } from '@/components/ui/layout/Stack';
import { Grid } from '@/components/ui/layout/Grid';

// ==================== TYPES ====================

interface ProductFiltersProps {
  categories: ProductCategory[];
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  totalProducts: number;
  filteredCount: number;
}

// ==================== COMPONENT ====================

export default function ProductFilters({
  categories,
  filters,
  onFiltersChange,
  totalProducts,
  filteredCount
}: ProductFiltersProps) {
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
    <Section>
      <Container>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          
          {/* Header com busca e controles principais */}
          <div className="p-6 border-b border-gray-200">
            <VStack spacing="lg">
              
              {/* Search and Controls Row */}
              <HStack spacing="lg" align="center" wrap>
                
                {/* Search Input */}
                <div className="flex-1 min-w-0 max-w-md">
                  <Input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    leftIcon={
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    }
                  />
                </div>

                {/* Results and Controls */}
                <HStack spacing="md" align="center">
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    {filteredCount} de {totalProducts} produtos
                  </span>
                  
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                    >
                      Limpar filtros ({activeFilterCount})
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    rightIcon={
                      <svg 
                        className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    }
                  >
                    Filtros Avançados
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          </div>

          {/* Filtros rápidos - sempre visíveis */}
          <div className="p-6 border-b border-gray-200">
            <VStack spacing="md">
              <h3 className="text-sm font-medium text-gray-700">Categorias</h3>
              
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={!filters.category ? 'primary' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => updateFilter('category', undefined)}
                >
                  Todos
                </Badge>
                
                {categories.map(category => (
                  <Badge
                    key={category.id}
                    variant={filters.category === category.id ? 'primary' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => updateFilter('category', category.id)}
                  >
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                    <span className="text-xs opacity-70">({category.count})</span>
                  </Badge>
                ))}
              </div>
            </VStack>
          </div>

          {/* Filtros avançados - expansível */}
          {isExpanded && (
            <div className="p-6">
              <VStack spacing="lg">
                
                {/* Subcategorias */}
                {selectedCategory?.subcategories && selectedCategory.subcategories.length > 0 && (
                  <VStack spacing="sm">
                    <h4 className="text-sm font-medium text-gray-700">
                      Subcategoria em {selectedCategory.name}
                    </h4>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={!filters.subcategory ? 'secondary' : 'default'}
                        className="cursor-pointer"
                        onClick={() => updateFilter('subcategory', undefined)}
                      >
                        Todas
                      </Badge>
                      
                      {selectedCategory.subcategories.map(sub => (
                        <Badge
                          key={sub.id}
                          variant={filters.subcategory === sub.id ? 'secondary' : 'default'}
                          className="cursor-pointer"
                          onClick={() => updateFilter('subcategory', sub.id)}
                        >
                          {sub.name} ({sub.count})
                        </Badge>
                      ))}
                    </div>
                  </VStack>
                )}

                {/* Grid de filtros específicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Faixa de preço */}
                  <VStack spacing="sm">
                    <label className="text-sm font-medium text-gray-700">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary-500 focus:border-transparent"
                    >
                      <option value="">Qualquer preço</option>
                      {PRICE_RANGES.map(range => (
                        <option key={`${range.min}-${range.max}`} value={`${range.min}-${range.max}`}>
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </VStack>

                  {/* Comprimento do cabo */}
                  {(filters.category === 'cabos-carregadores' || filters.category === 'gaming') && (
                    <VStack spacing="sm">
                      <label className="text-sm font-medium text-gray-700">
                        Comprimento
                      </label>
                      <select
                        value={filters.length || ''}
                        onChange={(e) => updateFilter('length', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary-500 focus:border-transparent"
                      >
                        <option value="">Qualquer comprimento</option>
                        {CABLE_LENGTHS.map(length => (
                          <option key={length.value} value={length.value}>
                            {length.label}
                          </option>
                        ))}
                      </select>
                    </VStack>
                  )}

                  {/* Potência */}
                  {(filters.category === 'cabos-carregadores' || filters.category === 'gaming') && (
                    <VStack spacing="sm">
                      <label className="text-sm font-medium text-gray-700">
                        Potência
                      </label>
                      <select
                        value={filters.powerRating || ''}
                        onChange={(e) => updateFilter('powerRating', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary-500 focus:border-transparent"
                      >
                        <option value="">Qualquer potência</option>
                        {POWER_RATINGS.map(power => (
                          <option key={power.value} value={power.value}>
                            {power.label} - {power.description}
                          </option>
                        ))}
                      </select>
                    </VStack>
                  )}

                  {/* Compatibilidade */}
                  <VStack spacing="sm">
                    <label className="text-sm font-medium text-gray-700">
                      Compatibilidade
                    </label>
                    <select
                      value={filters.compatibility || ''}
                      onChange={(e) => updateFilter('compatibility', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary-500 focus:border-transparent"
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
                  </VStack>
                  
                </div>

                {/* Filtros booleanos */}
                <VStack spacing="sm">
                  <h4 className="text-sm font-medium text-gray-700">Opções</h4>
                  
                  <HStack spacing="lg" wrap>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.freeShipping || false}
                        onChange={(e) => updateFilter('freeShipping', e.target.checked || undefined)}
                        className="rounded border-gray-300 text-brand-primary-600 focus:ring-brand-primary-500"
                      />
                      <span className="text-sm text-gray-700">Apenas frete grátis</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.inStock || false}
                        onChange={(e) => updateFilter('inStock', e.target.checked || undefined)}
                        className="rounded border-gray-300 text-brand-primary-600 focus:ring-brand-primary-500"
                      />
                      <span className="text-sm text-gray-700">Apenas em estoque</span>
                    </label>
                  </HStack>
                </VStack>
                
              </VStack>
            </div>
          )}
          
        </div>
      </Container>
    </Section>
  );
}