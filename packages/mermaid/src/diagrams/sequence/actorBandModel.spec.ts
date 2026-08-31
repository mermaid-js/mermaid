/**
 * Pipeline-level assertions for the band model: a real `mermaid.render`, all eight participant
 * shapes on one row, header and footer.
 *
 * These deliberately do not call `drawActor` in isolation. The regressions this model exists for
 * lived *between* the pieces -- shapes measuring themselves with `getBBox()` and feeding the
 * result back into `actor.height`, which the footer then consumed -- so a test that stubs the
 * measurement to a constant validates its own assumption and nothing else. Here `getBBox` is
 * emulated from the geometry actually emitted, and text has a realistic nonzero height, so the
 * feedback paths run for real.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import mermaid from '../../mermaid.js';

const TEXT_LINE_HEIGHT = 19;

const num = (el: Element, n: string) => Number(el.getAttribute(n) ?? 0);
const bboxOf = (el: Element): { x: number; y: number; width: number; height: number } => {
  const tag = el.tagName.toLowerCase();
  if (tag === 'circle') {
    const r = num(el, 'r');
    return { x: num(el, 'cx') - r, y: num(el, 'cy') - r, width: 2 * r, height: 2 * r };
  }
  if (tag === 'line') {
    const [x1, x2, y1, y2] = [num(el, 'x1'), num(el, 'x2'), num(el, 'y1'), num(el, 'y2')];
    return {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
    };
  }
  if (tag === 'rect') {
    return { x: num(el, 'x'), y: num(el, 'y'), width: num(el, 'width'), height: num(el, 'height') };
  }
  if (tag === 'path') {
    const ys = [...(el.getAttribute('d') ?? '').matchAll(/([\d.-]+)[\s,]([\d.-]+)/g)]
      .map((m) => Number(m[2]))
      .filter(Number.isFinite);
    if (!ys.length) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    return { x: 0, y: Math.min(...ys), width: 10, height: Math.max(...ys) - Math.min(...ys) };
  }
  if (tag === 'text' || tag === 'tspan') {
    const lines = Math.max(1, el.querySelectorAll('tspan').length);
    return {
      x: num(el, 'x'),
      y: num(el, 'y'),
      width: (el.textContent ?? '').length * 7,
      height: TEXT_LINE_HEIGHT * lines,
    };
  }
  const kids = [...el.children].map(bboxOf).filter((b) => b.width || b.height);
  if (!kids.length) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  const x = Math.min(...kids.map((b) => b.x));
  const y = Math.min(...kids.map((b) => b.y));
  return {
    x,
    y,
    width: Math.max(...kids.map((b) => b.x + b.width)) - x,
    height: Math.max(...kids.map((b) => b.y + b.height)) - y,
  };
};

beforeAll(() => {
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value(this: SVGElement) {
      return bboxOf(this);
    },
  });
  Object.defineProperty(SVGElement.prototype, 'getComputedTextLength', {
    configurable: true,
    value(this: SVGElement) {
      return (this.textContent ?? '').length * 7;
    },
  });
});

const MIXED_ROW = `sequenceDiagram
  actor User
  participant Plain as Plain
  participant B@{ "type" : "boundary" } as Bound
  participant C@{ "type" : "control" } as Ctrl
  participant E@{ "type" : "entity" } as Ent
  participant DB@{ "type" : "database" } as Database
  participant Q@{ "type" : "queue" } as Que
  participant Co@{ "type" : "collections" } as Coll
  User ->> DB: query
`;

/** Shapes that hang their label below a glyph; their labels share one baseline. */
const OUTSIDE_LABELS = new Set(['User', 'Bound', 'Ctrl', 'Ent', 'Database']);

const render = async (id: string, source: string) => {
  mermaid.initialize({ theme: 'redux-color', look: 'neo', startOnLoad: false });
  const { svg } = await mermaid.render(id, source);
  return new DOMParser().parseFromString(svg, 'image/svg+xml');
};

const lifelines = (doc: Document) =>
  [...doc.querySelectorAll('line[data-et="life-line"]')].map((l) => ({
    id: l.getAttribute('data-id')!,
    y1: Number(l.getAttribute('y1')),
    y2: Number(l.getAttribute('y2')),
  }));

/** Header labels sit above the first datum, footer labels below the second. */
const splitLabels = (doc: Document, datumTop: number) => {
  const header = new Map<string, number>();
  const footer = new Map<string, number>();
  for (const t of doc.querySelectorAll('text.actor')) {
    const y = Number(t.getAttribute('y'));
    (y <= datumTop ? header : footer).set(t.textContent!, y);
  }
  return { header, footer };
};

describe('actor band model (neo, real pipeline)', () => {
  it('starts and ends every lifeline on the two datum lines', async () => {
    const doc = await render('bm-datum', MIXED_ROW);
    const lls = lifelines(doc);

    expect(lls).toHaveLength(8);
    expect(new Set(lls.map((l) => l.y1)).size).toBe(1);
    expect(new Set(lls.map((l) => l.y2)).size).toBe(1);
  });

  it('puts every outside label on one baseline, clear of the lifeline, header and footer', async () => {
    const doc = await render('bm-labels', MIXED_ROW);
    const [{ y1: datumTop }] = lifelines(doc);
    const { header, footer } = splitLabels(doc, datumTop);

    const headerYs = [...OUTSIDE_LABELS].map((n) => header.get(n));
    expect(new Set(headerYs).size).toBe(1);
    // The label's ink must end above the datum: centre + half the real text height, with room.
    expect((headerYs[0] ?? Infinity) + TEXT_LINE_HEIGHT / 2).toBeLessThan(datumTop);

    const footerYs = [...OUTSIDE_LABELS].map((n) => footer.get(n));
    expect(new Set(footerYs).size).toBe(1);
  });

  it('keeps a multiline label on the datum, growing away from it', async () => {
    const single = await render('bm-single', MIXED_ROW);
    const multi = await render(
      'bm-multi',
      MIXED_ROW.replace('actor User', 'actor User as First line<br/>Second line')
    );

    const singleLifelines = lifelines(single);
    const multiLifelines = lifelines(multi);
    // The row grows, but stays one datum.
    expect(new Set(multiLifelines.map((l) => l.y1)).size).toBe(1);

    const singleDatum = singleLifelines[0].y1;
    const multiDatum = multiLifelines[0].y1;
    expect(multiDatum).toBeGreaterThan(singleDatum);

    // Single-line neighbours keep their distance to the datum -- the extra line grew upward past
    // them, it did not push them off the shared baseline.
    const singleLabels = splitLabels(single, singleDatum).header;
    const multiLabels = splitLabels(multi, multiDatum).header;
    expect(multiDatum - multiLabels.get('Database')!).toBe(
      singleDatum - singleLabels.get('Database')!
    );
  });

  it('reports one uniform actor height back into the pipeline', async () => {
    // The old failure mode: shapes overwrote `actor.height` from their own bounding box with
    // per-shape fudge terms, and the footer consumed the corrupted values. With the model, every
    // consumer of heights sees the row height. The footer labels sharing a baseline (asserted
    // above) is the visible consequence; this pins the datum gap between header and footer being
    // identical for every shape, which fails if any shape's height drifts.
    const doc = await render('bm-height', MIXED_ROW);
    const lls = lifelines(doc);
    const spans = new Set(lls.map((l) => l.y2 - l.y1));

    expect(spans.size).toBe(1);
  });
});
