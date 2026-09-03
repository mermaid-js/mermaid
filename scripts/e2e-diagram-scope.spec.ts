import { describe, it, expect } from 'vitest';
import { detectScope, SPEC_BASE_DIR, DIAGRAMS_DIR, SKIP } from './e2e-diagram-scope.mjs';

// Source folders mix kebab/camelCase; fixture folders are kebab. Compare on a
// canonical lowercased, hyphen-stripped name.
const canonical = (name: string) => name.toLowerCase().replace(/-/g, '');

// The tests run in the repo root, so the spec subfolders created by the file
// reorganisation are present on disk — no mocking needed.

describe('detectScope', () => {
  it('returns empty string for no changed files', () => {
    expect(detectScope([])).toBe('');
  });

  it('scopes to a single diagram when only that diagram changed', () => {
    const result = detectScope([
      'packages/mermaid/src/diagrams/flowchart/flowchartDb.ts',
      'packages/mermaid/src/diagrams/flowchart/flowchartRenderer.ts',
    ]);
    expect(result.split(',')).toEqual(
      expect.arrayContaining([
        `${SPEC_BASE_DIR}/flowchart/**`,
        `${SPEC_BASE_DIR}/mmd-snapshots.spec.ts`,
      ])
    );
  });

  it('falls back to full suite when rendering-util is touched', () => {
    expect(
      detectScope([
        'packages/mermaid/src/diagrams/flowchart/flowchartDb.ts',
        'packages/mermaid/src/rendering-util/edgeDetails.ts',
      ])
    ).toBe('');
  });

  it('falls back to full suite when themes are touched', () => {
    expect(detectScope(['packages/mermaid/src/themes/theme-default.js'])).toBe('');
  });

  it('falls back to full suite when config is touched', () => {
    expect(detectScope(['packages/mermaid/src/config.ts'])).toBe('');
  });

  it('falls back to full suite when diagrams/common is touched', () => {
    expect(detectScope(['packages/mermaid/src/diagrams/common/commonDb.ts'])).toBe('');
  });

  it('falls back to full suite when parser package is touched', () => {
    expect(detectScope(['packages/parser/src/language/flowchart.langium'])).toBe('');
  });

  it('falls back to full suite when CI config is touched', () => {
    expect(detectScope(['.github/workflows/e2e.yml'])).toBe('');
  });

  it('falls back to full suite when package.json is touched', () => {
    expect(detectScope(['package.json'])).toBe('');
  });

  it('combines patterns from two different diagrams', () => {
    const result = detectScope([
      'packages/mermaid/src/diagrams/gantt/ganttDb.ts',
      'packages/mermaid/src/diagrams/pie/pieDb.ts',
    ]);
    expect(result.split(',')).toEqual(
      expect.arrayContaining([
        `${SPEC_BASE_DIR}/gantt/**`,
        `${SPEC_BASE_DIR}/pie/**`,
        `${SPEC_BASE_DIR}/mmd-snapshots.spec.ts`,
      ])
    );
  });

  it('scopes a fixture-only change to the mmd snapshot runner (not the full suite)', () => {
    const result = detectScope(['e2e/diagrams/pie/new-case.mmd']);
    expect(result).toBe(`${SPEC_BASE_DIR}/mmd-snapshots.spec.ts`);
  });

  it('includes the mmd runner when a fixture changes alongside a diagram source', () => {
    const result = detectScope([
      'packages/mermaid/src/diagrams/flowchart/flowchartDb.ts',
      'e2e/diagrams/flowchart/new-case.mmd',
    ]);
    expect(result.split(',')).toEqual(
      expect.arrayContaining([
        `${SPEC_BASE_DIR}/flowchart/**`,
        `${SPEC_BASE_DIR}/mmd-snapshots.spec.ts`,
      ])
    );
  });

  it('still falls back to full suite when shared code changes alongside a fixture', () => {
    expect(
      detectScope([
        'packages/mermaid/src/rendering-util/edgeDetails.ts',
        'e2e/diagrams/flowchart/new-case.mmd',
      ])
    ).toBe('');
  });

  it('falls back to full suite for a diagram with no spec subfolder', () => {
    // Use a custom specBaseDir that has no subfolder for 'unknownDiagram'
    expect(
      detectScope(['packages/mermaid/src/diagrams/unknownDiagram/unknownDb.ts'], {
        specBaseDir: SPEC_BASE_DIR,
      })
    ).toBe('');
  });

  it('scopes to the subfolder when a spec file in that subfolder is modified', () => {
    const result = detectScope([`${SPEC_BASE_DIR}/gantt/gantt.spec.js`]);
    expect(result.split(',')).toEqual(
      expect.arrayContaining([
        `${SPEC_BASE_DIR}/gantt/**`,
        `${SPEC_BASE_DIR}/mmd-snapshots.spec.ts`,
      ])
    );
  });

  it('falls back to full suite for any spec at the rendering root (positional convention)', () => {
    // Any *.spec.* at the root of SPEC_BASE_DIR is treated as cross-cutting —
    // no explicit list needed.
    expect(detectScope([`${SPEC_BASE_DIR}/theme.spec.js`])).toBe('');
    expect(detectScope([`${SPEC_BASE_DIR}/brandNewCrossCutting.spec.ts`])).toBe('');
  });

  it('falls back to full suite when an e2e/other spec is modified', () => {
    expect(detectScope(['e2e/other/xss.spec.js'])).toBe('');
  });

  it('deduplicates when diagram source and its spec subfolder both change', () => {
    const result = detectScope([
      'packages/mermaid/src/diagrams/gantt/ganttDb.ts',
      `${SPEC_BASE_DIR}/gantt/gantt.spec.js`,
    ]);
    // Both point to the same subfolder — should deduplicate
    expect(result.split(',').filter((s) => s === `${SPEC_BASE_DIR}/gantt/**`).length).toBe(1);
  });
});

describe('ignorable files (docs-only, changesets, etc.)', () => {
  it('returns SKIP when only docs source files change', () => {
    expect(
      detectScope([
        'packages/mermaid/src/docs/syntax/flowchart.md',
        'packages/mermaid/src/docs/config/theming.md',
      ])
    ).toBe(SKIP);
  });

  it('returns SKIP when only root markdown files change', () => {
    expect(detectScope(['README.md', 'CONTRIBUTING.md'])).toBe(SKIP);
  });

  it('returns SKIP when only changeset files change', () => {
    expect(detectScope(['.changeset/cool-feature.md'])).toBe(SKIP);
  });

  it('returns SKIP when only generated docs change', () => {
    expect(detectScope(['docs/syntax/flowchart.md', 'docs/intro/index.md'])).toBe(SKIP);
  });

  it('returns SKIP when only AI/assistant config changes', () => {
    expect(detectScope(['.claude/settings.json', 'assistant/CONVENTIONS.md'])).toBe(SKIP);
  });

  it('returns SKIP when only docs CI workflows change', () => {
    expect(
      detectScope(['.github/workflows/build-docs.yml', '.github/workflows/publish-docs.yml'])
    ).toBe(SKIP);
  });

  it('returns SKIP when only demo files change', () => {
    expect(detectScope(['demos/architecture.html'])).toBe(SKIP);
  });

  it('scopes to diagram when diagram source + file in demo folder changed', () => {
    const result = detectScope([
      'packages/mermaid/src/diagrams/flowchart/flowchartDb.ts',
      'demos/sequence.html',
    ]);
    expect(result.split(',')).toEqual(
      expect.arrayContaining([
        `${SPEC_BASE_DIR}/flowchart/**`,
        `${SPEC_BASE_DIR}/mmd-snapshots.spec.ts`,
      ])
    );
  });

  it('scopes to diagram when diagram source + docs both change', () => {
    const result = detectScope([
      'packages/mermaid/src/diagrams/flowchart/flowchartDb.ts',
      'packages/mermaid/src/docs/syntax/flowchart.md',
    ]);
    expect(result.split(',')).toEqual(
      expect.arrayContaining([
        `${SPEC_BASE_DIR}/flowchart/**`,
        `${SPEC_BASE_DIR}/mmd-snapshots.spec.ts`,
      ])
    );
  });

  it('falls back to full suite when shared code + docs both change', () => {
    expect(
      detectScope([
        'packages/mermaid/src/rendering-util/edgeDetails.ts',
        'packages/mermaid/src/docs/syntax/flowchart.md',
      ])
    ).toBe('');
  });

  it('falls back to full suite for non-docs CI workflows', () => {
    // e2e.yml affects test execution — not ignorable
    expect(detectScope(['.github/workflows/e2e.yml'])).toBe('');
  });
});

describe('diagram coverage', () => {
  it('every known diagram has either a rendering spec subfolder or mmd fixtures', async () => {
    const fs = await import('fs');

    const diagramsRoot = 'packages/mermaid/src/diagrams';
    const diagramFolders = fs
      .readdirSync(diagramsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name !== 'common')
      .map((entry) => entry.name);

    // A diagram is covered by a per-diagram spec subfolder OR by the global mmd
    // snapshot runner (fixtures under e2e/diagrams/<name>/). The migration moved
    // several diagrams (block, c4, packet, …) to fixtures only.
    const covered = new Set(
      [SPEC_BASE_DIR, DIAGRAMS_DIR].flatMap((dir) =>
        fs
          .readdirSync(dir, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => canonical(entry.name))
      )
    );

    const missing = diagramFolders.filter((name) => !covered.has(canonical(name)));
    expect(
      missing,
      `Diagrams with no spec subfolder and no fixtures: ${missing.join(', ')}`
    ).toEqual([]);
  });
});
