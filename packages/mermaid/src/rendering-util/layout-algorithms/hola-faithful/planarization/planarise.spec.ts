import { describe, expect, it } from 'vitest';
import type { HolaEdge, HolaNode } from '../model.js';
import { buildDcel } from './dcel.js';
import { mergeDuplicateSegments, planariseCore, PlanarisationError } from './planarise.js';
import { findCrossings } from './sweep.js';

const node = (id: string, x: number, y: number): HolaNode => ({
  id,
  x,
  y,
  width: 20,
  height: 20,
  inputOrder: 0,
  original: undefined,
});

const edge = (id: string, source: string, target: string, route: [number, number][]): HolaEdge => ({
  id,
  source,
  target,
  originalEdgeIds: [id],
  route: route.map(([x, y]) => ({ x, y })),
  mandatoryWaypoints: [],
});

describe('sweep', () => {
  it('reports a proper crossing', () => {
    const crossings = findCrossings([
      { id: 'h', a: { x: 0, y: 50 }, b: { x: 100, y: 50 } },
      { id: 'v', a: { x: 50, y: 0 }, b: { x: 50, y: 100 } },
    ]);
    expect(crossings).toHaveLength(1);
    expect(crossings[0].point).toEqual({ x: 50, y: 50 });
  });

  it('ignores a T-junction', () => {
    const crossings = findCrossings([
      { id: 'h', a: { x: 0, y: 50 }, b: { x: 100, y: 50 } },
      { id: 'v', a: { x: 50, y: 50 }, b: { x: 50, y: 100 } },
    ]);
    expect(crossings).toHaveLength(0);
  });

  it('ignores parallel segments', () => {
    const crossings = findCrossings([
      { id: 'h1', a: { x: 0, y: 50 }, b: { x: 100, y: 50 } },
      { id: 'h2', a: { x: 0, y: 50 }, b: { x: 100, y: 50 } },
    ]);
    expect(crossings).toHaveLength(0);
  });
});

describe('planariseCore', () => {
  it('rejects a diagonal route', () => {
    const nodes = new Map([
      ['a', node('a', 0, 0)],
      ['b', node('b', 100, 100)],
    ]);
    expect(() =>
      planariseCore(nodes, [
        edge('e', 'a', 'b', [
          [0, 0],
          [100, 100],
        ]),
      ])
    ).toThrow(PlanarisationError);
  });

  it('gives a rectangle exactly one inner and one outer face', () => {
    const nodes = new Map([
      ['a', node('a', 0, 0)],
      ['b', node('b', 200, 0)],
      ['c', node('c', 200, 200)],
      ['d', node('d', 0, 200)],
    ]);
    const planar = planariseCore(nodes, [
      edge('ab', 'a', 'b', [
        [0, 0],
        [200, 0],
      ]),
      edge('bc', 'b', 'c', [
        [200, 0],
        [200, 200],
      ]),
      edge('cd', 'c', 'd', [
        [200, 200],
        [0, 200],
      ]),
      edge('da', 'd', 'a', [
        [0, 200],
        [0, 0],
      ]),
    ]);

    expect(planar.dcel.faces).toHaveLength(2);
    expect(planar.dcel.faces.filter((f) => f.isExternal)).toHaveLength(1);
    const inner = planar.dcel.faces.find((f) => !f.isExternal);
    expect(inner).toBeDefined();
    expect(Math.abs(inner!.signedArea)).toBeCloseTo(200 * 200, 6);
  });

  it('creates a bend dummy for every interior route point', () => {
    const nodes = new Map([
      ['a', node('a', 0, 0)],
      ['b', node('b', 200, 200)],
    ]);
    const planar = planariseCore(nodes, [
      edge('ab', 'a', 'b', [
        [0, 0],
        [200, 0],
        [200, 200],
      ]),
    ]);
    const bends = [...planar.nodes.values()].filter((n) => n.kind === 'bend');
    expect(bends).toHaveLength(1);
    expect(bends[0]).toMatchObject({ x: 200, y: 0 });
    expect(planar.segments).toHaveLength(2);
  });

  it('splits both segments at a crossing into four pieces', () => {
    const nodes = new Map([
      ['a', node('a', -100, 0)],
      ['b', node('b', 100, 0)],
      ['c', node('c', 0, -100)],
      ['d', node('d', 0, 100)],
    ]);
    const planar = planariseCore(nodes, [
      edge('ab', 'a', 'b', [
        [-100, 0],
        [100, 0],
      ]),
      edge('cd', 'c', 'd', [
        [0, -100],
        [0, 100],
      ]),
    ]);

    const crossings = [...planar.nodes.values()].filter((n) => n.kind === 'crossing');
    expect(crossings).toHaveLength(1);
    expect(planar.segments).toHaveLength(4);
  });

  it('traces a boundary of more than 20 segments completely', () => {
    // A staircase cycle with many corners: no fixed traversal cap may truncate it.
    const nodes = new Map<string, HolaNode>();
    const points: [number, number][] = [];
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      points.push([i * 100, i * 100]);
    }
    const ids: string[] = [];
    points.forEach(([x, y], i) => {
      const id = `n${i}`;
      ids.push(id);
      nodes.set(id, node(id, x, y));
    });
    const edges: HolaEdge[] = [];
    for (let i = 0; i + 1 < ids.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];
      edges.push(
        edge(`e${i}`, ids[i], ids[i + 1], [
          [x1, y1],
          [x2, y1],
          [x2, y2],
        ])
      );
    }
    // Close the staircase into a cycle around the outside.
    const [lastX, lastY] = points[points.length - 1];
    edges.push(
      edge('close', ids[ids.length - 1], ids[0], [
        [lastX, lastY],
        [lastX + 200, lastY],
        [lastX + 200, -200],
        [0, -200],
        [0, 0],
      ])
    );

    const planar = planariseCore(nodes, edges);
    const totalBoundary = planar.dcel.faces.reduce((sum, f) => sum + f.halfEdges.length, 0);
    expect(totalBoundary).toBe(planar.dcel.halfEdges.size);
    expect(Math.max(...planar.dcel.faces.map((f) => f.halfEdges.length))).toBeGreaterThan(20);
  });

  it('assigns every half-edge to exactly one face and every twin exists', () => {
    const nodes = new Map([
      ['a', node('a', 0, 0)],
      ['b', node('b', 200, 0)],
      ['c', node('c', 200, 200)],
    ]);
    const planar = planariseCore(nodes, [
      edge('ab', 'a', 'b', [
        [0, 0],
        [200, 0],
      ]),
      edge('bc', 'b', 'c', [
        [200, 0],
        [200, 200],
      ]),
    ]);

    const seen = new Set<string>();
    for (const face of planar.dcel.faces) {
      for (const id of face.halfEdges) {
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
    }
    expect(seen.size).toBe(planar.dcel.halfEdges.size);
    for (const half of planar.dcel.halfEdges.values()) {
      expect(planar.dcel.halfEdges.has(half.twin)).toBe(true);
      expect(half.face).toBeDefined();
    }
  });
});

describe('mergeDuplicateSegments', () => {
  it('merges identical segments and keeps both provenances', () => {
    const merged = mergeDuplicateSegments([
      {
        id: 's1',
        a: 'a',
        b: 'b',
        provenance: [{ edgeId: 'e1', originalEdgeIds: ['E1'], order: 0 }],
      },
      {
        id: 's2',
        a: 'b',
        b: 'a',
        provenance: [{ edgeId: 'e2', originalEdgeIds: ['E2'], order: 0 }],
      },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].provenance.map((p) => p.edgeId)).toEqual(['e1', 'e2']);
  });
});

describe('buildDcel', () => {
  it('produces two faces for a triangle', () => {
    const dcel = buildDcel(
      [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: 100, y: 0 },
        { id: 'c', x: 0, y: 100 },
      ],
      [
        { id: 'ab', a: 'a', b: 'b' },
        { id: 'bc', a: 'b', b: 'c' },
        { id: 'ca', a: 'c', b: 'a' },
      ]
    );
    expect(dcel.faces).toHaveLength(2);
    expect(dcel.faces.filter((f) => f.isExternal)).toHaveLength(1);
  });

  it('lets a bridge appear twice on one face boundary', () => {
    const dcel = buildDcel(
      [
        { id: 'a', x: 0, y: 0 },
        { id: 'b', x: 100, y: 0 },
      ],
      [{ id: 'ab', a: 'a', b: 'b' }]
    );
    expect(dcel.faces).toHaveLength(1);
    expect(dcel.faces[0].boundary).toHaveLength(2);
  });
});
