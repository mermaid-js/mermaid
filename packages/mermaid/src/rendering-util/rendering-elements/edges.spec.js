import { describe, it, expect, vi } from 'vitest';
import { select } from 'd3';

// Mock getConfig to control flowchart.curve
vi.mock('../../diagram-api/diagramAPI.js', () => ({
  getConfig: vi.fn(() => ({
    layout: 'swimlane',
    flowchart: { curve: 'rounded', arrowMarkerAbsolute: false },
    state: { arrowMarkerAbsolute: false },
    handDrawnSeed: 0,
  })),
}));

import { insertEdge, resolveEdgeCurveType, setTerminalWidth } from './edges.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { computeLabelTransform } from '../labelTransform.js';
import intersectCircle from './intersect/intersect-circle.js';
import intersectPolygon from './intersect/intersect-polygon.js';
import intersectRect from './intersect/intersect-rect.js';

describe('insertEdge clips for the engine that drew the edge', () => {
  /** A shape that reads the point it is handed, the way every real one does. */
  const shapeMeeting = () => ({ intersect: vi.fn((point) => ({ x: point.x, y: point.y })) });

  /** A straight two-point route, which is what a swimlane lane gives a simple chain. */
  const twoPointEdge = () => ({
    id: 'L_a_b_0',
    cssCompiledStyles: {},
    style: [],
    thickness: 'normal',
    pattern: 'solid',
    classes: 'bpmn-flow',
    curve: 'rounded',
    look: 'classic',
    arrowTypeEnd: 'arrow_point',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
    ],
  });

  const withConfiguredLayout = (name, run) => {
    const configured = vi.mocked(getConfig);
    const previous = configured.getMockImplementation();
    configured.mockImplementation(() => ({
      layout: name,
      flowchart: { curve: 'rounded', arrowMarkerAbsolute: false },
      state: { arrowMarkerAbsolute: false },
      handDrawnSeed: 0,
    }));
    try {
      return run();
    } finally {
      configured.mockImplementation(previous);
    }
  };

  it('takes the swimlane path when the layout data says so and the config disagrees', () => {
    document.body.innerHTML = '';
    const svg = select(document.body).append('svg');

    withConfiguredLayout('elk', () => {
      insertEdge(
        svg,
        twoPointEdge(),
        null,
        'bpmn',
        shapeMeeting(),
        shapeMeeting(),
        'd',
        false,
        'swimlane'
      );
    });

    const drawn = JSON.parse(atob(svg.select('path').attr('data-points')));
    expect(drawn).toHaveLength(2);
  });

  it('would empty a two-point route if it went by the configured layout instead', () => {
    // The clipping written for dagre drops the first and last point, which leaves a
    // two-point route with nothing to meet. A bpmn diagram is always laid out in
    // swimlanes while `layout` resolves to the global default, so the two disagree and
    // this is what the argument above exists to prevent.
    document.body.innerHTML = '';
    const svg = select(document.body).append('svg');

    withConfiguredLayout('elk', () => {
      expect(() =>
        insertEdge(svg, twoPointEdge(), null, 'bpmn', shapeMeeting(), shapeMeeting(), 'd')
      ).toThrow(TypeError);
    });
  });
});

describe('resolveEdgeCurveType', () => {
  it('should return edge.curve when it is a string', () => {
    expect(resolveEdgeCurveType('linear')).toBe('linear');
    expect(resolveEdgeCurveType('basis')).toBe('basis');
    expect(resolveEdgeCurveType('rounded')).toBe('rounded');
    expect(resolveEdgeCurveType('cardinal')).toBe('cardinal');
  });

  it('should fall back to config flowchart.curve when edge.curve is undefined', () => {
    // When edge.curve is undefined, should resolve from config (which is mocked as 'rounded')
    expect(resolveEdgeCurveType(undefined)).toBe('rounded');
  });

  it('should fall back to config flowchart.curve when edge.curve is not a string (D3 function)', () => {
    // Class diagrams and other non-flowchart types may pass a D3 CurveFactory function
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const fakeCurveFactory = () => {};
    expect(resolveEdgeCurveType(fakeCurveFactory)).toBe('rounded');
  });

  it('should fall back to config flowchart.curve when edge.curve is null', () => {
    expect(resolveEdgeCurveType(null)).toBe('rounded');
  });
});

describe('computeLabelTransform', () => {
  it('accounts for bbox.x/y offsets when centering SVG label (htmlLabels: false)', () => {
    // bbox.x = -2 simulates the 2px padding of the background <rect> added by
    // createFormattedText when addSvgBackground is true.
    // -(bbox.x + bbox.width / 2)  = -(-2 + 18) = -16
    // -(bbox.y + bbox.height / 2) = -(-3 + 10) = -7
    expect(computeLabelTransform({ x: -2, y: -3, width: 36, height: 20 }, false)).toBe(
      'translate(-16, -7)'
    );
  });

  it('centers SVG label correctly when bbox origin is at zero (no background offset)', () => {
    // -(0 + 20) = -20, -(0 + 10) = -10
    expect(computeLabelTransform({ x: 0, y: 0, width: 40, height: 20 }, false)).toBe(
      'translate(-20, -10)'
    );
  });

  it('centers HTML label using only width/height (ignores bbox.x/y) when htmlLabels: true', () => {
    // getBoundingClientRect() returns viewport-absolute coords; x/y are irrelevant for SVG positioning.
    // Even if x/y were non-zero, they must not affect the transform.
    // -width / 2 = -20, -height / 2 = -10
    expect(computeLabelTransform({ x: 999, y: 999, width: 40, height: 20 }, true)).toBe(
      'translate(-20, -10)'
    );
  });
});

describe('insertEdge swimlane endpoint clipping', () => {
  it('honors duplicated endpoint pins instead of recomputing polygon intersections', () => {
    document.body.innerHTML = '';
    const svg = select(document.body).append('svg');
    const pinnedEnd = { x: -100, y: 53 };
    const edge = {
      id: 'L_Sys1_B_0',
      cssCompiledStyles: {},
      style: [],
      thickness: 'normal',
      pattern: 'solid',
      classes: 'flowchart-link',
      curve: 'rounded',
      look: 'neo',
      arrowTypeEnd: 'arrow_point',
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 20 },
        { x: -100, y: 20 },
        pinnedEnd,
        { ...pinnedEnd },
      ],
    };
    const tail = {
      intersect: vi.fn((point) => point),
    };
    const head = {
      intersect: vi.fn(() => ({ x: -101, y: 54 })),
    };

    insertEdge(svg, edge, null, 'swimlane', tail, head, 'diagram');

    const path = svg.select('path');
    const renderedPoints = JSON.parse(atob(path.attr('data-points')));

    expect(head.intersect).not.toHaveBeenCalled();
    expect(renderedPoints.at(-1)).toEqual(pinnedEnd);
  });

  it('still clips source endpoints to the rendered shape boundary', () => {
    document.body.innerHTML = '';
    const svg = select(document.body).append('svg');
    const clippedStart = { x: 8, y: 12 };
    const edge = {
      id: 'L_A2_E_0',
      cssCompiledStyles: {},
      style: [],
      thickness: 'normal',
      pattern: 'solid',
      classes: 'flowchart-link',
      curve: 'rounded',
      look: 'neo',
      arrowTypeEnd: 'arrow_point',
      points: [
        { x: 10, y: 14 },
        { x: 10, y: 14 },
        { x: 10, y: 60 },
        { x: 90, y: 60 },
      ],
    };
    const tail = {
      intersect: vi.fn(() => clippedStart),
    };
    const head = {
      intersect: vi.fn((point) => point),
    };

    insertEdge(svg, edge, null, 'swimlane', tail, head, 'diagram');

    const path = svg.select('path');
    const renderedPoints = JSON.parse(atob(path.attr('data-points')));

    expect(tail.intersect).toHaveBeenCalledWith({ x: 10, y: 14 });
    expect(renderedPoints[0]).toEqual(clippedStart);
  });

  it('leaves exact endpoints alone when the edge skips intersection', () => {
    document.body.innerHTML = '';
    const svg = select(document.body).append('svg');
    const first = { x: 10, y: 14 };
    const last = { x: 90, y: 60 };
    const edge = {
      id: 'L_A3_E_0',
      cssCompiledStyles: {},
      style: [],
      thickness: 'normal',
      pattern: 'solid',
      classes: 'flowchart-link',
      curve: 'rounded',
      look: 'neo',
      arrowTypeEnd: 'arrow_point',
      points: [first, { x: 10, y: 60 }, last],
    };
    const tail = { intersect: vi.fn(() => ({ x: 8, y: 12 })) };
    const head = { intersect: vi.fn(() => ({ x: 92, y: 62 })) };

    insertEdge(svg, edge, null, 'swimlane', tail, head, 'diagram', true);

    const renderedPoints = JSON.parse(atob(svg.select('path').attr('data-points')));

    expect(tail.intersect).not.toHaveBeenCalled();
    expect(head.intersect).not.toHaveBeenCalled();
    expect(renderedPoints[0]).toEqual(first);
    expect(renderedPoints.at(-1)).toEqual(last);
  });
});

describe('setTerminalWidth', () => {
  // #8329: a hard-coded 12px height clipped the bottom of cardinalities whose text is 21px tall.
  it('never sizes the terminal label box smaller than the measured label', () => {
    const fo = { style: {} };
    setTerminalWidth(fo, '0..1', { width: 23.4, height: 21 });
    expect(parseFloat(fo.style.height)).toBeGreaterThanOrEqual(21);
    expect(parseFloat(fo.style.width)).toBeGreaterThanOrEqual(23.4);
  });

  it('keeps the width reserved per character for short labels', () => {
    const fo = { style: {} };
    setTerminalWidth(fo, '1', { width: 7.8, height: 21 });
    expect(fo.style.width).toBe('9px');
  });
});

describe('insertEdge subgraph boundary clipping', () => {
  const source = { x: 0, y: 0, width: 80, height: 80 };
  const target = { x: 300, y: 50, width: 80, height: 80 };
  const clusterDb = new Map([
    ['source', { node: { ...source, width: 120, height: 120 } }],
    ['target', { node: { ...target, width: 200, height: 160 } }],
  ]);
  const diamond = [
    { x: 40, y: 0 },
    { x: 80, y: -40 },
    { x: 40, y: -80 },
    { x: 0, y: -40 },
  ];
  const shapes = [
    {
      name: 'diamond',
      intersect: (point) => intersectPolygon(source, diamond, point),
      start: [26.667, 13.333],
    },
    {
      name: 'circle',
      intersect: (point) => intersectCircle(source, 40, point),
      start: [35.777, 17.889],
    },
    {
      name: 'rectangle',
      intersect: (point) => intersectRect(source, point),
      start: [40, 20],
    },
  ];
  const createEdge = () => ({
    id: 'L_f_c_0',
    cssCompiledStyles: {},
    style: [],
    thickness: 'normal',
    pattern: 'solid',
    classes: 'flowchart-link',
    curve: 'linear',
    look: 'classic',
    arrowTypeEnd: 'arrow_point',
    toCluster: 'target',
    points: [
      { x: 40, y: 20 },
      { x: 100, y: 50 },
      { x: 250, y: 50 },
      { x: 260, y: 50 },
    ],
  });
  const render = (edge, tail, head, layout = 'dagre', skipIntersect = false) => {
    document.body.innerHTML = '';
    const svg = select(document.body).append('svg');
    insertEdge(svg, edge, clusterDb, 'flowchart', tail, head, 'diagram', skipIntersect, layout);
    return svg.select('path').attr('d');
  };
  const rectangleHead = { intersect: (point) => intersectRect(target, point) };

  describe.each(['dagre', 'swimlane'])('%s', (layout) => {
    describe.each(['classic', 'neo'])('%s', (look) => {
      it.each(shapes)(
        'keeps the $name source on its boundary when targeting a subgraph',
        (shape) => {
          const path = render({ ...createEdge(), look }, shape, rectangleHead, layout);
          const start = /^M([^,]+),([^L]+)/.exec(path).slice(1).map(Number);
          expect(start[0]).toBeCloseTo(shape.start[0], 3);
          expect(start[1]).toBeCloseTo(shape.start[1], 3);
          expect(path).toMatch(/L196,50$/);
        }
      );
    });
  });

  it.each(shapes.slice(0, 2))('keeps the hand-drawn $name source near its boundary', (shape) => {
    const configured = vi.mocked(getConfig);
    const previous = configured.getMockImplementation();
    configured.mockImplementationOnce(() => ({ ...previous(), handDrawnSeed: 42 }));
    const path = render({ ...createEdge(), look: 'handDrawn' }, shape, rectangleHead);
    const start = path
      .match(/-?\d+(?:\.\d+)?/g)
      .slice(0, 2)
      .map(Number);
    expect(Math.hypot(start[0] - shape.start[0], start[1] - shape.start[1])).toBeLessThan(1);
  });

  it.each(shapes)('clips the $name source when the target subgraph was extracted', (shape) => {
    const edge = { ...createEdge(), toCluster: undefined };
    const path = render(edge, shape, { ...target, clusterNode: true });
    const start = /^M([^,]+),([^L]+)/.exec(path).slice(1).map(Number);
    expect(start[0]).toBeCloseTo(shape.start[0], 3);
    expect(start[1]).toBeCloseTo(shape.start[1], 3);
    expect(path).toMatch(/L256,50$/);
  });

  it('preserves the source port on an extracted subgraph edge when intersection is skipped', () => {
    const edge = { ...createEdge(), toCluster: undefined };
    const path = render(edge, shapes[0], { ...target, clusterNode: true }, 'dagre', true);
    expect(path).toBe('M40,20L100,50L250,50L256,50');
  });

  it('keeps a finite arrow tip when an inner point already meets the target subgraph', () => {
    const edge = createEdge();
    edge.points[2] = { x: 200, y: 50 };
    const head = { intersect: (point) => intersectRect(clusterDb.get('target').node, point) };
    const path = render(edge, shapes[0], head);
    expect(path).toBe('M26.667,13.333L100,50L196,50');
  });

  it('preserves exact source endpoints when intersection is skipped', () => {
    const edge = createEdge();
    edge.points[0] = { x: 30, y: 15 };
    const path = render(edge, shapes[0], rectangleHead, 'dagre', true);
    expect(path).toBe('M30,15L100,50L196,50');
  });

  it('keeps the circular target boundary when starting at a subgraph', () => {
    const edge = {
      ...createEdge(),
      toCluster: undefined,
      fromCluster: 'source',
      arrowTypeEnd: 'none',
      points: [
        { x: 40, y: 20 },
        { x: 100, y: 50 },
        { x: 250, y: 75 },
        { x: 260, y: 70 },
      ],
    };
    const path = render(edge, shapes[2], {
      intersect: (point) => intersectCircle(target, 40, point),
    });
    expect(path).toBe('M60,40L100,50L250,75L264.223,67.889');
  });

  it('clips both subgraph boundaries when connecting two subgraphs', () => {
    const path = render({ ...createEdge(), fromCluster: 'source' }, shapes[2], rectangleHead);
    expect(path).toBe('M60,40L100,50L196,50');
  });
});
