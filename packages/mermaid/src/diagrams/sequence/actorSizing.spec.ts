/**
 * Every participant shape draws into a box of `actor.width` x `actor.height` and offsets its label
 * below its own glyph. Those offsets differ per shape and are not interchangeable -- a plain
 * `participant` centres its label at `rect.y`, `boundary` uses `+15`, `database` uses `+35` -- so
 * alignment is only meaningful between shapes that share one, as `actor` and `database` do.
 *
 * The stick figure did not. Under `neo` it multiplied every coordinate by 0.5, reported the scaled
 * bounding box back as `actor.height`, and offset its label by `35 * scale - 10`. So an `actor`
 * standing next to a `database` was drawn at half the size with its label on a different baseline,
 * and because the scaled height feeds lifeline placement, the discrepancy propagated into layout.
 *
 * These assertions compare the two shapes against each other rather than against fixed numbers, so
 * they keep holding if the shared box geometry is retuned later.
 */
import { select } from 'd3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import defaultConfig from '../../defaultConfig.js';
import themes from '../../themes/index.js';
import svgDraw from './svgDraw.js';

const originalGetBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getBBox');

beforeAll(() => {
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    // The stick figure reads its own bbox back. Report the union of the drawn primitives so the
    // measurement tracks the glyph the code actually emitted.
    value(this: SVGElement) {
      const ys = [...this.querySelectorAll('line, circle')].flatMap((child) => {
        if (child.tagName === 'circle') {
          const cy = Number(child.getAttribute('cy') ?? 0);
          const r = Number(child.getAttribute('r') ?? 0);
          return [cy - r, cy + r];
        }
        return [Number(child.getAttribute('y1') ?? 0), Number(child.getAttribute('y2') ?? 0)];
      });
      const height = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
      return { x: 0, y: ys.length ? Math.min(...ys) : 0, width: 60, height } as DOMRect;
    },
  });
});

afterAll(() => {
  if (originalGetBBox) {
    Object.defineProperty(SVGElement.prototype, 'getBBox', originalGetBBox);
  } else {
    Reflect.deleteProperty(SVGElement.prototype, 'getBBox');
  }
});

const confFor = (look: string) => ({
  ...defaultConfig.sequence,
  look,
  theme: 'redux',
  themeVariables: themes.redux.getThemeVariables(),
  sequence: defaultConfig.sequence,
});

const participant = (name: string, type: string) => ({
  name,
  description: name,
  type,
  x: 0,
  y: 0,
  starty: 100,
  stopy: 400,
  width: 150,
  height: 65,
  links: {},
  properties: {},
});

const svg = () => select(document.querySelector<SVGSVGElement>('svg')!);

/** y of the label `<text>` a participant shape emitted. */
const labelY = (root: Element) => Number(root.querySelector('text')?.getAttribute('y'));

const drawOne = async (type: string, look: string) => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
  const actor = participant(type, type);
  const indexMap = new Map([[actor.name, 0]]);
  await svgDraw.drawActor(svg(), actor, confFor(look), false, 'test-id', undefined, indexMap);
  return { actor, root: document.querySelector('svg')! };
};

beforeEach(() => {
  document.body.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
});

describe('stick-figure actor sizing', () => {
  it.each(['classic', 'neo'])(
    'puts its label where a database puts its own, on %s',
    async (look) => {
      const stick = await drawOne('actor', look);
      const database = await drawOne('database', look);

      expect(labelY(stick.root)).toBe(labelY(database.root));
    }
  );

  it('draws the same size on neo as on classic', async () => {
    const classic = await drawOne('actor', 'classic');
    const classicHead = classic.root.querySelector('circle')?.getAttribute('r');

    const neo = await drawOne('actor', 'neo');
    const neoHead = neo.root.querySelector('circle')?.getAttribute('r');

    expect(neoHead).toBe(classicHead);
  });

  it('draws the glyph smaller than its box, centred in it', async () => {
    // The figure is deliberately inset -- `ACTOR_GLYPH_SCALE` -- while the box it reports stays
    // full size. Centred rather than top-anchored, so shrinking it does not leave it riding up
    // against the top edge with a gap above the label.
    const { actor, root } = await drawOne('actor', 'neo');
    const top = 100 + -5; // actorY + ACTOR_GLYPH_TOP
    const bottom = 100 + 60; // actorY + ACTOR_GLYPH_BOTTOM

    const figure = root.querySelector('.actor-man')!;
    const circle = figure.querySelector('circle')!;
    const cy = Number(circle.getAttribute('cy'));
    const r = Number(circle.getAttribute('r'));
    const feet = Math.max(
      ...[...figure.querySelectorAll('line')].map((l) => Number(l.getAttribute('y2') ?? 0))
    );

    expect(cy - r).toBeGreaterThan(top);
    expect(feet).toBeLessThan(bottom);
    // Equal insets top and bottom.
    expect(cy - r - top).toBeCloseTo(bottom - feet, 5);
    expect(actor.height).toBe(bottom - top);
  });

  it('keeps the label and the reported height independent of the glyph scale', async () => {
    // The regression this whole change is about: the label offset and `actor.height` must be keyed
    // to the box, so resizing the figure never moves the label or the surrounding layout.
    const { actor, root } = await drawOne('actor', 'neo');
    const figure = root.querySelector('.actor-man')!;
    const circle = figure.querySelector('circle')!;
    const glyphHeight =
      Math.max(
        ...[...figure.querySelectorAll('line')].map((l) => Number(l.getAttribute('y2') ?? 0))
      ) -
      (Number(circle.getAttribute('cy')) - Number(circle.getAttribute('r')));

    expect(glyphHeight).toBeLessThan(actor.height);
    expect(labelY(root)).toBe(100 + 35 + actor.height / 2);
  });

  it('reports a height that is not shrunk by the look', async () => {
    const classic = await drawOne('actor', 'classic');
    const neo = await drawOne('actor', 'neo');

    expect(neo.actor.height).toBe(classic.actor.height);
  });
});
