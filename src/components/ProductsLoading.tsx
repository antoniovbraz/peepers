import React from 'react';

const ProductsLoading: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
        <div className="aspect-square bg-gray-200"></div>
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
          <div className="flex items-center space-x-1 mb-3">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="w-4 h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default ProductsLoading;
