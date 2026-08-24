/**
 * HOLA Step 3b: the core's faces (guide §16).
 *
 * Tree placement needs them, because a placement direction is only valid if it
 * points into the angular wedge a face occupies at the tree's root (§17.2).
 *
 * HOLA's own planariser does the work — bend dummies at every route bend, then
 * crossing dummies from an axis-aligned sweep, then the DCEL — and it can be used
 * verbatim now that the core is orthogonally routed, which is the input it is
 * specified for (invariant 12). Its one requirement is that no segment is
 * diagonal, and `routeCoreEdges` guarantees that.
 *
 * The only thing added here is the external-face test. `buildDcel` infers it from
 * the minority sign of the signed areas, which is exact as soon as there are at
 * least two bounded faces but a coin flip when there are exactly two faces in
 * total — one bounded, one not, with equal and opposite areas. A core that is a
 * single cycle is exactly that case, and it is the commonest core there is.
 */

import { log } from '../../../logger.js';
import type { Dcel, DcelVertex } from '../hola-faithful/planarization/dcel.js';
import { planariseCore } from '../hola-faithful/planarization/planarise.js';
import type { PlanarisedCore } from '../hola-faithful/planarization/planarise.js';
import { faceWedgeAt } from '../hola-faithful/placement/placeTrees.js';
import type { HolaEdge, HolaNode } from '../hola-faithful/model.js';

const EPSILON = 1e-7;

/**
 * Planarise the routed core. Returns `undefined` when the drawing is too
 * degenerate to embed — the placement search then falls back to considering every
 * direction, which loses the wedge restriction but never the drawing (guide §25).
 */
export function planariseRoutedCore(
  coreRects: Map<string, HolaNode>,
  edges: HolaEdge[]
): PlanarisedCore | undefined {
  const routable = edges.filter((edge) => edge.route.length >= 2);
  if (routable.length === 0) {
    return undefined;
  }

  try {
    const planar = planariseCore(coreRects, routable);
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
 * Decide which face is the unbounded one from the geometry.
 *
 * The test is a probe that cannot be wrong: take the topmost vertex (leftmost
 * among ties) and look straight up. Nothing in the drawing reaches above it — no
 * vertex by construction, and no segment, because a segment stays within the `y`
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
