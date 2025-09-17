import type { Meta, StoryObj } from '@storybook/react';
import SalesChart from './SalesChart';

const meta: Meta<typeof SalesChart> = {
  title: 'Admin/Dashboard/SalesChart',
  component: SalesChart,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Interactive sales performance chart with time-based data visualization. Supports multiple time periods and responsive design.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    period: {
      control: 'select',
      options: ['7d', '30d', '90d', '1y'],
      description: 'Time period for data visualization',
    },
    height: {
      control: 'number',
      description: 'Chart height in pixels',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = [
  { date: '2025-09-11', revenue: 4200, orders: 12, visits: 520 },
  { date: '2025-09-12', revenue: 5800, orders: 18, visits: 680 },
  { date: '2025-09-13', revenue: 3200, orders: 9, visits: 420 },
  { date: '2025-09-14', revenue: 7100, orders: 22, visits: 890 },
  { date: '2025-09-15', revenue: 6500, orders: 19, visits: 750 },
  { date: '2025-09-16', revenue: 8200, orders: 25, visits: 1020 },
  { date: '2025-09-17', revenue: 9100, orders: 28, visits: 1150 },
];

export const Default: Story = {
  args: {
    data: mockData,
    period: '7d',
    height: 300,
  },
};

export const MonthlyView: Story = {
  args: {
    ...Default.args,
    period: '30d',
  },
};

export const QuarterlyView: Story = {
  args: {
    ...Default.args,
    period: '90d',
  },
};

export const YearlyView: Story = {
  args: {
    ...Default.args,
    period: '1y',
  },
};

export const TallChart: Story = {
  args: {
    ...Default.args,
    height: 450,
  },
};

export const CompactChart: Story = {
  args: {
    ...Default.args,
    height: 200,
  },
};

const highVolumeData = [
  { date: '2025-09-11', revenue: 15200, orders: 45, visits: 2320 },
  { date: '2025-09-12', revenue: 18800, orders: 52, visits: 2680 },
  { date: '2025-09-13', revenue: 12200, orders: 35, visits: 1920 },
  { date: '2025-09-14', revenue: 21100, orders: 68, visits: 3190 },
  { date: '2025-09-15', revenue: 19500, orders: 58, visits: 2850 },
  { date: '2025-09-16', revenue: 24200, orders: 72, visits: 3520 },
  { date: '2025-09-17', revenue: 27100, orders: 83, visits: 3850 },
];

export const HighVolume: Story = {
  args: {
    data: highVolumeData,
    period: '7d',
    height: 300,
  },
};

export const EmptyData: Story = {
  args: {
    data: [],
    period: '7d',
    height: 300,
  },
};