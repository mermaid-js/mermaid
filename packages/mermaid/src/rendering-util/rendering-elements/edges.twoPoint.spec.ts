/**
 * Regression: insertEdge must clip a 2-point (straight) edge without crashing.
 *
 * DOMUS and other orthogonal layouts emit straight edges as exactly two points
 * (start boundary -\> end boundary). The non-swimlane clipping branch used to do
 * `points.slice(1, length - 1)` which yields `[]` for a 2-point edge, then
 * dereferenced `points[0].x` inside `node.intersect` -\> "Cannot read properties
 * of undefined (reading 'x')". This is the crash users hit in the browser; it is
 * invisible to the DOM-free DDLT sweep because that never runs the paint path.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { select } from 'd3';
import { insertEdge } from './edges.js';
import intersect from './intersect/index.js';

function rectNode(id: string, x: number, y: number, width: number, height: number) {
  const node: any = { id, x, y, width, height };
  node.intersect = (point: { x: number; y: number }) => intersect.rect(node, point);
  return node;
}

describe('insertEdge — 2-point straight edge clipping', () => {
  let g: any;

  beforeAll(() => {
    const dom = new JSDOM('<!DOCTYPE html><svg><g id="root"></g></svg>');
    const doc = dom.window.document;
    (globalThis as any).document = doc;
    g = select(doc.querySelector('#root'));
  });

  it('clips a straight vertical 2-point edge without throwing', () => {
    const tail = rectNode('a', 100, 0, 60, 40);
    const head = rectNode('b', 100, 200, 60, 40);
    const edge = {
      id: 'L_a_b_0',
      start: 'a',
      end: 'b',
      points: [
        { x: 100, y: 20 },
        { x: 100, y: 180 },
      ],
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
    };

    expect(() =>
      insertEdge(g, edge as any, {} as any, 'flowchart', tail, head, 'diag-1')
    ).not.toThrow();
  });

  it('keeps the clipped endpoints axis-aligned for a straight vertical edge', () => {
    const tail = rectNode('a', 100, 0, 60, 40);
    const head = rectNode('b', 100, 200, 60, 40);
    const edge = {
      id: 'L_a_b_1',
      start: 'a',
      end: 'b',
      points: [
        { x: 100, y: 20 },
        { x: 100, y: 180 },
      ],
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
    };

    insertEdge(g, edge as any, {} as any, 'flowchart', tail, head, 'diag-2');
    // insertEdge mutates edge.points to the clipped polyline.
    const pts = (edge as any).points as { x: number; y: number }[];
    expect(pts.length).toBe(2);
    expect(pts[0].x).toBeCloseTo(100, 5);
    expect(pts[1].x).toBeCloseTo(100, 5);
    // Each endpoint sits on its node's facing border (y = 20 bottom of a, y = 180 top of b).
    expect(pts[0].y).toBeCloseTo(20, 5);
    expect(pts[1].y).toBeCloseTo(180, 5);
  });
});
