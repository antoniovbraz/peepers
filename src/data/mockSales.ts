/**
 * Mock Sales Data - v2.0
 * 
 * Comprehensive mock data for sales management testing
 * Simulates realistic Mercado Livre order scenarios
 */

import type { 
  Order, 
  OrderStatus, 
  PaymentStatus, 
  ShippingStatus,
  SalesMetrics 
} from '@/types/sales';

// Helper function to generate random dates
const getRandomDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
};

// Helper function to generate realistic Brazilian data
const brazilianNames = [
  { first: 'João', last: 'Silva' },
  { first: 'Maria', last: 'Santos' },
  { first: 'Carlos', last: 'Oliveira' },
  { first: 'Ana', last: 'Costa' },
  { first: 'Pedro', last: 'Ferreira' },
  { first: 'Juliana', last: 'Almeida' },
  { first: 'Ricardo', last: 'Pereira' },
  { first: 'Fernanda', last: 'Lima' },
  { first: 'Rafael', last: 'Rodrigues' },
  { first: 'Camila', last: 'Barbosa' },
];

const brazilianCities = [
  { city: 'São Paulo', state: 'SP', zip: '01310-100' },
  { city: 'Rio de Janeiro', state: 'RJ', zip: '20040-020' },
  { city: 'Belo Horizonte', state: 'MG', zip: '30112-000' },
  { city: 'Porto Alegre', state: 'RS', zip: '90010-150' },
  { city: 'Salvador', state: 'BA', zip: '40070-110' },
  { city: 'Brasília', state: 'DF', zip: '70040-010' },
  { city: 'Fortaleza', state: 'CE', zip: '60160-230' },
  { city: 'Recife', state: 'PE', zip: '50030-230' },
  { city: 'Curitiba', state: 'PR', zip: '80020-300' },
  { city: 'Manaus', state: 'AM', zip: '69010-040' },
];

const mockProducts = [
  {
    id: 'MLB3456789012',
    title: 'iPhone 15 Pro Max 256GB Titânio Natural',
    price: 7899.99,
    thumbnail: 'https://http2.mlstatic.com/D_Q_NP_2X_123456-MLA.webp',
    categoryId: 'MLB1051'
  },
  {
    id: 'MLB2345678901',
    title: 'Samsung Galaxy S24 Ultra 512GB Preto',
    price: 6299.99,
    thumbnail: 'https://http2.mlstatic.com/D_Q_NP_2X_234567-MLA.webp',
    categoryId: 'MLB1051'
  },
  {
    id: 'MLB3456789013',
    title: 'Apple MacBook Air M2 8GB 256GB',
    price: 8999.99,
    thumbnail: 'https://http2.mlstatic.com/D_Q_NP_2X_345678-MLA.webp',
    categoryId: 'MLB1430'
  },
  {
    id: 'MLB4567890123',
    title: 'Sony WH-1000XM5 Headphone Bluetooth',
    price: 1899.99,
    thumbnail: 'https://http2.mlstatic.com/D_Q_NP_2X_456789-MLA.webp',
    categoryId: 'MLB1002'
  },
  {
    id: 'MLB5678901234',
    title: 'Apple Watch Series 9 GPS 45mm',
    price: 2799.99,
    thumbnail: 'https://http2.mlstatic.com/D_Q_NP_2X_567890-MLA.webp',
    categoryId: 'MLB1002'
  },
];

// Generate realistic mock orders
export const generateMockOrder = (
  orderId: number,
  status?: OrderStatus,
  daysAgo = 30
): Order => {
  const buyer = brazilianNames[Math.floor(Math.random() * brazilianNames.length)];
  const location = brazilianCities[Math.floor(Math.random() * brazilianCities.length)];
  const product = mockProducts[Math.floor(Math.random() * mockProducts.length)];
  const quantity = Math.floor(Math.random() * 3) + 1;
  const createdDate = getRandomDate(daysAgo);
  const lastUpdatedDate = new Date(createdDate);
  lastUpdatedDate.setHours(lastUpdatedDate.getHours() + Math.floor(Math.random() * 72));

  const orderStatus: OrderStatus = status || (['confirmed', 'paid', 'shipped', 'delivered', 'cancelled'] as OrderStatus[])[Math.floor(Math.random() * 5)];
  
  const paymentStatus: PaymentStatus = orderStatus === 'cancelled' ? 'cancelled' :
                                     orderStatus === 'confirmed' ? 'pending' :
                                     orderStatus === 'payment_required' ? 'pending' :
                                     'approved';

  const shippingStatus: ShippingStatus = orderStatus === 'cancelled' ? 'cancelled' :
                                       orderStatus === 'delivered' ? 'delivered' :
                                       orderStatus === 'shipped' ? 'shipped' :
                                       orderStatus === 'paid' ? 'handling' :
                                       'pending';

  return {
    id: orderId,
    status: orderStatus,
    statusDetail: `Status: ${orderStatus}`,
    dateCreated: createdDate,
    dateLastUpdated: lastUpdatedDate.toISOString(),
    dateClosed: orderStatus === 'delivered' || orderStatus === 'cancelled' ? 
                lastUpdatedDate.toISOString() : undefined,
    orderItems: [{
      id: product.id,
      title: product.title,
      categoryId: product.categoryId,
      quantity,
      unitPrice: product.price,
      totalPrice: product.price * quantity,
      currencyId: 'BRL',
      thumbnail: product.thumbnail,
      permalink: `https://mercadolivre.com.br/p/${product.id}`,
    }],
    totalAmount: product.price * quantity,
    currencyId: 'BRL',
    buyer: {
      id: 123456000 + orderId,
      nickname: `${buyer.first.toLowerCase()}${buyer.last.toLowerCase()}${Math.floor(Math.random() * 100)}`,
      email: `${buyer.first.toLowerCase()}.${buyer.last.toLowerCase()}@email.com`,
      firstName: buyer.first,
      lastName: buyer.last,
      phone: {
        areaCode: '11',
        number: `9${Math.floor(Math.random() * 90000000) + 10000000}`,
      },
      identificationType: 'CPF',
      identificationNumber: `${Math.floor(Math.random() * 900000000) + 100000000}-${Math.floor(Math.random() * 90) + 10}`,
    },
    seller: {
      id: 987654321,
      nickname: 'PEEPERS_OFICIAL',
    },
    payments: [{
      id: 5000000000 + orderId,
      paymentMethodId: ['credit_card', 'debit_card', 'bank_transfer', 'mercadopago'][Math.floor(Math.random() * 4)],
      paymentTypeId: 'credit_card',
      status: paymentStatus,
      statusDetail: `Payment ${paymentStatus}`,
      currencyId: 'BRL',
      totalPaidAmount: orderStatus !== 'cancelled' ? product.price * quantity : 0,
      taxesAmount: 0,
      shippingCost: 29.99,
      overpaidAmount: 0,
      transactionAmount: product.price * quantity,
      installments: Math.floor(Math.random() * 12) + 1,
      dateCreated: createdDate,
      dateLastModified: lastUpdatedDate.toISOString(),
      dateApproved: paymentStatus === 'approved' ? lastUpdatedDate.toISOString() : undefined,
      orderValue: product.price * quantity,
      paidAmount: paymentStatus === 'approved' ? product.price * quantity : 0,
    }],
    shipping: {
      id: 4000000000 + orderId,
      shipmentType: 'shipping',
      status: shippingStatus,
      substatus: shippingStatus === 'shipped' ? 'in_transit' : undefined,
      dateCreated: createdDate,
      lastUpdated: lastUpdatedDate.toISOString(),
      trackingNumber: shippingStatus === 'shipped' || shippingStatus === 'delivered' ? 
                     `BR${Math.floor(Math.random() * 900000000) + 100000000}BR` : undefined,
      trackingMethod: 'drop_off',
      estimatedDeliveryTime: shippingStatus === 'shipped' ? {
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        timeFrom: '08:00',
        timeTo: '18:00',
      } : undefined,
      receiverAddress: {
        streetName: `Rua ${['das Flores', 'dos Pinheiros', 'Augusta', 'Paulista', 'do Comércio'][Math.floor(Math.random() * 5)]}`,
        streetNumber: `${Math.floor(Math.random() * 9000) + 1000}`,
        complement: Math.random() > 0.5 ? `Apto ${Math.floor(Math.random() * 100) + 1}` : undefined,
        zipCode: location.zip,
        city: location.city,
        state: location.state,
        country: 'BR',
        neighborhood: 'Centro',
        contactName: `${buyer.first} ${buyer.last}`,
        contactPhone: '11987654321',
      },
      cost: 29.99,
      mode: 'me2',
      logisticType: 'drop_off',
      shippingOption: {
        id: 182,
        name: 'Mercado Envios Express',
        cost: 29.99,
        estimatedDeliveryTime: '2-4 dias úteis',
      },
    },
    feedback: Math.random() > 0.7 ? {
      sale: {
        id: 6000000000 + orderId,
        rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
        message: ['Excelente produto!', 'Muito bom, recomendo!', 'Entrega rápida', 'Produto conforme descrição'][Math.floor(Math.random() * 4)],
        fulfilled: true,
        dateCreated: new Date(lastUpdatedDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      },
    } : undefined,
    context: {
      channel: 'marketplace',
      site: 'MLB',
      flows: ['CART'],
    },
    tags: orderStatus === 'delivered' ? ['delivered'] : 
          orderStatus === 'cancelled' ? ['cancelled'] : 
          ['processing'],
  };
};

// Generate multiple mock orders
export const mockOrders: Order[] = Array.from({ length: 50 }, (_, index) => 
  generateMockOrder(2000000000 + index + 1, undefined, 90)
);

// Mock sales metrics
export const mockSalesMetrics: SalesMetrics = {
  totalOrders: mockOrders.length,
  totalRevenue: mockOrders.reduce((sum, order) => 
    order.status !== 'cancelled' ? sum + order.totalAmount : sum, 0
  ),
  averageOrderValue: mockOrders.length > 0 ? 
    mockOrders.reduce((sum, order) => sum + order.totalAmount, 0) / mockOrders.length : 0,
  conversionRate: 0.034, // 3.4%
  pendingOrders: mockOrders.filter(o => o.status === 'confirmed' || o.status === 'payment_required').length,
  shippedOrders: mockOrders.filter(o => o.status === 'shipped').length,
  deliveredOrders: mockOrders.filter(o => o.status === 'delivered').length,
  cancelledOrders: mockOrders.filter(o => o.status === 'cancelled').length,
  revenueGrowth: 0.23, // 23% growth
  orderGrowth: 0.18, // 18% growth
  topSellingProducts: [
    {
      productId: 'MLB3456789012',
      title: 'iPhone 15 Pro Max 256GB',
      quantity: 8,
      revenue: 63199.92,
    },
    {
      productId: 'MLB2345678901',
      title: 'Samsung Galaxy S24 Ultra',
      quantity: 6,
      revenue: 37799.94,
    },
    {
      productId: 'MLB3456789013',
      title: 'MacBook Air M2',
      quantity: 4,
      revenue: 35999.96,
    },
    {
      productId: 'MLB4567890123',
      title: 'Sony WH-1000XM5',
      quantity: 12,
      revenue: 22799.88,
    },
    {
      productId: 'MLB5678901234',
      title: 'Apple Watch Series 9',
      quantity: 7,
      revenue: 19599.93,
    },
  ],
  salesByPeriod: Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    const ordersThisDay = Math.floor(Math.random() * 5) + 1;
    const revenue = ordersThisDay * (Math.random() * 5000 + 1000);
    
    return {
      date: date.toISOString().split('T')[0],
      orders: ordersThisDay,
      revenue: Math.round(revenue * 100) / 100,
    };
  }),
  paymentMethodDistribution: [
    { method: 'Cartão de Crédito', count: 28, percentage: 56 },
    { method: 'PIX', count: 12, percentage: 24 },
    { method: 'Mercado Pago', count: 7, percentage: 14 },
    { method: 'Boleto', count: 3, percentage: 6 },
  ],
  shippingMethodDistribution: [
    { method: 'Mercado Envios Express', count: 35, percentage: 70 },
    { method: 'Mercado Envios Full', count: 10, percentage: 20 },
    { method: 'Retirada', count: 3, percentage: 6 },
    { method: 'Outros', count: 2, percentage: 4 },
  ],
};

// Mock functions for API simulation
export const getMockOrders = (
  limit = 20,
  offset = 0,
  filters?: {
    status?: OrderStatus[];
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }
): { orders: Order[]; total: number; hasMore: boolean } => {
  let filteredOrders = [...mockOrders];

  // Apply filters
  if (filters?.status?.length) {
    filteredOrders = filteredOrders.filter(order => 
      filters.status!.includes(order.status)
    );
  }

  if (filters?.dateFrom) {
    filteredOrders = filteredOrders.filter(order => 
      new Date(order.dateCreated) >= new Date(filters.dateFrom!)
    );
  }

  if (filters?.dateTo) {
    filteredOrders = filteredOrders.filter(order => 
      new Date(order.dateCreated) <= new Date(filters.dateTo!)
    );
  }

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    filteredOrders = filteredOrders.filter(order => 
      order.buyer.firstName.toLowerCase().includes(search) ||
      order.buyer.lastName.toLowerCase().includes(search) ||
      order.buyer.email.toLowerCase().includes(search) ||
      order.orderItems.some(item => 
        item.title.toLowerCase().includes(search)
      )
    );
  }

  // Sort by date (newest first)
  filteredOrders.sort((a, b) => 
    new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
  );

  const total = filteredOrders.length;
  const paginatedOrders = filteredOrders.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  return {
    orders: paginatedOrders,
    total,
    hasMore,
  };
};

export const getMockOrder = (orderId: number): Order | null => {
  return mockOrders.find(order => order.id === orderId) || null;
};

export const getMockSalesMetrics = (): SalesMetrics => {
  return mockSalesMetrics;
};