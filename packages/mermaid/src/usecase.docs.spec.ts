import { describe, expect } from 'vitest';
import mermaidAPI from '@mermaid-js/core/mermaidAPI.js';
import { jsdomIt } from '@mermaid-js/core/tests/util.js';
import documentation from './docs/syntax/usecase.md?raw';

const extractMermaidExamples = (markdown: string): string[] =>
  [...markdown.matchAll(/^```mermaid-example[^\n]*\r?\n([\S\s]*?)\r?\n```$/gm)].map(
    ([, source]) => source
  );

describe('usecase public documentation examples', () => {
  jsdomIt(
    'parses and renders every mermaid-example fence from the canonical page',
    async () => {
      const examples = extractMermaidExamples(documentation);
      expect(examples.length).toBeGreaterThan(0);

      for (const [index, source] of examples.entries()) {
        const id = `usecase-doc-example-${index}`;
        try {
          const { svg } = await mermaidAPI.render(id, source);
          expect(svg, `documentation example ${index + 1}`).toContain('<svg');
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(`Use-case documentation example ${index + 1} failed: ${message}`);
        }
      }
    },
    // Renders every example on the page in one test, so the cost grows with the page and the
    // default 5s was already marginal on CI. Generous rather than tuned: the point is that
    // adding an example to the docs must not turn into a timeout here.
    60_000
  );
});
