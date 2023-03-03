// This file should be moved into .vitepress folder once https://github.com/vitest-dev/vitest/issues/2344 is resolved.
// Update https://github.com/mermaid-js/mermaid/blob/18c27c6f1d0537a738cbd95898df301b83c38ffc/packages/mermaid/src/docs.mts#L246 once fixed

import { expect, test } from 'vitest';
import { getRedirect } from './redirect.ts';

test.each([
  // Old docs, localhost
  ['http://localhost:1234/mermaid/#/flowchart.md', 'syntax/flowchart.html'],
  ['http://localhost/mermaid/#/flowchart.md', 'syntax/flowchart.html'],
  // Old docs, github pages
  ['https://mermaid-js.github.io/mermaid/#/flowchart.md', 'syntax/flowchart.html'], // without dot
  ['https://mermaid-js.github.io/mermaid/#/./flowchart', 'syntax/flowchart.html'], // with dot
  ['https://mermaid-js.github.io/mermaid/#flowchart', 'syntax/flowchart.html'], // without slash
  ['https://mermaid-js.github.io/mermaid/#/flowchart', 'syntax/flowchart.html'], // with slash
  ['https://mermaid-js.github.io/mermaid/#/flowchart.md?id=my-id', 'syntax/flowchart.html#my-id'], // with id
  ['https://mermaid-js.github.io/mermaid/#/./flowchart.md?id=my-id', 'syntax/flowchart.html#my-id'], // with id and dot
  [
    'https://mermaid-js.github.io/mermaid/#/flowchart?another=test&id=my-id&one=more', // with multiple params
    'syntax/flowchart.html#my-id',
  ],
  ['https://mermaid-js.github.io/mermaid/#/n00b-advanced', 'config/n00b-advanced.html'], // without .md
  ['https://mermaid-js.github.io/mermaid/#/n00b-advanced.md', 'config/n00b-advanced.html'], // with .md
  [
    'https://mermaid-js.github.io/mermaid/#/flowchart?id=a-node-in-the-form-of-a-circle', // with id, without .md
    'syntax/flowchart.html#a-node-in-the-form-of-a-circle',
  ],
  // Old docs, without base path, new domain
  ['https://mermaid.js.org/#/flowchart.md', 'syntax/flowchart.html'],
  // New docs, without base path, new domain
  ['https://mermaid.js.org/misc/faq.html', 'configure/faq.html'],
  [
    'https://mermaid.js.org/misc/faq.html#frequently-asked-questions',
    'configure/faq.html#frequently-asked-questions',
  ], // with hash
])('should process url %s to %s', (link: string, path: string) => {
  expect(getRedirect(link)).toBe(path);
});
