/**
 * Doubly connected edge list and face enumeration (guide §16.4).
 *
 * Faces come from directed half-edges, not from lists of node ids, which is
 * what lets a boundary repeat a node (bridges) and lets a cycle produce *two*
 * distinct faces — its inside and its outside — instead of one deduplicated
 * boundary. Every half-edge is visited exactly once; the only limit is a
 * safety bound derived from the total number of half-edges, and exceeding it
 * is an error rather than a silent truncation.
 */

import type { Bounds, Point } from '../model.js';

export interface DcelVertex {
  id: string;
  x: number;
  y: number;
}

export interface DcelEdgeInput {
  id: string;
  a: string;
  b: string;
}

export interface HalfEdge {
  id: string;
  edgeId: string;
  origin: string;
  destination: string;
  twin: string;
  next: string;
  face?: number;
}

export interface Face {
  index: number;
  /** Half-edge ids in traversal order. */
  halfEdges: string[];
  /** Vertex ids in traversal order; may repeat when the boundary uses a bridge. */
  boundary: string[];
  signedArea: number;
  bounds: Bounds;
  isExternal: boolean;
}

export interface Dcel {
  vertices: Map<string, DcelVertex>;
  halfEdges: Map<string, HalfEdge>;
  faces: Face[];
  /** Faces incident to each vertex. */
  facesAtVertex: Map<string, number[]>;
}

export class DcelError extends Error {}

export function buildDcel(vertices: DcelVertex[], edges: DcelEdgeInput[]): Dcel {
  const vertexById = new Map(vertices.map((v) => [v.id, v]));
  const halfEdges = new Map<string, HalfEdge>();
  const outgoing = new Map<string, string[]>();

  for (const v of vertices) {
    outgoing.set(v.id, []);
  }

  for (const edge of edges) {
    if (edge.a === edge.b) {
      continue;
    }
    const forwardId = `${edge.id}>`;
    const backwardId = `${edge.id}<`;
    halfEdges.set(forwardId, {
      id: forwardId,
      edgeId: edge.id,
      origin: edge.a,
      destination: edge.b,
      twin: backwardId,
      next: '',
    });
    halfEdges.set(backwardId, {
      id: backwardId,
      edgeId: edge.id,
      origin: edge.b,
      destination: edge.a,
      twin: forwardId,
      next: '',
    });
    outgoing.get(edge.a)?.push(forwardId);
    outgoing.get(edge.b)?.push(backwardId);
  }

  // Rotation system: outgoing half-edges sorted by angle at each vertex.
  const rotationIndex = new Map<string, number>();
  for (const [vertexId, ids] of outgoing) {
    const origin = vertexById.get(vertexId);
    if (!origin) {
      throw new DcelError(`Edge references unknown vertex ${vertexId}`);
    }
    ids.sort((p, q) => angleOf(halfEdges, vertexById, p) - angleOf(halfEdges, vertexById, q));
    ids.forEach((id, index) => rotationIndex.set(id, index));
  }

  // next(h) = successor, in the rotation at h's destination, of h's twin.
  for (const half of halfEdges.values()) {
    const ring = outgoing.get(half.destination) ?? [];
    const twinIndex = rotationIndex.get(half.twin);
    if (twinIndex === undefined || ring.length === 0) {
      throw new DcelError(`Half-edge ${half.id} has no twin in the rotation system`);
    }
    half.next = ring[(twinIndex + 1) % ring.length];
  }

  const faces = traceFaces(halfEdges, vertexById);
  markExternalFace(faces);

  const facesAtVertex = new Map<string, number[]>();
  for (const face of faces) {
    for (const vertexId of new Set(face.boundary)) {
      const list = facesAtVertex.get(vertexId);
      if (list) {
        list.push(face.index);
      } else {
        facesAtVertex.set(vertexId, [face.index]);
      }
    }
  }

  return { vertices: vertexById, halfEdges, faces, facesAtVertex };
}

function angleOf(
  halfEdges: Map<string, HalfEdge>,
  vertices: Map<string, DcelVertex>,
  halfEdgeId: string
): number {
  const half = halfEdges.get(halfEdgeId)!;
  const from = vertices.get(half.origin)!;
  const to = vertices.get(half.destination)!;
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function traceFaces(halfEdges: Map<string, HalfEdge>, vertices: Map<string, DcelVertex>): Face[] {
  const faces: Face[] = [];
  const limit = halfEdges.size + 1;

  for (const start of halfEdges.values()) {
    if (start.face !== undefined) {
      continue;
    }
    const walk: string[] = [];
    const boundary: string[] = [];
    let current = start;
    let steps = 0;

    do {
      if (steps++ > limit) {
        throw new DcelError(
          `Face traversal exceeded ${limit} half-edges starting at ${start.id}; ` +
            'the rotation system is inconsistent.'
        );
      }
      current.face = faces.length;
      walk.push(current.id);
      boundary.push(current.origin);
      const next = halfEdges.get(current.next);
      if (!next) {
        throw new DcelError(`Half-edge ${current.id} has a dangling next pointer`);
      }
      current = next;
    } while (current.id !== start.id);

    faces.push({
      index: faces.length,
      halfEdges: walk,
      boundary,
      signedArea: shoelace(boundary, vertices),
      bounds: boundsOf(boundary, vertices),
      isExternal: false,
    });
  }

  return faces;
}

function shoelace(boundary: string[], vertices: Map<string, DcelVertex>): number {
  let total = 0;
  for (let i = 0; i < boundary.length; i++) {
    const a = vertices.get(boundary[i])!;
    const b = vertices.get(boundary[(i + 1) % boundary.length])!;
    total += a.x * b.y - b.x * a.y;
  }
  return total / 2;
}

function boundsOf(boundary: string[], vertices: Map<string, DcelVertex>): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const id of boundary) {
    const v = vertices.get(id)!;
    minX = Math.min(minX, v.x);
    minY = Math.min(minY, v.y);
    maxX = Math.max(maxX, v.x);
    maxY = Math.max(maxY, v.y);
  }
  return { minX, minY, maxX, maxY };
}

/**
 * With this rotation convention every bounded face is traversed one way round
 * and the unbounded face the other, so the external face is the one whose
 * signed area has the minority sign. Degenerate boundaries (bridges, zero
 * area) can blur that, so the documented fallback is the largest absolute
 * area — which is the outer boundary whenever it exists.
 */
function markExternalFace(faces: Face[]): void {
  if (faces.length === 0) {
    return;
  }
  const negative = faces.filter((f) => f.signedArea < -1e-9);
  const positive = faces.filter((f) => f.signedArea > 1e-9);

  let external: Face | undefined;
  if (negative.length === 1 && positive.length >= 1) {
    external = negative[0];
  } else if (positive.length === 1 && negative.length >= 1) {
    external = positive[0];
  }
  external ??= faces.reduce((best, f) =>
    Math.abs(f.signedArea) > Math.abs(best.signedArea) ? f : best
  );
  external.isExternal = true;
}

export function faceCentroid(face: Face, vertices: Map<string, DcelVertex>): Point {
  let x = 0;
  let y = 0;
  for (const id of face.boundary) {
    const v = vertices.get(id)!;
    x += v.x;
    y += v.y;
  }
  return { x: x / face.boundary.length, y: y / face.boundary.length };
}
