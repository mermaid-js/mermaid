import { expect, test } from 'vitest';
import { getBaseFile } from './redirect';

test.each([
  ['http://localhost:1234/mermaid/#/flowchart.md', 'flowchart'],
  ['http://localhost/mermaid/#/flowchart.md', 'flowchart'],
  ['https://mermaid-js.github.io/mermaid/#/flowchart.md', 'flowchart'],
  ['https://mermaid-js.github.io/mermaid/#/./flowchart', 'flowchart'],
  ['https://mermaid-js.github.io/mermaid/#/flowchart', 'flowchart'],
  ['https://mermaid-js.github.io/mermaid/#flowchart', 'flowchart'],
  ['https://mermaid-js.github.io/mermaid/#/flowchart', 'flowchart'],
  ['https://mermaid-js.github.io/mermaid/#/flowchart.md?id=no-id', 'flowchart'],
  ['https://mermaid-js.github.io/mermaid/#/./flowchart.md?id=no-id', 'flowchart'],
  ['https://mermaid-js.github.io/mermaid/#/flowchart?id=no-id', 'flowchart'],
  ['https://mermaid-js.github.io/mermaid/#/language-highlight', 'language-highlight'],
  ['https://mermaid-js.github.io/mermaid/#/language-highlight.md', 'language-highlight'],
])('should process url %s to %s', (link, expected) => {
  expect(getBaseFile(link)).toBe(expected);
});

test('should throw for invalid URL', () => {
  // Not mermaid domain
  expect(() => getBaseFile('https://www.google.com')).toThrowError();

  // Not `/mermaid/` path
  expect(() => getBaseFile('http://localhost/#/flowchart.md')).toThrowError();
});
