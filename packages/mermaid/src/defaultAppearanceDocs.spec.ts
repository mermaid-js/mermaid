/**
 * The ten pages that document the per-diagram defaults each show the same diagram twice --
 * once with the defaults and once pinned back to `default`/`classic`. They render on the
 * public docs site, so a syntax slip in one shows up there as an error diagram.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, beforeAll } from 'vitest';
import { addDiagrams } from './diagram-api/diagram-orchestration.js';
import { mermaidAPI } from './mermaidAPI.js';

const PAGES = [
  'agentflow',
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

/**
 * Diagrams whose layout defaults to ELK, so their "previous appearance" example
 * has to pin `layout: dagre` as well. `swimlanes` defaults to the `swimlane`
 * layout and `sequenceDiagram`/`venn` are not laid out by the shared engine, so
 * naming ELK on those pages would be wrong.
 */
const ELK_BY_DEFAULT = new Set([
  'agentflow',
  'flowchart',
  'classDiagram',
  'entityRelationshipDiagram',
  'requirementDiagram',
  'stateDiagram',
  'usecase',
]);

/** The `mermaid-example` fences inside the "Default theme…" section. */
const appearanceExamples = (page: string): string[] => {
  const section = /## Default theme[^\n]*\n[\S\s]*?(?=\n## )/.exec(readPage(page))?.[0];
  expect(section, `${page}.md has no "Default theme…" section`).toBeDefined();
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
    // On `develop` that marker is still the placeholder; the changesets release
    // (`docs:release-version`) rewrites it to the version being published, so the
    // released docs carry a concrete number instead. Both are correct.
    expect(readPage(page)).toMatch(
      /^## Default theme[^\n]* \(v(?:<MERMAID_RELEASE_VERSION>|\d+\.\d+\.\d+)\+\)$/m
    );

    const [withDefaults, pinnedBack] = examples;
    // The pair has to be the same diagram, or the comparison teaches nothing.
    expect(pinnedBack).toContain(withDefaults.trim());
    expect(pinnedBack).toContain('theme: default');
    expect(pinnedBack).toContain('look: classic');
    // An ELK-laid-out diagram is not pinned back to how it used to look unless
    // the layout is pinned too, so the example would be misleading without it.
    if (ELK_BY_DEFAULT.has(page)) {
      expect(pinnedBack, `${page}.md must pin the layout back as well`).toContain('layout: dagre');
    } else {
      expect(
        pinnedBack,
        `${page}.md is not ELK-laid-out, so it must not pin a layout`
      ).not.toContain('layout: dagre');
    }

    for (const source of examples) {
      await expect(mermaidAPI.parse(source), `${page}.md:\n${source}`).resolves.toBeTruthy();
    }
  });
});
