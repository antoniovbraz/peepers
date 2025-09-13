import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Este endpoint está funcionando!',
    timestamp: new Date().toISOString(),
    status: 'success',
    deployment: 'working',
    environment: process.env.NODE_ENV || 'unknown',
    analysis: {
      problem: 'Vercel Deployment Protection está bloqueando acesso aos endpoints',
      solution: 'Desabilitar Deployment Protection nas configurações do projeto',
      confirmation: 'Se você conseguir ver esta mensagem, o problema NÃO é no código'
    }
  });
}