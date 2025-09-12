import assert from 'node:assert/strict';
import { html } from './html';

const dangerous = '<script>alert("xss")</script>';
const output = html`<div>${dangerous}</div>`;
assert.ok(!output.includes(dangerous));
assert.ok(output.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'));
console.log('HTML escaping test passed');
