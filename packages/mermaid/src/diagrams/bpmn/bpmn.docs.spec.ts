import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import mermaidAPI from '../../mermaidAPI.js';
import { jsdomIt } from '../../tests/util.js';

addDiagrams();

/** Every page whose examples are promised to render. */
const documentationPages = ['syntax/bpmn.md', 'syntax/bpmnElements.md'];

/** Run from the repository root or from `packages/mermaid`, so both are tried. */
const documentationRoots = [
  resolve(process.cwd(), 'packages/mermaid/src/docs'),
  resolve(process.cwd(), 'src/docs'),
];

const readPage = (page: string): string => {
  const candidates = documentationRoots.map((root) => resolve(root, page));
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(`BPMN documentation page was not found at: ${candidates.join(', ')}`);
  }
  return readFileSync(found, 'utf8');
};

// Only a fence opened as ```mermaid-example is rendered, so a snippet written in a plain
// fence is documentation nobody checks.
const extractMermaidExamples = (markdown: string): string[] =>
  [...markdown.matchAll(/^```mermaid-example[^\n]*\r?\n([\S\s]*?)\r?\n```$/gm)].map(
    ([, source]) => source
  );

const examples = documentationPages.flatMap((page) =>
  extractMermaidExamples(readPage(page)).map((source, index) => ({
    page,
    number: index + 1,
    source,
  }))
);

describe('bpmn public documentation examples', () => {
  it('finds examples on every documented page', () => {
    for (const page of documentationPages) {
      expect(examples.filter((example) => example.page === page).length, page).toBeGreaterThan(0);
    }
  });

  for (const { page, number, source } of examples) {
    // One example per test, on a budget of its own: a single test holding every render
    // has to have its timeout raised each time the documentation grows, and names no
    // example when it fails.
    jsdomIt(
      `renders ${page} example ${number}`,
      async () => {
        const id = `bpmn-doc-${page.replaceAll(/\W/g, '-')}-${number}`;
        const { svg } = await mermaidAPI.render(id, source);
        expect(svg).toContain('<svg');
        // An error diagram is an `<svg>` too, and carries the markers and classes a real
        // one does. Saying so is the difference between rendering an example and merely
        // producing something shaped like one.
        expect(svg).not.toContain('aria-roledescription="error"');
      },
      15_000
    );
  }
});
