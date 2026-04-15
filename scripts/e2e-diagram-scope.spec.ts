import { describe, it, expect } from 'vitest';
import { detectScope, SPEC_BASE_DIR } from './e2e-diagram-scope.mjs';

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
    expect(result).toBe(`${SPEC_BASE_DIR}/flowchart/**`);
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
      expect.arrayContaining([`${SPEC_BASE_DIR}/gantt/**`, `${SPEC_BASE_DIR}/pie/**`])
    );
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
    expect(result).toBe(`${SPEC_BASE_DIR}/gantt/**`);
  });

  it('falls back to full suite for any spec at the rendering root (positional convention)', () => {
    // Any *.spec.* at the root of SPEC_BASE_DIR is treated as cross-cutting —
    // no explicit list needed.
    expect(detectScope([`${SPEC_BASE_DIR}/theme.spec.js`])).toBe('');
    expect(detectScope([`${SPEC_BASE_DIR}/brandNewCrossCutting.spec.ts`])).toBe('');
  });

  it('falls back to full suite when a cypress/other spec is modified', () => {
    expect(detectScope(['cypress/integration/other/xss.spec.js'])).toBe('');
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

describe('SPEC_BASE_DIR subfolder coverage', () => {
  it('every known diagram folder has a matching spec subfolder', async () => {
    const fs = await import('fs');

    const diagramsRoot = 'packages/mermaid/src/diagrams';
    const diagramFolders = fs
      .readdirSync(diagramsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name !== 'common')
      .map((entry) => entry.name);

    const specFolders = new Set(
      fs
        .readdirSync(SPEC_BASE_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    );

    const missing = diagramFolders.filter((name) => !specFolders.has(name));
    expect(missing, `Diagram folders without a spec subfolder: ${missing.join(', ')}`).toEqual([]);
  });
});
