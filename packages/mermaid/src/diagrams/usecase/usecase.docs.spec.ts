import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect } from 'vitest';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import mermaidAPI from '../../mermaidAPI.js';
import { jsdomIt } from '../../tests/util.js';

addDiagrams();

const documentationCandidates = [
  resolve(process.cwd(), 'packages/mermaid/src/docs/syntax/usecase.md'),
  resolve(process.cwd(), 'src/docs/syntax/usecase.md'),
];

const readDocumentation = (): string => {
  const documentationPath = documentationCandidates.find((candidate) => existsSync(candidate));
  if (!documentationPath) {
    throw new Error(
      `Canonical use-case documentation was not found at: ${documentationCandidates.join(', ')}`
    );
  }
  return readFileSync(documentationPath, 'utf8');
};

const extractMermaidExamples = (markdown: string): string[] =>
  [...markdown.matchAll(/^```mermaid-example[^\n]*\r?\n([\S\s]*?)\r?\n```$/gm)].map(
    ([, source]) => source
  );

// Renders all 20 examples from the page through a real layout engine in jsdom.
// ELK, now the default layout, does considerably more work than dagre and pays
// a one-off cost to load elkjs, which pushes this past vitest's 5s default on
// slower CI runners.
const RENDER_ALL_EXAMPLES_TIMEOUT_MS = 30_000;

describe('usecase public documentation examples', () => {
  jsdomIt(
    'parses and renders every mermaid-example fence from the canonical page',
    async () => {
      const examples = extractMermaidExamples(readDocumentation());
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
    RENDER_ALL_EXAMPLES_TIMEOUT_MS
  );
});
