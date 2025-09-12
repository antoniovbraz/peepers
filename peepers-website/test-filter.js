// Test the filter logic
const sampleProduct = {
  code: 200,
  body: {
    id: 'MLB2199848959',
    status: 'active',
    title: 'Test Product'
  },
  cached_at: '2025-09-11T20:48:26.146Z',
  cache_ttl: 7200
};

console.log('Testing filter logic:');
console.log('Sample product:', JSON.stringify(sampleProduct, null, 2));

// Test the filter conditions
console.log('\nFilter tests:');
console.log('p.body exists:', !!sampleProduct.body);
console.log('p.body.status exists:', !!sampleProduct.body?.status);
console.log('p.body.status === "active":', sampleProduct.body?.status === 'active');
console.log('p.status exists:', !!sampleProduct.status);
console.log('p.status === "active":', sampleProduct.status === 'active');

// Test the actual filter function
const filterFunction = (p) => {
  // Handle nested structure from ML API response
  if (p.body && p.body.status) {
    return p.body.status === 'active';
  }
  // Handle direct structure
  return p.status === 'active';
};

console.log('\nFilter result:', filterFunction(sampleProduct));

// Test with array
const testArray = [sampleProduct];
const filtered = testArray.filter(filterFunction);
console.log('Filtered array length:', filtered.length);
console.log('Filtered products:', filtered);
