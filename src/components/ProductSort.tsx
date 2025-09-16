'use client';

import { SORT_OPTIONS, SortOption } from '@/utils/productCategories';

interface ProductSortProps {
  currentSort: string;
  onSortChange: (sort: string) => void;
  className?: string;
}

export default function ProductSort({ currentSort, onSortChange, className = '' }: ProductSortProps) {
  const selectedOption = SORT_OPTIONS.find(option => option.value === currentSort) || SORT_OPTIONS[0];

  return (
    <div className={`relative ${className}`}>
      <label htmlFor="sort-select" className="sr-only">
        Ordenar produtos
      </label>
      <select
        id="sort-select"
        value={currentSort}
        onChange={(e) => onSortChange(e.target.value)}
        className="appearance-none bg-white pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-peepers-primary-500 focus:border-transparent text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        {SORT_OPTIONS.map((option: SortOption) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Ícone customizado */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg 
          className="h-4 w-4 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </div>
      
      {/* Descrição da ordenação atual */}
      <p className="text-xs text-gray-500 mt-1">
        {selectedOption.description}
      </p>
    </div>
  );
}