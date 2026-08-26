import type { LayoutData } from '../../types.js';
import { sanitizeOrthogonalPolylineForRendering } from './pipeline/sanitize.js';
import { polylineIntersectsAnyRect } from './core/routing.js';
import {
  approxEqual,
  bendCount,
  manhattanLength,
  rectForNode,
  segmentIntersectsRectInterior,
} from './core/helpers.js';
import { liftObstacleIntersectingSegments } from './pipeline/obstacleLiftPass.js';
import { applyObstacleDetourInsertPass } from './pipeline/obstacleDetourInsertPass.js';
import { applySharedSubpathNudge } from './pipeline/sharedSubpathNudge.js';
import { relocateLabelsForSimplification } from './pipeline/labelRelocationPass.js';
import { snapPortsToCenterWhenPaintDiagonal } from './pipeline/snapPortToCenter.js';
import { rebuildPathologicalLabelEdges } from './pipeline/labelDetourRebuild.js';
import { repairShortEndpointStubs } from './pipeline/endpointStubRepair.js';
import { nudgeSegmentsOffGroupBordersWhenScoreImproves } from './pipeline/groupBorderHugNudge.js';
import { checkLayout } from './validateLayoutProxy.js';

/** Arc-length midpoint of an orthogonal polyline (the point halfway along its
 * total length). Returns null for a polyline with fewer than 2 finite points. */
function polylineMidpoint(points: { x: number; y: number }[]): { x: number; y: number } | null {
  const pts = (points ?? []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  if (pts.length < 2) {
    return pts.length === 1 ? { x: pts[0].x, y: pts[0].y } : null;
  }
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    total += Math.abs(pts[i + 1].x - pts[i].x) + Math.abs(pts[i + 1].y - pts[i].y);
  }
  if (total <= 0) {
    return { x: pts[0].x, y: pts[0].y };
  }
  const half = total / 2;
  let travelled = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const segLen = Math.abs(pts[i + 1].x - pts[i].x) + Math.abs(pts[i + 1].y - pts[i].y);
    if (travelled + segLen >= half) {
      const t = segLen <= 0 ? 0 : (half - travelled) / segLen;
      return {
        x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
        y: pts[i].y + (pts[i + 1].y - pts[i].y) * t,
      };
    }
    travelled += segLen;
  }
  return { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y };
}

/** The merged label's authoritative anchor: the DOMUS-placed label-node centre
 * when finite, else the polyline midpoint, else undefined. */
function anchorForMergedLabel(
  ln: { x?: unknown; y?: unknown },
  points: { x: number; y: number }[]
): { x: number | undefined; y: number | undefined } {
  if (Number.isFinite(ln.x) && Number.isFinite(ln.y)) {
    return { x: ln.x as number, y: ln.y as number };
  }
  const mid = polylineMidpoint(points);
  return mid ? { x: mid.x, y: mid.y } : { x: undefined, y: undefined };
}

/**
 * Convert internal "label-as-node" representation back into overlay labels for paint.
 *
 * Orthogonal measurement may inject dummy label nodes and split labeled edges into:
 * - `${edgeId}-to-label`  : start to labelNode
 * - `${edgeId}-from-label`: labelNode to end
 *
 * This function merges those two edges back into a single semantic edge with:
 * - `edge.label` restored (from the label node),
 * - `edge.points` concatenated,
 * - `edge.width/edge.height` populated from the measured label node size,
 * - `edge.x/edge.y` set to the authoritative label anchor (see anchorForMergedLabel),
 * and removes the dummy label nodes from `layoutData.nodes`.
 *
 * This is DOM-free and should be called as the final step of the orthogonal layout,
 * before paint.
 */
export function finalizeDummyLabelNodesToOverlayLabels(layoutData: LayoutData): void {
  const nodes = (layoutData.nodes ?? []) as any[];
  const edges = (layoutData.edges ?? []) as any[];

  const labelNodes = nodes.filter(
    (n) => Boolean(n?.isEdgeLabel) && String(n?.id ?? '').startsWith('edge-label-')
  );
  if (labelNodes.length === 0) {
    // No edge labels to merge — but the generic, label-independent geometry
    // cleanup still applies. Historically this early-returned, so label-less
    // diagrams (e.g. plain subgraph flowcharts) skipped every post-routing
    // pass and shipped raw shape-walk routes (obstacle cuts, shared subpaths,
    // sub-threshold stubs).
    //
    // Run the cleanup only as REMEDIATION — when the route set is invalid.
    // An already-valid label-less layout (e.g. multiple-edges) is left for the
    // gentle score-gated simplifyEdgeJogs pass in index.ts; perturbing its
    // clean routes here can strand it in a worse local optimum that the later
    // pass cannot recover.
    if (!checkLayout(layoutData).ok) {
      runGenericOrthogonalCleanup(layoutData, 10);
    }
    (layoutData.config as any).isLabelNode = false;
    return;
  }

  const edgesByStart = new Map<string, any[]>();
  const edgesByEnd = new Map<string, any[]>();
  for (const e of edges) {
    const s = String(e?.start ?? '');
    const t = String(e?.end ?? '');
    if (!edgesByStart.has(s)) {
      edgesByStart.set(s, []);
    }
    if (!edgesByEnd.has(t)) {
      edgesByEnd.set(t, []);
    }
    edgesByStart.get(s)!.push(e);
    edgesByEnd.get(t)!.push(e);
  }

  const mergedEdges: any[] = [];
  const consumedEdgeIds = new Set<string>();
  const consumedNodeIds = new Set<string>();

  for (const ln of labelNodes) {
    const labelNodeId = String(ln.id);
    const incoming = (edgesByEnd.get(labelNodeId) ?? []).filter((e) => Boolean(e?.isLabelEdge));
    const outgoing = (edgesByStart.get(labelNodeId) ?? []).filter((e) => Boolean(e?.isLabelEdge));
    const toLabel = incoming.find((e) => String(e?.id ?? '').endsWith('-to-label')) ?? incoming[0];
    const fromLabel =
      outgoing.find((e) => String(e?.id ?? '').endsWith('-from-label')) ?? outgoing[0];
    if (!toLabel || !fromLabel) {
      continue;
    }

    const origId = String(toLabel.id ?? '').replace(/-to-label$/, '');
    const start = String(toLabel.start ?? '');
    const end = String(fromLabel.end ?? '');
    const label = String(ln.label ?? '');

    const aPts = Array.isArray(toLabel.points) ? toLabel.points : [];
    const bPts = Array.isArray(fromLabel.points) ? fromLabel.points : [];
    let points = aPts;
    if (aPts.length > 0 && bPts.length > 0) {
      const lastA = aPts[aPts.length - 1];
      const firstB = bPts[0];
      const same =
        lastA &&
        firstB &&
        typeof lastA.x === 'number' &&
        typeof lastA.y === 'number' &&
        typeof firstB.x === 'number' &&
        typeof firstB.y === 'number' &&
        lastA.x === firstB.x &&
        lastA.y === firstB.y;
      points = same ? [...aPts, ...bPts.slice(1)] : [...aPts, ...bPts];
    } else if (bPts.length > 0) {
      points = bPts;
    }

    mergedEdges.push({
      // Preserve important rendering properties from both halves:
      // - `toLabel` carries start-side styling/class/etc.
      // - `fromLabel` carries end-side arrowhead settings (arrowTypeEnd is 'arrow_point').
      ...toLabel,
      ...fromLabel,
      id: origId,
      start,
      end,
      label,
      // Restore arrowheads for the merged semantic edge.
      arrowTypeStart: toLabel.arrowTypeStart ?? fromLabel.arrowTypeStart,
      arrowTypeEnd: fromLabel.arrowTypeEnd ?? toLabel.arrowTypeEnd,
      // Preserve measured label size from the label node so paint can position it predictably.
      width: ln.width,
      height: ln.height,
      // Authoritative label anchor — single source of truth for validate + paint.
      // Normally the DOMUS-placed label-node centre (finite). As a defensive
      // fallback (should a dummy ever lack a placement), use the merged
      // polyline's arc-length midpoint so the anchor is ALWAYS finite: a missing
      // anchor makes validateLayout skip the label and forces paint onto a
      // different position, re-introducing the very divergence A fixed.
      ...anchorForMergedLabel(ln, points),
      points,
      isLabelEdge: false,
    });

    consumedEdgeIds.add(String(toLabel.id));
    consumedEdgeIds.add(String(fromLabel.id));
    consumedNodeIds.add(labelNodeId);
  }

  const keptEdges = edges.filter(
    (e) => !consumedEdgeIds.has(String(e?.id ?? '')) && !e?.isLabelEdge
  );
  layoutData.edges = [...keptEdges, ...mergedEdges] as any;

  // Remove label nodes from the painted node set.
  layoutData.nodes = nodes.filter((n) => !consumedNodeIds.has(String(n?.id ?? ''))) as any;

  // After merging label-split edges, we may have introduced kinks/diagonal joins
  // (e.g. if the two halves don't share an identical join point due to post-routing
  // port reconciliation). Run a small DOM-free cleanup pass on the merged edges:
  // - enforce strict orthogonality
  // - prefer a straight or single-bend L-shape when obstacle-free
  //
  // This intentionally uses the same default spacing as the orthogonal pipeline (10).
  const spacing = 10;
  const nodesByIdNoGroups = new Map<string, any>();
  for (const n of layoutData.nodes as any[]) {
    if (!n?.id) {
      continue;
    }
    if (n?.isGroup) {
      continue;
    }
    nodesByIdNoGroups.set(String(n.id), n);
  }

  // iter-36 D3: collect other edges' ports on each (node, side) so we can
  // detect collisions when realigning a labelled edge's end port. Keyed
  // as `${nodeId}:${side}`; values are coords along the parallel axis
  // (x for N/S, y for E/W).
  const sideOfBoundaryPoint = (
    p: { x: number; y: number },
    r: ReturnType<typeof rectForNode>
  ): 'N' | 'S' | 'E' | 'W' | null => {
    if (approxEqual(p.y, r.top)) {
      return 'N';
    }
    if (approxEqual(p.y, r.bottom)) {
      return 'S';
    }
    if (approxEqual(p.x, r.left)) {
      return 'W';
    }
    if (approxEqual(p.x, r.right)) {
      return 'E';
    }
    return null;
  };
  const portsByNodeSide = new Map<string, number[]>();
  for (const ed of layoutData.edges as any[]) {
    const pts = Array.isArray(ed?.points) ? ed.points : [];
    if (pts.length < 2) {
      continue;
    }
    const endpoints: { nodeId: string; pt: any }[] = [];
    if (ed?.start) {
      endpoints.push({ nodeId: String(ed.start), pt: pts[0] });
    }
    if (ed?.end) {
      endpoints.push({ nodeId: String(ed.end), pt: pts[pts.length - 1] });
    }
    for (const { nodeId, pt } of endpoints) {
      const n2 = nodesByIdNoGroups.get(nodeId);
      if (!n2) {
        continue;
      }
      const r = rectForNode(n2);
      const side = sideOfBoundaryPoint(pt, r);
      if (!side) {
        continue;
      }
      const key = `${nodeId}:${side}`;
      const para = side === 'N' || side === 'S' ? pt.x : pt.y;
      const arr = portsByNodeSide.get(key) ?? [];
      arr.push(para);
      portsByNodeSide.set(key, arr);
    }
  }

  for (const e of mergedEdges) {
    if (!Array.isArray(e.points) || e.points.length < 2 || e.start == null || e.end == null) {
      continue;
    }
    const startId = String(e.start);
    const endId = String(e.end);
    const pts0 = sanitizeOrthogonalPolylineForRendering(e.points, { spacing });
    e.points = pts0 as any;

    // iter-36 D3: end-port realignment for labelled edges. When the end
    // port sits on a node side (N/S/E/W) and the label's parallel-axis
    // coord lies safely within the side's range AND away from sibling
    // ports, shift the port+stub to the label-aligned position. This
    // eliminates the C1-distribution-induced horizontal/vertical detour
    // between label anchor and port (on company-simp this was a 44.5u
    // horizontal kink from x=305.4 label to x=349.9 C1 port). Paper
    // anchor: Siebenhaller §5.6 (label-aligned pin on connected side).
    if (Number.isFinite(e.x) && Number.isFinite(e.y) && pts0.length >= 3) {
      const endPort = pts0[pts0.length - 1];
      const endStub = pts0[pts0.length - 2];
      const endNode = nodesByIdNoGroups.get(endId);
      if (endNode) {
        const r = rectForNode(endNode);
        const side = sideOfBoundaryPoint(endPort, r);
        if (side) {
          const lx = e.x as number;
          const ly = e.y as number;
          const isNS = side === 'N' || side === 'S';
          const targetPara = isNS ? lx : ly;
          const currentPara = isNS ? endPort.x : endPort.y;
          const paraMin = isNS ? r.left : r.top;
          const paraMax = isNS ? r.right : r.bottom;
          const safety = spacing;
          const inRange = targetPara >= paraMin + safety && targetPara <= paraMax - safety;
          const worthShifting = Math.abs(targetPara - currentPara) > safety;
          // The shift moves BOTH the port and its stub on the parallel axis,
          // which keeps the final (perpendicular) segment orthogonal — but the
          // segment BEHIND the stub only survives when it runs along the
          // perpendicular axis too. When it runs parallel (the stub's
          // predecessor is a corner on the same rail), moving the stub bends
          // that segment diagonal: triage2's BSState->Classify shipped its
          // `edge-non-orthogonal` from exactly this shift.
          const prev = pts0.length >= 3 ? pts0[pts0.length - 3] : undefined;
          const prevSurvives =
            !prev || (isNS ? approxEqual(prev.y, endStub.y) : approxEqual(prev.x, endStub.x));
          if (inRange && worthShifting && prevSurvives) {
            const siblings = (portsByNodeSide.get(`${endId}:${side}`) ?? []).filter(
              (p) => Math.abs(p - currentPara) > 1e-6
            );
            const collides = siblings.some((p) => Math.abs(p - targetPara) < safety);
            if (!collides) {
              pts0[pts0.length - 1] = isNS
                ? { x: targetPara, y: endPort.y }
                : { x: endPort.x, y: targetPara };
              pts0[pts0.length - 2] = isNS
                ? { x: targetPara, y: endStub.y }
                : { x: endStub.x, y: targetPara };
              e.points = pts0 as any;
            }
          }
        }
      }
    }

    const a = pts0[0];
    const b = pts0[pts0.length - 1];
    if (!a || !b) {
      continue;
    }

    // iter-36 D2: label-waypoint shortcut. When the edge has a finite
    // label anchor (e.x, e.y), generate candidates that visit the anchor
    // as a required waypoint — one L-elbow per leg. Paper anchor:
    // Siebenhaller §5.6 (center-label split-segment through-going
    // pattern, source `0fb2d84f`) + Wybrow §5.2 edge-length minimisation
    // with forced OVG waypoint (source `e8804c93`). Replaces iter-6's R6
    // early-return — the R6 invariant (label must stay on rendered edge)
    // is now preserved by construction because every label-waypoint
    // candidate passes through the anchor exactly.
    //
    // Port-stub preservation: pts0[1] and pts0[n-2] are the iter-11 R14 /
    // iter-35 R16 port-direction stubs that guarantee perpendicular
    // entry/exit at the end nodes. The shortcut MUST preserve them —
    // stripping the stubs produces edge-port-direction-mismatch. So the
    // candidate replaces only the MIDDLE of the polyline and keeps the
    // two-point start/end caps unchanged. Effective endpoints for the
    // label-waypoint L-per-leg logic are pts0[1] and pts0[n-2].
    const hasLabelAnchor = Number.isFinite(e.x) && Number.isFinite(e.y);
    const n0 = pts0.length;
    const startCap = n0 >= 2 ? pts0[1] : a;
    const endCap = n0 >= 2 ? pts0[n0 - 2] : b;

    const candidates: any[] = [];
    if (hasLabelAnchor && n0 >= 4) {
      const lx = e.x as number;
      const ly = e.y as number;
      // Four L-per-leg pairings through the label anchor, between the
      // preserved port-stub caps. Each candidate is prepended with pts0[0]
      // and appended with pts0[n-1] so the port entries survive.
      const mids: any[][] = [
        [startCap, { x: startCap.x, y: ly }, { x: lx, y: ly }, { x: lx, y: endCap.y }, endCap],
        [startCap, { x: startCap.x, y: ly }, { x: lx, y: ly }, { x: endCap.x, y: ly }, endCap],
        [startCap, { x: lx, y: startCap.y }, { x: lx, y: ly }, { x: lx, y: endCap.y }, endCap],
        [startCap, { x: lx, y: startCap.y }, { x: lx, y: ly }, { x: endCap.x, y: ly }, endCap],
      ];
      for (const mid of mids) {
        candidates.push([pts0[0], ...mid, pts0[n0 - 1]]);
      }
    } else if (approxEqual(a.x, b.x) || approxEqual(a.y, b.y)) {
      candidates.push([a, b]);
    } else {
      candidates.push([a, { x: a.x, y: b.y }, b]);
      candidates.push([a, { x: b.x, y: a.y }, b]);
    }

    // iter-36 D2: label-incidence guard. Sanitize's collinear-collapse can
    // drop a waypoint if the two adjacent segments lie on the same axis —
    // this would silently remove the label anchor from the polyline and
    // leave the rendered label visually disconnected (the R6 regression
    // iter-6 guarded against). Reject any candidate whose post-sanitize
    // polyline does not contain the label anchor.
    const polylineContainsAnchor = (pts: any[]): boolean => {
      if (!hasLabelAnchor) {
        return true;
      }
      const lx = e.x as number;
      const ly = e.y as number;
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        if (approxEqual(p1.y, p2.y) && approxEqual(p1.y, ly)) {
          const xmin = Math.min(p1.x, p2.x);
          const xmax = Math.max(p1.x, p2.x);
          if (lx >= xmin - 1e-6 && lx <= xmax + 1e-6) {
            return true;
          }
        }
        if (approxEqual(p1.x, p2.x) && approxEqual(p1.x, lx)) {
          const ymin = Math.min(p1.y, p2.y);
          const ymax = Math.max(p1.y, p2.y);
          if (ly >= ymin - 1e-6 && ly <= ymax + 1e-6) {
            return true;
          }
        }
      }
      return false;
    };

    // iter-36 D2: stricter obstacle check for label-waypoint candidates.
    // The default `polylineIntersectsAnyRect` excludes start/end nodes (by
    // design — an edge must meet its endpoints at their boundaries). But
    // a label-waypoint detour can cross through the INTERIOR of a start/
    // end node (e.g. the USC→HKC merged edge looping up through the
    // label can clip HKC's interior if the candidate goes via the label
    // x-axis). Check interior segments (skip the first and last — those
    // legitimately touch the node boundary at the port) against ALL
    // nodes, including start/end.
    const rectsForAllNodes: { rect: ReturnType<typeof rectForNode> }[] = [];
    for (const n of nodesByIdNoGroups.values()) {
      rectsForAllNodes.push({ rect: rectForNode(n) });
    }
    const interiorSegmentsClearOfAllNodes = (pts: any[]): boolean => {
      if (pts.length < 4) {
        return true;
      }
      for (let i = 1; i < pts.length - 2; i++) {
        for (const { rect } of rectsForAllNodes) {
          if (segmentIntersectsRectInterior(pts[i], pts[i + 1], rect)) {
            return false;
          }
        }
      }
      return true;
    };

    const currentCost = { bends: bendCount(pts0 as any), length: manhattanLength(pts0 as any) };
    let best: any[] | null = null;
    let bestCost = currentCost;
    for (const cand of candidates) {
      const cPts = sanitizeOrthogonalPolylineForRendering(cand, { spacing });
      if (polylineIntersectsAnyRect(cPts as any, nodesByIdNoGroups, startId, endId)) {
        continue;
      }
      if (hasLabelAnchor && !interiorSegmentsClearOfAllNodes(cPts as any)) {
        continue;
      }
      if (!polylineContainsAnchor(cPts as any)) {
        continue;
      }
      const cost = { bends: bendCount(cPts as any), length: manhattanLength(cPts as any) };
      if (
        cost.bends < bestCost.bends ||
        (cost.bends === bestCost.bends && cost.length + 1e-6 < bestCost.length)
      ) {
        best = cPts as any;
        bestCost = cost;
      }
    }
    if (
      best &&
      (bestCost.bends < currentCost.bends || bestCost.length + 1e-6 < currentCost.length)
    ) {
      e.points = best as any;
    }
  }

  // iter-38: post-D2/D3 obstacle-lift pass. The shape-walk producer
  // (`edgePaths.ts:createEdgePathsFromShapeAtPorts`) is obstacle-
  // unaware; some SAT placements end up with interior segments passing
  // through non-endpoint node interiors. On company-simp iter-37b the
  // merged USC→Expenses polyline cut through Wages at y=147 (validator:
  // `edge-intersects-obstacle`). The lift pass detects any such segment
  // and shifts it to just outside the obstacle (spacing margin above or
  // below / left or right), picking the candidate with fewest bends.
  // Safe fallback: no clean detour → keep current polyline.
  liftObstacleIntersectingSegments(layoutData, { spacing });

  // iter-52: detour-insertion pass on the merged labelled polyline. iter-38
  // lift can only SHIFT a segment; if the geometry is tight (e.g.,
  // Company.mmd `L_USCompany_Income_0` port-inclusive run through Tax
  // with 5u Tax.bottom→Income.top band), shift candidates fail and the
  // detour-insert Case B pattern (bend out, traverse past obstacle,
  // bridge back to port column) is the remaining option. Idempotent;
  // skips edges with no offender, so firing here is safe even when the
  // cycle-removal path already inserted a Case A detour.
  applyObstacleDetourInsertPass(layoutData, { spacing });

  // iter-53 (first call): Wybrow §5.2 shared-subpath nudge for stub-column
  // overlaps introduced pre-iter-42 rebuild (e.g. USC fan-out at x=625).
  applySharedSubpathNudge(layoutData, { spacing });

  // iter-39: label relocation pass. When the merged labelled edge has
  // a large detour (ratio > 2.0) just to visit the DOMUS-placed label
  // anchor, try a simpler L-shape that preserves port entry/exit
  // directions. If the simpler polyline clears obstacles AND the label
  // bbox at its midpoint is clear of non-group nodes, replace the
  // polyline and relocate edge.x/edge.y to the new midpoint. On
  // company-simp iter-37b this fixes the USC→HKC "labelled curl on
  // HKC.left" (ratio 2.66) by pulling the label from (187.3, 220)
  // onto the natural L between USC and HKC.
  // iter-40: also enable bend-count trigger (bends > 3) so the pass
  // catches polylines the iter-38 obstacle-lift leaves with residual
  // zigzags (e.g. company-simp USC→Expenses at ratio 1.73, 5 bends —
  // below ratio threshold but well above 3 bends). Mixed-axis first/
  // last ports are also now handled.
  relocateLabelsForSimplification(layoutData, {
    spacing,
    ratioThreshold: 2.0,
    bendThreshold: 3,
  });

  // iter-42: rebuild pathologically long merged labelled edges. When both
  // endpoint ports are on the SAME horizontal side (W/W or E/E) AND the
  // label anchor is on the opposite side of the source node, the polyline
  // is forced to wrap around (e.g. Company.mmd USC→HKC at 14 bends).
  // iter-39/40's label-relocation returns null in these mixed-sign same-
  // axis configurations. Rebuild with opposing ports + relocate the label.
  rebuildPathologicalLabelEdges(layoutData, { bendThresholdHigh: 7 });

  // iter-56: label-preserving long-dogleg compression. Some merged labelled
  // edges leave finalization as `start -> label-side cap -> tiny Z dogleg ->
  // long rail -> end` even though the label anchor already lies on the first
  // horizontal cap and the same long rail can be reached directly. Replace
  // only when the candidate keeps the label anchor on the polyline, has lower
  // bend/point cost, and remains obstacle-clear.
  simplifyLabelPreservingLongDoglegs(layoutData, nodesByIdNoGroups, spacing);

  // iter-53 (second call): Wybrow §5.2 shared-subpath nudge AFTER iter-42.
  // The rebuild can reintroduce shared-subpaths (e.g. USC→HKC's rebuilt
  // polyline touches HKC.left stub column x=947.5, colliding with an
  // outgoing HKC edge's stub column). Idempotent; no-op if no overlap.
  applySharedSubpathNudge(layoutData, { spacing });

  // Endpoint stubs can remain direction-correct but too short after the
  // labelled-edge passes above. Expand only those local caps so validator
  // threshold failures don't survive as 4-6u bends near a node boundary.
  repairShortEndpointStubs(layoutData, { minLength: spacing });

  // Endpoint expansion can move a terminal rail onto a sibling edge's rail;
  // reuse the idempotent Wybrow-style nudge as the final edge-edge cleanup.
  applySharedSubpathNudge(layoutData, { spacing, preferShorter: true });
  repairShortEndpointStubs(layoutData, { minLength: spacing });
  applySharedSubpathNudge(layoutData, { spacing, preferShorter: true });

  // iter-57: crossing-reduction rail nudge. Some compact same-side doglegs
  // need a short endpoint cap for port correctness but place the first
  // vertical rail directly on a sibling's attach/crossing line. Try a small
  // further-out rail shift and keep it only if the unified validator remains
  // valid and headline score improves.
  nudgeFirstDoglegRailsWhenScoreImproves(layoutData, spacing);

  // iter-59: coordinated crossing rail snap. Some reciprocal same-region
  // doglegs need both crossing segments moved together; moving either edge
  // alone is invalid or score-negative. Try snapping the crossing vertical
  // and horizontal rails to existing rails from the two involved edges, and
  // keep only if the unified validator score improves.
  snapCrossingRailsWhenScoreImproves(layoutData, spacing);

  // iter-58: center-aligned vertical straightening. Some near-vertical
  // N/S edges keep unnecessary side-distribution elbows even when both
  // endpoint node centers are aligned. Try a straight center port route and
  // keep it only if the unified validator score improves.
  straightenCenterAlignedVerticalEdgesWhenScoreImproves(layoutData, nodesByIdNoGroups);

  // iter-41: paint-diagonal port snap. When a first/last port is at
  // t≠0.5 (off-center) on a W/E side, Mermaid's paint-time clip (ray
  // from node center to firstInner) lands at a slightly different y
  // than the port, so the RENDERED first/last segment is diagonal by
  // sub-pixel. Sub-pixel diagonal endpoints are not user-visible but
  // can flip downstream renderer-clip detection. Snap p0 (and
  // firstInner) perpendicular-axis to node center when detected. C1's
  // distinctness is already lost
  // to paint, so this snap is a paint-compatibility adaptation only.
  snapPortsToCenterWhenPaintDiagonal(layoutData, { spacing });

  // iter-60: final semantic-edge label-side rail shortcut. Run after paint-
  // compatibility port snap because that is the final DOM-free route shape
  // returned by the DOMUS layout wrapper.
  shortcutFinalLabelSideRailsWhenScoreImproves(layoutData);

  // iter-61: overlay labels are invisible to the node-obstacle passes above
  // (post-merge they are edge.x/y/width/height, not nodes), so a foreign
  // edge can end up running through a label box. Routes are final at this
  // point; slide the LABEL along its own polyline to a clear spot instead
  // of disturbing any edge geometry.
  relocateLabelOverlaysOffForeignEdgesWhenImproves(layoutData);

  // A long interior segment flush on a subgraph frame trips edge-border-hugging
  // (e.g. deploy-pipeline K->L exiting the Deploy Pipeline subgraph). Nudge it
  // off the frame, score-gated so it never makes any layout worse.
  nudgeSegmentsOffGroupBordersWhenScoreImproves(layoutData, spacing);

  // Paint should treat labels as overlay labels (not label nodes).
  (layoutData.config as any).isLabelNode = false;
}

/**
 * iter-61: move an overlay label off foreign edges by sliding it along its
 * own edge polyline. Candidates are sampled on the polyline (the label is
 * painted over its own edge, which the validator permits), geometrically
 * pre-filtered against all other edges' segments and all non-group node
 * rects, then accepted only when the unified validator improves — score up,
 * or (while invalid) strictly fewer issues.
 */
/**
 * Generic, label-independent orthogonal-route cleanup. These passes operate on
 * `layoutData.edges` against node obstacles and never touch label geometry, so
 * they apply equally to labeled and label-less diagrams. The labeled path runs
 * them inline (interleaved with label-specific passes); the label-less early
 * return calls this so plain subgraph flowcharts get the same cleanup instead
 * of shipping raw shape-walk routes.
 */
function runGenericOrthogonalCleanup(layoutData: LayoutData, spacing: number): void {
  const nodesByIdNoGroups = new Map<string, any>();
  for (const n of (layoutData.nodes ?? []) as any[]) {
    if (n?.id && !n.isGroup) {
      nodesByIdNoGroups.set(String(n.id), n);
    }
  }

  // Snapshot every edge's polyline so the whole cleanup can be reverted as a
  // unit. Some constituent passes (obstacle-lift, shared-subpath, stub repair)
  // apply unconditionally rather than score-gated, so on an already-clean route
  // they can trade one clean shape for a different-but-worse one. Guarding the
  // batch keeps the net effect monotone: cleanup only ships when it does not
  // lower the unified validator score.
  const before = checkLayout(layoutData);
  const snapshot = new Map<any, { x: number; y: number }[]>();
  for (const e of (layoutData.edges ?? []) as any[]) {
    if (Array.isArray(e?.points)) {
      snapshot.set(
        e,
        e.points.map((p: any) => ({ x: p.x, y: p.y }))
      );
    }
  }

  // Obstacle clearance first: shift, then detour-insert for tight cases.
  liftObstacleIntersectingSegments(layoutData, { spacing });
  applyObstacleDetourInsertPass(layoutData, { spacing });

  // Separate coincident rails, then expand sub-threshold endpoint stubs; repeat
  // once because stub expansion can reintroduce a shared rail. All idempotent.
  applySharedSubpathNudge(layoutData, { spacing });
  repairShortEndpointStubs(layoutData, { minLength: spacing });
  applySharedSubpathNudge(layoutData, { spacing, preferShorter: true });
  repairShortEndpointStubs(layoutData, { minLength: spacing });
  applySharedSubpathNudge(layoutData, { spacing, preferShorter: true });

  // Score-gated refinements (each reverts unless the unified validator improves).
  nudgeFirstDoglegRailsWhenScoreImproves(layoutData, spacing);
  snapCrossingRailsWhenScoreImproves(layoutData, spacing);
  straightenCenterAlignedVerticalEdgesWhenScoreImproves(layoutData, nodesByIdNoGroups);
  snapPortsToCenterWhenPaintDiagonal(layoutData, { spacing });
  nudgeSegmentsOffGroupBordersWhenScoreImproves(layoutData, spacing);

  const after = checkLayout(layoutData);
  if (after.score < before.score) {
    for (const e of (layoutData.edges ?? []) as any[]) {
      const orig = snapshot.get(e);
      if (orig) {
        e.points = orig;
      }
    }
  }
}

function relocateLabelOverlaysOffForeignEdgesWhenImproves(
  layoutData: LayoutData,
  opts: { allowPerpendicularOffsets?: boolean } = {}
): void {
  let current = checkLayout(layoutData);
  const offenders = current.issues.filter(
    (i) =>
      i.type === 'edge-label-overlaps-foreign-edge' &&
      typeof (i.details as { ownerEdgeId?: unknown })?.ownerEdgeId === 'string' &&
      (i.details as { ownerEdgeId: string }).ownerEdgeId.length > 0
  );
  if (offenders.length === 0) {
    return;
  }

  const edges = (layoutData.edges ?? []) as any[];
  const edgesById = new Map<string, any>();
  for (const e of edges) {
    edgesById.set(String(e?.id ?? ''), e);
  }
  const nodeRects = ((layoutData.nodes ?? []) as any[])
    .filter((n) => n?.id != null && !n.isGroup)
    .map((n) => rectForNode(n));

  const MAX_VALIDATIONS_PER_LABEL = 12;
  const SAMPLE_STEP = 8;

  for (const issue of offenders) {
    const ownerId = (issue.details as { ownerEdgeId: string }).ownerEdgeId;
    const owner = edgesById.get(ownerId);
    const pts = owner?.points as { x: number; y: number }[] | undefined;
    const w = Number(owner?.width);
    const h = Number(owner?.height);
    if (
      !owner ||
      !Array.isArray(pts) ||
      pts.length < 2 ||
      !Number.isFinite(w) ||
      !Number.isFinite(h) ||
      w <= 0 ||
      h <= 0
    ) {
      continue;
    }

    const isClear = (cx: number, cy: number): boolean => {
      const rect = { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 };
      for (const e2 of edges) {
        if (String(e2?.id ?? '') === ownerId) {
          continue;
        }
        const p2 = e2?.points as { x: number; y: number }[] | undefined;
        if (!Array.isArray(p2)) {
          continue;
        }
        for (let i = 0; i < p2.length - 1; i++) {
          if (segmentIntersectsRectInterior(p2[i], p2[i + 1], rect as any)) {
            return false;
          }
        }
      }
      for (const nr of nodeRects) {
        const apart =
          rect.right <= nr.left ||
          rect.left >= nr.right ||
          rect.bottom <= nr.top ||
          rect.top >= nr.bottom;
        if (!apart) {
          return false;
        }
      }
      return true;
    };

    // Sample candidate anchors along the own polyline, nearest-first to the
    // current anchor so the visual move is minimal.
    const curX = Number(owner.x);
    const curY = Number(owner.y);
    const candidates: { x: number; y: number; dist: number }[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
      const steps = Math.max(1, Math.floor(len / SAMPLE_STEP));
      const push = (x: number, y: number): void => {
        const dist =
          Number.isFinite(curX) && Number.isFinite(curY)
            ? Math.abs(x - curX) + Math.abs(y - curY)
            : 0;
        candidates.push({ x, y, dist });
      };
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;
        push(x, y);
        // Perpendicular offsets: on a dense drawing every centered anchor can
        // be occupied (triage: 81 anchors, all hit ≥1 foreign edge — the
        // routes share the label's own corridor). Anchoring the label a hair
        // under half its extent off the segment keeps the polyline inside the
        // rect (the `edge-label-off-edge` contract is intersection, not
        // centering) while the rect's bulk leaves the corridor entirely.
        // Only offered on the final end-of-layout call: mid-finalize label
        // moves change the monotone accounting of the route repairs that run
        // after finalize, and measured on triage that cost the repairs their
        // acceptance (3 obstacle hits shipped) — labels must move LAST.
        const horizontal = Math.abs(b.y - a.y) <= Math.abs(b.x - a.x);
        const off = (horizontal ? h : w) / 2 - 1;
        if (opts.allowPerpendicularOffsets && off > 1) {
          if (horizontal) {
            push(x, y - off);
            push(x, y + off);
          } else {
            push(x - off, y);
            push(x + off, y);
          }
        }
      }
    }
    candidates.sort((c1, c2) => c1.dist - c2.dist);

    let validations = 0;
    for (const c of candidates) {
      if (validations >= MAX_VALIDATIONS_PER_LABEL) {
        break;
      }
      if (!isClear(c.x, c.y)) {
        continue;
      }
      const oldX = owner.x;
      const oldY = owner.y;
      owner.x = c.x;
      owner.y = c.y;
      validations += 1;
      const next = checkLayout(layoutData);
      const improved =
        next.score > current.score || (!current.ok && next.issues.length < current.issues.length);
      if (improved) {
        current = next;
        break;
      }
      owner.x = oldX;
      owner.y = oldY;
    }
  }
}

/**
 * Final label-only cleanup, for the very end of `layout()`: every route is
 * final, so sliding a label (with perpendicular offsets allowed) cannot
 * disturb any repair pass's accounting — the geometry the validator grades is
 * exactly the geometry the labels are placed against.
 */
export function relocateOverlayLabelsOffForeignEdgesFinal(layoutData: LayoutData): void {
  relocateLabelOverlaysOffForeignEdgesWhenImproves(layoutData, {
    allowPerpendicularOffsets: true,
  });
}

function shortcutFinalLabelSideRailsWhenScoreImproves(layoutData: LayoutData): void {
  let current = checkLayout(layoutData);
  if (!current.ok) {
    return;
  }

  const clean = (pts: any[]): any[] => {
    const out: any[] = [];
    for (const p of pts) {
      const q = out[out.length - 1];
      if (!q || !approxEqual(q.x, p.x) || !approxEqual(q.y, p.y)) {
        out.push(p);
      }
    }
    return out;
  };

  for (const e of layoutData.edges as any[]) {
    if (!Number.isFinite(e?.x) || !Number.isFinite(e?.y)) {
      continue;
    }
    if (!Array.isArray(e.points) || e.points.length < 6) {
      continue;
    }

    const pts0 = e.points as any[];
    const label = { x: e.x as number, y: e.y as number };
    if (!polylineContainsPoint([pts0[0], pts0[1]], label)) {
      continue;
    }

    for (let railIndex = 3; railIndex <= pts0.length - 3; railIndex++) {
      const railEntry = pts0[railIndex];
      const railExit = pts0[railIndex + 1];
      if (!railEntry || !railExit || !approxEqual(railEntry.x, railExit.x)) {
        continue;
      }
      if (approxEqual(railEntry.x, label.x) || approxEqual(railEntry.y, label.y)) {
        continue;
      }

      // Keep the explicit label waypoint. Sanitizing this candidate would collapse
      // the collinear label anchor, breaking overlay-label incidence even though
      // the rendered route is geometrically equivalent.
      const candidate = clean([
        pts0[0],
        label,
        { x: railEntry.x, y: label.y },
        ...pts0.slice(railIndex + 1),
      ]);
      if (candidate.length >= pts0.length) {
        continue;
      }
      if (!polylineContainsPoint(candidate, label) || !sameEndpointDirections(pts0, candidate)) {
        continue;
      }

      const oldPoints = e.points;
      e.points = candidate as any;
      const next = checkLayout(layoutData);
      if (next.ok && next.score > current.score) {
        current = next;
        break;
      }
      e.points = oldPoints;
    }
  }
}

function snapCrossingRailsWhenScoreImproves(layoutData: LayoutData, spacing: number): void {
  let current = checkLayout(layoutData);
  if (!current.ok) {
    return;
  }

  const segmentInfo = (edge: any): any[] => {
    const pts = Array.isArray(edge?.points) ? edge.points : [];
    const out: any[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (!a || !b) {
        continue;
      }
      if (approxEqual(a.x, b.x)) {
        out.push({
          edge,
          index: i,
          vertical: true,
          x: a.x,
          y1: Math.min(a.y, b.y),
          y2: Math.max(a.y, b.y),
        });
      } else if (approxEqual(a.y, b.y)) {
        out.push({
          edge,
          index: i,
          vertical: false,
          y: a.y,
          x1: Math.min(a.x, b.x),
          x2: Math.max(a.x, b.x),
        });
      }
    }
    return out;
  };

  const crosses = (a: any, b: any): boolean => {
    if (a.edge === b.edge || a.vertical === b.vertical) {
      return false;
    }
    const v = a.vertical ? a : b;
    const h = a.vertical ? b : a;
    return v.x > h.x1 + 1e-6 && v.x < h.x2 - 1e-6 && h.y > v.y1 + 1e-6 && h.y < v.y2 - 1e-6;
  };

  const snapVertical = (points: any[], index: number, x: number): any[] | null => {
    if (!points[index] || !points[index + 1]) {
      return null;
    }
    const next = points.map((p) => ({ ...p }));
    next[index].x = x;
    next[index + 1].x = x;
    return sanitizeOrthogonalPolylineForRendering(next, { spacing }) as any[];
  };
  const snapHorizontal = (points: any[], index: number, y: number): any[] | null => {
    if (!points[index] || !points[index + 1]) {
      return null;
    }
    const next = points.map((p) => ({ ...p }));
    next[index].y = y;
    next[index + 1].y = y;
    return sanitizeOrthogonalPolylineForRendering(next, { spacing }) as any[];
  };

  const edges = (layoutData.edges as any[]).filter(
    (e) => Array.isArray(e?.points) && e.points.length >= 4
  );
  const segments = edges.flatMap(segmentInfo);
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const a = segments[i];
      const b = segments[j];
      if (!crosses(a, b)) {
        continue;
      }
      const vertical = a.vertical ? a : b;
      const horizontal = a.vertical ? b : a;
      const xCandidates = [
        ...new Set([...vertical.edge.points, ...horizontal.edge.points].map((p: any) => p.x)),
      ];
      const yCandidates = [
        ...new Set([...vertical.edge.points, ...horizontal.edge.points].map((p: any) => p.y)),
      ];
      for (const x of xCandidates) {
        for (const y of yCandidates) {
          if (!Number.isFinite(x) || !Number.isFinite(y)) {
            continue;
          }
          const oldV = vertical.edge.points;
          const oldH = horizontal.edge.points;
          const nextV = snapVertical(oldV, vertical.index, x);
          const nextH = snapHorizontal(oldH, horizontal.index, y);
          if (!nextV || !nextH) {
            continue;
          }
          if (!sameEndpointDirections(oldV, nextV) || !sameEndpointDirections(oldH, nextH)) {
            continue;
          }
          vertical.edge.points = nextV;
          horizontal.edge.points = nextH;
          const next = checkLayout(layoutData);
          if (next.ok && next.score > current.score) {
            current = next;
          } else {
            vertical.edge.points = oldV;
            horizontal.edge.points = oldH;
          }
        }
      }
    }
  }
}

function straightenCenterAlignedVerticalEdgesWhenScoreImproves(
  layoutData: LayoutData,
  nodesByIdNoGroups: Map<string, any>
): void {
  let current = checkLayout(layoutData);
  if (!current.ok) {
    return;
  }

  for (const e of layoutData.edges as any[]) {
    if (!Array.isArray(e?.points) || e.points.length < 3 || e.start == null || e.end == null) {
      continue;
    }
    const startNode = nodesByIdNoGroups.get(String(e.start));
    const endNode = nodesByIdNoGroups.get(String(e.end));
    if (!startNode || !endNode) {
      continue;
    }
    if (!approxEqual(startNode.x, endNode.x)) {
      continue;
    }
    const startRect = rectForNode(startNode);
    const endRect = rectForNode(endNode);
    const startY = startNode.y < endNode.y ? startRect.bottom : startRect.top;
    const endY = startNode.y < endNode.y ? endRect.top : endRect.bottom;
    const candidate = [
      { x: startNode.x, y: startY },
      { x: endNode.x, y: endY },
    ];
    if (!sameEndpointDirections(e.points, candidate)) {
      continue;
    }

    const oldPoints = e.points;
    e.points = candidate as any;
    const next = checkLayout(layoutData);
    if (next.ok && next.score > current.score) {
      current = next;
    } else {
      e.points = oldPoints;
    }
  }
}

function nudgeFirstDoglegRailsWhenScoreImproves(layoutData: LayoutData, spacing: number): void {
  let current = checkLayout(layoutData);
  if (!current.ok) {
    return;
  }

  for (const e of layoutData.edges as any[]) {
    if (!Array.isArray(e?.points) || e.points.length !== 6) {
      continue;
    }
    const pts0 = sanitizeOrthogonalPolylineForRendering(e.points, { spacing }) as any[];
    if (pts0.length !== 6) {
      continue;
    }
    const p0 = pts0[0];
    const p1 = pts0[1];
    const p2 = pts0[2];
    const p3 = pts0[3];
    if (!approxEqual(p0.y, p1.y) || !approxEqual(p1.x, p2.x) || !approxEqual(p2.y, p3.y)) {
      continue;
    }

    const firstDx = p1.x - p0.x;
    if (Math.abs(firstDx) < 1e-6) {
      continue;
    }
    const candidateX = firstDx < 0 ? Math.floor(p1.x - spacing - 1) : Math.ceil(p1.x + spacing + 1);
    const candidate = sanitizeOrthogonalPolylineForRendering(
      [p0, { ...p1, x: candidateX }, { ...p2, x: candidateX }, ...pts0.slice(3)],
      { spacing }
    ) as any[];
    if (candidate.length !== pts0.length || !sameEndpointDirections(pts0, candidate)) {
      continue;
    }

    const oldPoints = e.points;
    e.points = candidate as any;
    const next = checkLayout(layoutData);
    if (next.ok && next.score > current.score) {
      current = next;
    } else {
      e.points = oldPoints;
    }
  }
}

function simplifyLabelPreservingLongDoglegs(
  layoutData: LayoutData,
  nodesByIdNoGroups: Map<string, any>,
  spacing: number
): void {
  for (const e of layoutData.edges as any[]) {
    if (!e?.label || !Number.isFinite(e.x) || !Number.isFinite(e.y)) {
      continue;
    }
    if (!Array.isArray(e.points) || e.points.length < 8 || e.start == null || e.end == null) {
      continue;
    }

    const startId = String(e.start);
    const endId = String(e.end);
    const pts0 = sanitizeOrthogonalPolylineForRendering(e.points, { spacing }) as any[];
    if (pts0.length < 8) {
      continue;
    }

    const first = pts0[0];
    const label = { x: e.x as number, y: e.y as number };
    if (!approxEqual(first.y, label.y)) {
      continue;
    }

    const currentCost = { bends: bendCount(pts0 as any), length: manhattanLength(pts0 as any) };
    let best: any[] | null = null;
    let bestCost = currentCost;

    for (let railIndex = 4; railIndex <= pts0.length - 3; railIndex++) {
      const railEntry = pts0[railIndex];
      if (!railEntry || !Number.isFinite(railEntry.x) || !Number.isFinite(railEntry.y)) {
        continue;
      }

      const candidate = sanitizeOrthogonalPolylineForRendering(
        [
          first,
          { x: label.x, y: first.y },
          { x: label.x, y: railEntry.y },
          ...pts0.slice(railIndex),
        ],
        { spacing }
      ) as any[];

      if (candidate.length >= pts0.length) {
        continue;
      }
      if (!polylineContainsPoint(candidate, label)) {
        continue;
      }
      if (polylineIntersectsAnyRect(candidate as any, nodesByIdNoGroups, startId, endId)) {
        continue;
      }
      if (!interiorSegmentsClearOfAllNodes(candidate, nodesByIdNoGroups)) {
        continue;
      }
      if (!sameEndpointDirections(pts0, candidate)) {
        continue;
      }
      const cost = {
        bends: bendCount(candidate as any),
        length: manhattanLength(candidate as any),
      };
      if (
        cost.bends < bestCost.bends ||
        (cost.bends === bestCost.bends && cost.length + 1e-6 < bestCost.length)
      ) {
        best = candidate;
        bestCost = cost;
      }
    }

    if (
      best &&
      (bestCost.bends < currentCost.bends || bestCost.length + 1e-6 < currentCost.length)
    ) {
      e.points = best as any;
    }
  }
}

function polylineContainsPoint(pts: any[], point: { x: number; y: number }): boolean {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (approxEqual(a.y, b.y) && approxEqual(a.y, point.y)) {
      const lo = Math.min(a.x, b.x);
      const hi = Math.max(a.x, b.x);
      if (point.x >= lo - 1e-6 && point.x <= hi + 1e-6) {
        return true;
      }
    }
    if (approxEqual(a.x, b.x) && approxEqual(a.x, point.x)) {
      const lo = Math.min(a.y, b.y);
      const hi = Math.max(a.y, b.y);
      if (point.y >= lo - 1e-6 && point.y <= hi + 1e-6) {
        return true;
      }
    }
  }
  return false;
}

function interiorSegmentsClearOfAllNodes(pts: any[], nodesByIdNoGroups: Map<string, any>): boolean {
  if (pts.length < 4) {
    return true;
  }
  const rects = [...nodesByIdNoGroups.values()].map((node) => rectForNode(node));
  for (let i = 1; i < pts.length - 2; i++) {
    for (const rect of rects) {
      if (segmentIntersectsRectInterior(pts[i], pts[i + 1], rect)) {
        return false;
      }
    }
  }
  return true;
}

function sameEndpointDirections(before: any[], after: any[]): boolean {
  if (before.length < 2 || after.length < 2) {
    return false;
  }
  const direction = (a: any, b: any): 'H' | 'V' | null => {
    if (approxEqual(a.y, b.y)) {
      return 'H';
    }
    if (approxEqual(a.x, b.x)) {
      return 'V';
    }
    return null;
  };
  return (
    direction(before[0], before[1]) === direction(after[0], after[1]) &&
    direction(before[before.length - 2], before[before.length - 1]) ===
      direction(after[after.length - 2], after[after.length - 1])
  );
}
