import { describe, it, expect } from 'vitest';
import { extractFaces, faceDirectionForPair } from './faces.js';
import { createDomusGraph } from './types.js';
import type { Shape } from './types.js';
import { createShape } from './types.js';

/**
 * Helper to build a shape from a list of (edgeId, from, to, label) tuples.
 */
function buildShape(
  edges: { id: string; from: string; to: string; label: 'L' | 'R' | 'U' | 'D' }[]
): Shape {
  const shape = createShape();
  for (const e of edges) {
    shape.setLabel(e.id, e.label, e.from, e.to);
  }
  return shape;
}

describe('domus/faces — extractFaces', () => {
  it('returns no faces for an edge-less graph', () => {
    const graph = createDomusGraph(['A', 'B'], []);
    const shape = createShape();
    expect(extractFaces(graph, shape)).toEqual([]);
  });

  it('returns two faces (inner + outer) for a 4-cycle square', () => {
    // Square with labels chosen so each vertex has consistent rotation:
    //   A --R-- B
    //   |       |
    //   U       U
    //   |       |
    //   D --R-- C
    // A's neighbours: B (R), D (D). Rotation CCW [R, U, L, D] → entries
    // sorted as [B(R), D(D)].
    // B's neighbours: A (L), C (D). Rotation [A(L), C(D)].
    // C's neighbours: B (U), D (L). Rotation [B(U), D(L)].
    // D's neighbours: A (U), C (R). Rotation [C(R), A(U)].
    const graph = createDomusGraph(
      ['A', 'B', 'C', 'D'],
      [
        { id: 'eAB', from: 'A', to: 'B' },
        { id: 'eBC', from: 'B', to: 'C' },
        { id: 'eDC', from: 'D', to: 'C' },
        { id: 'eAD', from: 'A', to: 'D' },
      ]
    );
    const shape = buildShape([
      { id: 'eAB', from: 'A', to: 'B', label: 'R' },
      { id: 'eBC', from: 'B', to: 'C', label: 'D' },
      { id: 'eDC', from: 'D', to: 'C', label: 'R' },
      { id: 'eAD', from: 'A', to: 'D', label: 'D' },
    ]);

    const faces = extractFaces(graph, shape);
    // A 4-cycle has 2 faces (inner + outer). Each visits all 4 vertices.
    expect(faces.length).toBe(2);
    expect(faces.every((f) => f.vertices.length === 4)).toBe(true);
  });

  it('produces deterministic face ordering across runs', () => {
    const graph = createDomusGraph(
      ['A', 'B', 'C', 'D'],
      [
        { id: 'eAB', from: 'A', to: 'B' },
        { id: 'eBC', from: 'B', to: 'C' },
        { id: 'eDC', from: 'D', to: 'C' },
        { id: 'eAD', from: 'A', to: 'D' },
      ]
    );
    const shape = buildShape([
      { id: 'eAB', from: 'A', to: 'B', label: 'R' },
      { id: 'eBC', from: 'B', to: 'C', label: 'D' },
      { id: 'eDC', from: 'D', to: 'C', label: 'R' },
      { id: 'eAD', from: 'A', to: 'D', label: 'D' },
    ]);

    const a = extractFaces(graph, shape).map((f) => f.vertices.join(','));
    const b = extractFaces(graph, shape).map((f) => f.vertices.join(','));
    expect(a).toEqual(b);
  });

  it('skips edges that have no shape label (incomplete shape)', () => {
    const graph = createDomusGraph(
      ['A', 'B', 'C'],
      [
        { id: 'eAB', from: 'A', to: 'B' },
        { id: 'eBC', from: 'B', to: 'C' },
        { id: 'eAC', from: 'A', to: 'C' },
      ]
    );
    // Only label two of three edges — face walk should not crash.
    const shape = buildShape([
      { id: 'eAB', from: 'A', to: 'B', label: 'R' },
      { id: 'eBC', from: 'B', to: 'C', label: 'D' },
    ]);
    expect(() => extractFaces(graph, shape)).not.toThrow();
  });
});

describe('domus/faces — faceDirectionForPair', () => {
  it('returns a-to-b when A appears before B on the smallest shared face', () => {
    const faces = [{ vertices: ['A', 'B', 'C', 'D'], edgeIds: ['e1', 'e2', 'e3', 'e4'] }];
    const result = faceDirectionForPair(faces, new Set(['A']), new Set(['B']));
    expect(result).toBe('a-to-b');
  });

  it('returns b-to-a when B appears before A', () => {
    const faces = [{ vertices: ['B', 'A', 'C', 'D'], edgeIds: ['e1', 'e2', 'e3', 'e4'] }];
    const result = faceDirectionForPair(faces, new Set(['A']), new Set(['B']));
    expect(result).toBe('b-to-a');
  });

  it('returns null when no face contains both classes', () => {
    const faces = [
      { vertices: ['A', 'C'], edgeIds: ['e1', 'e2'] },
      { vertices: ['B', 'D'], edgeIds: ['e3', 'e4'] },
    ];
    const result = faceDirectionForPair(faces, new Set(['A']), new Set(['B']));
    expect(result).toBeNull();
  });

  it('prefers the smallest face when multiple contain both classes', () => {
    // Larger face has A before B; smaller face (preferred) has B before A.
    const faces = [
      { vertices: ['A', 'X', 'Y', 'B', 'Z'], edgeIds: ['e1', 'e2', 'e3', 'e4', 'e5'] },
      { vertices: ['B', 'A'], edgeIds: ['eBA1', 'eBA2'] },
    ];
    const result = faceDirectionForPair(faces, new Set(['A']), new Set(['B']));
    expect(result).toBe('b-to-a');
  });

  it('handles classes with multiple vertices', () => {
    const faces = [{ vertices: ['A1', 'B1', 'A2', 'B2'], edgeIds: ['e1', 'e2', 'e3', 'e4'] }];
    const result = faceDirectionForPair(faces, new Set(['A1', 'A2']), new Set(['B1', 'B2']));
    // First A index = 0, first B index = 1 → a-to-b.
    expect(result).toBe('a-to-b');
  });
});
