/**
 * The nine pages that document the per-diagram defaults each show the same diagram twice --
 * once with the defaults and once pinned back to `default`/`classic`. They render on the
 * public docs site, so a syntax slip in one shows up there as an error diagram.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, beforeAll } from 'vitest';
import { addDiagrams } from './diagram-api/diagram-orchestration.js';
import { mermaidAPI } from './mermaidAPI.js';

const PAGES = [
  'flowchart',
  'swimlanes',
  'classDiagram',
  'entityRelationshipDiagram',
  'requirementDiagram',
  'sequenceDiagram',
  'stateDiagram',
  'usecase',
  'venn',
];

const readPage = (page: string): string => {
  const path = [
    resolve(process.cwd(), `packages/mermaid/src/docs/syntax/${page}.md`),
    resolve(process.cwd(), `src/docs/syntax/${page}.md`),
  ].find((candidate) => existsSync(candidate));
  if (!path) {
    throw new Error(`Documentation page not found: ${page}.md`);
  }
  return readFileSync(path, 'utf8');
};

/** The `mermaid-example` fences inside the "Default theme and look" section. */
const appearanceExamples = (page: string): string[] => {
  const section = /## Default theme and look[^\n]*\n[\S\s]*?(?=\n## )/.exec(readPage(page))?.[0];
  expect(section, `${page}.md has no "Default theme and look" section`).toBeDefined();
  return [...section!.matchAll(/^```mermaid-example[^\n]*\r?\n([\S\s]*?)\r?\n```$/gm)].map(
    ([, source]) => source
  );
};

describe('per-diagram appearance documentation', () => {
  beforeAll(() => {
    addDiagrams();
  });

  it.each(PAGES)('%s.md shows the diagram with the defaults and pinned back', async (page) => {
    const examples = appearanceExamples(page);
    expect(examples).toHaveLength(2);

    // `contributing.md` asks for a version marker on newly documented behaviour.
    expect(readPage(page)).toContain('## Default theme and look (v<MERMAID_RELEASE_VERSION>+)');

    const [withDefaults, pinnedBack] = examples;
    // The pair has to be the same diagram, or the comparison teaches nothing.
    expect(pinnedBack).toContain(withDefaults.trim());
    expect(pinnedBack).toContain('theme: default');
    expect(pinnedBack).toContain('look: classic');

    for (const source of examples) {
      await expect(mermaidAPI.parse(source), `${page}.md:\n${source}`).resolves.toBeTruthy();
    }
  });
});
