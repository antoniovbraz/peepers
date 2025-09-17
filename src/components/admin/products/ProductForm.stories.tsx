import type { Meta, StoryObj } from '@storybook/react';
import ProductForm from './ProductForm';
import { ProductFormData } from '@/types/product-validation';

const meta: Meta<typeof ProductForm> = {
  title: 'Admin/Products/ProductForm',
  component: ProductForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Complete form for creating and editing products with validation, image upload, and ML integration.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isEditing: {
      control: 'boolean',
      description: 'Whether the form is in edit mode',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state for form submission',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockSubmit = async (data: ProductFormData) => {
  console.log('Form submitted:', data);
  await new Promise(resolve => setTimeout(resolve, 2000));
};

export const CreateMode: Story = {
  args: {
    onSubmit: mockSubmit,
    isEditing: false,
    isLoading: false,
  },
};

export const EditMode: Story = {
  args: {
    initialData: {
      title: 'iPhone 15 Pro Max 256GB Azul Titânio',
      description: 'iPhone 15 Pro Max com 256GB de armazenamento na cor azul titânio. Inclui carregador e fones de ouvido originais. Produto lacrado com garantia do fabricante.',
      category_id: 'MLB1051',
      price: '7899.99',
      available_quantity: '5',
      condition: 'new',
      listing_type_id: 'gold_special',
      pictures: [
        {
          id: '1',
          url: 'https://http2.mlstatic.com/D_Q_NP_123456_MLA.jpg',
        },
      ],
      free_shipping: true,
      dimensions: {
        width: '15.1',
        height: '0.8',
        length: '7.7',
        weight: '0.221',
      },
      warranty: '12 meses de garantia do fabricante',
      video_id: '',
    },
    onSubmit: mockSubmit,
    isEditing: true,
    isLoading: false,
  },
};

export const LoadingState: Story = {
  args: {
    onSubmit: mockSubmit,
    isEditing: false,
    isLoading: true,
  },
};

export const WithValidationErrors: Story = {
  args: {
    onSubmit: async (data: ProductFormData) => {
      throw new Error('Erro de validação: Título muito curto');
    },
    isEditing: false,
    isLoading: false,
  },
};

export const MinimalData: Story = {
  args: {
    initialData: {
      title: 'Produto de Teste',
      description: 'Esta é uma descrição mínima para testar o formulário com dados básicos.',
      category_id: 'MLB1002',
      price: '99.99',
      available_quantity: '1',
      condition: 'new',
      listing_type_id: 'gold',
      pictures: [],
      free_shipping: false,
    },
    onSubmit: mockSubmit,
    isEditing: true,
    isLoading: false,
  },
};

export const FullyPopulated: Story = {
  args: {
    initialData: {
      title: 'Samsung Galaxy S24 Ultra 512GB Preto com S Pen',
      description: `Samsung Galaxy S24 Ultra com 512GB de armazenamento interno na cor preta. Inclui S Pen integrada e todos os acessórios originais.

Características principais:
• Tela Dynamic AMOLED 2X de 6.8 polegadas
• Processador Snapdragon 8 Gen 3
• 12GB de RAM
• 512GB de armazenamento interno
• Câmera principal de 200MP
• S Pen integrada
• Bateria de 5000mAh
• Resistente à água IP68

Conteúdo da embalagem:
• Smartphone Samsung Galaxy S24 Ultra
• S Pen
• Cabo USB-C
• Ferramenta para remoção do chip
• Manual do usuário
• Garantia de 12 meses`,
      category_id: 'MLB1051',
      price: '6299.99',
      available_quantity: '3',
      condition: 'new',
      listing_type_id: 'gold_special',
      pictures: [
        {
          id: '1',
          url: 'https://http2.mlstatic.com/D_Q_NP_987654_MLA.jpg',
        },
        {
          id: '2',
          url: 'https://http2.mlstatic.com/D_Q_NP_987655_MLA.jpg',
        },
      ],
      free_shipping: true,
      dimensions: {
        width: '16.2',
        height: '0.9',
        length: '7.9',
        weight: '0.233',
      },
      warranty: '12 meses de garantia do fabricante Samsung',
      video_id: 'dQw4w9WgXcQ',
    },
    onSubmit: mockSubmit,
    isEditing: true,
    isLoading: false,
  },
};