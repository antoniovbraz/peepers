import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/core/error';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export class RateLimiter {
  private requests: Map<string, { count: number; firstRequest: number }> = new Map();
  private readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig = { limit: 100, windowMs: 60000 }) {
    this.config = config;
  }

  check(req: NextRequest): void {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const requestData = this.requests.get(ip);

    if (!requestData) {
      this.requests.set(ip, { count: 1, firstRequest: now });
      return;
    }

    if (now - requestData.firstRequest > this.config.windowMs) {
      this.requests.set(ip, { count: 1, firstRequest: now });
      return;
    }

    if (requestData.count >= this.config.limit) {
      throw AppError.forbidden('Rate limit exceeded');
    }

    requestData.count++;
    this.requests.set(ip, requestData);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [ip, data] of this.requests.entries()) {
      if (now - data.firstRequest > this.config.windowMs) {
        this.requests.delete(ip);
      }
    }
  }
}

// Create a singleton instance
const rateLimiter = new RateLimiter();

// Clean up old entries every minute
setInterval(() => rateLimiter.cleanup(), 60000);

export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async function(req: NextRequest): Promise<NextResponse> {
    try {
      rateLimiter.check(req);
      return await handler(req);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: error.code, message: error.message },
          { status: error.statusCode }
        );
      }
      throw error;
    }
  };
}