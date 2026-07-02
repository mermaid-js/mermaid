/**
 * Regression tests for https://github.com/Mermaid-Chart/agentflow/issues/78
 *
 * The neo look used to emit node rects with a hardcoded `stroke="url(#gradient)"`
 * attribute while no element with id="gradient" existed anywhere in the SVG.
 * Per the SVG spec a broken paint reference with no fallback means the stroke
 * cannot be painted, and downstream consumers restyling strokes via CSS sat on
 * top of a dangling resource reference. The stroke must be owned by the theme CSS
 * (which scopes gradient ids per SVG as `<svgId>-gradient`), not by the shape.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { select } from 'd3';
import type { Node, RectOptions } from '../../types.js';

vi.mock('./handDrawnShapeStyles.js', () => ({
  styles2String: vi.fn().mockReturnValue({ labelStyles: '', nodeStyles: '' }),
  userNodeOverrides: vi.fn().mockReturnValue({}),
}));

vi.mock('./util.js', () => ({
  labelHelper: vi.fn().mockImplementation((parent) => {
    const shapeSvg = parent.append('g');
    return Promise.resolve({
      shapeSvg,
      bbox: { width: 100, height: 40 },
      halfPadding: 4,
      label: shapeSvg.append('g'),
    });
  }),
  getNodeClasses: vi.fn().mockReturnValue(''),
  updateNodeBounds: vi.fn(),
}));

const PAINT_URL_REF = /url\(["']?#([^"')]+)["']?\)/g;

/** Collect the ids of all url(#...) references in attributes under the given root. */
function collectPaintRefIds(root: Element): string[] {
  const ids: string[] = [];
  for (const el of [root, ...root.querySelectorAll('*')]) {
    for (const attr of el.attributes) {
      for (const match of attr.value.matchAll(PAINT_URL_REF)) {
        ids.push(match[1]);
      }
    }
  }
  return ids;
}

describe('drawRect', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  async function renderNeoRect() {
    const { drawRect } = await import('./drawRect.js');
    const svg = select(document.body).append('svg').attr('id', 'mermaid-test');
    const node = {
      id: 'node-1',
      look: 'neo',
      rx: 12,
      ry: 12,
      cssStyles: [],
    } as unknown as Node;
    const options: RectOptions = {
      rx: 12,
      ry: 12,
      labelPaddingX: 8,
      labelPaddingY: 8,
      classes: '',
    };
    await drawRect(svg as unknown as Parameters<typeof drawRect>[0], node, options);
    return svg.node()!;
  }

  it('does not emit a stroke attribute on the node rect — the theme CSS owns the stroke', async () => {
    const svgEl = await renderNeoRect();
    const rect = svgEl.querySelector('rect');
    expect(rect).not.toBeNull();
    expect(rect!.getAttribute('stroke')).toBeNull();
  });

  it('emits no dangling url(#...) paint references', async () => {
    const svgEl = await renderNeoRect();
    const refIds = collectPaintRefIds(svgEl);
    for (const id of refIds) {
      expect(document.getElementById(id), `url(#${id}) must resolve to an element`).not.toBeNull();
    }
  });
});
