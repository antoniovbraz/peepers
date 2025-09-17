'use client';

import { SORT_OPTIONS, SortOption } from '@/utils/productCategories';

// Design System Imports
import { VStack } from '@/components/ui/layout/Stack';

// ==================== TYPES ====================

interface ProductSortNewProps {
  currentSort: string;
  onSortChange: (sort: string) => void;
  className?: string;
}

// ==================== COMPONENT ====================

export default function ProductSortNew({ 
  currentSort, 
  onSortChange, 
  className = '' 
}: ProductSortNewProps) {
  const selectedOption = SORT_OPTIONS.find(option => option.value === currentSort) || SORT_OPTIONS[0];

  return (
    <VStack spacing="xs" className={className}>
      
      {/* Select Container */}
      <div className="relative">
        <label htmlFor="sort-select" className="sr-only">
          Ordenar produtos
        </label>
        
        <select
          id="sort-select"
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="appearance-none bg-white pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary-500 focus:border-brand-primary-500 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 cursor-pointer min-w-[180px] shadow-sm"
        >
          {SORT_OPTIONS.map((option: SortOption) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Custom Icon */}
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
      </div>
      
      {/* Sort Description */}
      <p className="text-xs text-gray-500 leading-tight">
        {selectedOption.description}
      </p>
      
    </VStack>
  );
}