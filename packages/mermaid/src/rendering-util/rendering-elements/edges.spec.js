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

import {
  generateRoundedPath,
  insertEdge,
  resolveEdgeCornerRadius,
  resolveEdgeCurveType,
  setTerminalWidth,
} from './edges.js';
import { getConfig } from '../../diagram-api/diagramAPI.js';
import { computeLabelTransform } from '../labelTransform.js';
import intersectRect from './intersect/intersect-rect.js';

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

describe('rounded edge corners', () => {
  it('uses a valid configured radius and defaults invalid values', () => {
    expect(resolveEdgeCornerRadius(12)).toBe(12);
    expect(resolveEdgeCornerRadius(0)).toBe(0);
    expect(resolveEdgeCornerRadius(-1)).toBe(5);
    expect(resolveEdgeCornerRadius(Number.NaN)).toBe(5);
  });

  it('changes the rounded path geometry with the corner radius', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 40 },
    ];

    expect(generateRoundedPath(points, 5)).not.toBe(generateRoundedPath(points, 12));
    expect(generateRoundedPath(points, 0)).toBe('M0,0L40,0Q40,0 40,0L40,40');
  });
});

describe('insertEdge non-grid compatibility', () => {
  const layouts = ['dagre', 'elk', 'swimlane'];
  const points = [
    { x: 0, y: 0 },
    { x: 0, y: 20 },
    { x: 20, y: 20 },
    { x: 20, y: 40 },
  ];

  const setLayout = (layout) => {
    vi.mocked(getConfig).mockReturnValue({
      layout,
      flowchart: { curve: 'rounded', arrowMarkerAbsolute: false },
      state: { arrowMarkerAbsolute: false },
      handDrawnSeed: 0,
    });
  };

  const makeEdge = (overrides = {}) => ({
    id: 'non-grid-edge',
    cssCompiledStyles: {},
    style: [],
    thickness: 'normal',
    pattern: 'solid',
    classes: 'flowchart-link',
    look: 'classic',
    arrowTypeStart: 'none',
    arrowTypeEnd: 'none',
    points,
    ...overrides,
  });

  it.each(layouts)('%s linear edges retain legacy corner fixing', (layout) => {
    setLayout(layout);
    document.body.innerHTML = '';
    const svg = select(document.body).append('svg');

    insertEdge(
      svg,
      makeEdge({ curve: 'linear' }),
      null,
      'flowchart-v2',
      { intersect: vi.fn(() => points[0]) },
      { intersect: vi.fn(() => points.at(-1)) },
      'diagram'
    );

    const path = svg.select('path');
    expect(JSON.parse(atob(path.attr('data-points')))).toEqual(points);
    expect(path.attr('d')).not.toBe('M0,0L0,20L20,20L20,40');
    expect(path.attr('d').match(/L/g)).toHaveLength(7);
  });

  it.each(layouts)('%s rounded edges default to a 5px corner radius', (layout) => {
    setLayout(layout);
    document.body.innerHTML = '';
    const svg = select(document.body).append('svg');

    insertEdge(
      svg,
      makeEdge({ curve: 'rounded' }),
      null,
      'flowchart-v2',
      { intersect: vi.fn(() => points[0]) },
      { intersect: vi.fn(() => points.at(-1)) },
      'diagram'
    );

    expect(svg.select('path').attr('d')).toBe(generateRoundedPath(points, 5));
  });

  it.each(layouts)('%s edges do not use grid orthogonal clipping', (layout) => {
    setLayout(layout);
    document.body.innerHTML = '';
    const svg = select(document.body).append('svg');
    const clippedStart = { x: -5, y: -5 };
    const clippedEnd = { x: 25, y: 45 };

    insertEdge(
      svg,
      makeEdge({ curve: 'linear', skipCornerFix: true }),
      null,
      'flowchart-v2',
      { intersect: vi.fn(() => clippedStart) },
      { intersect: vi.fn(() => clippedEnd) },
      'diagram'
    );

    expect(JSON.parse(atob(svg.select('path').attr('data-points')))).toEqual([
      clippedStart,
      points[1],
      points[2],
      clippedEnd,
    ]);
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
});

describe('insertEdge orthogonal endpoint clipping', () => {
  it('clips router-owned ports to shape outlines with orthogonal endpoint doglegs', () => {
    vi.mocked(getConfig).mockReturnValue({
      layout: 'dagre',
      flowchart: { curve: 'rounded', arrowMarkerAbsolute: false },
      state: { arrowMarkerAbsolute: false },
      handDrawnSeed: 0,
    });
    document.body.innerHTML = '';
    const svg = select(document.body).append('svg');
    const points = [
      { x: 130, y: 110 },
      { x: 100, y: 110 },
      { x: 100, y: 34 },
      { x: 80, y: 34 },
    ];
    const edge = {
      id: 'v2p-v1',
      cssCompiledStyles: {},
      style: [],
      thickness: 'normal',
      pattern: 'solid',
      classes: 'flowchart-link',
      curve: 'linear',
      look: 'classic',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
      portClipping: 'outline-orthogonal',
      skipCornerFix: true,
      points,
    };
    const tail = {
      intersect: vi.fn(() => ({ x: 135, y: 101.25 })),
    };
    const head = {
      intersect: vi.fn(() => ({ x: 75, y: 29.33 })),
    };

    insertEdge(svg, edge, null, 'flowchart-v2', tail, head, 'diagram');

    const path = svg.select('path');
    const renderedPoints = JSON.parse(atob(path.attr('data-points')));
    expect(tail.intersect).toHaveBeenCalledWith(points[1]);
    expect(head.intersect).toHaveBeenCalledWith(points.at(-2));
    expect(renderedPoints).toEqual([
      { x: 135, y: 101.25 },
      { x: 100, y: 101.25 },
      { x: 100, y: 110 },
      { x: 100, y: 34 },
      { x: 100, y: 29.33 },
      { x: 75, y: 29.33 },
    ]);
    for (let index = 1; index < renderedPoints.length; index++) {
      const previous = renderedPoints[index - 1];
      const current = renderedPoints[index];
      expect(current.x === previous.x || current.y === previous.y).toBe(true);
    }
  });

  it('keeps rectangular outline points unchanged', () => {
    vi.mocked(getConfig).mockReturnValue({
      layout: 'dagre',
      flowchart: { curve: 'rounded', arrowMarkerAbsolute: false },
      state: { arrowMarkerAbsolute: false },
      handDrawnSeed: 0,
    });
    document.body.innerHTML = '';
    const svg = select(document.body).append('svg');
    const points = [
      { x: 140, y: 108 },
      { x: 80, y: 108 },
      { x: 80, y: 192 },
      { x: 20, y: 192 },
    ];
    const edge = {
      id: 'rectangular-grid-edge',
      cssCompiledStyles: {},
      style: [],
      thickness: 'normal',
      pattern: 'solid',
      classes: 'flowchart-link',
      curve: 'linear',
      look: 'classic',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
      portClipping: 'outline-orthogonal',
      skipCornerFix: true,
      points,
    };

    insertEdge(
      svg,
      edge,
      null,
      'flowchart-v2',
      {
        intersect: vi.fn((point) =>
          intersectRect({ x: 200, y: 100, width: 120, height: 60 }, point)
        ),
      },
      {
        intersect: vi.fn((point) =>
          intersectRect({ x: -40, y: 200, width: 120, height: 60 }, point)
        ),
      },
      'diagram'
    );

    expect(JSON.parse(atob(svg.select('path').attr('data-points')))).toEqual(points);
  });

  it('keeps a two-point route orthogonal when both shape outlines are inset', () => {
    vi.mocked(getConfig).mockReturnValue({
      layout: 'dagre',
      flowchart: { curve: 'rounded', arrowMarkerAbsolute: false },
      state: { arrowMarkerAbsolute: false },
      handDrawnSeed: 0,
    });
    document.body.innerHTML = '';
    const svg = select(document.body).append('svg');
    const edge = {
      id: 'direct-grid-edge',
      cssCompiledStyles: {},
      style: [],
      thickness: 'normal',
      pattern: 'solid',
      classes: 'flowchart-link',
      curve: 'linear',
      look: 'classic',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
      portClipping: 'outline-orthogonal',
      skipCornerFix: true,
      points: [
        { x: 0, y: 10 },
        { x: 100, y: 10 },
      ],
    };

    insertEdge(
      svg,
      edge,
      null,
      'flowchart-v2',
      { intersect: vi.fn(() => ({ x: -10, y: 5 })) },
      { intersect: vi.fn(() => ({ x: 110, y: 15 })) },
      'diagram'
    );

    expect(JSON.parse(atob(svg.select('path').attr('data-points')))).toEqual([
      { x: -10, y: 5 },
      { x: 50, y: 5 },
      { x: 50, y: 15 },
      { x: 110, y: 15 },
    ]);
  });

  it('skips grid endpoint clipping when skipIntersect is true', () => {
    vi.mocked(getConfig).mockReturnValue({
      layout: 'grid',
      flowchart: { curve: 'rounded', arrowMarkerAbsolute: false },
      state: { arrowMarkerAbsolute: false },
      handDrawnSeed: 0,
    });
    document.body.innerHTML = '';
    const svg = select(document.body).append('svg');
    const points = [
      { x: 0, y: 10 },
      { x: 100, y: 10 },
    ];
    const edge = {
      id: 'skipped-grid-clipping',
      cssCompiledStyles: {},
      style: [],
      thickness: 'normal',
      pattern: 'solid',
      classes: 'flowchart-link',
      curve: 'linear',
      look: 'classic',
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
      portClipping: 'outline-orthogonal',
      skipCornerFix: true,
      points,
    };
    const tail = { intersect: vi.fn(() => ({ x: -10, y: 5 })) };
    const head = { intersect: vi.fn(() => ({ x: 110, y: 15 })) };

    insertEdge(svg, edge, null, 'flowchart-v2', tail, head, 'diagram', true);

    expect(tail.intersect).not.toHaveBeenCalled();
    expect(head.intersect).not.toHaveBeenCalled();
    expect(JSON.parse(atob(svg.select('path').attr('data-points')))).toEqual(points);
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
