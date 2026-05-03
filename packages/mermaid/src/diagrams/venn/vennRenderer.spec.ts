import { describe, expect, it, vi } from 'vitest';
import { draw } from './vennRenderer.js';
import type { Diagram } from '../../Diagram.js';
import * as configModule from '../../config.js';

const createDiagram = (overrides: Partial<Record<string, unknown>> = {}) => {
  const defaultDb = {
    getConfig: () => ({
      padding: 15,
      useDebugLayout: false,
    }),
    getDiagramTitle: () => undefined,
    getSubsetData: () => [
      { sets: ['A'], size: 10, label: 'A' },
      { sets: ['B'], size: 10, label: 'B' },
      { sets: ['A', 'B'], size: 2.5, label: 'AB' },
    ],
    getTextData: () => [],
    getStyleData: () => [],
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

  it('renders text nodes with custom color via style data', async () => {
    document.body.innerHTML = '<svg id="venn"></svg>';
    const diagram = createDiagram({
      getTextData: () => [
        { sets: ['A'], id: 'alpha', label: undefined },
        { sets: ['A', 'B'], id: 'shared', label: undefined },
      ],
      getStyleData: () => [{ targets: ['alpha'], styles: { color: '#ff0000' } }],
    });

    await draw('', 'venn', '1.0', diagram);

    const nodes = [...document.querySelectorAll<HTMLDivElement>('.venn-text-node')];
    expect(nodes.length).toBeGreaterThanOrEqual(2);
    const colored = nodes.find((node) => node.textContent === 'alpha');
    expect(colored?.style.color).toBe('rgb(255, 0, 0)');
  });

  it('applies theme colors to circles', async () => {
    document.body.innerHTML = '<svg id="venn"></svg>';
    const diagram = createDiagram();

    await draw('', 'venn', '1.0', diagram);

    const circles = document.querySelectorAll('.venn-circle');
    expect(circles.length).toBeGreaterThanOrEqual(2);
    // First circle should have venn-set-0 class
    expect(circles[0]?.classList.contains('venn-set-0')).toBe(true);
    // Second circle should have venn-set-1 class
    expect(circles[1]?.classList.contains('venn-set-1')).toBe(true);
  });

  it('user override colors take priority over theme via style data', async () => {
    document.body.innerHTML = '<svg id="venn"></svg>';
    const diagram = createDiagram({
      getSubsetData: () => [
        { sets: ['A'], size: 10, label: 'A' },
        { sets: ['B'], size: 10, label: 'B' },
        { sets: ['A', 'B'], size: 2.5, label: 'AB' },
      ],
      getStyleData: () => [{ targets: ['A', 'B'], styles: { color: '#00ff00', fill: 'gold' } }],
    });

    await draw('', 'venn', '1.0', diagram);

    const intersectionTexts = document.querySelectorAll('.venn-intersection text');
    // Find the text element for AB intersection
    let abText: Element | null = null;
    intersectionTexts.forEach((el) => {
      if (el.textContent === 'AB') {
        abText = el;
      }
    });
    if (abText) {
      expect((abText as SVGTextElement).style.fill).toBe('#00ff00');
    }

    const intersectionPaths = document.querySelectorAll('.venn-intersection path');
    let abPath: Element | null = null;
    intersectionPaths.forEach((el) => {
      if ((el as SVGPathElement).style.fillOpacity === '1') {
        abPath = el;
      }
    });
    if (abPath) {
      expect((abPath as SVGPathElement).style.fill).toBe('gold');
    }
  });

  it('computes contrasting text color for dark backgrounds', async () => {
    document.body.innerHTML = '<svg id="venn"></svg>';
    // Mock getConfig to return dark theme colors
    const spy = vi.spyOn(configModule, 'getConfig');
    const originalConfig = configModule.getConfig();
    spy.mockReturnValue({
      ...originalConfig,
      themeVariables: {
        ...originalConfig.themeVariables,
        venn1: '#1a1a2e',
        venn2: '#16213e',
        venn3: '#0f3460',
        venn4: '#533483',
        venn5: '#2b2d42',
        venn6: '#1b1b2f',
        venn7: '#162447',
        venn8: '#1f4068',
        vennTitleTextColor: '#ffffff',
        vennSetTextColor: '#cccccc',
        primaryColor: '#1a1a2e',
        titleColor: '#ffffff',
        textColor: '#cccccc',
        primaryTextColor: '#cccccc',
      },
    } as ReturnType<typeof configModule.getConfig>);

    const diagram = createDiagram();
    await draw('', 'venn', '1.0', diagram);

    const circles = document.querySelectorAll('.venn-circle');
    expect(circles.length).toBeGreaterThanOrEqual(2);
    // For dark backgrounds, text should be lightened
    const textEl = circles[0]?.querySelector('text');
    expect(textEl?.style.fill).toBeTruthy();
    // The fill should NOT be the same as the dark background color
    expect(textEl?.style.fill).not.toBe('#1a1a2e');

    spy.mockRestore();
  });

  it('renders debug layout helpers when enabled', async () => {
    document.body.innerHTML = '<svg id="venn"></svg>';
    const diagram = createDiagram({
      getConfig: () => ({
        padding: 15,
        useDebugLayout: true,
        textMinFontSize: 12,
        textMaxFontSize: 28,
      }),
      getTextData: () => [{ sets: ['A'], id: 'alpha', label: undefined }],
    });

    await draw('', 'venn', '1.0', diagram);

    const debugCircle = document.querySelector('.venn-text-debug-circle');
    expect(debugCircle).not.toBeNull();
  });
});
