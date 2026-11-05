import { describe, expect, it } from 'vitest';
import {
  clipEdgeEndpointsToNodeBoundaries,
  cropEdgeEndsToShapes,
  prepareEdgeEndpointsForRenderer,
} from '../direction/endpointClip.js';

describe('direction endpoint clipping', () => {
  it('clips buried endpoints to source and destination node boundaries', () => {
    const nodeById = new Map<string, any>([
      ['A', { id: 'A', x: 0, y: 0, width: 10, height: 10 }],
      ['B', { id: 'B', x: 20, y: 0, width: 10, height: 10 }],
    ]);
    const edges: any[] = [
      {
        id: 'A_B',
        start: 'A',
        end: 'B',
        points: [
          { x: 0, y: 0 },
          { x: 20, y: 0 },
        ],
      },
    ];

    clipEdgeEndpointsToNodeBoundaries(edges, nodeById);

    expect(edges[0].points).toEqual([
      { x: 5, y: 0 },
      { x: 15, y: 0 },
    ]);
  });

  it('moves straight side-to-side endpoints away from node corners', () => {
    const nodeById = new Map<string, any>([
      ['A', { id: 'A', x: 0, y: 0, width: 20, height: 20 }],
      ['B', { id: 'B', x: 40, y: 0, width: 20, height: 40 }],
    ]);
    const edges: any[] = [
      {
        id: 'A_B',
        start: 'A',
        end: 'B',
        points: [
          { x: 10, y: 8 },
          { x: 30, y: 8 },
        ],
      },
    ];

    clipEdgeEndpointsToNodeBoundaries(edges, nodeById);

    expect(edges[0].points).toEqual([
      { x: 10, y: 6 },
      { x: 30, y: 6 },
    ]);
  });

  it('duplicates snapped endpoints so renderer clipping becomes a no-op', () => {
    const nodeById = new Map<string, any>([
      ['A', { id: 'A', x: 0, y: 0, width: 10, height: 10 }],
      ['B', { id: 'B', x: 20, y: 0, width: 10, height: 10 }],
    ]);
    const edges: any[] = [
      {
        id: 'A_B',
        start: 'A',
        end: 'B',
        points: [
          { x: -5, y: 0 },
          { x: 10, y: 0 },
          { x: 15, y: 0 },
        ],
      },
    ];

    prepareEdgeEndpointsForRenderer(edges, nodeById);

    expect(edges[0].points).toEqual([
      { x: -5, y: 0 },
      { x: -5, y: 0 },
      { x: 10, y: 0 },
      { x: 15, y: 0 },
      { x: 15, y: 0 },
    ]);
  });

  it('is idempotent when renderer endpoints are already duplicated', () => {
    const nodeById = new Map<string, any>([
      ['A', { id: 'A', x: 0, y: 0, width: 10, height: 10 }],
      ['B', { id: 'B', x: 20, y: 0, width: 10, height: 10 }],
    ]);
    const edges: any[] = [
      {
        id: 'A_B',
        start: 'A',
        end: 'B',
        points: [
          { x: -5, y: 0 },
          { x: 10, y: 0 },
          { x: 15, y: 0 },
        ],
      },
    ];

    prepareEdgeEndpointsForRenderer(edges, nodeById);
    const once = edges[0].points.map((point: any) => ({ ...point }));
    prepareEdgeEndpointsForRenderer(edges, nodeById);

    expect(edges[0].points).toEqual(once);
  });

  it('keeps straight renderer edges two-point while clearing corner ports', () => {
    const nodeById = new Map<string, any>([
      ['A', { id: 'A', x: 0, y: 0, width: 20, height: 20 }],
      ['B', { id: 'B', x: 40, y: 0, width: 20, height: 40 }],
    ]);
    const edges: any[] = [
      {
        id: 'A_B',
        start: 'A',
        end: 'B',
        points: [
          { x: 10, y: 8 },
          { x: 30, y: 8 },
        ],
      },
    ];

    prepareEdgeEndpointsForRenderer(edges, nodeById);

    expect(edges[0].points).toEqual([
      { x: 10, y: 6 },
      { x: 30, y: 6 },
    ]);
  });

  it('snaps renderer endpoints to the boundary entered by the approach segment', () => {
    const nodeById = new Map<string, any>([
      ['A', { id: 'A', x: 0, y: 0, width: 10, height: 10 }],
      ['B', { id: 'B', x: 40, y: 40, width: 20, height: 20 }],
    ]);
    const edges: any[] = [
      {
        id: 'A_B',
        start: 'A',
        end: 'B',
        points: [
          { x: 5, y: 0 },
          { x: 40, y: 0 },
          { x: 40, y: 50 },
        ],
      },
    ];

    prepareEdgeEndpointsForRenderer(edges, nodeById);

    expect(edges[0].points).toEqual([
      { x: 5, y: 0 },
      { x: 5, y: 0 },
      { x: 40, y: 0 },
      { x: 40, y: 30 },
      { x: 40, y: 30 },
    ]);
  });
});

describe('cropping an edge end to the box it reaches', () => {
  // B is 100 x 40 around the origin; A sits below it, its top face at y 100.
  const nodes = (b: Record<string, unknown> = {}) =>
    new Map<string, any>([
      ['A', { id: 'A', x: 30, y: 120, width: 40, height: 40 }],
      ['B', { id: 'B', x: 0, y: 0, width: 100, height: 40, ...b }],
    ]);
  const cropped = (points: { x: number; y: number }[], nodeById = nodes(), end = 'B') => {
    const edges: any[] = [{ id: 'A_B', start: 'A', end, points }];
    cropEdgeEndsToShapes(edges, nodeById);
    return edges[0].points;
  };
  const intoB = [
    { x: 30, y: 100 },
    { x: 30, y: 60 },
    { x: -20, y: 60 },
  ];

  it('ends an edge that runs on inside its box where it first meets the box', () => {
    const points = cropped([...intoB, { x: -20, y: 0 }, { x: 50, y: 0 }]);

    expect(points).toEqual([...intoB, { x: -20, y: 20 }]);
  });

  it('leaves an edge that already ends on the face', () => {
    const points = cropped([...intoB, { x: -20, y: 20 }]);

    expect(points).toEqual([...intoB, { x: -20, y: 20 }]);
  });

  it('leaves an edge whose last segment runs along a face of its box', () => {
    const alongTop = [
      { x: 30, y: 100 },
      { x: 30, y: 60 },
      { x: -100, y: 60 },
      { x: -100, y: -20 },
      { x: 0, y: -20 },
    ];
    const alongBottom = [
      { x: 30, y: 100 },
      { x: 30, y: 60 },
      { x: 100, y: 60 },
      { x: 100, y: 20 },
      { x: 0, y: 20 },
    ];
    const almostAlongTop = [...alongTop.slice(0, -1), { x: 0, y: -20 + 1e-7 }];

    expect(cropped(alongTop)).toEqual(alongTop);
    expect(cropped(alongBottom)).toEqual(alongBottom);
    expect(cropped(almostAlongTop)).toEqual(almostAlongTop);
  });

  it('starts an edge that leaves its box from inside where it last meets the box', () => {
    const nodeById = new Map<string, any>([
      ['A', { id: 'A', x: 0, y: 0, width: 100, height: 40 }],
      ['B', { id: 'B', x: 80, y: 120, width: 40, height: 40 }],
    ]);
    const points = cropped(
      [
        { x: 0, y: 0 },
        { x: 80, y: 0 },
        { x: 80, y: 100 },
      ],
      nodeById
    );

    expect(points).toEqual([
      { x: 50, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 100 },
    ]);
  });

  it('crops to what the shape draws when it draws less than its box', () => {
    const points = cropped(
      [...intoB, { x: -20, y: 0 }],
      nodes({ metadata: { drawnExtent: { width: 60, height: 20 } } })
    );

    expect(points).toEqual([...intoB, { x: -20, y: 10 }]);
  });

  it('leaves a slanted segment that crosses the box', () => {
    const slanted = [
      { x: 30, y: 100 },
      { x: -20, y: 0 },
    ];

    expect(cropped(slanted)).toEqual(slanted);
  });

  it('leaves a self-loop', () => {
    const loop = [
      { x: 30, y: 100 },
      { x: 30, y: 60 },
      { x: 20, y: 60 },
      { x: 20, y: 100 },
    ];

    expect(cropped(loop, nodes(), 'A')).toEqual(loop);
  });

  it('leaves an edge into a group', () => {
    const route = [...intoB, { x: -20, y: 0 }];

    expect(cropped(route, nodes({ isGroup: true }))).toEqual(route);
  });

  it('leaves an edge out of a group', () => {
    const route = [...intoB, { x: -20, y: 0 }];
    const nodeById = nodes();
    nodeById.set('A', { ...nodeById.get('A'), isGroup: true });

    expect(cropped(route, nodeById)).toEqual(route);
  });

  it('leaves an edge that only steers the layout', () => {
    const route = [...intoB, { x: -20, y: 0 }];
    const edges: any[] = [{ id: 'A_B', start: 'A', end: 'B', isLayoutOnly: true, points: route }];

    cropEdgeEndsToShapes(edges, nodes());

    expect(edges[0].points).toEqual(route);
  });
});
