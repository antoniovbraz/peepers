import { describe, it, expect } from 'vitest';
import { PassThrough } from 'node:stream';
import { createLogger } from './logger';

describe('logger', () => {
  it('outputs JSON with level and msg', async () => {
    const stream = new PassThrough();
    const logs: any[] = [];
    stream.on('data', chunk => {
      const str = chunk.toString();
      if (str.trim().length > 0) {
        logs.push(JSON.parse(str));
      }
    });

    const testLogger = createLogger(stream);
    testLogger.info('test message');
    // allow stream to flush
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]).toHaveProperty('level');
    expect(logs[0]).toHaveProperty('msg', 'test message');
  });
});
