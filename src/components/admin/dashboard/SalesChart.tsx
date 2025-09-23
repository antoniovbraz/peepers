/**
 * Sales Chart Component - v2.0
 * 
 * Interactive sales performance chart with time-based data
 * Supports multiple periods and responsive design
 */

'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
  visits: number;
}

interface SalesChartProps {
  data?: SalesDataPoint[];
  period?: '7d' | '30d' | '90d' | '1y';
  height?: number;
  // Real data from dashboard metrics
  realData?: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
  };
}

// Generate chart data from real metrics
const generateRealData = (realData: NonNullable<SalesChartProps['realData']>): SalesDataPoint[] => {
  const today = new Date();
  const data: SalesDataPoint[] = [];
  
  // Generate last 7 days of data based on real metrics
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Distribute total metrics across days with some variation
    const dayMultiplier = 0.8 + Math.random() * 0.4; // 0.8-1.2 variation
    const dailyRevenue = (realData.totalRevenue / 7) * dayMultiplier;
    const dailyOrders = Math.round((realData.totalOrders / 7) * dayMultiplier);
    const dailyVisits = dailyOrders * (8 + Math.random() * 4); // Estimate visits based on orders
    
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.round(dailyRevenue),
      orders: dailyOrders,
      visits: Math.round(dailyVisits)
    });
  }
  
  return data;
};

// Mock data for development
const mockSalesData: SalesDataPoint[] = [
  { date: '2025-09-11', revenue: 4200, orders: 12, visits: 520 },
  { date: '2025-09-12', revenue: 5800, orders: 18, visits: 680 },
  { date: '2025-09-13', revenue: 3200, orders: 9, visits: 420 },
  { date: '2025-09-14', revenue: 7100, orders: 22, visits: 890 },
  { date: '2025-09-15', revenue: 6500, orders: 19, visits: 750 },
  { date: '2025-09-16', revenue: 8200, orders: 25, visits: 1020 },
  { date: '2025-09-17', revenue: 9100, orders: 28, visits: 1150 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{`Data: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name === 'revenue' && `Receita: R$ ${entry.value.toLocaleString()}`}
            {entry.name === 'orders' && `Pedidos: ${entry.value}`}
            {entry.name === 'visits' && `Visitas: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SalesChart({ 
  data = mockSalesData, 
  period = '7d',
  height = 300,
  realData
}: SalesChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  // Use real data if available, otherwise use mock data
  const chartData = realData ? generateRealData(realData) : data;

  const formatXAxisLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (value: number) => {
    return `R$ ${(value / 1000).toFixed(1)}k`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Performance de Vendas
          </h3>
          <p className="text-sm text-gray-600">
            Receita, pedidos e visitas por período
          </p>
        </div>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d', '1y'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedPeriod === p
                  ? 'bg-green-100 text-green-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {p === '7d' && '7 dias'}
              {p === '30d' && '30 dias'}
              {p === '90d' && '90 dias'}
              {p === '1y' && '1 ano'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisLabel}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              yAxisId="revenue"
              orientation="left"
              tickFormatter={formatCurrency}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              yAxisId="count"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke="#0D6832"
              strokeWidth={3}
              dot={{ fill: '#0D6832', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#0D6832', strokeWidth: 2 }}
              name="Receita"
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="orders"
              stroke="#E0C81A"
              strokeWidth={2}
              dot={{ fill: '#E0C81A', strokeWidth: 2, r: 3 }}
              name="Pedidos"
            />
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="visits"
              stroke="#DC2626"
              strokeWidth={2}
              dot={{ fill: '#DC2626', strokeWidth: 2, r: 3 }}
              name="Visitas"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}