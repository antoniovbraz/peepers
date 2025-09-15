import Link from 'next/link';
import { PAGES } from '@/config/routes';

export default function AcessoNegadoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 mb-8">
            Esta aplicação está configurada para uso exclusivo de uma conta específica do Mercado Livre.
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sistema Personalizado
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Você está autenticado com o Mercado Livre, mas esta instância da aplicação
                está configurada exclusivamente para outra conta vendedora.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    Interessado em ter seu próprio site?
                  </h4>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Este sistema pode ser personalizado para qualquer vendedor do Mercado Livre.
                      Tenha seu próprio site integrado com sua loja automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <a
                href="https://wa.me/5511999999999?text=Olá!%20Tenho%20interesse%20em%20adquirir%20um%20sistema%20personalizado%20para%20minha%20loja%20do%20Mercado%20Livre"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-3 shadow-md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span>Falar com Especialista</span>
              </a>

              <div className="text-center">
                <Link
                  href={PAGES.PRODUTOS}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Ver produtos disponíveis
                </Link>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="text-xs text-gray-500 text-center space-y-2">
                <p>
                  <strong>Por que apenas uma conta?</strong>
                </p>
                <ul className="text-left space-y-1">
                  <li>• Sistema personalizado por vendedor</li>
                  <li>• Configurações específicas da loja</li>
                  <li>• Segurança e isolamento de dados</li>
                  <li>• Suporte técnico dedicado</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Sistema desenvolvido exclusivamente para integração com Mercado Livre
          </p>
        </div>
      </div>
    </div>
  );
}