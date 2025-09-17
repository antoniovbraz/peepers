import type { Meta, StoryObj } from '@storybook/react';
import DataTable from './DataTable';
import {
  ShoppingBagIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

// Mock data types
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive';
  createdAt: string;
  orders: number;
  revenue: number;
}

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  category: string;
  status: 'active' | 'paused' | 'closed';
  sales: number;
}

// Mock data
const mockUsers: User[] = [
  {
    id: 1,
    name: 'João Silva',
    email: 'joao.silva@email.com',
    role: 'admin',
    status: 'active',
    createdAt: '2025-01-15',
    orders: 45,
    revenue: 12500.50,
  },
  {
    id: 2,
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    role: 'user',
    status: 'active',
    createdAt: '2025-02-20',
    orders: 23,
    revenue: 8750.25,
  },
  {
    id: 3,
    name: 'Carlos Oliveira',
    email: 'carlos.oliveira@email.com',
    role: 'moderator',
    status: 'inactive',
    createdAt: '2025-03-10',
    orders: 67,
    revenue: 19890.75,
  },
  {
    id: 4,
    name: 'Ana Costa',
    email: 'ana.costa@email.com',
    role: 'user',
    status: 'active',
    createdAt: '2025-04-05',
    orders: 12,
    revenue: 4320.00,
  },
  {
    id: 5,
    name: 'Pedro Lima',
    email: 'pedro.lima@email.com',
    role: 'user',
    status: 'active',
    createdAt: '2025-05-12',
    orders: 89,
    revenue: 25670.30,
  },
];

const mockProducts: Product[] = [
  {
    id: 'MLB123456789',
    title: 'iPhone 15 Pro Max 256GB Azul Titânio',
    price: 7899.99,
    stock: 15,
    category: 'Eletrônicos',
    status: 'active',
    sales: 45,
  },
  {
    id: 'MLB987654321',
    title: 'Samsung Galaxy S24 Ultra 512GB Preto',
    price: 6299.99,
    stock: 0,
    category: 'Eletrônicos',
    status: 'paused',
    sales: 32,
  },
  {
    id: 'MLB456789123',
    title: 'MacBook Air M3 256GB Prateado',
    price: 9999.99,
    stock: 8,
    category: 'Computadores',
    status: 'active',
    sales: 18,
  },
];

const meta: Meta<typeof DataTable> = {
  title: 'UI/Data Display/DataTable',
  component: DataTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Advanced data table component with sorting, filtering, pagination, and search functionality.',
      },
    },
  },
  argTypes: {
    loading: {
      control: { type: 'boolean' },
    },
    searchable: {
      control: { type: 'boolean' },
    },
    sortable: {
      control: { type: 'boolean' },
    },
    pagination: {
      control: { type: 'boolean' },
    },
    pageSize: {
      control: { type: 'number', min: 5, max: 50 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable>;

export const UsersTable: Story = {
  args: {
    data: mockUsers,
    columns: [
      {
        key: 'id',
        label: 'ID',
        sortable: true,
        width: '80px',
      },
      {
        key: 'name',
        label: 'Nome',
        sortable: true,
        render: (value, row) => (
          <div className="flex items-center space-x-3">
            <UserIcon className="h-5 w-5 text-gray-400" />
            <div>
              <div className="font-medium text-gray-900">{value}</div>
              <div className="text-gray-500 text-sm">{row.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        label: 'Função',
        sortable: true,
        render: (value) => (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value === 'admin' ? 'bg-purple-100 text-purple-800' :
            value === 'moderator' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {value === 'admin' ? 'Administrador' :
             value === 'moderator' ? 'Moderador' : 'Usuário'}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (value) => (
          <div className="flex items-center space-x-2">
            {value === 'active' ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500" />
            )}
            <span className={value === 'active' ? 'text-green-700' : 'text-red-700'}>
              {value === 'active' ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        ),
      },
      {
        key: 'orders',
        label: 'Pedidos',
        sortable: true,
        className: 'text-right',
      },
      {
        key: 'revenue',
        label: 'Receita',
        sortable: true,
        className: 'text-right',
        render: (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      {
        key: 'createdAt',
        label: 'Criado em',
        sortable: true,
        render: (value) => new Date(value).toLocaleDateString('pt-BR'),
      },
    ],
    searchable: true,
    searchPlaceholder: 'Buscar usuários...',
    searchKeys: ['name', 'email'],
    emptyMessage: 'Nenhum usuário encontrado',
    emptyIcon: <UserIcon className="h-full w-full" />,
  },
};

export const ProductsTable: Story = {
  args: {
    data: mockProducts,
    columns: [
      {
        key: 'id',
        label: 'ID',
        sortable: true,
        width: '120px',
        render: (value) => (
          <div className="font-mono text-sm text-gray-600">{value}</div>
        ),
      },
      {
        key: 'title',
        label: 'Produto',
        sortable: true,
        render: (value) => (
          <div className="max-w-xs">
            <div className="font-medium text-gray-900 truncate">{value}</div>
          </div>
        ),
      },
      {
        key: 'category',
        label: 'Categoria',
        sortable: true,
      },
      {
        key: 'price',
        label: 'Preço',
        sortable: true,
        className: 'text-right',
        render: (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
      {
        key: 'stock',
        label: 'Estoque',
        sortable: true,
        className: 'text-right',
        render: (value) => (
          <span className={value === 0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
            {value}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (value) => (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value === 'active' ? 'bg-green-100 text-green-800' :
            value === 'paused' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {value === 'active' ? 'Ativo' :
             value === 'paused' ? 'Pausado' : 'Fechado'}
          </span>
        ),
      },
      {
        key: 'sales',
        label: 'Vendas',
        sortable: true,
        className: 'text-right',
      },
    ],
    searchable: true,
    searchPlaceholder: 'Buscar produtos...',
    searchKeys: ['title', 'category', 'id'],
    emptyMessage: 'Nenhum produto encontrado',
    emptyIcon: <ShoppingBagIcon className="h-full w-full" />,
  },
};

export const Loading: Story = {
  args: {
    data: [],
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'email', label: 'Email' },
      { key: 'status', label: 'Status' },
    ],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns: [
      { key: 'name', label: 'Nome', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
    ],
    searchable: true,
    emptyMessage: 'Nenhum item encontrado',
    emptyIcon: <UserIcon className="h-full w-full" />,
  },
};

export const WithoutPagination: Story = {
  args: {
    data: mockUsers.slice(0, 3),
    columns: [
      { key: 'name', label: 'Nome', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'role', label: 'Função', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
    ],
    pagination: false,
    searchable: true,
  },
};

export const WithRowClick: Story = {
  args: {
    data: mockUsers,
    columns: [
      { key: 'name', label: 'Nome', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'role', label: 'Função', sortable: true },
    ],
    onRowClick: (row) => alert(`Clicou em: ${row.name}`),
    rowClassName: () => 'cursor-pointer hover:bg-blue-50',
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with clickable rows. Click on any row to see the action.',
      },
    },
  },
};

export const CustomPageSize: Story = {
  args: {
    data: mockUsers,
    columns: [
      { key: 'name', label: 'Nome', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'orders', label: 'Pedidos', sortable: true },
    ],
    pageSize: 3,
    searchable: true,
  },
};