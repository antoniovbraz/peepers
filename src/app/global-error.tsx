'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/primitives/Button';
import { Container } from '@/components/ui/layout/Container';
import { VStack } from '@/components/ui/layout/Stack';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Captura o erro no Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <Container className="min-h-screen flex items-center justify-center">
          <VStack className="max-w-md text-center space-y-6">
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Algo deu errado!
              </h1>
              <p className="text-gray-600">
                Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
              </p>
              {error.digest && (
                <p className="text-xs text-gray-400 font-mono">
                  ID do Erro: {error.digest}
                </p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={reset}
                variant="primary"
              >
                Tentar Novamente
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                Voltar ao Início
              </Button>
            </div>
          </VStack>
        </Container>
      </body>
    </html>
  );
}