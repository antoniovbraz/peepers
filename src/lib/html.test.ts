import { describe, it, expect } from 'vitest';
import { html } from './html';

describe('html', () => {
  it('escapes dangerous content', () => {
    const dangerous = '<script>alert("xss")</script>';
    const output = html`<div>${dangerous}</div>`;
    expect(output).not.toContain(dangerous);
    expect(output).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
});
