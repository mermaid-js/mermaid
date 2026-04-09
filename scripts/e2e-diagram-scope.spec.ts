import { describe, it, expect } from 'vitest';
import { detectScope, DIAGRAM_SPEC_MAP } from './e2e-diagram-scope.mjs';

describe('detectScope', () => {
  it('returns empty string for no changed files', () => {
    expect(detectScope([])).toBe('');
  });

  it('scopes to a single diagram when only that diagram changed', () => {
    const result = detectScope([
      'packages/mermaid/src/diagrams/flowchart/flowchartDb.ts',
      'packages/mermaid/src/diagrams/flowchart/flowchartRenderer.ts',
    ]);
    expect(result).not.toBe('');
    expect(result.split(',')).toEqual(expect.arrayContaining(DIAGRAM_SPEC_MAP.flowchart));
    expect(result.split(',').length).toBe(DIAGRAM_SPEC_MAP.flowchart.length);
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

  it('combines specs from two different diagrams', () => {
    const result = detectScope([
      'packages/mermaid/src/diagrams/gantt/ganttDb.ts',
      'packages/mermaid/src/diagrams/pie/pieDb.ts',
    ]);
    expect(result).not.toBe('');
    const specs = result.split(',');
    expect(specs).toEqual(
      expect.arrayContaining([...DIAGRAM_SPEC_MAP.gantt, ...DIAGRAM_SPEC_MAP.pie])
    );
  });

  it('falls back to full suite for an unknown diagram folder', () => {
    expect(detectScope(['packages/mermaid/src/diagrams/unknownDiagram/unknownDb.ts'])).toBe('');
  });

  it('includes a directly modified spec file', () => {
    const result = detectScope(['cypress/integration/rendering/gantt.spec.js']);
    expect(result).toBe('cypress/integration/rendering/gantt.spec.js');
  });

  it('falls back to full suite when a cross-cutting spec is modified', () => {
    expect(detectScope(['cypress/integration/rendering/theme.spec.js'])).toBe('');
  });

  it('falls back to full suite when a cypress/other spec is modified', () => {
    expect(detectScope(['cypress/integration/other/xss.spec.js'])).toBe('');
  });

  it('combines a diagram change with a directly modified spec', () => {
    const result = detectScope([
      'packages/mermaid/src/diagrams/pie/pieDb.ts',
      'cypress/integration/rendering/pie.spec.ts',
    ]);
    const specs = result.split(',');
    expect(specs).toEqual(expect.arrayContaining(DIAGRAM_SPEC_MAP.pie));
    // spec file is already in the map, so length should match map length
    expect(specs.length).toBe(DIAGRAM_SPEC_MAP.pie.length);
  });
});

describe('DIAGRAM_SPEC_MAP', () => {
  it('has an entry for every known diagram folder', () => {
    const knownDiagrams = [
      'architecture',
      'block',
      'c4',
      'class',
      'er',
      'error',
      'eventmodeling',
      'flowchart',
      'gantt',
      'git',
      'info',
      'ishikawa',
      'kanban',
      'mindmap',
      'packet',
      'pie',
      'quadrant-chart',
      'radar',
      'requirement',
      'sankey',
      'sequence',
      'state',
      'timeline',
      'treeView',
      'treemap',
      'user-journey',
      'venn',
      'wardley',
      'xychart',
      'zenuml',
    ];
    for (const name of knownDiagrams) {
      expect(DIAGRAM_SPEC_MAP).toHaveProperty(name);
      expect(DIAGRAM_SPEC_MAP[name].length).toBeGreaterThan(0);
    }
  });

  it('all spec paths start with cypress/integration/rendering/', () => {
    for (const [diagram, specs] of Object.entries(DIAGRAM_SPEC_MAP)) {
      for (const spec of specs) {
        expect(spec, `${diagram}: ${spec}`).toMatch(
          /^cypress\/integration\/rendering\/.+\.spec\.(js|ts)$/
        );
      }
    }
  });
});
