import { describe, it, expect } from 'vitest';
import { Writable } from 'stream';
import { createLogger } from './logger';

describe('logger', () => {
  it('formats logs as json', () => {
    let output = '';
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      }
    });

    const logger = createLogger(
      { base: null, timestamp: () => ',"time":0' },
      stream as any
    );

    logger.info({ foo: 'bar' }, 'hello');

    expect(output.trim()).toMatchInlineSnapshot(
      `"{\"level\":30,\"time\":0,\"foo\":\"bar\",\"msg\":\"hello\"}"`
    );
  });
});
