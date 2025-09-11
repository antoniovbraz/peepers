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
    // Get sync status and cache stats
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
