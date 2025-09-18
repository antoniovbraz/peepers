import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/cache';
import { CACHE_KEYS, API_ENDPOINTS } from '@/config/routes';
import { getMockOrders, getMockSalesMetrics } from '@/data/mockSales';

interface MLOrder {
  id: number;
  status: string;
  date_created: string;
  date_closed?: string;
  total_amount: number;
  currency_id: string;
  buyer: {
    id: number;
    nickname?: string;
  };
  order_items: Array<{
    item: {
      id: string;
      title: string;
    };
    quantity: number;
    unit_price: number;
  }>;
  payments: Array<{
    status: string;
    payment_method_id: string;
    date_approved?: string;
  }>;
  shipping?: {
    id: number;
  };
}

async function fetchMLOrders(accessToken: string, params: URLSearchParams): Promise<any> {
  const mlApiUrl = `https://api.mercadolibre.com/orders/search?${params.toString()}`;
  
  const response = await fetch(mlApiUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`ML API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function transformMLOrderToOrder(mlOrder: MLOrder): any {
  return {
    id: mlOrder.id.toString(),
    date: mlOrder.date_created,
    status: mlOrder.status === 'paid' ? 'completed' : 'pending',
    buyer_name: mlOrder.buyer.nickname || `Usuário ${mlOrder.buyer.id}`,
    product_title: mlOrder.order_items[0]?.item.title || 'Produto',
    quantity: mlOrder.order_items[0]?.quantity || 1,
    sale_price: mlOrder.order_items[0]?.unit_price || 0,
    total: mlOrder.total_amount,
    currency: mlOrder.currency_id,
    payment_method: mlOrder.payments[0]?.payment_method_id || 'unknown',
    shipping: mlOrder.shipping ? { cost: 0 } : null,
    product_id: mlOrder.order_items[0]?.item.id || '',
  };
}

/**
 * API de vendas integrada com Mercado Livre
 * Tenta usar dados reais do ML, com fallback inteligente para simulação
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const search = searchParams.get('search') || '';
    const days = parseInt(searchParams.get('days') || '30');
    
    // Tentar obter token de acesso do cache
    const kv = getKVClient();
    let accessToken: string | null = null;
    
    try {
      // Verificar token de usuário admin no cache
      const userTokens = await kv.get(CACHE_KEYS.USER_TOKEN('admin'));
      if (userTokens && typeof userTokens === 'object' && 'access_token' in userTokens) {
        accessToken = userTokens.access_token as string;
      }
    } catch (error) {
      console.warn('Erro ao buscar token do cache:', error);
    }

    // TENTATIVA 1: Dados reais do Mercado Livre
    if (accessToken) {
      try {
        console.log('🔄 Buscando vendas reais do Mercado Livre...');
        
        // Configurar parâmetros para buscar orders
        const mlParams = new URLSearchParams({
          seller: 'me',
          limit,
          sort: 'date_desc',
        });

        if (search) {
          mlParams.append('q', search);
        }

        const mlResponse = await fetchMLOrders(accessToken, mlParams);
        
        if (mlResponse.results && Array.isArray(mlResponse.results)) {
          const transformedOrders = mlResponse.results.map(transformMLOrderToOrder);
          
          // Calcular métricas das vendas reais
          const totalRevenue = transformedOrders
            .filter((order: any) => order.status === 'completed')
            .reduce((sum: number, order: any) => sum + order.total, 0);
          
          const analytics = {
            totals: {
              sales: transformedOrders.length,
              revenue: totalRevenue,
              avg_order_value: transformedOrders.length > 0 ? totalRevenue / transformedOrders.length : 0,
              products_sold: transformedOrders.reduce((sum: number, order: any) => sum + order.quantity, 0),
            },
            top_products: calculateTopProducts(transformedOrders),
            sales_by_day: calculateSalesByDay(transformedOrders),
            conversion_rate: 12.5, // Valor padrão, pode ser calculado com mais dados
          };

          console.log('✅ Vendas reais do ML carregadas com sucesso!');

          return NextResponse.json({
            success: true,
            data: {
              sales: transformedOrders,
              analytics,
              period: {
                days,
                start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
                end: new Date().toISOString()
              }
            },
            meta: {
              source: 'mercado_livre_real',
              total: mlResponse.paging?.total || transformedOrders.length,
              timestamp: new Date().toISOString(),
              message: 'Dados reais do Mercado Livre'
            }
          });
        }
      } catch (mlError) {
        console.error('❌ Erro ao buscar dados do ML:', mlError);
        // Continuar para fallback
      }
    }

    // TENTATIVA 2: Simulação baseada em produtos reais
    console.log('🔄 Gerando vendas simuladas baseadas em produtos reais...');
    
    const productsResponse = await fetch(`${request.nextUrl.origin}${API_ENDPOINTS.PRODUCTS_V1}?format=summary&limit=50`);
    
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      const products = productsData.data?.products || [];
      
      if (products.length > 0) {
        // Simular vendas baseadas nos produtos reais
        const sales = generateRealisticSales(products, days);
        const analytics = calculateAnalytics(sales, products, days);
        
        console.log('✅ Vendas simuladas baseadas em produtos reais!');
        
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
            timestamp: new Date().toISOString(),
            message: accessToken 
              ? 'Erro no ML - usando simulação baseada em produtos reais'
              : 'Faça login para ver dados reais - usando simulação baseada em produtos reais'
          }
        });
      }
    }

    // TENTATIVA 3: Fallback para dados mockados
    console.log('⚠️ Usando dados mockados como último fallback');
    
    const mockData = getMockOrders(parseInt(limit), 0, { search });
    const mockMetrics = getMockSalesMetrics();
    
    return NextResponse.json({
      success: true,
      data: {
        sales: mockData.orders,
        analytics: {
          totals: {
            sales: mockMetrics.totalOrders,
            revenue: mockMetrics.totalRevenue,
            avg_order_value: mockMetrics.averageOrderValue,
            products_sold: mockData.orders.reduce((sum: number, order: any) => sum + order.quantity, 0),
          },
          top_products: [],
          sales_by_day: [],
          conversion_rate: 8.5,
        },
        period: {
          days,
          start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      },
      meta: {
        source: 'mock_fallback',
        timestamp: new Date().toISOString(),
        message: 'Dados de demonstração - faça login com Mercado Livre para ver dados reais'
      }
    });

  } catch (error) {
    console.error('❌ Erro crítico na API de vendas:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

function calculateTopProducts(orders: any[]) {
  const productSales = orders.reduce((acc, order) => {
    const key = order.product_id;
    if (!acc[key]) {
      acc[key] = {
        product_id: order.product_id,
        title: order.product_title,
        sales_count: 0,
        revenue: 0
      };
    }
    acc[key].sales_count += order.quantity;
    acc[key].revenue += order.total;
    return acc;
  }, {});
  
  return Object.values(productSales)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 5);
}

function calculateSalesByDay(orders: any[]) {
  const salesByDay = [];
  
  // Agrupar vendas por dia (últimos 7 dias)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dayStr = date.toISOString().split('T')[0];
    const daySales = orders.filter(order => order.date.startsWith(dayStr));
    
    salesByDay.push({
      date: dayStr,
      sales_count: daySales.length,
      revenue: daySales.reduce((sum, order) => sum + order.total, 0)
    });
  }
  
  return salesByDay;
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