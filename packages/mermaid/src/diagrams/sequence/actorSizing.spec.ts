/**
 * The stick figure under the band model (`actorBands.ts`), against `classic` as the invariant.
 *
 * History, because this spec has pinned three designs: the original `neo` halved the figure and
 * let the scale leak into `actor.height` and the label; a first fix drew it full size; a second
 * inset it at 0.8 with the label pinned. Both fixes still derived positions per shape, and the
 * misalignments simply moved to the next seam -- lifelines, then footer stacks. The band model
 * replaces all of that: the figure fills the shared glyph band, the label is bottom-anchored at
 * the datum, and `classic` draws its legacy geometry untouched.
 */
import { select } from 'd3';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import defaultConfig from '../../defaultConfig.js';
import themes from '../../themes/index.js';
import svgDraw from './svgDraw.js';
import { GLYPH_BAND_HEIGHT, LABEL_LIFELINE_GAP, actorLabelHeight } from './actorBands.js';

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

/** Vertical extent of the drawn stick figure, ignoring the lifeline outside its group. */
const glyphHeightOf = (figure: Element) => {
  const circle = figure.querySelector('circle')!;
  const top = Number(circle.getAttribute('cy')) - Number(circle.getAttribute('r'));
  const feet = Math.max(
    ...[...figure.querySelectorAll('line')].map((l) => Number(l.getAttribute('y2') ?? 0))
  );
  return feet - top;
};

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

  it('leaves the classic figure at the size it has always been', async () => {
    // The default look renders a great many existing documents server-side, so its actor is not
    // ours to resize. 15 is the radius `classic` has always drawn, and the glyph fills its box.
    const { actor, root } = await drawOne('actor', 'classic');
    const figure = root.querySelector('.actor-man')!;

    expect(figure.querySelector('circle')?.getAttribute('r')).toBe('15');
    expect(glyphHeightOf(figure)).toBe(actor.height);
  });

  it('draws the figure smaller on neo than on classic, at the glyph band size', async () => {
    const classic = await drawOne('actor', 'classic');
    const classicHead = Number(classic.root.querySelector('circle')!.getAttribute('r'));

    const neo = await drawOne('actor', 'neo');
    const neoHead = Number(neo.root.querySelector('circle')!.getAttribute('r'));

    expect(neoHead).toBeLessThan(classicHead);
    // Same box height either way; the look changes the glyph, not the layout around it.
    expect(neo.actor.height).toBe(classic.actor.height);
  });

  it('fills the shared glyph band on neo', async () => {
    // The figure is the same size as the round icons beside it: it spans exactly the glyph band,
    // feet on the band's bottom edge.
    const { root } = await drawOne('actor', 'neo');
    const figure = root.querySelector('.actor-man')!;

    expect(glyphHeightOf(figure)).toBeCloseTo(GLYPH_BAND_HEIGHT, 5);
  });

  it('anchors the label at the datum on neo', async () => {
    // Bottom-anchored: the label block's centre sits half its measured height plus the clearance
    // above the lifeline datum, so single-line labels share a baseline across shapes and a second
    // line grows upward rather than into the lifeline.
    const { actor, root } = await drawOne('actor', 'neo');
    const textHeight = actorLabelHeight(actor as never, confFor('neo') as never);
    const datum = 100 + actor.height;

    expect(labelY(root)).toBe(datum - LABEL_LIFELINE_GAP - textHeight / 2);
  });

  it('reports a height that is not shrunk by the look', async () => {
    const classic = await drawOne('actor', 'classic');
    const neo = await drawOne('actor', 'neo');

    expect(neo.actor.height).toBe(classic.actor.height);
  });
});
