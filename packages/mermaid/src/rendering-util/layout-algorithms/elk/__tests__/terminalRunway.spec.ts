import { describe, expect, it } from 'vitest';
import {
  terminalClearance,
  terminalDeficit,
  minimumRawLead,
  readTerminalRunway,
  reserveTerminalLayoutSpace,
  type TerminalRunway,
} from '../terminalRunway.js';
import { reduceRouteBends, routeBends } from '../bendReduction.js';
import { processEdgesWithJumps } from '../../../rendering-elements/lineJump.js';
const head = { offset: 4, back: 10, lead: 12 };
const end: TerminalRunway = { end: head, rounded: true };
describe('straight marker lead-in, not bend-then-arrow', () => {
  it('counts marker body, pullback and the actual rounded corner, not only raw leg length', () => {
    const p = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 10 },
    ];
    expect(terminalClearance(p, end, 'end')).toBeLessThan(0);
    expect(terminalDeficit(p, end)).toBeGreaterThan(12);
    expect(minimumRawLead(head)).toBeGreaterThan(30);
  });
  it('repairs a cramped one-elbow arrow using the least available three-elbow route', () => {
    const p = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 10 },
    ];
    const r = reduceRouteBends(p, [], [], [], [], end);
    expect(terminalDeficit(r, end)).toBeLessThan(0.01);
    expect(routeBends(r)).toBe(3);
    expect(r[0]).toEqual(p[0]);
    expect(r.at(-1)).toEqual(p.at(-1));
    expect(p).toHaveLength(3);
  });
  it('protects both heads without routing through the source or target body', () => {
    const p = [
      { x: 0, y: 0 },
      { x: 0, y: 5 },
      { x: 100, y: 5 },
      { x: 100, y: 10 },
    ];
    const policy: TerminalRunway = {
      start: head,
      end: head,
      rounded: true,
      startBounds: { left: -10, right: 10, top: -40, bottom: 0 },
      endBounds: { left: 90, right: 110, top: 10, bottom: 50 },
    };
    const r = reduceRouteBends(p, [], [], [], [], policy);
    expect(terminalDeficit(r, policy)).toBeLessThan(0.01);
    expect(routeBends(r)).toBe(4);
  });
  it('never shortens a valid terminal runway merely to remove two bends', () => {
    const p = [
      { x: 0, y: 0 },
      { x: 60, y: 0 },
      { x: 60, y: -40 },
      { x: 100, y: -40 },
      { x: 100, y: 10 },
    ];
    const r = reduceRouteBends(p, [], [], [], [], end);
    expect(terminalDeficit(r, end)).toBeLessThan(0.01);
    expect(routeBends(r)).toBe(3);
  });
  it('does not gratuitously lengthen a completely straight short connection', () => {
    const p = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    expect(terminalDeficit(p, { start: head, end: head })).toBe(0);
    expect(reduceRouteBends(p, [], [], [], [], end)).toEqual(p);
  });
  it('keeps an impossible case observable instead of hiding a malformed marker', () => {
    const p = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 10 },
    ];
    const r = reduceRouteBends(
      p,
      [],
      [{ left: -50, right: 150, top: -100, bottom: 100 }],
      [],
      [],
      end
    );
    expect(r).toEqual(p);
    expect(terminalDeficit(r, end)).toBeGreaterThan(0);
  });
  it('scales the runway to the SVG marker viewport and markerUnits stroke width', () => {
    const ns = 'http://www.w3.org/2000/svg',
      svg = document.createElementNS(ns, 'svg'),
      m = document.createElementNS(ns, 'marker'),
      p = document.createElementNS(ns, 'path');
    m.id = 'runway-marker';
    for (const [k, v] of Object.entries({
      viewBox: '0 0 12 12',
      refX: '12',
      markerWidth: '12',
      markerHeight: '12',
    })) {
      m.setAttribute(k, v);
    }
    svg.append(m, p);
    p.setAttribute('marker-end', 'url(#runway-marker)');
    p.style.strokeWidth = '3px';
    document.body.append(svg);
    const stroke = readTerminalRunway(p, { arrowTypeEnd: 'arrow_point' });
    m.setAttribute('markerUnits', 'userSpaceOnUse');
    const user = readTerminalRunway(p, { arrowTypeEnd: 'arrow_point' });
    expect(stroke.end!.back).toBe(38);
    expect(user.end!.back).toBe(14);
    expect(stroke.end!.offset).toBe(4);
    svg.remove();
  });
  it('moves a hop to the counterpart instead of curving beside an end marker', () => {
    const paths = processEdgesWithJumps(
      [
        {
          id: 'h',
          points: [
            { x: 0, y: 50 },
            { x: 100, y: 50 },
          ],
          terminalClearanceEnd: 25,
        },
        {
          id: 'v',
          points: [
            { x: 85, y: 0 },
            { x: 85, y: 100 },
          ],
        },
      ],
      { enabled: true, jumpRadius: 6, jumpStyle: 'arc' }
    );
    expect(paths.get('h')).not.toContain('A');
    expect(paths.get('v')).toContain('A6,6');
  });
  it('applies the same hop guard to start arrows and gap style', () => {
    const paths = processEdgesWithJumps(
      [
        {
          id: 'h',
          points: [
            { x: 0, y: 50 },
            { x: 100, y: 50 },
          ],
          terminalClearanceStart: 25,
        },
        {
          id: 'v',
          points: [
            { x: 15, y: 0 },
            { x: 15, y: 100 },
          ],
        },
      ],
      { enabled: true, jumpRadius: 6, jumpStyle: 'gap' }
    );
    expect(paths.get('h')).toBe('M0,50 L100,50');
    expect(paths.get('v')).toContain('M15,56');
  });
});

describe('placement reserves space for real arrow approaches', () => {
  it('reserves both routing lanes and a title-safe approach inside nested groups', () => {
    const graph = {
      layoutOptions: {},
      children: [
        {
          layoutOptions: { 'elk.padding': '[top=80,left=24,bottom=24,right=24]' },
          children: [{ id: 'node' }],
        },
      ],
    };
    reserveTerminalLayoutSpace(graph, 36);
    expect((graph.layoutOptions as any)['elk.layered.spacing.edgeNodeBetweenLayers']).toBe(36);
    expect(graph.children[0].layoutOptions['elk.padding']).toBe(
      '[top=80,left=52,bottom=52,right=52]'
    );
    expect((graph.layoutOptions as any)['elk.padding']).toBeUndefined();
  });
  it('does not enlarge unarrowed layouts or reduce larger requested spacing', () => {
    const graph = { layoutOptions: { 'elk.layered.spacing.edgeNodeBetweenLayers': 100 } };
    reserveTerminalLayoutSpace(graph, 0);
    expect(graph.layoutOptions).toEqual({ 'elk.layered.spacing.edgeNodeBetweenLayers': 100 });
    reserveTerminalLayoutSpace(graph, 36);
    expect((graph.layoutOptions as any)['elk.layered.spacing.edgeNodeBetweenLayers']).toBe(100);
  });
});
