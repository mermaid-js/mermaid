/**
 * HOLA Step 3b: core planarisation (guide §16).
 *
 * Input is the *already orthogonally routed* core, so the planariser only ever
 * sees axis-aligned geometry (invariant 12). Two passes, in the order the
 * paper gives them:
 *
 *   Pass 1  insert a dummy at every route bend, split routes into segments
 *           between real or dummy nodes, and only *then* merge duplicate
 *           segments — HOLA removes duplicate segments exposed by bend
 *           insertion, not duplicate whole edges (guide §16.2);
 *   Pass 2  find crossings with an axis-aligned sweep and split both segments
 *           at a shared crossing dummy (guide §16.3).
 *
 * Provenance travels with every segment so the original edges can be restored
 * after placement.
 */

import type { HolaEdge, HolaNode, Point } from '../model.js';
import { bendDummyId, crossingDummyId } from '../ids.js';
import type { Dcel, DcelEdgeInput, DcelVertex } from './dcel.js';
import { buildDcel } from './dcel.js';
import { findCrossings } from './sweep.js';
import type { AxisSegment } from './sweep.js';

export type PlanarNodeKind = 'core' | 'bend' | 'crossing';

export interface PlanarNode {
  id: string;
  x: number;
  y: number;
  kind: PlanarNodeKind;
  width: number;
  height: number;
}

export interface SegmentProvenance {
  /** Topological edge this piece came from. */
  edgeId: string;
  originalEdgeIds: string[];
  /** Index of the piece along that edge, ascending from the edge source. */
  order: number;
}

export interface PlanarSegment {
  id: string;
  a: string;
  b: string;
  provenance: SegmentProvenance[];
}

export interface PlanarisedCore {
  nodes: Map<string, PlanarNode>;
  segments: PlanarSegment[];
  dcel: Dcel;
}

export class PlanarisationError extends Error {}

const EPSILON = 1e-7;

export function planariseCore(coreNodes: Map<string, HolaNode>, edges: HolaEdge[]): PlanarisedCore {
  const nodes = new Map<string, PlanarNode>();
  for (const node of coreNodes.values()) {
    nodes.set(node.id, {
      id: node.id,
      x: node.x,
      y: node.y,
      kind: 'core',
      width: node.width,
      height: node.height,
    });
  }

  // ---- Pass 1: bend dummies, split, then merge duplicate segments ---------
  let bendCounter = 0;
  const rawSegments: PlanarSegment[] = [];

  for (const edge of edges) {
    const route = edge.route;
    if (route.length < 2) {
      continue;
    }
    for (let i = 1; i < route.length; i++) {
      if (!isAxisAligned(route[i - 1], route[i])) {
        throw new PlanarisationError(
          `Edge ${edge.id} reaches planarisation with a diagonal segment.`
        );
      }
    }

    // Every interior route point becomes a bend dummy.
    const chain: string[] = [edge.source];
    for (let i = 1; i < route.length - 1; i++) {
      const id = bendDummyId(bendCounter++);
      nodes.set(id, { id, x: route[i].x, y: route[i].y, kind: 'bend', width: 0, height: 0 });
      chain.push(id);
    }
    chain.push(edge.target);

    for (let i = 0; i < chain.length - 1; i++) {
      rawSegments.push({
        id: `seg:${edge.id}:${i}`,
        a: chain[i],
        b: chain[i + 1],
        provenance: [{ edgeId: edge.id, originalEdgeIds: [...edge.originalEdgeIds], order: i }],
      });
    }
  }

  const merged = mergeDuplicateSegments(rawSegments);

  // ---- Pass 2: crossing dummies ------------------------------------------
  const withCrossings = splitAtCrossings(nodes, merged);

  // ---- DCEL --------------------------------------------------------------
  const vertices: DcelVertex[] = [...nodes.values()].map((n) => ({ id: n.id, x: n.x, y: n.y }));
  const usedVertices = new Set<string>();
  for (const segment of withCrossings) {
    usedVertices.add(segment.a);
    usedVertices.add(segment.b);
  }
  const dcelEdges: DcelEdgeInput[] = withCrossings.map((s) => ({ id: s.id, a: s.a, b: s.b }));
  const dcel = buildDcel(
    vertices.filter((v) => usedVertices.has(v.id)),
    dcelEdges
  );

  return { nodes, segments: withCrossings, dcel };
}

function isAxisAligned(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < EPSILON || Math.abs(a.y - b.y) < EPSILON;
}

/**
 * Guide §16.2 step 3: after splitting, two routes that share a stretch of the
 * drawing produce identical segments. Keep one and accumulate the provenance
 * of the others so nothing is lost.
 */
export function mergeDuplicateSegments(segments: PlanarSegment[]): PlanarSegment[] {
  const byEndpoints = new Map<string, PlanarSegment>();
  const result: PlanarSegment[] = [];
  for (const segment of segments) {
    const key = segment.a < segment.b ? `${segment.a}|${segment.b}` : `${segment.b}|${segment.a}`;
    const existing = byEndpoints.get(key);
    if (existing) {
      existing.provenance.push(...segment.provenance);
      continue;
    }
    const copy: PlanarSegment = { ...segment, provenance: [...segment.provenance] };
    byEndpoints.set(key, copy);
    result.push(copy);
  }
  return result;
}

function splitAtCrossings(
  nodes: Map<string, PlanarNode>,
  segments: PlanarSegment[]
): PlanarSegment[] {
  const axisSegments: AxisSegment[] = segments.map((s) => ({
    id: s.id,
    a: pointOf(nodes, s.a),
    b: pointOf(nodes, s.b),
  }));
  const crossings = findCrossings(axisSegments);
  if (crossings.length === 0) {
    return segments;
  }

  const segmentById = new Map(segments.map((s) => [s.id, s]));
  const splitsBySegment = new Map<string, { point: Point; dummyId: string }[]>();
  let crossingCounter = 0;

  for (const crossing of crossings) {
    const id = crossingDummyId(crossingCounter++);
    nodes.set(id, {
      id,
      x: crossing.point.x,
      y: crossing.point.y,
      kind: 'crossing',
      width: 0,
      height: 0,
    });
    push(splitsBySegment, crossing.horizontalId, { point: crossing.point, dummyId: id });
    push(splitsBySegment, crossing.verticalId, { point: crossing.point, dummyId: id });
  }

  const result: PlanarSegment[] = [];
  for (const segment of segments) {
    const splits = splitsBySegment.get(segment.id);
    if (!splits || splits.length === 0) {
      result.push(segment);
      continue;
    }
    const from = pointOf(nodes, segment.a);
    splits.sort((p, q) => distance(from, p.point) - distance(from, q.point));

    let previous = segment.a;
    splits.forEach((split, index) => {
      result.push({
        id: `${segment.id}#${index}`,
        a: previous,
        b: split.dummyId,
        provenance: segment.provenance.map((p) => ({ ...p })),
      });
      previous = split.dummyId;
    });
    result.push({
      id: `${segment.id}#${splits.length}`,
      a: previous,
      b: segment.b,
      provenance: segment.provenance.map((p) => ({ ...p })),
    });
    void segmentById;
  }

  return result;
}

function pointOf(nodes: Map<string, PlanarNode>, id: string): Point {
  const node = nodes.get(id);
  if (!node) {
    throw new PlanarisationError(`Segment references unknown node ${id}`);
  }
  return { x: node.x, y: node.y };
}

function distance(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list) {
    list.push(value);
  } else {
    map.set(key, [value]);
  }
}
