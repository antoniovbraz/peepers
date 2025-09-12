import assert from 'node:assert/strict';
import { renderHtml } from './render-html';
import { html } from './html';

(async () => {
  const response = renderHtml(html`<h1>${'Hello'}</h1>`, { status: 201 });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('Content-Type'), 'text/html');
  const text = await response.text();
  assert.equal(text, '<h1>Hello</h1>');

  console.log('renderHtml helper test passed');
})();
