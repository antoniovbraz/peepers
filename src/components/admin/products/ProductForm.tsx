/**
 * Product Form Component - v2.0
 * 
 * Complete form for creating and editing products
 * Supports validation, image upload, and ML integration
 */

'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { 
  ProductFormSchema, 
  ProductFormData, 
  getDefaultProductForm 
} from '@/types/product-validation';
import { useNotificationActions } from '@/contexts/NotificationContext';

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isEditing?: boolean;
  isLoading?: boolean;
}

// Mock categories for now
const mockCategories = [
  { id: 'MLB1051', name: 'Celulares e Telefones' },
  { id: 'MLB1002', name: 'Eletrônicos' },
  { id: 'MLB1430', name: 'Informática' },
  { id: 'MLB1276', name: 'Esportes e Fitness' },
  { id: 'MLB1039', name: 'Câmeras e Acessórios' },
];

export default function ProductForm({ 
  initialData, 
  onSubmit, 
  isEditing = false,
  isLoading = false 
}: ProductFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { notifySuccess, notifyError } = useNotificationActions();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      ...getDefaultProductForm(),
      ...initialData,
    },
  });

  const watchedPictures = watch('pictures') || [];

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(false);
      
      await onSubmit(data);
      
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      
      // Show success notification
      notifySuccess(
        `Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso!`,
        `Produto ${isEditing ? 'Atualizado' : 'Criado'}`
      );
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setSubmitError(errorMessage);
      
      // Show error notification
      notifyError(
        `Erro ao ${isEditing ? 'atualizar' : 'criar'} produto: ${errorMessage}`,
        `Erro no Produto`
      );
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPictures = Array.from(files).map((file, index) => ({
      file,
      url: URL.createObjectURL(file),
      id: `temp-${Date.now()}-${index}`,
    }));

    const currentPictures = watchedPictures;
    const totalPictures = [...currentPictures, ...newPictures];

    if (totalPictures.length > 12) {
      setSubmitError('Máximo 12 imagens permitidas');
      return;
    }

    setValue('pictures', totalPictures);
  };

  const removeImage = (index: number) => {
    const currentPictures = [...watchedPictures];
    
    // Revoke object URL to prevent memory leaks
    if (currentPictures[index].url?.startsWith('blob:')) {
      URL.revokeObjectURL(currentPictures[index].url!);
    }
    
    currentPictures.splice(index, 1);
    setValue('pictures', currentPictures);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar Produto' : 'Criar Novo Produto'}
        </h1>
        <p className="text-gray-600 mt-2">
          Preencha os dados abaixo para {isEditing ? 'atualizar' : 'criar'} seu produto no Mercado Livre
        </p>
      </div>

      {/* Success/Error Messages */}
      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <p className="text-sm text-red-700 mt-1">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {submitSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Sucesso</h3>
              <p className="text-sm text-green-700 mt-1">
                Produto {isEditing ? 'atualizado' : 'criado'} com sucesso!
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Informações Básicas
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Produto *
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ex: iPhone 15 Pro Max 256GB Azul Titânio"
                maxLength={60}
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                {...register('category_id')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Selecione uma categoria</option>
                {mockCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-sm text-red-600 mt-1">{errors.category_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condição *
              </label>
              <select
                {...register('condition')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="new">Novo</option>
                <option value="used">Usado</option>
                <option value="not_specified">Não especificado</option>
              </select>
              {errors.condition && (
                <p className="text-sm text-red-600 mt-1">{errors.condition.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço (R$) *
              </label>
              <input
                {...register('price')}
                type="number"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0,00"
              />
              {errors.price && (
                <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade Disponível *
              </label>
              <input
                {...register('available_quantity')}
                type="number"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="1"
              />
              {errors.available_quantity && (
                <p className="text-sm text-red-600 mt-1">{errors.available_quantity.message}</p>
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                {...register('description')}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Descreva detalhadamente seu produto..."
                maxLength={50000}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Imagens do Produto
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Adicione até 12 imagens do seu produto. A primeira será a imagem principal.
              </p>
              <label className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                <PlusIcon className="h-4 w-4" />
                <span>Adicionar Imagens</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {watchedPictures.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {watchedPictures.map((picture, index) => (
                  <div key={picture.id || index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={picture.url}
                        alt={`Produto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        Principal
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {watchedPictures.length === 0 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma imagem adicionada</p>
                <p className="text-sm text-gray-500">Clique em "Adicionar Imagens" para começar</p>
              </div>
            )}

            {errors.pictures && (
              <p className="text-sm text-red-600">{errors.pictures.message}</p>
            )}
          </div>
        </div>

        {/* Shipping */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Configurações de Envio
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <Controller
                name="free_shipping"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                )}
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Frete grátis
              </label>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Largura (cm)
                </label>
                <input
                  {...register('dimensions.width')}
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Altura (cm)
                </label>
                <input
                  {...register('dimensions.height')}
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comprimento (cm)
                </label>
                <input
                  {...register('dimensions.length')}
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso (kg)
                </label>
                <input
                  {...register('dimensions.weight')}
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Informações Adicionais
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Garantia
              </label>
              <input
                {...register('warranty')}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ex: 12 meses de garantia do fabricante"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID do Vídeo (YouTube)
              </label>
              <input
                {...register('video_id')}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Ex: dQw4w9WgXcQ"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              isSubmitting || isLoading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isSubmitting || isLoading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Processando...</span>
              </span>
            ) : (
              `${isEditing ? 'Atualizar' : 'Criar'} Produto`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}