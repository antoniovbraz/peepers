/**
 * Analytics Overview Component - v2.0
 * 
 * Displays multiple charts and metrics in a grid layout
 * Includes revenue, conversion, and performance analytics
 */

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AnalyticsOverviewProps {
  className?: string;
}

// Mock data for different chart types
const conversionData = [
  { name: 'Visitas', value: 1000, fill: '#E5E7EB' },
  { name: 'Visualizações', value: 650, fill: '#FEF3C7' },
  { name: 'Interessados', value: 120, fill: '#E0C81A' },
  { name: 'Compradores', value: 45, fill: '#0D6832' },
];

const categoryPerformance = [
  { category: 'Eletrônicos', sales: 45, revenue: 32000 },
  { category: 'Casa', sales: 32, revenue: 18500 },
  { category: 'Moda', sales: 28, revenue: 15200 },
  { category: 'Esportes', sales: 22, revenue: 12800 },
  { category: 'Livros', sales: 18, revenue: 8900 },
];

const hourlyActivity = [
  { hour: '6h', orders: 2 },
  { hour: '9h', orders: 8 },
  { hour: '12h', orders: 15 },
  { hour: '15h', orders: 22 },
  { hour: '18h', orders: 18 },
  { hour: '21h', orders: 12 },
  { hour: '0h', orders: 5 },
];

const COLORS = ['#E5E7EB', '#FEF3C7', '#E0C81A', '#0D6832'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}${entry.name === 'revenue' ? ' R$' : ''}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsOverview({ className }: AnalyticsOverviewProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Conversion Funnel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Funil de Conversão
          </h3>
          <p className="text-sm text-gray-600">
            Taxa de conversão por etapa
          </p>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={conversionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {conversionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {conversionData.map((item, index) => (
            <div key={item.name} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index] }}
              />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-gray-600">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Performance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Performance por Categoria
          </h3>
          <p className="text-sm text-gray-600">
            Vendas e receita por categoria
          </p>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="category" 
                stroke="#6b7280"
                fontSize={12}
                tick={{ textAnchor: 'middle' }}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="sales" 
                fill="#0D6832" 
                radius={[4, 4, 0, 0]}
                name="Vendas"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Atividade por Horário
          </h3>
          <p className="text-sm text-gray-600">
            Pedidos ao longo do dia
          </p>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyActivity} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="hour" 
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="orders" 
                fill="#E0C81A" 
                radius={[4, 4, 0, 0]}
                name="Pedidos"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Estatísticas Rápidas
          </h3>
          <p className="text-sm text-gray-600">
            Resumo das métricas principais
          </p>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Taxa de Conversão</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '4.5%' }}></div>
              </div>
              <span className="text-sm font-medium text-gray-900">4.5%</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Ticket Médio</span>
            <span className="text-sm font-medium text-gray-900">R$ 287,50</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Taxa de Abandono</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
              <span className="text-sm font-medium text-gray-900">68%</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Tempo Médio na Página</span>
            <span className="text-sm font-medium text-gray-900">2m 34s</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Retorno de Visitantes</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '23%' }}></div>
              </div>
              <span className="text-sm font-medium text-gray-900">23%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}