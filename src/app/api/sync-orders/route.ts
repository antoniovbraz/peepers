/**
 * API Route: /api/sync-orders
 *
 * Sincroniza pedidos do Mercado Livre e atualiza o cache
 * Endpoint para sincronização manual de pedidos
 */

import { NextRequest, NextResponse } from 'next/server';
import { mlOrderDataService } from '@/lib/ml-order-data-service';

export async function POST(_request: NextRequest) {
  try {
    console.log('🔄 Iniciando sincronização de pedidos...');

    // Verificar se é uma requisição autenticada (opcional por enquanto)
    // TODO: Adicionar autenticação quando necessário

    // Executar sincronização
    const result = await mlOrderDataService.syncOrders();

    if (result.errors.length > 0) {
      console.warn('⚠️ Sincronização de pedidos concluída com erros:', result.errors);
    } else {
      console.log(`✅ Sincronização de pedidos concluída: ${result.synced} pedidos sincronizados`);
    }

    return NextResponse.json({
      success: true,
      data: {
        synced: result.synced,
        errors: result.errors
      },
      message: `Sincronização concluída: ${result.synced} pedidos sincronizados${result.errors.length > 0 ? ` (${result.errors.length} erros)` : ''}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na sincronização de pedidos:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('🔍 Verificando status de sincronização de pedidos...');

    // Verificar se precisa de sincronização
    const needsSync = await mlOrderDataService.needsSync();

    return NextResponse.json({
      success: true,
      data: {
        needsSync,
        message: needsSync ? 'Sincronização necessária' : 'Dados atualizados'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status de sincronização:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}