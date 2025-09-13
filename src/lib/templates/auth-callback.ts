import { html } from '@/lib/html';
import { API_ENDPOINTS, PAGES } from '@/config/routes';

export function renderAuthCallback(options: {
  success: boolean;
  message: string;
  details?: string;
}) {
  const { success, message, details } = options;

  return html`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Peepers - Autenticação Mercado Livre</title>
        <style>
          :root {
            --color-success: #2da44e;
            --color-error: #cf222e;
            --color-text: #1f2328;
            --color-bg: #ffffff;
            --color-border: #d0d7de;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
            line-height: 1.5;
            color: var(--color-text);
            background: var(--color-bg);
            margin: 0;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }

          .container {
            max-width: 600px;
            margin: 40px auto;
            padding: 24px;
            text-align: center;
          }

          .icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .success { color: var(--color-success); }
          .error { color: var(--color-error); }

          .message {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 16px;
          }

          .details {
            color: #57606a;
            margin-bottom: 24px;
          }

          .button {
            display: inline-block;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            text-align: center;
            white-space: nowrap;
            vertical-align: middle;
            cursor: pointer;
            user-select: none;
            border: 1px solid;
            border-radius: 6px;
            appearance: none;
            text-decoration: none;
            transition: background-color 0.2s cubic-bezier(0.3, 0, 0.5, 1);
          }

          .button-primary {
            color: #ffffff;
            background-color: var(--color-success);
            border-color: rgba(27, 31, 36, 0.15);
          }

          .button-primary:hover {
            background-color: #2c974b;
          }

          .button-secondary {
            color: var(--color-text);
            background-color: var(--color-bg);
            border-color: var(--color-border);
          }

          .button-secondary:hover {
            background-color: #f3f4f6;
          }

          .button + .button {
            margin-left: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon ${success ? 'success' : 'error'}">
            ${success ? '✓' : '✕'}
          </div>
          
          <h1 class="message">
            ${message}
          </h1>
          
          ${details ? `<p class="details">${details}</p>` : ''}
          
          <div>
            <a href="/" class="button button-primary">
              Voltar para a página inicial
            </a>
            
            ${success ? `
              <a href="${PAGES.PRODUTOS}" class="button button-secondary">
                Ver meus produtos
              </a>
            ` : `
              <a href="${API_ENDPOINTS.AUTH_ML}" class="button button-secondary">
                Tentar novamente
              </a>
            `}
          </div>
        </div>
      </body>
    </html>
  `;
}