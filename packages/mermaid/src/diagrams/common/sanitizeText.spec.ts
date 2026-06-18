// cspell:disable -- corpus contains intentional XSS payloads and non-dictionary unicode
import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeTextImpl } from './common.js';
import type { MermaidConfig } from '../../config.type.js';

// The fast path and cache in `sanitizeText` are pure optimizations: for any input and config they
// must return exactly what the full pipeline (`sanitizeTextImpl`) returns. This corpus deliberately
// mixes plain text, quotes/apostrophes (which the fast path keeps), every char the fast path treats
// as "needs sanitizing" (`< > & =`), HTML, entities, and XSS payloads.
const INPUTS = [
  '',
  ' ',
  'Hello World',
  "it's a test",
  'say "hi" to me',
  'node_1.2-3',
  '100% done',
  '#tag @ref',
  'a < b',
  'x > y',
  'a & b',
  'a = b = c',
  '<b>bold</b>',
  '<br>',
  'line1<br/>line2',
  '<br />',
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  "<a href='javascript:alert(1)'>x</a>",
  '<a href="https://example.com" target="_blank">link</a>',
  '<iframe src="evil"></iframe>',
  '<style>body{color:red}</style>',
  '&amp;',
  '&lt;script&gt;',
  '&#39;quoted&#39;',
  '&copy; 2026',
  '**bold** and `code` _italic_',
  'a=b<c>d&e',
];

const CONFIGS: MermaidConfig[] = [
  {},
  { securityLevel: 'strict' },
  { securityLevel: 'loose' },
  { securityLevel: 'antiscript' },
  { securityLevel: 'sandbox' },
  { securityLevel: 'strict', htmlLabels: true },
  { securityLevel: 'strict', htmlLabels: false, flowchart: { htmlLabels: false } },
  { securityLevel: 'strict', dompurifyConfig: { ADD_ATTR: ['data-foo'] } },
] as MermaidConfig[];

describe('sanitizeText fast-path + cache', () => {
  it('returns identical output to the uncached pipeline for every input × config', () => {
    for (const config of CONFIGS) {
      for (const input of INPUTS) {
        const expected = input ? sanitizeTextImpl(input, config) : input;
        expect(sanitizeText(input, config), `input=${JSON.stringify(input)}`).toBe(expected);
      }
    }
  });

  it('fast-paths text with no < > & = (incl. quotes/apostrophes) unchanged', () => {
    const cfg = { securityLevel: 'strict' } as MermaidConfig;
    for (const plain of [
      'Hello World',
      "it's fine",
      'say "hi"',
      'node_1.2-3',
      '100% done',
      'café 🚀',
    ]) {
      expect(sanitizeText(plain, cfg)).toBe(plain);
    }
  });

  it('is output-stable across repeated calls (cache) and still sanitizes markup', () => {
    const cfg = { securityLevel: 'strict' } as MermaidConfig;
    const malicious = '<script>alert(1)</script>x = y & z';
    const first = sanitizeText(malicious, cfg);
    expect(sanitizeText(malicious, cfg)).toBe(first); // cache hit, same result
    expect(first).toBe(sanitizeTextImpl(malicious, cfg)); // still fully sanitized
    expect(first).not.toContain('<script>');
  });
});
