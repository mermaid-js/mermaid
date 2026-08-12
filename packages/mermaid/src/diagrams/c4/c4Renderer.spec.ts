/**
 * Grid placement for C4 elements. `getBBox` is stubbed to a fixed box so every element
 * self-sizes to the `c4.width` floor, which makes the row structure exact rather than
 * font-dependent.
 */
import { JSDOM } from 'jsdom';
import { describe, beforeAll, afterEach, it, expect } from 'vitest';
import mermaid from '../../mermaid.js';
import { mermaidAPI } from '../../mermaidAPI.js';

/** The centre of every drawn C4 element, in document order. */
const renderShapeCentres = async (
  code: string,
  id: string
): Promise<{ x: number; y: number }[]> => {
  const oldWindow = global.window;
  const oldDocument = global.document;
  const oldMutationObserver = global.MutationObserver;

  try {
    const dom = new JSDOM(`<html lang="en"><body><div id="container"></div></body></html>`, {
      resources: 'usable',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeParse(_window: any) {
        _window.Element.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 100 });
        _window.Element.prototype.getComputedTextLength = () => 50;
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = dom.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).document = dom.window.document;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).MutationObserver = undefined;

    const { svg } = await mermaidAPI.render(id, code);
    const holder = dom.window.document.createElement('div');
    holder.innerHTML = svg;

    return [...holder.querySelectorAll('.c4-shape')].map((shape) => {
      // The element is drawn into a group already translated to its grid position.
      let ancestor: Element | null = shape;
      let translate: RegExpMatchArray | null = null;
      while (ancestor && !translate) {
        translate = /translate\(\s*([\d.-]+)[\s,]+([\d.-]+)\s*\)/.exec(
          ancestor.getAttribute('transform') ?? ''
        );
        ancestor = ancestor.parentElement;
      }
      if (!translate) {
        throw new Error('C4 element is not inside a translated group');
      }
      return { x: Number(translate[1]), y: Number(translate[2]) };
    });
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = oldWindow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).document = oldDocument;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).MutationObserver = oldMutationObserver;
  }
};

/** How many elements sit on each row, top row first. */
const rowSizes = (centres: { x: number; y: number }[]): number[] =>
  [...new Set(centres.map(({ y }) => y))]
    .sort((a, b) => a - b)
    .map((row) => centres.filter(({ y }) => y === row).length);

const systems = (count: number) =>
  Array.from({ length: count }, (_, i) => `System(sys${i}, "System ${i}", "Description")`).join(
    '\n'
  );

describe('C4 grid placement', () => {
  beforeAll(async () => {
    await mermaid.registerExternalDiagrams([]);
    mermaid.initialize({ deterministicIds: true, deterministicIDSeed: '', logLevel: 5 });
  });

  afterEach(() => {
    // One test below reports a different display size. Drop that override so the rest
    // see the environment's own value and the results do not depend on test order.
    delete (globalThis.screen as unknown as { availWidth?: number }).availWidth;
  });

  it('fills a row to c4ShapeInRow before starting the next one', async () => {
    const centres = await renderShapeCentres(`C4Context\n${systems(5)}`, 'c4-rows-0');

    expect(centres).toHaveLength(5);
    // c4ShapeInRow defaults to 4.
    expect(rowSizes(centres)).toEqual([4, 1]);
    // The first row advances left to right, and the last element starts a new row.
    expect(centres[1].x).toBeGreaterThan(centres[0].x);
    expect(centres[4].x).toBe(centres[0].x);
  });

  // Element widths depend on the font the viewer happens to have, so a width-based row
  // break would place the same source differently on different machines - and did, from
  // the display size.
  it('places elements identically whatever the display reports', async () => {
    const code = `C4Context\n${systems(5)}`;
    const asSeenOn = async (availWidth: number, id: string) => {
      Object.defineProperty(globalThis.screen, 'availWidth', {
        value: availWidth,
        configurable: true,
      });
      return renderShapeCentres(code, id);
    };

    expect(await asSeenOn(400, 'c4-rows-narrow')).toEqual(await asSeenOn(4000, 'c4-rows-wide'));
  });

  it('honours a c4ShapeInRow wider than the elements would fit on screen', async () => {
    const centres = await renderShapeCentres(
      `C4Context\nUpdateLayoutConfig($c4ShapeInRow="6")\n${systems(6)}`,
      'c4-rows-6'
    );

    expect(rowSizes(centres)).toEqual([6]);
  });

  it('keeps the elements of a boundary on one row', async () => {
    const centres = await renderShapeCentres(
      `C4Context
Enterprise_Boundary(b1, "Bank") {
${systems(3)}
}`,
      'c4-rows-boundary'
    );

    expect(rowSizes(centres)).toEqual([3]);
  });
});
