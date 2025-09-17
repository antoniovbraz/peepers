/**
 * NotificationCenter Stories - v2.0
 * 
 * Storybook stories for the notification center component
 * Demonstrates different states and user interactions
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NotificationCenter } from '@/components/admin/NotificationCenter';

const meta: Meta<typeof NotificationCenter> = {
  title: 'Admin/NotificationCenter',
  component: NotificationCenter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
NotificationCenter é o componente central para gerenciamento de notificações no painel administrativo.

### Características:
- **Real-time Updates**: Mostra notificações em tempo real
- **Dropdown Interface**: Interface compacta com dropdown
- **Badge Counter**: Contador visual de notificações não lidas
- **Bulk Actions**: Ações em massa para gerenciar notificações
- **Persistent Storage**: Notificações são salvas no localStorage
- **Toast Integration**: Integração com sistema de toast
- **Action URLs**: Suporte a ações personalizadas por notificação

### Estados:
- Vazio (nenhuma notificação)
- Com notificações não lidas
- Com diferentes tipos de notificação (success, error, warning, info)
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NotificationCenter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Estado padrão do centro de notificações.',
      },
    },
  },
};

export const WithClassName: Story = {
  args: {
    className: 'bg-gray-100 p-4 rounded-lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Centro de notificações com classe CSS personalizada.',
      },
    },
  },
};

export const InHeader: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Centro de notificações como seria usado no header administrativo.',
      },
    },
  },
};