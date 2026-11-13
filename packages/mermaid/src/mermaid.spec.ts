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
      /'(@mermaid-js\/diagram-[^']+)'/g
    ),
  ].map(([, name]) => name);

/** Diagram packages that tiny leaves out, to stay small. */
const LARGE_DIAGRAMS = ['@mermaid-js/diagram-mindmap'];

describe('mermaid', () => {
  it.each([...coseBilkentLayouts, ...elkLayouts])('registers the $name layout', (layout) => {
    expect(getLayoutLoaderDefinition(layout.name)).toBe(layout);
  });

  it('registers KaTeX', async () => {
    const math = await renderKatexSanitized('$$x$$', { legacyMathML: true });
    expect(math).toContain('katex-mathml');
  });

  it.each([
    { text: 'cynefin-beta', expected: 'cynefin' },
    { text: 'erDiagram', expected: 'er' },
    { text: 'eventmodeling', expected: 'eventmodeling' },
    { text: 'info', expected: 'info' },
    { text: 'ishikawa', expected: 'ishikawa' },
    { text: 'ishikawa-beta', expected: 'ishikawa' },
    { text: 'journey', expected: 'journey' },
    { text: 'kanban', expected: 'kanban' },
    { text: 'mindmap', expected: 'mindmap' },
    { text: 'packet', expected: 'packet' },
    { text: 'packet-beta', expected: 'packet' },
    { text: 'pie', expected: 'pie' },
    { text: 'pie title: "flowchart"\n flowchart: 1 "pie" pie: 2 "pie"', expected: 'pie' },
    { text: 'quadrantChart', expected: 'quadrantChart' },
    { text: 'radar-beta', expected: 'radar' },
    { text: 'requirementDiagram', expected: 'requirement' },
    { text: 'sankey', expected: 'sankey' },
    { text: 'sankey-beta', expected: 'sankey' },
    { text: 'timeline', expected: 'timeline' },
    { text: 'treeView-beta', expected: 'treeView' },
    { text: 'treemap', expected: 'treemap' },
    { text: 'treemap-beta', expected: 'treemap' },
    { text: 'venn-beta', expected: 'venn' },
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
  it('imports the same diagram packages as tiny, apart from the large ones', () => {
    expect(diagramImports('../../tiny/src/mermaid.ts')).toEqual(
      diagramImports('./diagrams.ts').filter((name) => !LARGE_DIAGRAMS.includes(name))
    );
  });
});
