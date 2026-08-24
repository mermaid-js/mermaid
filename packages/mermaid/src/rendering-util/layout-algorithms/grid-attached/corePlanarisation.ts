/**
 * HOLA Step 3b for a straight-line core (guide §16).
 *
 * Tree placement needs the *faces* of the core, because a placement direction is
 * only valid if it points into the angular wedge a face occupies at the tree's
 * root (guide §17.2). HOLA reads those faces off an orthogonally routed core, so
 * its own planariser refuses anything diagonal — and a grid-like core is straight
 * centre-to-centre lines, most but not all of them axis-aligned.
 *
 * Everything else about §16 carries over unchanged, because none of it depends on
 * the segments being axis-aligned:
 *
 *   - a crossing of two edges is a vertex of the planarisation, so both edges are
 *     split at a shared dummy. Only the *search* for crossings differs: a general
 *     segment intersection instead of the axis-aligned sweep;
 *   - the faces then come from `buildDcel`, HOLA's own face enumeration, which
 *     sorts half-edges by angle around each vertex and is indifferent to the
 *     angles being multiples of 90°.
 *
 * There are no bend dummies: a straight-line drawing has no bends.
 *
 * The result is HOLA's own `PlanarisedCore`, so `faceWedgeAt` consumes it
 * verbatim.
 */

import { log } from '../../../logger.js';
import type { Point } from '../../../types.js';
import { buildDcel } from '../hola-faithful/planarization/dcel.js';
import type { Dcel, DcelEdgeInput, DcelVertex } from '../hola-faithful/planarization/dcel.js';
import { faceWedgeAt } from '../hola-faithful/placement/placeTrees.js';
import type { PlanarNode, PlanarSegment } from '../hola-faithful/planarization/planarise.js';
import type { PlanarisedCore } from '../hola-faithful/planarization/planarise.js';
import type { HolaNode } from '../hola-faithful/model.js';
import type { CoreSegment } from './coreDrawing.js';

const EPSILON = 1e-7;

/**
 * Planarise the straight-line core. Returns `undefined` when the drawing is too
 * degenerate to embed — the placement search then falls back to considering every
 * direction, which loses the wedge restriction but never the drawing (guide §25).
 */
export function planariseStraightCore(
  coreRects: Map<string, HolaNode>,
  segments: CoreSegment[]
): PlanarisedCore | undefined {
  const nodes = new Map<string, PlanarNode>();
  for (const rect of coreRects.values()) {
    nodes.set(rect.id, {
      id: rect.id,
      x: rect.x,
      y: rect.y,
      kind: 'core',
      width: rect.width,
      height: rect.height,
    });
  }

  const pieces = splitAtCrossings(nodes, segments);
  if (pieces.length === 0) {
    return undefined;
  }

  const usedVertices = new Set<string>();
  for (const piece of pieces) {
    usedVertices.add(piece.a);
    usedVertices.add(piece.b);
  }

  const vertices: DcelVertex[] = [...nodes.values()]
    .filter((node) => usedVertices.has(node.id))
    .map((node) => ({ id: node.id, x: node.x, y: node.y }));
  const edges: DcelEdgeInput[] = pieces.map((piece) => ({
    id: piece.id,
    a: piece.a,
    b: piece.b,
  }));

  try {
    const planar: PlanarisedCore = {
      nodes,
      segments: pieces,
      dcel: buildDcel(vertices, edges),
    };
    markExternalFace(planar);
    return planar;
  } catch (error) {
    log.debug(
      `GRID-ATTACHED: the core drawing could not be embedded (${
        error instanceof Error ? error.message : String(error)
      }); tree placement will consider every direction.`
    );
    return undefined;
  }
}

/**
 * Split every segment at every proper crossing, sharing one dummy vertex per
 * crossing point so both segments meet there (guide §16.3).
 *
 * Segments that share an endpoint meet at a node, not at a crossing, and
 * collinear overlaps are left alone: they would give the DCEL two half-edges with
 * the same angle at a vertex, and the face traversal would be ambiguous.
 */
function splitAtCrossings(
  nodes: Map<string, PlanarNode>,
  segments: CoreSegment[]
): PlanarSegment[] {
  // Crossing parameters per segment, as fractions along it.
  const cuts = new Map<number, { t: number; vertexId: string }[]>();
  const dummyByKey = new Map<string, string>();
  let counter = 0;

  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const first = segments[i];
      const second = segments[j];
      if (sharesEndpoint(first, second)) {
        continue;
      }
      const hit = properIntersection(first, second);
      if (!hit) {
        continue;
      }

      const key = `${Math.round(hit.point.x / EPSILON)}:${Math.round(hit.point.y / EPSILON)}`;
      let vertexId = dummyByKey.get(key);
      if (vertexId === undefined) {
        vertexId = `~cross:${counter++}`;
        dummyByKey.set(key, vertexId);
        nodes.set(vertexId, {
          id: vertexId,
          x: hit.point.x,
          y: hit.point.y,
          kind: 'crossing',
          width: 0,
          height: 0,
        });
      }

      addCut(cuts, i, hit.t, vertexId);
      addCut(cuts, j, hit.u, vertexId);
    }
  }

  const pieces: PlanarSegment[] = [];
  segments.forEach((segment, index) => {
    const chain = [
      segment.source,
      ...(cuts.get(index) ?? []).sort((a, b) => a.t - b.t).map((cut) => cut.vertexId),
      segment.target,
    ];
    for (let k = 0; k < chain.length - 1; k++) {
      if (chain[k] === chain[k + 1]) {
        continue;
      }
      pieces.push({
        id: `seg:${segment.edgeId}:${k}`,
        a: chain[k],
        b: chain[k + 1],
        provenance: [
          {
            edgeId: segment.edgeId,
            originalEdgeIds: [...segment.originalEdgeIds],
            order: k,
          },
        ],
      });
    }
  });

  return pieces;
}

function addCut(
  cuts: Map<number, { t: number; vertexId: string }[]>,
  index: number,
  t: number,
  vertexId: string
): void {
  const list = cuts.get(index);
  if (list) {
    if (!list.some((cut) => cut.vertexId === vertexId)) {
      list.push({ t, vertexId });
    }
  } else {
    cuts.set(index, [{ t, vertexId }]);
  }
}

function sharesEndpoint(a: CoreSegment, b: CoreSegment): boolean {
  return (
    a.source === b.source || a.source === b.target || a.target === b.source || a.target === b.target
  );
}

/**
 * The single point strictly interior to both segments where they cross, or
 * `undefined` when they are parallel, collinear or only touch at an endpoint.
 */
function properIntersection(
  first: CoreSegment,
  second: CoreSegment
): { point: Point; t: number; u: number } | undefined {
  const r = { x: first.b.x - first.a.x, y: first.b.y - first.a.y };
  const s = { x: second.b.x - second.a.x, y: second.b.y - second.a.y };
  const denominator = r.x * s.y - r.y * s.x;
  if (Math.abs(denominator) < EPSILON) {
    return undefined;
  }

  const d = { x: second.a.x - first.a.x, y: second.a.y - first.a.y };
  const t = (d.x * s.y - d.y * s.x) / denominator;
  const u = (d.x * r.y - d.y * r.x) / denominator;
  if (t <= EPSILON || t >= 1 - EPSILON || u <= EPSILON || u >= 1 - EPSILON) {
    return undefined;
  }

  return { point: { x: first.a.x + t * r.x, y: first.a.y + t * r.y }, t, u };
}

/**
 * Decide which face is the unbounded one from the geometry.
 *
 * `buildDcel` infers it from the minority sign of the signed areas, which is
 * exact as soon as there are at least two bounded faces but a coin flip when
 * there are exactly two faces in total — one bounded, one not, with equal and
 * opposite areas. A core that is a single cycle is exactly that case, and it is
 * the commonest core there is, so the answer is settled here instead.
 *
 * The test is a probe that cannot be wrong: take the topmost vertex (leftmost
 * among ties) and look straight up. Nothing in the drawing reaches above it — no
 * vertex by construction, and no edge, because a segment stays within the `y`
 * range of its endpoints — so whichever face's wedge contains that direction is
 * the face that extends to infinity. All three upward directions are tried,
 * because a direction lying exactly along an incident edge belongs to no wedge.
 */
function markExternalFace(planar: PlanarisedCore): void {
  const dcel: Dcel = planar.dcel;
  if (dcel.faces.length === 0) {
    return;
  }

  let probeVertex: DcelVertex | undefined;
  for (const vertex of dcel.vertices.values()) {
    if ((dcel.facesAtVertex.get(vertex.id) ?? []).length === 0) {
      continue;
    }
    if (
      !probeVertex ||
      vertex.y < probeVertex.y - EPSILON ||
      (Math.abs(vertex.y - probeVertex.y) <= EPSILON && vertex.x < probeVertex.x)
    ) {
      probeVertex = vertex;
    }
  }
  if (!probeVertex) {
    return;
  }

  const faceIndices = dcel.facesAtVertex.get(probeVertex.id) ?? [];
  for (const direction of ['N', 'NW', 'NE'] as const) {
    const claiming = faceIndices.filter((index) =>
      faceWedgeAt(planar, dcel.faces[index], probeVertex.id)(direction)
    );
    if (claiming.length !== 1) {
      continue;
    }
    for (const face of dcel.faces) {
      face.isExternal = face.index === claiming[0];
    }
    return;
  }
}
