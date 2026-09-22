import { describe, expect, it } from 'vitest';
import {
  clipEdgeEndpointsToNodeBoundaries,
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
