import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta = {
  title: 'Design System/Primitives/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'O componente Input oferece uma interface consistente para entrada de dados, com suporte a diferentes variantes, validação e elementos auxiliares.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'error', 'success'],
      description: 'Variante visual do input',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Tamanho do input',
    },
    disabled: {
      control: 'boolean',
      description: 'Estado desabilitado do input',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Se o input deve ocupar toda a largura disponível',
    },
    label: {
      control: 'text',
      description: 'Label do input',
    },
    helperText: {
      control: 'text',
      description: 'Texto de ajuda',
    },
    errorMessage: {
      control: 'text',
      description: 'Mensagem de erro',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder do input',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// ==================== PRIMARY STORIES ====================

export const Default: Story = {
  args: {
    placeholder: 'Digite aqui...',
    label: 'Label do Input',
  },
};

export const WithHelperText: Story = {
  args: {
    placeholder: 'Digite seu email',
    label: 'Email',
    helperText: 'Nós nunca compartilharemos seu email.',
  },
};

export const WithError: Story = {
  args: {
    placeholder: 'Digite seu email',
    label: 'Email',
    errorMessage: 'Email é obrigatório',
    value: 'email-invalido',
  },
};

export const Success: Story = {
  args: {
    placeholder: 'Digite seu email',
    label: 'Email',
    variant: 'success',
    value: 'user@example.com',
  },
};

// ==================== SIZE STORIES ====================

export const Sizes: Story = {
  args: {
    placeholder: 'Input',
  },
  render: () => (
    <div className="space-y-4 w-80">
      <Input size="sm" placeholder="Small input" label="Small" />
      <Input size="md" placeholder="Medium input" label="Medium" />
      <Input size="lg" placeholder="Large input" label="Large" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes tamanhos disponíveis para o componente Input.',
      },
    },
  },
};

// ==================== STATE STORIES ====================

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Input desabilitado',
    label: 'Input Desabilitado',
    value: 'Valor não editável',
  },
};

export const Required: Story = {
  args: {
    placeholder: 'Campo obrigatório',
    label: 'Nome Completo',
    required: true,
  },
};

// ==================== WITH ICONS ====================

export const WithIcons: Story = {
  args: {
    placeholder: 'Input',
  },
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        placeholder="Buscar..."
        label="Com Ícone Esquerdo"
        leftIcon={<span>🔍</span>}
      />
      <Input
        placeholder="Digite sua senha"
        label="Com Ícone Direito"
        type="password"
        rightIcon={<span>👁️</span>}
      />
      <Input
        placeholder="Email com validação"
        label="Com Ambos os Ícones"
        leftIcon={<span>📧</span>}
        rightIcon={<span>✅</span>}
        variant="success"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Exemplos de inputs com ícones em diferentes posições.',
      },
    },
  },
};

// ==================== FORM EXAMPLES ====================

export const FormExample: Story = {
  args: {
    placeholder: 'Input',
  },
  render: () => (
    <div className="space-y-6 w-96">
      <Input
        label="Nome Completo"
        placeholder="Digite seu nome completo"
        required
      />
      <Input
        label="Email"
        type="email"
        placeholder="seu@email.com"
        leftIcon={<span>📧</span>}
        required
      />
      <Input
        label="Telefone"
        type="tel"
        placeholder="(11) 99999-9999"
        helperText="Formato: (XX) XXXXX-XXXX"
      />
      <Input
        label="CEP"
        placeholder="00000-000"
        errorMessage="CEP inválido"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Exemplo de uso em formulário completo.',
      },
    },
  },
};