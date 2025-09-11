import { NextRequest, NextResponse } from 'next/server';
import { mlApi } from '@/lib/ml-api';
import { cache } from '@/lib/cache';

export const runtime = 'edge';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    console.log('Starting ML sync...');
    
    // Check if sync is already in progress
    const lockAcquired = await cache.acquireSyncLock();
    if (!lockAcquired) {
      return NextResponse.json(
        { error: 'Sync already in progress' },
        { status: 429 }
      );
    }

    try {
      // Get access token from cache
      const tokenData = await cache.getUser('access_token');
      if (!tokenData || !tokenData.token) {
        return NextResponse.json(
          { error: 'No access token found. Please authorize with Mercado Livre first.' },
          { status: 401 }
        );
      }

      // Check if token is expired
      if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'Access token expired. Please re-authorize with Mercado Livre.' },
          { status: 401 }
        );
      }

      console.log('Using access token for user:', tokenData.user_id);

      // Set the token in the ML API instance
      mlApi.setAccessToken(tokenData.token, tokenData.user_id);
      
      // Sync all products from ML API
      const products = await mlApi.syncAllProducts();
      
      // Cache the products
      await cache.setAllProducts(products);
      
      console.log(`Sync completed: ${products.length} products`);
      
      return NextResponse.json({
        success: true,
        message: `Synced ${products.length} products`,
        timestamp: new Date().toISOString(),
        products_count: products.length
      });
      
    } finally {
      // Always release the lock
      await cache.releaseSyncLock();
    }
    
  } catch (error) {
    console.error('Sync failed:', error);
    
    // Release lock on error
    await cache.releaseSyncLock();
    
    return NextResponse.json(
      { 
        error: 'Sync failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if user wants to trigger sync via GET (for convenience)
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'sync') {
      // Redirect to POST for actual sync
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Peepers - Sincronizando Produtos</title>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                max-width: 600px; 
                margin: 50px auto; 
                padding: 20px;
                text-align: center;
              }
              .loading { color: #007bff; }
              .result { margin: 20px 0; padding: 15px; border-radius: 5px; }
              .success { background: #d4edda; color: #155724; }
              .error { background: #f8d7da; color: #721c24; }
              .button {
                display: inline-block;
                background: #007bff;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                margin: 10px;
              }
            </style>
          </head>
          <body>
            <h1 class="loading">🔄 Sincronizando Produtos...</h1>
            <p>Aguarde enquanto sincronizamos seus produtos do Mercado Livre.</p>
            
            <div id="result"></div>
            
            <script>
              async function syncProducts() {
                try {
                  const response = await fetch('/api/ml/sync', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  const data = await response.json();
                  const resultDiv = document.getElementById('result');
                  
                  if (response.ok) {
                    resultDiv.innerHTML = \`
                      <div class="result success">
                        <h2>✅ Sincronização Concluída!</h2>
                        <p>\${data.message}</p>
                        <p><strong>Produtos sincronizados:</strong> \${data.products_count}</p>
                        <a href="/" class="button">Voltar ao Site</a>
                        <a href="/produtos" class="button">Ver Produtos</a>
                      </div>
                    \`;
                  } else {
                    resultDiv.innerHTML = \`
                      <div class="result error">
                        <h2>❌ Erro na Sincronização</h2>
                        <p><strong>Erro:</strong> \${data.message || data.error}</p>
                        <a href="/api/ml/sync?action=sync" class="button">Tentar Novamente</a>
                        <a href="/" class="button">Voltar ao Site</a>
                      </div>
                    \`;
                  }
                } catch (error) {
                  document.getElementById('result').innerHTML = \`
                    <div class="result error">
                      <h2>❌ Erro de Conexão</h2>
                      <p><strong>Erro:</strong> \${error.message}</p>
                      <a href="/api/ml/sync?action=sync" class="button">Tentar Novamente</a>
                      <a href="/" class="button">Voltar ao Site</a>
                    </div>
                  \`;
                }
              }
              
              // Start sync automatically
              syncProducts();
            </script>
          </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    
    // Default GET behavior - return sync status
    const [cacheStats, lastSync] = await Promise.all([
      cache.getCacheStats(),
      cache.getLastSyncTime()
    ]);
    
    return NextResponse.json({
      cache_stats: cacheStats,
      last_sync: lastSync,
      sync_available: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Sync status check failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Cron job endpoint (called by Vercel Cron)
export async function PATCH(request: NextRequest) {
  try {
    // Verify this is coming from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Cron sync triggered');
    
    // Check if sync is already in progress
    const lockAcquired = await cache.acquireSyncLock();
    if (!lockAcquired) {
      console.log('Sync already in progress, skipping cron sync');
      return NextResponse.json({ message: 'Sync already in progress' });
    }

    try {
      // Check if we need to sync (avoid unnecessary syncs)
      const lastSync = await cache.getLastSyncTime();
      if (lastSync) {
        const lastSyncTime = new Date(lastSync);
        const now = new Date();
        const timeDiff = now.getTime() - lastSyncTime.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Only sync if more than 1.5 hours have passed
        if (hoursDiff < 1.5) {
          console.log(`Last sync was ${hoursDiff.toFixed(1)} hours ago, skipping`);
          return NextResponse.json({ 
            message: 'Sync not needed yet',
            last_sync: lastSync,
            hours_since_last_sync: hoursDiff
          });
        }
      }
      
      // Perform sync
      const products = await mlApi.syncAllProducts();
      await cache.setAllProducts(products);
      
      console.log(`Cron sync completed: ${products.length} products`);
      
      return NextResponse.json({
        success: true,
        message: `Cron sync completed: ${products.length} products`,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      await cache.releaseSyncLock();
    }
    
  } catch (error) {
    console.error('Cron sync failed:', error);
    await cache.releaseSyncLock();
    
    return NextResponse.json(
      { 
        error: 'Cron sync failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
