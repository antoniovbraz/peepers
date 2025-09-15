/**
 * MOCKS PARA DESENVOLVIMENTO LOCAL
 *
 * Este arquivo contém dados simulados para desenvolvimento local,
 * evitando a dependência do Mercado Livre durante o desenvolvimento.
 *
 * ATENÇÃO: Nunca usar em produção!
 */

export const MOCK_PRODUCTS = [
  {
    id: 'MLB123456789',
    title: 'Produto de Teste 1 - Camiseta Básica',
    price: 29.90,
    status: 'active',
    thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_123456-MLA12345678_012023-W.webp',
    available_quantity: 50,
    condition: 'new',
    currency_id: 'BRL',
    shipping: {
      free_shipping: true
    },
    pictures: [
      {
        secure_url: 'https://http2.mlstatic.com/D_NQ_NP_123456-MLA12345678_012023-W.webp'
      }
    ]
  },
  {
    id: 'MLB987654321',
    title: 'Produto de Teste 2 - Calça Jeans',
    price: 89.90,
    status: 'active',
    thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_987654-MLA98765432_012023-W.webp',
    available_quantity: 25,
    condition: 'new',
    currency_id: 'BRL',
    shipping: {
      free_shipping: false
    },
    pictures: [
      {
        secure_url: 'https://http2.mlstatic.com/D_NQ_NP_987654-MLA98765432_012023-W.webp'
      }
    ]
  },
  {
    id: 'MLB456789123',
    title: 'Produto de Teste 3 - Tênis Esportivo',
    price: 149.90,
    status: 'active',
    thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_456789-MLA45678912_012023-W.webp',
    available_quantity: 15,
    condition: 'new',
    currency_id: 'BRL',
    shipping: {
      free_shipping: true
    },
    pictures: [
      {
        secure_url: 'https://http2.mlstatic.com/D_NQ_NP_456789-MLA45678912_012023-W.webp'
      }
    ]
  },
  {
    id: 'MLB789123456',
    title: 'Produto de Teste 4 - Relógio Digital',
    price: 199.90,
    status: 'active',
    thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_789123-MLA78912345_012023-W.webp',
    available_quantity: 8,
    condition: 'new',
    currency_id: 'BRL',
    shipping: {
      free_shipping: false
    },
    pictures: [
      {
        secure_url: 'https://http2.mlstatic.com/D_NQ_NP_789123-MLA78912345_012023-W.webp'
      }
    ]
  }
];

export const MOCK_USER = {
  id: 669073070,
  nickname: 'TEST_USER',
  email: 'test@example.com',
  first_name: 'Usuário',
  last_name: 'Teste',
  country_id: 'BR'
};

export const MOCK_AUTH_RESPONSE = {
  access_token: 'APP_USR-1234567890123456-090909-1234567890abcdef1234567890abcdef',
  token_type: 'Bearer',
  expires_in: 21600,
  scope: 'read write offline_access',
  user_id: 669073070
};