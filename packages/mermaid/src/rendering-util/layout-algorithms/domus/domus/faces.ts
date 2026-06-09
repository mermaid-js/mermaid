/**
 * Face extraction and direction oracle for DOMUS planar embeddings.
 *
 * B1 / iter-15 / Phase B1 wedge 3 — face-walk direction oracle for
 * pass-2 visibility-arc emission in
 * `computeCompactedCoordinatesWithOverlapConstraints`.
 *
 * The DOMUS shape (label per edge in `{L,R,U,D}`) implies a planar embedding:
 * at each vertex, the cyclic CCW rotation of incident edges follows the
 * label order R → U → L → D. The faces of the embedding are obtained by
 * walking each directed edge and, at each arrival vertex, turning to the
 * next CW edge in the rotation (the standard combinatorial-face-traversal
 * rule for left-of-walk faces).
 *
 * This module replaces the iter-4 sorted-ID tie-break that decides arc
 * direction for pass-2 visibility constraints between aux-classes whose
 * perpendicular bounds overlap.
 *
 * Caveat: This is a step toward face-aware compaction, not full
 * Bruckdorfer-style face-based linear programming. The ccw order on a
 * shared face gives an ordering signal but not a guaranteed-optimal one.
 * When the oracle returns null (no shared face for the pair), the caller
 * falls back to sorted-ID for determinism.
 *
 * Paper anchors:
 * - DOMUS §3 (source `6784b3d1`): orthogonal alphabet `{L,R,D,U}`.
 * - Siebenhaller §podavsnef (source `0fb2d84f`): rectangular face-based
 *   compaction (the broader framework this module steps toward).
 */
import type { DomusGraph, EdgeLabel, Shape, SimpleCycle } from './types.js';

/**
 * Cyclic CCW rotation order for the four orthogonal labels.
 *
 * Standard planar-embedding convention: positive x is east (R), positive
 * y is north (U). CCW around a point: east, north, west, south = R, U, L, D.
 */
const CCW_INDEX: Record<EdgeLabel, number> = { R: 0, U: 1, L: 2, D: 3 };

/**
 * Extract the faces of the planar embedding implied by `shape`.
 *
 * Each face is returned as a `SimpleCycle` (cyclic vertex sequence with
 * matching edge IDs). Both the inner and outer faces are included; the
 * caller distinguishes them if needed (the outer face is typically the
 * longest by vertex count).
 *
 * Algorithm (combinatorial face traversal):
 * 1. Build, at each vertex, the CCW cyclic order of incident edges based
 *    on their labels (R, U, L, D mapping to indices 0, 1, 2, 3).
 * 2. Each undirected edge (u, v) corresponds to two directed traversals:
 *    u→v and v→u. Each directed traversal lies on exactly one face.
 * 3. Walk: starting at directed edge (u, v), at v find the entering edge
 *    (v, u) in v's rotation, then take the *next CW* edge (= previous in
 *    CCW order). Repeat until back to the starting directed edge.
 *
 * Vertices with `degree < 2` (isolated or pendant) cannot be on any face
 * boundary in the usual sense; they are skipped.
 *
 * Vertices with multiple edges sharing the same label (which violates the
 * shape's vertex-distinctness invariant for degree ≤ 4) are handled by
 * grouping same-label edges together in the rotation in deterministic
 * insertion order — not paper-correct for malformed shapes, but
 * defensively robust.
 *
 * @param graph - The DOMUS graph (provides adjacency).
 * @param shape - The shape (provides edge labels).
 * @returns The list of faces. Empty when the graph has no cycles.
 */
export function extractFaces(graph: DomusGraph, shape: Shape): SimpleCycle[] {
  // Build per-vertex CCW rotation of incident edges, keyed by edge ID
  // (so we can find the entering edge unambiguously when there are
  // parallel edges or repeated labels).
  interface RotationEntry {
    neighbor: string;
    edgeId: string;
    label: EdgeLabel;
  }
  const rotations = new Map<string, RotationEntry[]>();

  for (const v of graph.vertices) {
    const incident = graph.adjacency.get(v) ?? [];
    const entries: RotationEntry[] = [];
    for (const { neighbor, edgeId } of incident) {
      const label = shape.getLabel(v, neighbor, edgeId);
      if (label === undefined) {
        // Edge has no shape label (incomplete shape) — skip. Face walk
        // would be ambiguous without a direction.
        continue;
      }
      entries.push({ neighbor, edgeId, label });
    }
    entries.sort((a, b) => CCW_INDEX[a.label] - CCW_INDEX[b.label]);
    rotations.set(v, entries);
  }

  const visited = new Set<string>(); // key: `${u}->${v}|${edgeId}`
  const faces: SimpleCycle[] = [];

  // Iterate vertices and edges in deterministic order so the face list
  // is stable across runs.
  const sortedVertices = [...graph.vertices].sort();
  for (const startV of sortedVertices) {
    const rot = rotations.get(startV) ?? [];
    for (const startEntry of rot) {
      const startKey = `${startV}->${startEntry.neighbor}|${startEntry.edgeId}`;
      if (visited.has(startKey)) {
        continue;
      }

      const faceVertices: string[] = [];
      const faceEdgeIds: string[] = [];
      let curU = startV;
      let curV = startEntry.neighbor;
      let curEdgeId = startEntry.edgeId;
      const safety = graph.edges.size * 4 + 8; // O(E) per face is plenty.

      for (let step = 0; step < safety; step++) {
        const key = `${curU}->${curV}|${curEdgeId}`;
        if (visited.has(key) && step > 0) {
          // Shouldn't happen if the embedding is consistent; bail on safety.
          break;
        }
        visited.add(key);
        faceVertices.push(curU);
        faceEdgeIds.push(curEdgeId);

        // Next CW edge at curV from edge (curV, curU). We look up the
        // entering edge by its edgeId (handles parallel edges) then take
        // the previous entry in the CCW rotation (= next CW).
        const arrivalRot = rotations.get(curV) ?? [];
        const enterIdx = arrivalRot.findIndex((e) => e.edgeId === curEdgeId);
        if (enterIdx === -1) {
          // Inconsistent embedding (e.g. arrival vertex doesn't have the
          // edge in its rotation). Bail.
          break;
        }
        const nextIdx = (enterIdx - 1 + arrivalRot.length) % arrivalRot.length;
        const nextEntry = arrivalRot[nextIdx];

        const nextU = curV;
        const nextV = nextEntry.neighbor;
        const nextEdgeId = nextEntry.edgeId;

        if (nextU === startV && nextV === startEntry.neighbor && nextEdgeId === startEntry.edgeId) {
          // Closed the face.
          if (faceVertices.length > 0) {
            faces.push({ vertices: faceVertices, edgeIds: faceEdgeIds });
          }
          break;
        }

        curU = nextU;
        curV = nextV;
        curEdgeId = nextEdgeId;
      }
    }
  }

  return faces;
}

/**
 * Decide arc direction for a pair of aux-classes (a, b) whose perpendicular
 * bounds overlap, using the planar embedding's faces as an oracle.
 *
 * Returns `'a-to-b'` if class A should come "before" class B in the
 * compaction dimension (left for Gx, above for Gy), or `'b-to-a'` if the
 * reverse, or `null` when no shared face provides a signal (caller should
 * fall back to a deterministic tie-break, e.g. sorted-ID).
 *
 * The rule: walk each face in the embedding; if a face contains at least
 * one vertex from each class, the order in which they first appear on the
 * CCW walk gives the direction. The first face matching is taken.
 *
 * Caveat: this is heuristic, not full face-based compaction. Different
 * faces (interior vs exterior) can give opposing orderings. We prefer
 * the smallest face (by vertex count) that contains both, on the theory
 * that the smallest enclosing face captures the most local relationship.
 */
export function faceDirectionForPair(
  faces: SimpleCycle[],
  classAVertices: ReadonlySet<string>,
  classBVertices: ReadonlySet<string>
): 'a-to-b' | 'b-to-a' | null {
  // Find candidate faces containing at least one vertex from each class.
  // Prefer the smallest such face for locality.
  let best: { face: SimpleCycle; firstA: number; firstB: number } | null = null;
  for (const face of faces) {
    let firstA = -1;
    let firstB = -1;
    for (let i = 0; i < face.vertices.length; i++) {
      if (firstA === -1 && classAVertices.has(face.vertices[i])) {
        firstA = i;
      }
      if (firstB === -1 && classBVertices.has(face.vertices[i])) {
        firstB = i;
      }
      if (firstA !== -1 && firstB !== -1) {
        break;
      }
    }
    if (
      firstA !== -1 &&
      firstB !== -1 &&
      (best === null || face.vertices.length < best.face.vertices.length)
    ) {
      best = { face, firstA, firstB };
    }
  }
  if (best === null) {
    return null;
  }
  return best.firstA < best.firstB ? 'a-to-b' : 'b-to-a';
}
