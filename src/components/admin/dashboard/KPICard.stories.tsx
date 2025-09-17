import type { Meta, StoryObj } from '@storybook/react';
import KPICard from './KPICard';
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const meta: Meta<typeof KPICard> = {
  title: 'Admin/Dashboard/KPICard',
  component: KPICard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Card component for displaying Key Performance Indicators with trends and status indicators.',
      },
    },
  },
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['success', 'warning', 'error', 'neutral'],
    },
    isLoading: {
      control: { type: 'boolean' },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof KPICard>;

export const Default: Story = {
  args: {
    title: 'Total de Produtos',
    value: 1247,
    subtitle: 'produtos ativos',
    icon: <ShoppingBagIcon className="h-full w-full" />,
  },
};

export const WithPositiveTrend: Story = {
  args: {
    title: 'Vendas do Mês',
    value: 'R$ 45.230',
    subtitle: 'receita total',
    trend: {
      value: 12.5,
      isPositive: true,
      period: 'vs mês anterior',
    },
    icon: <CurrencyDollarIcon className="h-full w-full" />,
    status: 'success',
  },
};

export const WithNegativeTrend: Story = {
  args: {
    title: 'Conversão',
    value: '2.4%',
    subtitle: 'taxa de conversão',
    trend: {
      value: 5.2,
      isPositive: false,
      period: 'vs semana anterior',
    },
    icon: <ChartBarIcon className="h-full w-full" />,
    status: 'warning',
  },
};

export const ErrorStatus: Story = {
  args: {
    title: 'Produtos Pausados',
    value: 23,
    subtitle: 'requerem atenção',
    icon: <ShoppingBagIcon className="h-full w-full" />,
    status: 'error',
  },
};

export const Loading: Story = {
  args: {
    title: 'Carregando...',
    value: 0,
    isLoading: true,
  },
};

export const Large: Story = {
  args: {
    title: 'Visitantes Únicos',
    value: 124567,
    subtitle: 'últimos 30 dias',
    trend: {
      value: 8.7,
      isPositive: true,
      period: 'vs período anterior',
    },
    icon: <UserGroupIcon className="h-full w-full" />,
    status: 'success',
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        title="Total de Produtos"
        value={1247}
        subtitle="produtos ativos"
        icon={<ShoppingBagIcon className="h-full w-full" />}
        status="neutral"
      />
      <KPICard
        title="Vendas do Mês"
        value="R$ 45.230"
        subtitle="receita total"
        trend={{
          value: 12.5,
          isPositive: true,
          period: 'vs mês anterior',
        }}
        icon={<CurrencyDollarIcon className="h-full w-full" />}
        status="success"
      />
      <KPICard
        title="Conversão"
        value="2.4%"
        subtitle="taxa de conversão"
        trend={{
          value: 5.2,
          isPositive: false,
          period: 'vs semana anterior',
        }}
        icon={<ChartBarIcon className="h-full w-full" />}
        status="warning"
      />
      <KPICard
        title="Visitantes"
        value={12456}
        subtitle="últimos 7 dias"
        trend={{
          value: 8.7,
          isPositive: true,
          period: 'vs semana anterior',
        }}
        icon={<UserGroupIcon className="h-full w-full" />}
        status="success"
      />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Example of KPI cards arranged in a responsive grid layout.',
      },
    },
  },
};