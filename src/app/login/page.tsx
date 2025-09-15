import Link from 'next/link';
import { PAGES, API_ENDPOINTS } from '@/config/routes';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Acesso ao Painel
          </h2>
          <p className="text-gray-600 mb-8">
            Faça login com sua conta do Mercado Livre para acessar o painel administrativo
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Autenticação Necessária
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Para acessar o painel administrativo, você precisa se conectar com sua conta do Mercado Livre.
                Isso nos permite sincronizar seus produtos e gerenciar sua loja de forma segura.
              </p>
            </div>

            <div className="space-y-4">
              <a
                href={API_ENDPOINTS.AUTH_ML}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-3 shadow-md"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>Continuar com Mercado Livre</span>
              </a>

              <div className="text-center">
                <Link
                  href={PAGES.HOME}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ← Voltar para a página inicial
                </Link>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="text-xs text-gray-500 text-center space-y-2">
                <p>
                  <strong>Por que preciso me conectar?</strong>
                </p>
                <ul className="text-left space-y-1">
                  <li>• Sincronizar produtos automaticamente</li>
                  <li>• Gerenciar pedidos e estoque</li>
                  <li>• Acessar relatórios de vendas</li>
                  <li>• Manter dados sempre atualizados</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Seus dados estão seguros e criptografados.
            Não armazenamos suas credenciais do Mercado Livre.
          </p>
        </div>
      </div>
    </div>
  );
}