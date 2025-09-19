'use client';

import { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import KPICard from '@/components/admin/dashboard/KPICard';
import DataTable from '@/components/ui/data-display/DataTable';

// Types
interface Message {
  id: string;
  type: 'question' | 'complaint' | 'post_sale' | 'contact';
  subject: string;
  content: string;
  buyer: {
    id: number;
    name: string;
    email: string;
  };
  product?: {
    id: string;
    title: string;
  };
  status: 'pending' | 'answered' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  answered_at?: string;
  response?: string;
}

// Mock data
const mockMessages: Message[] = [
  {
    id: 'MSG-001',
    type: 'question',
    subject: 'Disponibilidade de cores',
    content: 'Olá, gostaria de saber se vocês têm o iPhone 15 Pro Max na cor azul titânio disponível?',
    buyer: {
      id: 123456,
      name: 'João Silva',
      email: 'joao.silva@email.com',
    },
    product: {
      id: 'MLB123456789',
      title: 'iPhone 15 Pro Max 256GB',
    },
    status: 'pending',
    priority: 'medium',
    created_at: '2025-09-17T10:30:00Z',
  },
  {
    id: 'MSG-002',
    type: 'complaint',
    subject: 'Produto com defeito',
    content: 'Recebi o produto com um arranhão na tela. Gostaria de solicitar a troca.',
    buyer: {
      id: 987654,
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
    },
    product: {
      id: 'MLB987654321',
      title: 'Samsung Galaxy S24 Ultra',
    },
    status: 'pending',
    priority: 'high',
    created_at: '2025-09-17T08:15:00Z',
  },
  {
    id: 'MSG-003',
    type: 'post_sale',
    subject: 'Como usar o produto',
    content: 'Comprei o MacBook mas estou com dificuldades para configurar. Podem me ajudar?',
    buyer: {
      id: 456789,
      name: 'Carlos Oliveira',
      email: 'carlos.oliveira@email.com',
    },
    product: {
      id: 'MLB456789123',
      title: 'MacBook Air M3 256GB',
    },
    status: 'answered',
    priority: 'low',
    created_at: '2025-09-16T15:45:00Z',
    answered_at: '2025-09-16T16:30:00Z',
    response: 'Olá Carlos! Fico feliz em ajudar. Vou enviar um manual de configuração por email.',
  },
  {
    id: 'MSG-004',
    type: 'contact',
    subject: 'Informações sobre garantia',
    content: 'Gostaria de saber mais detalhes sobre a garantia do produto.',
    buyer: {
      id: 789123,
      name: 'Ana Costa',
      email: 'ana.costa@email.com',
    },
    status: 'answered',
    priority: 'low',
    created_at: '2025-09-16T12:00:00Z',
    answered_at: '2025-09-16T13:15:00Z',
    response: 'A garantia é de 12 meses contra defeitos de fabricação.',
  },
];

// Helper functions
const getTypeIcon = (type: Message['type']) => {
  switch (type) {
    case 'question':
      return QuestionMarkCircleIcon;
    case 'complaint':
      return ExclamationTriangleIcon;
    case 'post_sale':
      return ChatBubbleLeftRightIcon;
    case 'contact':
      return PhoneIcon;
    default:
      return ChatBubbleLeftRightIcon;
  }
};

const getTypeLabel = (type: Message['type']) => {
  switch (type) {
    case 'question':
      return 'Pergunta';
    case 'complaint':
      return 'Reclamação';
    case 'post_sale':
      return 'Pós-Venda';
    case 'contact':
      return 'Contato';
    default:
      return 'Mensagem';
  }
};

const getStatusColor = (status: Message['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'answered':
      return 'bg-green-100 text-green-800';
    case 'closed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: Message['status']) => {
  switch (status) {
    case 'pending':
      return 'Pendente';
    case 'answered':
      return 'Respondida';
    case 'closed':
      return 'Fechada';
    default:
      return 'Desconhecido';
  }
};

const getPriorityColor = (priority: Message['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-blue-100 text-blue-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityLabel = (priority: Message['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'Urgente';
    case 'high':
      return 'Alta';
    case 'medium':
      return 'Média';
    case 'low':
      return 'Baixa';
    default:
      return 'Normal';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ComunicacaoPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [responseText, setResponseText] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);

  // Load messages from API
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      // Buscar mensagens reais da API do Mercado Livre
      const response = await fetch('/api/admin/messages', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para enviar cookies de autenticação
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.messages) {
          setMessages(data.data.messages);
          setIsRealData(true);
          console.log('✅ Mensagens reais do ML carregadas!');
          return;
        }
      }

      // Fallback: usar dados mockados se a API falhar
      console.warn('API de mensagens não disponível, usando dados mockados');
      setMessages(mockMessages);
      setIsRealData(false);
      
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setMessages(mockMessages);
      setIsRealData(false);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const metrics = {
    total: messages.length,
    pending: messages.filter(m => m.status === 'pending').length,
    answered: messages.filter(m => m.status === 'answered').length,
    avgResponseTime: 2.5, // hours (mock)
  };

  // Filter messages
  const filteredMessages = messages.filter(message => {
    if (filterType !== 'all' && message.type !== filterType) return false;
    if (filterStatus !== 'all' && message.status !== filterStatus) return false;
    return true;
  });

  // Table columns
  const columns = [
    {
      key: 'type',
      label: 'Tipo',
      sortable: true,
      render: (value: Message['type'], _row: Message) => {
        const Icon = getTypeIcon(value);
        return (
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-gray-400" />
            <span>{getTypeLabel(value)}</span>
          </div>
        );
      },
    },
    {
      key: 'subject',
      label: 'Assunto',
      sortable: true,
      render: (value: string, row: Message) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          {row.product && (
            <div className="text-sm text-gray-500">{row.product.title}</div>
          )}
        </div>
      ),
    },
    {
      key: 'buyer',
      label: 'Comprador',
      sortable: true,
      render: (value: Message['buyer']) => (
        <div>
          <div className="font-medium text-gray-900">{value.name}</div>
          <div className="text-sm text-gray-500">{value.email}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: Message['status']) => (
        <span className={clsx(
          'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
          getStatusColor(value)
        )}>
          {getStatusLabel(value)}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Prioridade',
      sortable: true,
      render: (value: Message['priority']) => (
        <span className={clsx(
          'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
          getPriorityColor(value)
        )}>
          {getPriorityLabel(value)}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Data',
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (_value: void, row: Message) => (
        <button
          onClick={() => setSelectedMessage(row)}
          className="text-green-600 hover:text-green-900 text-sm font-medium"
        >
          {row.status === 'pending' ? 'Responder' : 'Ver Detalhes'}
        </button>
      ),
    },
  ];

  const handleResponse = () => {
    if (!selectedMessage || !responseText.trim()) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setMessages(prev => 
        prev.map(m => 
          m.id === selectedMessage.id 
            ? { 
                ...m, 
                status: 'answered' as const,
                answered_at: new Date().toISOString(),
                response: responseText 
              }
            : m
        )
      );
      setSelectedMessage(null);
      setResponseText('');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Central de Comunicação</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie perguntas, reclamações e comunicação pós-venda
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={loadMessages}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
            {loading ? 'Sincronizando...' : 'Sincronizar Mensagens'}
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            Marcar Todas como Lidas
          </button>
        </div>
      </div>

      {/* Data Source Indicator */}
      {!loading && (
        <div className={clsx(
          'rounded-md p-3 text-sm',
          isRealData 
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
        )}>
          <div className="flex items-center">
            {isRealData ? (
              <CheckCircleIcon className="h-4 w-4 mr-2" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            )}
            <span className="font-medium">
              {isRealData 
                ? '✅ Mensagens reais do Mercado Livre'
                : '⚠️ Dados de demonstração - faça login para ver mensagens reais'
              }
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total de Mensagens"
          value={metrics.total}
          subtitle="todas as conversas"
          icon={<ChatBubbleLeftRightIcon className="h-full w-full" />}
          status="neutral"
        />
        
        <KPICard
          title="Pendentes"
          value={metrics.pending}
          subtitle="aguardando resposta"
          icon={<ClockIcon className="h-full w-full" />}
          status={metrics.pending > 0 ? 'warning' : 'success'}
        />
        
        <KPICard
          title="Respondidas"
          value={metrics.answered}
          subtitle="mensagens atendidas"
          trend={{
            value: 15.2,
            isPositive: true,
            period: 'vs semana anterior',
          }}
          icon={<CheckCircleIcon className="h-full w-full" />}
          status="success"
        />
        
        <KPICard
          title="Tempo Médio Resposta"
          value={`${metrics.avgResponseTime}h`}
          subtitle="últimos 30 dias"
          trend={{
            value: 0.8,
            isPositive: false,
            period: 'vs mês anterior',
          }}
          icon={<ClockIcon className="h-full w-full" />}
          status="success"
        />
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="type-filter" className="text-sm font-medium text-gray-700">
                Tipo:
              </label>
              <select
                id="type-filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="ml-2 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="all">Todos</option>
                <option value="question">Perguntas</option>
                <option value="complaint">Reclamações</option>
                <option value="post_sale">Pós-Venda</option>
                <option value="contact">Contatos</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
                Status:
              </label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="ml-2 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="answered">Respondidas</option>
                <option value="closed">Fechadas</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <DataTable
        data={filteredMessages}
        columns={columns}
        searchable={true}
        searchPlaceholder="Buscar por assunto, comprador..."
        searchKeys={['subject']}
        emptyMessage="Nenhuma mensagem encontrada"
        emptyIcon={<ChatBubbleLeftRightIcon className="h-full w-full" />}
        onRowClick={(message) => setSelectedMessage(message)}
        rowClassName={(message) => 
          message.status === 'pending' ? 'bg-yellow-50' : ''
        }
      />

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {(() => {
                      const Icon = getTypeIcon(selectedMessage.type);
                      return <Icon className="h-6 w-6 text-gray-400" />;
                    })()}
                  </div>
                  <div className="ml-3 w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {selectedMessage.subject}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <strong>De:</strong> {selectedMessage.buyer.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Email:</strong> {selectedMessage.buyer.email}
                      </p>
                      {selectedMessage.product && (
                        <p className="text-sm text-gray-600">
                          <strong>Produto:</strong> {selectedMessage.product.title}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        <strong>Data:</strong> {formatDate(selectedMessage.created_at)}
                      </p>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900">Mensagem:</h4>
                      <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {selectedMessage.content}
                      </p>
                    </div>

                    {selectedMessage.response && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900">Resposta:</h4>
                        <p className="mt-2 text-sm text-gray-700 bg-green-50 p-3 rounded">
                          {selectedMessage.response}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Respondido em: {selectedMessage.answered_at && formatDate(selectedMessage.answered_at)}
                        </p>
                      </div>
                    )}

                    {selectedMessage.status === 'pending' && (
                      <div className="mt-4">
                        <label htmlFor="response" className="block text-sm font-medium text-gray-700">
                          Sua resposta:
                        </label>
                        <textarea
                          id="response"
                          rows={4}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          placeholder="Digite sua resposta..."
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedMessage.status === 'pending' && (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    onClick={handleResponse}
                    disabled={!responseText.trim() || loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar Resposta'}
                  </button>
                )}
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedMessage(null)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}