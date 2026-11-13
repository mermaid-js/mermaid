import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { renderKatexSanitized } from '@mermaid-js/core/diagrams/common/common.js';
import { getLayoutLoaderDefinition } from '@mermaid-js/core/rendering-util/render.js';
import coseBilkentLayouts from '@mermaid-js/layout-cose-bilkent';
import elkLayouts from '@mermaid-js/layout-elk';
import { diagrams } from './diagrams.js';
import mermaid from './mermaid.js';

const diagramImports = (entry: string) =>
  [
    ...readFileSync(new URL(entry, import.meta.url), 'utf8').matchAll(
      /'@mermaid-js\/diagram-[^']+'/g
    ),
  ].map(([name]) => name);

describe('mermaid', () => {
  it.each([...coseBilkentLayouts, ...elkLayouts])('registers the $name layout', (layout) => {
    expect(getLayoutLoaderDefinition(layout.name)).toBe(layout);
  });

  it('registers KaTeX', async () => {
    const math = await renderKatexSanitized('$$x$$', { legacyMathML: true });
    expect(math).toContain('katex-mathml');
  });

  it.each([
    { text: 'info', expected: 'info' },
    { text: 'ishikawa', expected: 'ishikawa' },
    { text: 'ishikawa-beta', expected: 'ishikawa' },
    { text: 'kanban', expected: 'kanban' },
    { text: 'packet', expected: 'packet' },
    { text: 'packet-beta', expected: 'packet' },
    { text: 'pie', expected: 'pie' },
    { text: 'pie title: "flowchart"\n flowchart: 1 "pie" pie: 2 "pie"', expected: 'pie' },
    { text: 'radar-beta', expected: 'radar' },
    { text: 'requirementDiagram', expected: 'requirement' },
    { text: 'sankey', expected: 'sankey' },
    { text: 'sankey-beta', expected: 'sankey' },
    { text: 'treeView-beta', expected: 'treeView' },
  ])('detects $text as $expected', ({ text, expected }) => {
    expect(mermaid.detectType(text)).toBe(expected);
  });

  // The test setup registers `diagrams` too, so check the entry against a fresh registry.
  it('registers its diagram packages after the core diagrams', async () => {
    vi.resetModules();
    const { detectors } = await import('@mermaid-js/core/diagram-api/detectType.js');
    await import('./mermaid.js');
    expect(Object.keys(detectors).slice(-diagrams.length)).toEqual(diagrams.map(({ id }) => id));
  });

  // Both entries share one core instance in tests, so compare their imports.
  it('imports the same diagram packages as tiny', () => {
    expect(diagramImports('../../tiny/src/mermaid.ts')).toEqual(diagramImports('./diagrams.ts'));
  });
});
