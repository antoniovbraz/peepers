'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import PeepersLogo from '@/components/PeepersLogo';

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Entre em Contato
            </h1>
            <p className="text-lg sm:text-xl max-w-3xl mx-auto opacity-90">
              Estamos aqui para ajudar! Entre em contato conosco para dúvidas, sugestões ou suporte.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Envie sua Mensagem</h2>

              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Sobrenome *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Seu sobrenome"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Assunto *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione um assunto</option>
                    <option value="duvida">Dúvida sobre produto</option>
                    <option value="suporte">Suporte técnico</option>
                    <option value="sugestao">Sugestão</option>
                    <option value="parceria">Parceria/Revenda</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    placeholder="Digite sua mensagem aqui..."
                  />
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="privacy"
                    name="privacy"
                    required
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="privacy" className="ml-2 text-sm text-gray-600">
                    Concordo com a{' '}
                    <Link href="/privacidade" className="text-blue-600 hover:underline">
                      Política de Privacidade
                    </Link>{' '}
                    e aceito receber comunicações sobre produtos e ofertas.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  Enviar Mensagem
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              {/* Contact Details */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Informações de Contato</h2>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">Email</h3>
                      <p className="text-gray-600">contato@peepers.com.br</p>
                      <p className="text-sm text-gray-500 mt-1">Respondemos em até 24 horas</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">Horário de Atendimento</h3>
                      <p className="text-gray-600">Segunda a Sexta: 9h às 18h</p>
                      <p className="text-gray-600">Sábado: 9h às 12h</p>
                      <p className="text-sm text-gray-500 mt-1">Fora do horário comercial, deixe sua mensagem</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900">Suporte</h3>
                      <p className="text-gray-600">Para dúvidas urgentes sobre pedidos</p>
                      <p className="text-gray-600">WhatsApp: (11) 9999-9999</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Preview */}
              <div className="bg-blue-50 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Perguntas Frequentes</h2>
                <div className="space-y-3">
                  <details className="group">
                    <summary className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 flex items-center">
                      <span className="mr-2">Como faço uma compra?</span>
                      <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="mt-2 text-gray-600 pl-6">
                      Navegue pelos produtos, clique em "Ver Produto" e será redirecionado para nossa loja oficial no Mercado Livre.
                    </p>
                  </details>

                  <details className="group">
                    <summary className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 flex items-center">
                      <span className="mr-2">Quais são as formas de pagamento?</span>
                      <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="mt-2 text-gray-600 pl-6">
                      Aceitamos todas as formas disponíveis no Mercado Livre: cartão de crédito, boleto, PIX e outros.
                    </p>
                  </details>

                  <details className="group">
                    <summary className="cursor-pointer text-gray-700 font-medium hover:text-blue-600 flex items-center">
                      <span className="mr-2">Como funciona o frete?</span>
                      <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="mt-2 text-gray-600 pl-6">
                      O frete é calculado automaticamente no Mercado Livre baseado no seu CEP e peso do produto.
                    </p>
                  </details>
                </div>

                <div className="mt-6">
                  <Link
                    href="/ajuda"
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    Ver todas as perguntas frequentes →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <PeepersLogo variant="full" size="md" className="mb-4" />
              <p className="text-gray-300 mb-4">
                Produtos cuidadosamente selecionados, vendidos com a segurança e confiança do Mercado Livre.
              </p>
              <p className="text-sm text-gray-400">
                © 2025 Peepers. Todos os direitos reservados.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Links Úteis</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
                <li><Link href="/produtos" className="text-gray-300 hover:text-white transition-colors">Produtos</Link></li>
                <li><Link href="#como-funciona" className="text-gray-300 hover:text-white transition-colors">Como Funciona</Link></li>
                <li><Link href="/contato" className="text-gray-300 hover:text-white transition-colors">Contato</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2">
                <li><Link href="/ajuda" className="text-gray-300 hover:text-white transition-colors">Central de Ajuda</Link></li>
                <li><Link href="/termos" className="text-gray-300 hover:text-white transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="text-gray-300 hover:text-white transition-colors">Privacidade</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}