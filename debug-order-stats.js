#!/usr/bin/env node

const BASE_URL = 'https://peepers.vercel.app';

async function debugOrderStats() {
  console.log('🔍 Debugging Order Statistics...\n');

  try {
    // First, let's check the sales data
    console.log('1. Testing sales endpoint:');
    const salesResponse = await fetch(`${BASE_URL}/api/admin/sales?days=30`);
    const salesData = await salesResponse.json();
    
    console.log(`Sales API Status: ${salesResponse.status}`);
    console.log(`Sales Data Success: ${salesData.success}`);
    console.log(`Number of Sales: ${salesData.data?.sales?.length || 0}`);
    
    if (salesData.data?.sales?.length > 0) {
      const firstSale = salesData.data.sales[0];
      console.log('First Sale Sample:', {
        id: firstSale.id,
        status: firstSale.status,
        sale_price: firstSale.sale_price,
        quantity: firstSale.quantity,
        total: firstSale.sale_price * firstSale.quantity,
        currency: firstSale.currency,
        date: firstSale.date
      });
    }

    console.log('\n2. Testing metrics endpoint:');
    const metricsResponse = await fetch(`${BASE_URL}/api/admin/dashboard/metrics`);
    const metricsData = await metricsResponse.json();
    
    console.log(`Metrics API Status: ${metricsResponse.status}`);
    console.log(`Metrics Data Success: ${metricsData.success}`);
    
    if (metricsData.success) {
      console.log('Order Statistics:', {
        total: metricsData.data.orders.total,
        totalRevenue: metricsData.data.orders.totalRevenue,
        totalProfit: metricsData.data.orders.totalProfit,
        averageOrderValue: metricsData.data.orders.averageOrderValue,
        byStatus: metricsData.data.orders.byStatus
      });
    } else {
      console.log('Metrics Error:', metricsData.error);
    }

  } catch (error) {
    console.error('Debug Error:', error.message);
  }
}

debugOrderStats();