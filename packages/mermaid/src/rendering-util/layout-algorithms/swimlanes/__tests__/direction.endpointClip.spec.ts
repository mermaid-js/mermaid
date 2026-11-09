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

  it('leaves a self-loop, even one that comes back into its box', () => {
    // The loop leaves A's top face at y 100 and comes back 10 px into A.
    const loop = [
      { x: 30, y: 100 },
      { x: 30, y: 60 },
      { x: 20, y: 60 },
      { x: 20, y: 110 },
    ];

    expect(cropped(loop, nodes(), 'A')).toEqual(loop);
  });

  it('leaves a route that cropping would leave with nothing to draw', () => {
    // A and B share the face at x 50, and the route runs from centre to centre.
    const touching = new Map([
      ['A', { id: 'A', x: 0, y: 0, width: 100, height: 40 }],
      ['B', { id: 'B', x: 100, y: 0, width: 100, height: 40 }],
    ]);
    const centreToCentre = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    const startsInsideB = [
      { x: 0, y: 10 },
      { x: 0, y: 0 },
    ];

    expect(cropped(centreToCentre, touching)).toEqual(centreToCentre);
    expect(cropped(startsInsideB)).toEqual(startsInsideB);
  });

  it('leaves an end at a shape that draws less than its box, and cuts the same route at a box', () => {
    // B is 100 x 100 around the origin. The route passes the top right corner of that box,
    // outside a circle drawn in it, and ends on the circle's right side at (50, 0).
    const route = [
      { x: 80, y: 120 },
      { x: 40, y: 120 },
      { x: 40, y: 40 },
      { x: 100, y: 40 },
      { x: 100, y: 0 },
      { x: 50, y: 0 },
    ];
    const endingAt = (shape?: string) =>
      new Map([
        ['A', { id: 'A', x: 80, y: 140, width: 40, height: 40 }],
        ['B', { id: 'B', x: 0, y: 0, width: 100, height: 100, shape }],
      ]);

    expect(cropped(structuredClone(route), endingAt('circle'))).toEqual(route);
    expect(cropped(structuredClone(route), endingAt('diamond'))).toEqual(route);
    // Rounded corners curve away from the box, and a fork or join bar is drawn inside its box.
    expect(cropped(structuredClone(route), endingAt('roundedRect'))).toEqual(route);
    expect(cropped(structuredClone(route), endingAt('fork'))).toEqual(route);
    expect(cropped(structuredClone(route), endingAt('squareRect'))).toEqual([
      { x: 80, y: 120 },
      { x: 40, y: 120 },
      { x: 40, y: 50 },
    ]);
  });

  it('leaves a start at a shape that draws less than its box, and cuts the same route at a box', () => {
    // The same route the other way: it leaves the circle's right side and passes the corner.
    const route = [
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 40 },
      { x: 40, y: 40 },
      { x: 40, y: 120 },
      { x: 80, y: 120 },
    ];
    const startingAt = (shape?: string) =>
      new Map([
        ['A', { id: 'A', x: 0, y: 0, width: 100, height: 100, shape }],
        ['B', { id: 'B', x: 80, y: 140, width: 40, height: 40 }],
      ]);

    expect(cropped(structuredClone(route), startingAt('circle'))).toEqual(route);
    expect(cropped(structuredClone(route), startingAt('squareRect'))).toEqual([
      { x: 40, y: 50 },
      { x: 40, y: 120 },
      { x: 80, y: 120 },
    ]);
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
