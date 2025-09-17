import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Design System/Primitives/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'O componente Button é um elemento fundamental do design system, oferecendo diferentes variantes, tamanhos e estados para diversas situações de uso.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'success'],
      description: 'Variante visual do botão',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', 'icon'],
      description: 'Tamanho do botão',
    },
    disabled: {
      control: 'boolean',
      description: 'Estado desabilitado do botão',
    },
    loading: {
      control: 'boolean',
      description: 'Estado de carregamento do botão',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Se o botão deve ocupar toda a largura disponível',
    },
    children: {
      control: 'text',
      description: 'Conteúdo do botão',
    },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ==================== PRIMARY STORIES ====================

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Botão Primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Botão Secondary',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Botão Outline',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Botão Ghost',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Botão Destructive',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Botão Success',
  },
};

// ==================== SIZE STORIES ====================

export const Sizes: Story = {
  args: {
    children: 'Button',
  },
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes tamanhos disponíveis para o componente Button.',
      },
    },
  },
};

export const IconButton: Story = {
  args: {
    size: 'icon',
    children: '🔍',
  },
  parameters: {
    docs: {
      description: {
        story: 'Botão específico para ícones com proporções quadradas.',
      },
    },
  },
};

// ==================== STATE STORIES ====================

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Carregando...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Estado de carregamento com spinner animado.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Botão Desabilitado',
  },
  parameters: {
    docs: {
      description: {
        story: 'Estado desabilitado com aparência visual reduzida.',
      },
    },
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Botão Full Width',
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Botão que ocupa toda a largura do container.',
      },
    },
  },
};

// ==================== VARIANT SHOWCASE ====================

export const AllVariants: Story = {
  args: {
    children: 'Button',
  },
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-md">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="success">Success</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Showcase de todas as variantes disponíveis do componente Button.',
      },
    },
  },
};

// ==================== INTERACTIVE EXAMPLES ====================

export const WithIcons: Story = {
  args: {
    children: 'Button',
  },
  render: () => (
    <div className="flex items-center gap-4">
      <Button>
        <span className="mr-2">📄</span>
        Com Ícone Esquerdo
      </Button>
      <Button variant="outline">
        Com Ícone Direito
        <span className="ml-2">➡️</span>
      </Button>
      <Button variant="ghost">
        <span className="mr-2">❤️</span>
        Ambos os Lados
        <span className="ml-2">🎉</span>
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Exemplos de botões com ícones em diferentes posições.',
      },
    },
  },
};