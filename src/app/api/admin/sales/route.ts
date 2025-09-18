import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/config/routes';

/**
 * API de vendas baseada em produtos reais
 * Simula vendas usando os produtos reais do ML para fornecer dados realísticos ao admin
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    // Buscar produtos reais
    const productsResponse = await fetch(`${request.nextUrl.origin}${API_ENDPOINTS.PRODUCTS_V1}?format=summary&limit=50`);
    
    if (!productsResponse.ok) {
      throw new Error('Failed to fetch products');
    }
    
    const productsData = await productsResponse.json();
    const products = productsData.data?.products || [];
    
    if (products.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No products found'
      }, { status: 404 });
    }
    
    // Simular vendas baseadas nos produtos reais
    const sales = generateRealisticSales(products, days);
    const analytics = calculateAnalytics(sales, products, days);
    
    return NextResponse.json({
      success: true,
      data: {
        sales,
        analytics,
        period: {
          days,
          start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      },
      meta: {
        source: 'products-based-simulation',
        products_count: products.length,
        sales_count: sales.length,
        timestamp: new Date().toISOString()
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Sales API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateRealisticSales(products: any[], days: number) {
  const sales = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  // Gerar vendas para cada dia
  for (let d = 0; d < days; d++) {
    const dayStart = now - (d * dayMs);
    const salesPerDay = Math.floor(Math.random() * 8) + 2; // 2-10 vendas por dia
    
    for (let s = 0; s < salesPerDay; s++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const saleTime = dayStart - Math.random() * dayMs;
      
      // Simular variação de preços (desconto 0-20%)
      const discount = Math.random() * 0.2;
      const salePrice = product.price * (1 - discount);
      
      sales.push({
        id: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        product_id: product.id,
        product_title: product.title,
        product_price: product.price,
        sale_price: Math.round(salePrice * 100) / 100,
        quantity: Math.random() > 0.8 ? 2 : 1, // 80% chance de quantidade 1
        currency: 'BRL',
        date: new Date(saleTime).toISOString(),
        status: Math.random() > 0.05 ? 'completed' : 'pending', // 95% completed
        buyer: {
          id: Math.floor(Math.random() * 1000000),
          nickname: `buyer_${Math.random().toString(36).substr(2, 6)}`,
          location: getRandomLocation()
        },
        shipping: {
          type: product.shipping?.free_shipping ? 'free' : 'paid',
          cost: product.shipping?.free_shipping ? 0 : Math.round(Math.random() * 20 + 5)
        }
      });
    }
  }
  
  // Ordenar por data (mais recente primeiro)
  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function calculateAnalytics(sales: any[], products: any[], days: number) {
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.sale_price * sale.quantity), 0);
  const avgOrderValue = totalRevenue / totalSales || 0;
  
  // Top produtos
  const productSales = sales.reduce((acc, sale) => {
    const key = sale.product_id;
    if (!acc[key]) {
      acc[key] = {
        product_id: sale.product_id,
        title: sale.product_title,
        sales_count: 0,
        revenue: 0
      };
    }
    acc[key].sales_count += sale.quantity;
    acc[key].revenue += sale.sale_price * sale.quantity;
    return acc;
  }, {});
  
  const topProducts = Object.values(productSales)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5);
  
  // Vendas por dia (últimos 7 dias)
  const salesByDay = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dayStr = date.toISOString().split('T')[0];
    const daySales = sales.filter(sale => sale.date.startsWith(dayStr));
    
    salesByDay.push({
      date: dayStr,
      sales_count: daySales.length,
      revenue: daySales.reduce((sum, sale) => sum + (sale.sale_price * sale.quantity), 0)
    });
  }
  
  return {
    totals: {
      sales: totalSales,
      revenue: Math.round(totalRevenue * 100) / 100,
      avg_order_value: Math.round(avgOrderValue * 100) / 100,
      products_sold: sales.reduce((sum, sale) => sum + sale.quantity, 0)
    },
    growth: {
      sales_change: Math.round((Math.random() * 40 - 20) * 100) / 100, // -20% a +20%
      revenue_change: Math.round((Math.random() * 30 - 10) * 100) / 100, // -10% a +20%
    },
    top_products: topProducts,
    sales_by_day: salesByDay,
    conversion_rate: Math.round((Math.random() * 10 + 5) * 100) / 100 // 5-15%
  };
}

function getRandomLocation() {
  const locations = [
    'São Paulo, SP', 
    'Rio de Janeiro, RJ', 
    'Belo Horizonte, MG',
    'Salvador, BA',
    'Brasília, DF',
    'Fortaleza, CE',
    'Curitiba, PR',
    'Recife, PE',
    'Porto Alegre, RS',
    'Manaus, AM'
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}