import { describe, expect, it } from 'vitest';
import { draw } from './vennRenderer.js';
import type { Diagram } from '../../Diagram.js';

const createDiagram = (overrides: Partial<Record<string, unknown>> = {}) => {
  const defaultDb = {
    getConfig: () => ({
      padding: 15,
      debugTextLayout: false,
    }),
    getDiagramTitle: () => undefined,
    getSubsetData: () => [
      { sets: ['A'], size: 10, label: 'A', color: undefined, background: undefined },
      { sets: ['B'], size: 10, label: 'B', color: undefined, background: undefined },
      { sets: ['A', 'B'], size: 2.5, label: 'AB', color: undefined, background: undefined },
    ],
    getTextData: () => [],
  };

  return {
    db: { ...defaultDb, ...overrides },
  } as unknown as Diagram;
};

describe('vennRenderer', () => {
  it('renders a title when provided', async () => {
    document.body.innerHTML = '<svg id="venn"></svg>';
    const diagram = createDiagram({
      getDiagramTitle: () => 'My Venn Title',
    });

    await draw('', 'venn', '1.0', diagram);

    const title = document.querySelector('#venn > text');
    expect(title?.textContent).toBe('My Venn Title');
  });

  it('renders text nodes with custom color', async () => {
    document.body.innerHTML = '<svg id="venn"></svg>';
    const diagram = createDiagram({
      getTextData: () => [
        { sets: ['A'], id: 'alpha', label: undefined, color: '#ff0000' },
        { sets: ['A', 'B'], id: 'shared', label: undefined, color: undefined },
      ],
    });

    await draw('', 'venn', '1.0', diagram);

    const nodes = [...document.querySelectorAll<SVGTextElement>('.venn-text-node')];
    expect(nodes.length).toBeGreaterThanOrEqual(2);
    const colored = nodes.find((node) => node.textContent === 'alpha');
    expect(colored?.getAttribute('fill')).toBe('#ff0000');
  });

  it('renders debug layout helpers when enabled', async () => {
    document.body.innerHTML = '<svg id="venn"></svg>';
    const diagram = createDiagram({
      getConfig: () => ({
        padding: 15,
        debugTextLayout: true,
        textMinFontSize: 12,
        textMaxFontSize: 28,
      }),
      getTextData: () => [{ sets: ['A'], id: 'alpha', label: undefined, color: undefined }],
    });

    await draw('', 'venn', '1.0', diagram);

    const debugCircle = document.querySelector('.venn-text-debug-circle');
    expect(debugCircle).not.toBeNull();
  });
});
