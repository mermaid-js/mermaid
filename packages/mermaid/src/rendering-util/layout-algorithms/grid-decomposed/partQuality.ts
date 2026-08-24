/**
 * Two geometric measures of a finished part, used to choose between the two ways
 * a cyclic part can be laid out (see `layoutCore.ts`).
 *
 * Both are counted on the straight centre-to-centre routes grid-like produces.
 * The painter later clips each route back to the node boundaries, which shortens
 * the first and last segment but never moves the line, so what is counted here is
 * what a reader sees.
 *
 * These are deliberately narrow. `validateLayout` is the shared judge of layout
 * quality and stays that: it assumes a layout that owns its routing, so on a
 * centre-to-centre layout it reports every edge as non-orthogonal and every edge
 * as intersecting its own endpoints. What is needed here is two specific numbers
 * that decide one choice.
 */

import type { LayoutData } from '../../types.js';
import type { Point } from '../../../types.js';

interface Segment {
  edgeId: string;
  start: string;
  end: string;
  a: Point;
  b: Point;
}

/**
 * How many (edge, node) pairs have the edge running through a node it does not
 * connect.
 *
 * This is the paper's "no edge-node overlap" desideratum (§1), and the symptom of
 * a cycle that has been collapsed onto a single line: the closing edge is then
 * drawn straight back through every node in between.
 */
export function countEdgesThroughForeignNodes(layout: LayoutData): number {
  const nodes = (layout.nodes ?? []).filter((node) => !node.isGroup);
  let count = 0;

  for (const segment of segments(layout)) {
    for (const node of nodes) {
      if (node.id === segment.start || node.id === segment.end) {
        continue;
      }
      // Half the node's smaller side: inside that radius of the centre the line
      // is unambiguously crossing the shape rather than passing close by it.
      const clearance = Math.min(node.width ?? 0, node.height ?? 0) / 2;
      const distance = pointToSegmentDistance(
        { x: node.x ?? 0, y: node.y ?? 0 },
        segment.a,
        segment.b
      );
      if (distance < clearance) {
        count++;
      }
    }
  }

  return count;
}

/**
 * How many pairs of edges cross.
 *
 * Edges that share an endpoint node are skipped: they meet at that node by
 * construction, which is not a crossing.
 */
export function countEdgeCrossings(layout: LayoutData): number {
  const all = segments(layout);
  let count = 0;

  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const s = all[i];
      const t = all[j];
      if (s.edgeId === t.edgeId || sharesEndpoint(s, t)) {
        continue;
      }
      if (segmentsProperlyIntersect(s.a, s.b, t.a, t.b)) {
        count++;
      }
    }
  }

  return count;
}

function segments(layout: LayoutData): Segment[] {
  const out: Segment[] = [];

  for (const edge of layout.edges ?? []) {
    const points = edge.points ?? [];
    for (let i = 1; i < points.length; i++) {
      out.push({
        edgeId: edge.id,
        start: edge.start ?? '',
        end: edge.end ?? '',
        a: points[i - 1],
        b: points[i],
      });
    }
  }

  return out;
}

function sharesEndpoint(s: Segment, t: Segment): boolean {
  return s.start === t.start || s.start === t.end || s.end === t.start || s.end === t.end;
}

function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));

  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** True when the two segments cross at an interior point of both. */
function segmentsProperlyIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = orientation(p3, p4, p1);
  const d2 = orientation(p3, p4, p2);
  const d3 = orientation(p1, p2, p3);
  const d4 = orientation(p1, p2, p4);

  return d1 > 0 !== d2 > 0 && d3 > 0 !== d4 > 0;
}

function orientation(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}
