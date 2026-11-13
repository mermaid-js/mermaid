import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { renderKatexSanitized } from '@mermaid-js/core/diagrams/common/common.js';
import { getLayoutLoaderDefinition } from '@mermaid-js/core/rendering-util/render.js';
import coseBilkentLayouts from '@mermaid-js/layout-cose-bilkent';
import elkLayouts from '@mermaid-js/layout-elk';
import { diagrams } from './diagrams.js';
import mermaid from './mermaid.js';

/** The diagrams that an entry registers, in order. */
const diagramList = (entry: string, listStart: string) => {
  const source = readFileSync(new URL(entry, import.meta.url), 'utf8');
  const list = source.slice(source.indexOf(listStart) + listStart.length);
  return list
    .slice(0, list.indexOf(']'))
    .replaceAll(/\/\/.*/g, '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
};

/** Diagrams that tiny leaves out, to stay small. */
const LARGE_DIAGRAMS = ['architecture', 'flowchartElk', 'mindmap'];

describe('mermaid', () => {
  it.each([...coseBilkentLayouts, ...elkLayouts])('registers the $name layout', (layout) => {
    expect(getLayoutLoaderDefinition(layout.name)).toBe(layout);
  });

  it('registers KaTeX', async () => {
    const math = await renderKatexSanitized('$$x$$', { legacyMathML: true });
    expect(math).toContain('katex-mathml');
  });

  it.each([
    { text: 'architecture-beta', expected: 'architecture' },
    { text: 'block', expected: 'block' },
    { text: 'block-beta', expected: 'block' },
    { text: 'C4Context', expected: 'c4' },
    { text: 'classDiagram', expected: 'classDiagram' },
    { text: 'cynefin-beta', expected: 'cynefin' },
    { text: 'erDiagram', expected: 'er' },
    { text: 'eventmodeling', expected: 'eventmodeling' },
    { text: 'flowchart', expected: 'flowchart-v2' },
    { text: 'flowchart-elk', expected: 'flowchart-elk' },
    { text: 'gantt', expected: 'gantt' },
    { text: 'gitGraph', expected: 'gitGraph' },
    { text: 'graph', expected: 'flowchart-v2' },
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
    { text: 'railroad-beta', expected: 'railroad' },
    { text: 'railroad-abnf-beta', expected: 'railroadAbnf' },
    { text: 'railroad-ebnf-beta', expected: 'railroadEbnf' },
    { text: 'railroad-peg-beta', expected: 'railroadPeg' },
    { text: 'requirementDiagram', expected: 'requirement' },
    { text: 'sankey', expected: 'sankey' },
    { text: 'sankey-beta', expected: 'sankey' },
    { text: 'sequenceDiagram', expected: 'sequence' },
    { text: 'stateDiagram', expected: 'stateDiagram' },
    { text: 'stateDiagram-v2', expected: 'stateDiagram' },
    { text: 'swimlane-beta', expected: 'swimlane' },
    { text: 'timeline', expected: 'timeline' },
    { text: 'treeView-beta', expected: 'treeView' },
    { text: 'treemap', expected: 'treemap' },
    { text: 'treemap-beta', expected: 'treemap' },
    { text: 'usecase-beta', expected: 'usecase' },
    { text: 'venn-beta', expected: 'venn' },
    { text: 'wardley-beta', expected: 'wardley' },
    { text: 'xychart', expected: 'xychart' },
    { text: 'xychart-beta', expected: 'xychart' },
    // C4's detector matches its keywords anywhere, so only the diagrams before it win.
    { text: 'mindmap\n  C4Container', expected: 'mindmap' },
    { text: 'flowchart\n  C4Container', expected: 'c4' },
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

  // Both entries share one core instance in tests, so compare their sources.
  it('registers the same diagrams in the same order as tiny, apart from the large ones', () => {
    expect(diagramList('../../tiny/src/mermaid.ts', 'registerExternalDiagrams([')).toEqual(
      diagramList('./diagrams.ts', 'ExternalDiagramDefinition[] = [').filter(
        (name) => !LARGE_DIAGRAMS.includes(name)
      )
    );
  });
});
