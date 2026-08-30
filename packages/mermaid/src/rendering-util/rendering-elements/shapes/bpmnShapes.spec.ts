import { describe, it, expect } from 'vitest';
import type { Node } from '../../types.js';
import { isValidShape, shapes } from '../shapes.js';
import { EVENT_RINGS, faceCentreIntersect } from './bpmnShapeCore.js';
import { bpmnIcons } from './bpmnIcons.js';
import bpmnStyles from '../../../diagrams/bpmn/styles.js';

const BPMN_SHAPES = [
  'bpmn-start',
  'bpmn-intermediate',
  'bpmn-boundary',
  'bpmn-end',
  'bpmn-gateway',
  'bpmn-activity',
  'bpmn-data',
  'bpmn-data-store',
  'bpmn-annotation',
];

describe('BPMN shape registration', () => {
  it.each(BPMN_SHAPES)('registers %s', (name) => {
    expect(isValidShape(name)).toBe(true);
    expect(Object.keys(shapes)).toContain(name);
  });

  // flowDb rejects a shape name that is not lowercase, or that contains an underscore,
  // before it ever reaches the registry. These names have to survive that check or the
  // whole vocabulary becomes unreachable from a flowchart.
  it.each(BPMN_SHAPES)('%s can be named from a flowchart', (name) => {
    expect(name).toBe(name.toLowerCase());
    expect(name).not.toContain('_');
  });
});

describe('event ring weights', () => {
  it('draws a start event with one thin ring and an end event with one thick ring', () => {
    expect(EVENT_RINGS.start.rings).toBe(1);
    expect(EVENT_RINGS.end.rings).toBe(1);
    expect(EVENT_RINGS.end.strokeWidth).toBeGreaterThan(EVENT_RINGS.start.strokeWidth);
  });

  it('draws an intermediate and a boundary event with a double ring', () => {
    expect(EVENT_RINGS.intermediate.rings).toBe(2);
    expect(EVENT_RINGS.boundary.rings).toBe(2);
  });
});

describe('faceCentreIntersect', () => {
  const node = { id: 'n', x: 100, y: 50 } as Node;

  it.each([
    ['above', { x: 100, y: -100 }, { x: 100, y: 30 }],
    ['below', { x: 100, y: 200 }, { x: 100, y: 70 }],
    ['the left', { x: -100, y: 50 }, { x: 80, y: 50 }],
    ['the right', { x: 300, y: 50 }, { x: 120, y: 50 }],
  ])('docks a flow arriving from %s on the middle of that border', (_label, from, expected) => {
    expect(faceCentreIntersect(node, 40, 40, from)).toEqual(expected);
  });

  it('chooses the face by the box aspect, not by the raw angle', () => {
    // A short, wide box takes a 45-degree approach on its bottom edge, because relative
    // to its own proportions that approach is mostly vertical.
    expect(faceCentreIntersect(node, 100, 40, { x: 160, y: 110 })).toEqual({ x: 100, y: 70 });
  });
});

describe('the message marker', () => {
  const glyph = bpmnIcons.icons.message.body;

  it('draws the envelope fold as a line of its own', () => {
    expect(glyph).toContain('bpmn-glyph-fold');
  });

  // A throwing marker is filled. Filling the fold along with the envelope leaves a
  // plain rectangle, which is not what the notation draws (BPMN 2.0.2, Table 10.93).
  it('leaves that fold unfilled where the marker is filled', () => {
    const theme = {
      border: '#999',
      edgeLabelBackground: '#fff',
      fontFamily: 'sans-serif',
      lineColor: '#333',
      mainBkg: '#fafafa',
      nodeBorder: '#666',
      nodeTextColor: '#111',
      tertiaryColor: '#eee',
      textColor: '#111',
      titleColor: '#111',
    };
    const sheet = bpmnStyles(theme as Parameters<typeof bpmnStyles>[0]).replace(/\s+/g, ' ');
    expect(sheet).toMatch(/\.bpmn-throw[^{]*\.bpmn-glyph-fold\s*{[^}]*fill:\s*none/);
  });
});
