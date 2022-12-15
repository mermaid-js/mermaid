// This file should be moved into .vitepress folder once https://github.com/vitest-dev/vitest/issues/2344 is resolved.
// Update https://github.com/mermaid-js/mermaid/blob/18c27c6f1d0537a738cbd95898df301b83c38ffc/packages/mermaid/src/docs.mts#L246 once fixed

import { expect, test } from 'vitest';
import { getRedirect } from './redirect';

test.each([
  ['http://localhost:1234/mermaid/#/flowchart.md', 'syntax/flowchart.html'],
  ['http://localhost/mermaid/#/flowchart.md', 'syntax/flowchart.html'],
  ['https://mermaid-js.github.io/mermaid/#/flowchart.md', 'syntax/flowchart.html'],
  ['https://mermaid-js.github.io/mermaid/#/./flowchart', 'syntax/flowchart.html'],
  ['https://mermaid-js.github.io/mermaid/#/flowchart', 'syntax/flowchart.html'],
  ['https://mermaid-js.github.io/mermaid/#flowchart', 'syntax/flowchart.html'],
  ['https://mermaid-js.github.io/mermaid/#/flowchart', 'syntax/flowchart.html'],
  ['https://mermaid-js.github.io/mermaid/#/flowchart.md?id=my-id', 'syntax/flowchart.html#my-id'],
  ['https://mermaid-js.github.io/mermaid/#/./flowchart.md?id=my-id', 'syntax/flowchart.html#my-id'],
  [
    'https://mermaid-js.github.io/mermaid/#/flowchart?another=test&id=my-id&one=more',
    'syntax/flowchart.html#my-id',
  ],
  ['https://mermaid-js.github.io/mermaid/#/n00b-advanced', 'config/n00b-advanced.html'],
  ['https://mermaid-js.github.io/mermaid/#/n00b-advanced.md', 'config/n00b-advanced.html'],
  [
    'https://mermaid-js.github.io/mermaid/#/flowchart?id=a-node-in-the-form-of-a-circle',
    'syntax/flowchart.html#a-node-in-the-form-of-a-circle',
  ],
])('should process url %s to %s', (link: string, path: string) => {
  expect(getRedirect(link)).toBe(path);
});

test('should throw for invalid URL', () => {
  // Not mermaid domain
  expect(() => getRedirect('https://www.google.com')).toThrowError();

  // Not `/mermaid/` path
  expect(() => getRedirect('http://localhost/#/flowchart.md')).toThrowError();
});
