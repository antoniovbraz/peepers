import { describe, it, expect } from 'vitest';
import { renderHtml } from './render-html';
import { html } from './html';

describe('renderHtml', () => {
  it('renders markup with status and headers', async () => {
    const response = renderHtml(html`<h1>${'Hello'}</h1>`, { status: 201 });
    expect(response.status).toBe(201);
    expect(response.headers.get('Content-Type')).toBe('text/html');
    const text = await response.text();
    expect(text).toBe('<h1>Hello</h1>');
  });
});
