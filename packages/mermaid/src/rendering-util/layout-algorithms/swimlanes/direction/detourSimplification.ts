// cspell:ignore Hegemann Wybrow

import type { NodeBoundsInfo } from './geometry.js';
import {
  buildOrthogonalPortPath,
  buildSameSideTrackPath,
  collectRealNodeBounds,
  countOrthogonalBends,
  orthogonalSegmentsCross,
  orthogonalSegmentsForPoints,
  portForRectSide,
  sameAxisSegmentOverlapLength,
  segmentHitsAnyRect,
} from './geometry.js';
import type { RectSide } from './geometry.js';

const EPS = 1e-3;
const MIN_SHARED = 8;

export function simplifyDetouredEdges(edges: any[], nodes: any[]): void {
  const { nodeInfoById, realNodeRects } = collectRealNodeBounds(nodes);

  const sides: RectSide[] = ['top', 'bottom', 'left', 'right'];

  // Anchor offset for port exit. Each port's first/last segment must
  // extend in the port's perpendicular direction by at least this many
  // units before turning, so (a) the port-direction check in
  // validateLayout is satisfied and (b) the segment does not hug the
  // node's boundary. Matches raykov's ANCHOR_OFFSET.
  const ANCHOR = 20;

  const outsideTracks = {
    top: Math.min(...realNodeRects.map((node) => node.rect.top)) - ANCHOR,
    bottom: Math.max(...realNodeRects.map((node) => node.rect.bottom)) + ANCHOR,
    left: Math.min(...realNodeRects.map((node) => node.rect.left)) - ANCHOR,
    right: Math.max(...realNodeRects.map((node) => node.rect.right)) + ANCHOR,
  };

  const buildOrthogonalPathCandidates = (
    src: { x: number; y: number },
    srcSide: RectSide,
    dst: { x: number; y: number },
    dstSide: RectSide
  ): { x: number; y: number }[][] => {
    const paths: { x: number; y: number }[][] = [];
    const base = buildOrthogonalPortPath(src, srcSide, dst, dstSide, ANCHOR, EPS);
    if (base) {
      paths.push(base);
    }

    // Crossing-reduction extension of the same-side detour rule above:
    // when the local "just outside these two ports" track still crosses
    // an existing connector, also try the corresponding global outer
    // channel. This mirrors Wybrow-style post-route nudging/ordering:
    // preserve the port pair and topology class, but move the maximal
    // middle segment into an uncongested alley if safety checks accept it.
    if (srcSide === dstSide) {
      paths.push(buildSameSideTrackPath(src, srcSide, dst, outsideTracks[srcSide]));
    }

    return paths;
  };

  const pathHitsNode = (pts: { x: number; y: number }[], excludeIds: string[]): boolean => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (segmentHitsAnyRect(a, b, realNodeRects, excludeIds, 1)) {
        return true;
      }
    }
    return false;
  };

  const pathConflictCount = (
    path: { x: number; y: number }[],
    currentEdge: any,
    includeIncidentEdges = false
  ): number => {
    let conflicts = 0;
    const pathSegments = orthogonalSegmentsForPoints(path, EPS);
    const currentStart = (currentEdge as { start?: string }).start;
    const currentEnd = (currentEdge as { end?: string }).end;
    for (const other of edges) {
      if (other === currentEdge || (other as { isLayoutOnly?: boolean }).isLayoutOnly) {
        continue;
      }
      const otherStart = (other as { start?: string }).start;
      const otherEnd = (other as { end?: string }).end;
      if (
        !includeIncidentEdges &&
        currentStart &&
        currentEnd &&
        (otherStart === currentStart ||
          otherStart === currentEnd ||
          otherEnd === currentStart ||
          otherEnd === currentEnd)
      ) {
        continue;
      }
      const otherPts = (other as { points?: { x: number; y: number }[] }).points;
      if (!otherPts || otherPts.length < 2) {
        continue;
      }
      for (const pathSegment of pathSegments) {
        for (const otherSegment of orthogonalSegmentsForPoints(otherPts, EPS)) {
          if (
            orthogonalSegmentsCross(
              pathSegment.a,
              pathSegment.b,
              otherSegment.a,
              otherSegment.b,
              EPS,
              EPS
            )
          ) {
            conflicts++;
            continue;
          }
          if (sameAxisSegmentOverlapLength(pathSegment, otherSegment, EPS) >= MIN_SHARED) {
            conflicts++;
          }
        }
      }
    }
    return conflicts;
  };

  const BEND_THRESHOLD = 4;

  // Collect which node faces are already claimed by other edges so the
  // rewrite loop below can reject a candidate port pair whose face is
  // contested. This realizes Hegemann-Wolff's bend-or-end global
  // feasibility rule (src d30cdbe1): two edges claiming the same node
  // face must be feasibility-checked as a set, never accepted as a
  // sequential patch.
  //
  // Iter 9 defect: raykov routed L_D_E_0 around H with 4 bends and
  // L_E_F_0 cleanly at E.top in parallel; this pass then rewrote
  // L_D_E_0 to the 2-bend (D.top, E.top) L-shape because it only
  // checked against real-node obstacles and was blind to the E.top
  // claim L_E_F_0 had already made.
  //
  // Note the face-detection uses `nearestSideOfRect` which picks
  // whichever of the 4 rect edges the point is closest to. The
  // polyline endpoints at this point in the pipeline are ALREADY
  // transformed to TB coordinates but the final endpoint-clip pass
  // (which snaps each endpoint onto the actual rect boundary) runs
  // LATER, so the raw attach points may sit a few units inside the
  // node rect. Nearest-side works regardless of whether the point is
  // on, just outside, or a few units inside the rect.
  const nearestSideOfRect = (pt: { x: number; y: number }, info: NodeBoundsInfo): RectSide => {
    const dTop = Math.abs(pt.y - info.rect.top);
    const dBottom = Math.abs(pt.y - info.rect.bottom);
    const dLeft = Math.abs(pt.x - info.rect.left);
    const dRight = Math.abs(pt.x - info.rect.right);
    let best: RectSide = 'top';
    let bestDist = dTop;
    if (dBottom < bestDist) {
      best = 'bottom';
      bestDist = dBottom;
    }
    if (dLeft < bestDist) {
      best = 'left';
      bestDist = dLeft;
    }
    if (dRight < bestDist) {
      best = 'right';
      bestDist = dRight;
    }
    return best;
  };

  interface FaceClaim {
    side: RectSide;
    edgeId: string;
  }
  const faceClaims = new Map<string, FaceClaim[]>();
  const addFaceClaim = (nodeId: string, side: RectSide, edgeId: string) => {
    const claims = faceClaims.get(nodeId) ?? [];
    claims.push({ side, edgeId });
    faceClaims.set(nodeId, claims);
  };
  for (const e of edges) {
    if ((e as { isLayoutOnly?: boolean }).isLayoutOnly) {
      continue;
    }
    const pts = (e as { points?: { x: number; y: number }[] }).points ?? [];
    if (pts.length < 1) {
      continue;
    }
    const eId = (e as { id?: string }).id ?? '';
    const startId = (e as { start?: string }).start;
    const endId = (e as { end?: string }).end;
    if (startId) {
      const info = nodeInfoById.get(startId);
      if (info) {
        addFaceClaim(startId, nearestSideOfRect(pts[0], info), eId);
      }
    }
    if (endId) {
      const info = nodeInfoById.get(endId);
      if (info) {
        addFaceClaim(endId, nearestSideOfRect(pts[pts.length - 1], info), eId);
      }
    }
  }

  const faceIsClaimed = (nodeId: string, side: RectSide, ignoreEdgeId: string): boolean => {
    return (
      faceClaims.get(nodeId)?.some((c) => c.edgeId !== ignoreEdgeId && c.side === side) ?? false
    );
  };

  for (const edge of edges) {
    if (edge.isLayoutOnly) {
      continue;
    }
    const pts = edge.points as { x: number; y: number }[] | undefined;
    if (!pts || pts.length < 2) {
      continue;
    }
    const currentBends = countOrthogonalBends(pts, EPS);
    if (currentBends < BEND_THRESHOLD) {
      continue;
    }
    const srcId = edge.start as string | undefined;
    const dstId = edge.end as string | undefined;
    if (!srcId || !dstId) {
      continue;
    }
    const srcInfo = nodeInfoById.get(srcId);
    const dstInfo = nodeInfoById.get(dstId);
    if (!srcInfo || !dstInfo) {
      continue;
    }
    const edgeId = (edge as { id?: string }).id ?? '';
    const currentCrossingConflicts = pathConflictCount(pts, edge, true);
    const currentNonIncidentConflicts = pathConflictCount(pts, edge);

    let bestPath: { x: number; y: number }[] | undefined;
    let bestCrossingConflicts = currentCrossingConflicts;
    let bestBends = currentBends;

    for (const srcSide of sides) {
      if (faceIsClaimed(srcId, srcSide, edgeId)) {
        continue;
      }
      const srcPort = portForRectSide(srcInfo, srcSide);
      for (const dstSide of sides) {
        if (faceIsClaimed(dstId, dstSide, edgeId)) {
          continue;
        }
        const dstPort = portForRectSide(dstInfo, dstSide);
        for (const path of buildOrthogonalPathCandidates(srcPort, srcSide, dstPort, dstSide)) {
          if (pathHitsNode(path, [srcId, dstId])) {
            continue;
          }

          const pathBends = countOrthogonalBends(path, EPS);
          if (currentCrossingConflicts > 0) {
            const pathCrossingConflicts = pathConflictCount(path, edge, true);
            if (
              pathCrossingConflicts > bestCrossingConflicts ||
              (pathCrossingConflicts === bestCrossingConflicts && pathBends >= bestBends)
            ) {
              continue;
            }
            bestCrossingConflicts = pathCrossingConflicts;
            bestBends = pathBends;
            bestPath = path;
            continue;
          }

          if (pathConflictCount(path, edge) > currentNonIncidentConflicts) {
            continue;
          }
          if (pathBends < bestBends) {
            bestBends = pathBends;
            bestPath = path;
          }
        }
      }
    }

    if (bestPath) {
      (edge as { points: { x: number; y: number }[] }).points = bestPath;
      // Refresh face claims for this edge so downstream iterations
      // see the new attach sides. The loop mutates edges in place;
      // stale claims would let two edges both commit to the same face.
      const refreshSrc = faceClaims.get(srcId);
      if (refreshSrc) {
        faceClaims.set(
          srcId,
          refreshSrc.filter((c) => c.edgeId !== edgeId)
        );
      }
      const refreshDst = faceClaims.get(dstId);
      if (refreshDst) {
        faceClaims.set(
          dstId,
          refreshDst.filter((c) => c.edgeId !== edgeId)
        );
      }
      addFaceClaim(srcId, nearestSideOfRect(bestPath[0], srcInfo), edgeId);
      addFaceClaim(dstId, nearestSideOfRect(bestPath[bestPath.length - 1], dstInfo), edgeId);
    }
  }
}
