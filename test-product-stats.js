/**
 * Test script for ProductRepository getStatistics method
 * Tests the integration with ML API for fetching real product data
 */

const { ProductRepository } = require('./src/infrastructure/repositories/ProductRepository');

async function testProductStatistics() {
  console.log('🧪 Testing ProductRepository.getStatistics()...\n');

  try {
    // Create repository instance with admin context
    const repository = new ProductRepository(undefined, true);

    // Test with a mock seller ID
    const sellerId = 123456789; // Mock seller ID for testing

    console.log(`📊 Fetching statistics for seller ${sellerId}...`);

    const result = await repository.getStatistics(sellerId);

    console.log('\n📈 Statistics Result:');
    console.log('==================');

    if (result.success && result.data) {
      console.log(`✅ Success: ${result.success}`);
      console.log(`📊 Total Products: ${result.data.total}`);
      console.log(`🟢 Active Products: ${result.data.active}`);
      console.log(`⏸️  Paused Products: ${result.data.paused}`);
      console.log(`❌ Closed Products: ${result.data.closed}`);
      console.log(`📦 Out of Stock: ${result.data.outOfStock}`);
      console.log(`⚠️  Low Stock: ${result.data.lowStock}`);
      console.log(`💰 Total Value: R$ ${result.data.totalValue.toFixed(2)}`);
      console.log(`📈 Average Price: R$ ${result.data.averagePrice.toFixed(2)}`);
      console.log(`🕒 Timestamp: ${result.timestamp}`);
    } else {
      console.log(`❌ Failed: ${result.error || 'Unknown error'}`);
    }

    console.log('\n🎯 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testProductStatistics();