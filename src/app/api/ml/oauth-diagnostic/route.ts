import { NextRequest, NextResponse } from "next/server";
import { cache } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    
    // Get all cookies for debugging
    const cookies = Object.fromEntries(
      request.cookies.getAll().map(c => [c.name, c.value])
    );
    
    // Check cache health
    const cacheHealth = await cache.healthCheck();
    
    // Get current OAuth sessions from cache
    const oauthSessions = [];
    try {
      // Try to find recent OAuth sessions
      const now = Date.now();
      for (let i = 0; i < 30; i++) { // Check last 30 minutes
        const timestamp = now - (i * 60000);
        const key = `oauth_backup:${Math.floor(timestamp / 60000) * 60000}`;
        try {
          const session = await cache.getUser(key);
          if (session && (session as any).oauth_data) {
            oauthSessions.push({
              key,
              timestamp: new Date(timestamp).toISOString(),
              state: (session as any).oauth_data.state,
              hasVerifier: !!(session as any).oauth_data.code_verifier
            });
          }
        } catch (e) {
          // Session doesn't exist, continue
        }
      }
    } catch (err) {
      console.warn('Failed to fetch OAuth sessions:', err);
    }
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        domain: request.headers.get('host'),
        userAgent: request.headers.get('user-agent')?.substring(0, 100),
        referer: request.headers.get('referer')
      },
      cookies: {
        total: Object.keys(cookies).length,
        mlRelated: Object.fromEntries(
          Object.entries(cookies).filter(([name]) => 
            name.includes('ml_') || name.includes('oauth')
          )
        ),
        all: cookies
      },
      cache: {
        health: cacheHealth,
        oauthSessions: oauthSessions.slice(0, 5) // Show only recent 5
      },
      actions: {
        available: [
          "clear-oauth-cache - Clear all OAuth cache entries",
          "test-cookies - Test cookie setting",
          "force-cleanup - Force cleanup all sessions"
        ]
      }
    };
    
    // Handle specific actions
    if (action === "clear-oauth-cache") {
      try {
        const now = Date.now();
        const keysToDelete = [];
        
        // Clear OAuth sessions from last hour
        for (let i = 0; i < 60; i++) {
          const timestamp = now - (i * 60000);
          keysToDelete.push(`oauth_backup:${Math.floor(timestamp / 60000) * 60000}`);
        }
        
        // Also clear any state-based sessions
        for (const session of oauthSessions) {
          if (session.state) {
            keysToDelete.push(`oauth_session:${session.state}`);
          }
        }
        
        // Delete cache entries (ignore errors)
        for (const key of keysToDelete) {
          try {
            await cache.setUser(key, null as any);
          } catch (e) {
            // Ignore individual failures
          }
        }
        
        (response as any).action_result = {
          action: "clear-oauth-cache",
          keysAttempted: keysToDelete.length,
          success: true
        };
      } catch (err) {
        (response as any).action_result = {
          action: "clear-oauth-cache",
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }
    
    if (action === "test-cookies") {
      const testResponse = NextResponse.json({
        ...response,
        action_result: {
          action: "test-cookies",
          success: true,
          message: "Test cookie set"
        }
      });
      
      testResponse.cookies.set('test_cookie', `test_${Date.now()}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 300 // 5 minutes
      });
      
      return testResponse;
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("OAuth diagnostic error:", error);
    return NextResponse.json({ 
      success: false,
      error: "Diagnostic failed",
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}