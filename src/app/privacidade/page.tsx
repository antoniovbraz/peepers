import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Peepers',
  description: 'Política de Privacidade e Proteção de Dados do Peepers conforme LGPD',
  robots: 'index, follow',
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Política de Privacidade e Proteção de Dados
          </h1>
          
          <div className="prose prose-lg max-w-none">
            {/* Última atualização */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
              <p className="text-sm text-blue-700">
                <strong>Última atualização:</strong> 17 de setembro de 2025
              </p>
            </div>

            {/* 1. Controlador de Dados */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Controlador de Dados
              </h2>
              <p className="text-gray-700 mb-4">
                O <strong>Peepers</strong> é um painel administrativo para vendedores do Mercado Livre, 
                desenvolvido como ferramenta de gestão e análise de produtos. Esta aplicação atua como 
                <strong> controlador de dados</strong> conforme definido pela Lei Geral de Proteção de 
                Dados (LGPD - Lei 13.709/2018).
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Responsável:</strong> Desenvolvedor do Peepers<br/>
                  <strong>Contato:</strong> antonio.vinicius.braz@gmail.com<br/>
                  <strong>Finalidade:</strong> Integração e gestão de produtos do Mercado Livre
                </p>
              </div>
            </section>

            {/* 2. Base Legal */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Base Legal para Tratamento de Dados
              </h2>
              <p className="text-gray-700 mb-4">
                O tratamento de dados pessoais pelo Peepers baseia-se nas seguintes hipóteses legais 
                previstas no Art. 7° da LGPD:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>Consentimento (Art. 7°, I):</strong> Para cookies não essenciais e análises 
                  de uso da aplicação
                </li>
                <li>
                  <strong>Execução de contrato (Art. 7°, V):</strong> Para autenticação OAuth com 
                  Mercado Livre e gestão de produtos
                </li>
                <li>
                  <strong>Interesse legítimo (Art. 7°, IX):</strong> Para logs de segurança, 
                  prevenção de fraudes e melhoria da aplicação
                </li>
                <li>
                  <strong>Exercício de direitos (Art. 7°, VI):</strong> Para cumprimento de 
                  obrigações legais e regulamentares
                </li>
              </ul>
            </section>

            {/* 3. Dados Coletados */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Dados Pessoais Coletados
              </h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                3.1 Dados de Autenticação (Mercado Livre)
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
                <li>ID do usuário no Mercado Livre</li>
                <li>Nome completo</li>
                <li>Email cadastrado</li>
                <li>Nickname/apelido</li>
                <li>País de origem</li>
                <li>Tipo de usuário</li>
                <li>Status da conta</li>
                <li>Dados da empresa (se aplicável)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">
                3.2 Dados de Navegação e Uso
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
                <li>Endereço IP (parcialmente mascarado para privacidade)</li>
                <li>Logs de acesso e ações realizadas</li>
                <li>Timestamps de sessões</li>
                <li>Informações de dispositivo e navegador</li>
                <li>Cookies de sessão e preferências</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">
                3.3 Dados Técnicos
              </h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Tokens de acesso OAuth (temporários)</li>
                <li>Sessões de autenticação</li>
                <li>Cache de produtos e categorias</li>
                <li>Logs estruturados para monitoramento</li>
              </ul>
            </section>

            {/* 4. Finalidades */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Finalidades do Tratamento
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Finalidades Primárias</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Autenticação e autorização de usuários</li>
                    <li>• Sincronização de produtos do Mercado Livre</li>
                    <li>• Exibição de informações de vendas</li>
                    <li>• Gestão de sessões e segurança</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Finalidades Secundárias</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Análise de performance da aplicação</li>
                    <li>• Prevenção de fraudes e ataques</li>
                    <li>• Melhoria da experiência do usuário</li>
                    <li>• Suporte técnico e resolução de problemas</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. Compartilhamento */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Compartilhamento de Dados
              </h2>
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <p className="text-red-700">
                  <strong>Importante:</strong> O Peepers NÃO compartilha, vende ou transfere 
                  dados pessoais para terceiros para fins comerciais.
                </p>
              </div>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                5.1 Compartilhamento Necessário
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <strong>Mercado Livre:</strong> Como parte da integração OAuth, dados são 
                  sincronizados conforme autorização do usuário
                </li>
                <li>
                  <strong>Upstash (Redis):</strong> Para armazenamento temporário de cache 
                  e sessões (dados criptografados)
                </li>
                <li>
                  <strong>Vercel:</strong> Para hospedagem da aplicação e logs de infraestrutura
                </li>
                <li>
                  <strong>Sentry:</strong> Para monitoramento de erros (dados anonimizados)
                </li>
              </ul>
            </section>

            {/* 6. Retenção */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Tempo de Retenção
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                        Tipo de Dado
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                        Tempo de Retenção
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                        Justificativa
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Tokens de Acesso</td>
                      <td className="border border-gray-300 px-4 py-2">24 horas</td>
                      <td className="border border-gray-300 px-4 py-2">Segurança da sessão</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">Dados de Usuário</td>
                      <td className="border border-gray-300 px-4 py-2">2 horas (cache)</td>
                      <td className="border border-gray-300 px-4 py-2">Performance da aplicação</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Cache de Produtos</td>
                      <td className="border border-gray-300 px-4 py-2">6 horas</td>
                      <td className="border border-gray-300 px-4 py-2">Sincronização eficiente</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">Logs de Acesso</td>
                      <td className="border border-gray-300 px-4 py-2">30 dias</td>
                      <td className="border border-gray-300 px-4 py-2">Auditoria e segurança</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Logs de Erro</td>
                      <td className="border border-gray-300 px-4 py-2">90 dias</td>
                      <td className="border border-gray-300 px-4 py-2">Resolução de problemas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 7. Segurança */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Medidas de Segurança
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Segurança Técnica</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Criptografia TLS 1.3 (HTTPS obrigatório)</li>
                    <li>OAuth 2.0 + PKCE para autenticação</li>
                    <li>Cookies HttpOnly e SameSite</li>
                    <li>Rate limiting por IP</li>
                    <li>Validação CSRF com state parameter</li>
                    <li>Mascaramento de IPs nos logs</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Segurança Organizacional</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Acesso restrito por lista de usuários autorizados</li>
                    <li>Logs estruturados para auditoria</li>
                    <li>Monitoramento contínuo de erros</li>
                    <li>Atualizações regulares de segurança</li>
                    <li>Backup automático de configurações</li>
                    <li>Política de senhas e tokens</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 8. Direitos do Titular */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Seus Direitos (Art. 18 da LGPD)
              </h2>
              <p className="text-gray-700 mb-4">
                Como titular dos dados, você possui os seguintes direitos garantidos pela LGPD:
              </p>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">🔍 Confirmação e Acesso</h3>
                  <p className="text-blue-700 text-sm">
                    Confirmar se seus dados estão sendo tratados e acessar seus dados pessoais.
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">✏️ Correção</h3>
                  <p className="text-green-700 text-sm">
                    Solicitar correção de dados incompletos, inexatos ou desatualizados.
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">🗑️ Eliminação</h3>
                  <p className="text-yellow-700 text-sm">
                    Solicitar eliminação de dados desnecessários ou tratados sem base legal.
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">📱 Portabilidade</h3>
                  <p className="text-purple-700 text-sm">
                    Solicitar portabilidade dos dados para outro fornecedor.
                  </p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">🚫 Oposição</h3>
                  <p className="text-red-700 text-sm">
                    Opor-se ao tratamento realizado com base em interesse legítimo.
                  </p>
                </div>
              </div>
            </section>

            {/* 9. Como Exercer Direitos */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Como Exercer seus Direitos
              </h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  Para exercer qualquer dos seus direitos previstos na LGPD, entre em contato conosco:
                </p>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <strong>📧 Email:</strong> antonio.vinicius.braz@gmail.com
                  </p>
                  <p className="text-gray-700">
                    <strong>📋 Assunto:</strong> [LGPD] Exercício de Direito - [Tipo do Direito]
                  </p>
                  <p className="text-gray-700">
                    <strong>⏰ Prazo de Resposta:</strong> Até 15 dias úteis conforme Art. 19 da LGPD
                  </p>
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded border-l-4 border-blue-400">
                  <p className="text-blue-700 text-sm">
                    <strong>Importante:</strong> Para sua segurança, solicitações devem partir do 
                    mesmo email utilizado na autenticação do Mercado Livre.
                  </p>
                </div>
              </div>
            </section>

            {/* 10. Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Política de Cookies
              </h2>
              <p className="text-gray-700 mb-4">
                O Peepers utiliza cookies para garantir o funcionamento adequado da aplicação e 
                melhorar sua experiência:
              </p>
              
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">🔒 Cookies Essenciais</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    Necessários para o funcionamento básico da aplicação. Não podem ser desabilitados.
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 text-sm">
                    <li><code>session_token</code> - Autenticação de sessão (24h)</li>
                    <li><code>user_id</code> - Identificação do usuário (24h)</li>
                  </ul>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">⚙️ Cookies Funcionais</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    Melhoram a funcionalidade e personalização. Podem ser controlados pelo usuário.
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 text-sm">
                    <li><code>cookie_consent</code> - Preferências de cookies (1 ano)</li>
                    <li><code>ui_preferences</code> - Configurações de interface (30 dias)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 11. Alterações */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Alterações nesta Política
              </h2>
              <p className="text-gray-700 mb-4">
                Esta Política de Privacidade pode ser atualizada periodicamente para refletir 
                mudanças em nossas práticas ou requisitos legais. Alterações significativas 
                serão comunicadas através de:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Notificação na aplicação com 30 dias de antecedência</li>
                <li>Email para usuários ativos (quando aplicável)</li>
                <li>Atualização da data de "Última atualização" no topo desta página</li>
              </ul>
            </section>

            {/* 12. ANPD */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Autoridade Nacional de Proteção de Dados (ANPD)
              </h2>
              <p className="text-gray-700 mb-4">
                Em caso de não resolução de questões relacionadas aos seus dados pessoais, 
                você pode contatar a ANPD:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>🌐 Site:</strong> https://www.gov.br/anpd<br/>
                  <strong>📧 Email:</strong> canal_cidadao@anpd.gov.br<br/>
                  <strong>📱 Telefone:</strong> 0800 880 0099
                </p>
              </div>
            </section>

            {/* Rodapé */}
            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-500 text-center">
                Esta Política de Privacidade está em conformidade com a Lei Geral de Proteção de Dados 
                (LGPD - Lei 13.709/2018) e foi elaborada com base nas melhores práticas de proteção de dados.
              </p>
              <p className="text-sm text-gray-500 text-center mt-2">
                <strong>Última atualização:</strong> 17 de setembro de 2025 | 
                <strong> Versão:</strong> 1.0 | 
                <strong> Documento:</strong> LGPD-POL-001
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}