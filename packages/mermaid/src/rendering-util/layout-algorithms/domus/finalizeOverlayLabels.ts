import type { Edge, LayoutData, Node } from '../../types.js';
import { log } from '../../../logger.js';
import { ORTHO_DEBUG } from './debug.js';
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
import { applyBorderHugClearance } from './pipeline/borderHugClearance.js';
import { applyParallelLaneSeparation } from './pipeline/parallelLaneSeparation.js';
import { relocateLabelsForSimplification } from './pipeline/labelRelocationPass.js';
import { snapPortsToCenterWhenPaintDiagonal } from './pipeline/snapPortToCenter.js';
import { rebuildPathologicalLabelEdges } from './pipeline/labelDetourRebuild.js';
import { repairShortEndpointStubs } from './pipeline/endpointStubRepair.js';
import { validateLayout } from './validateLayoutProxy.js';
import { applyLibavoidFallbackIfNeeded } from './pipeline/libavoidFallback.js';
import { withDefaultLibavoidFallback } from './pipeline/libavoidAdapter.js';

type EdgeWithLabelGeometry = Edge & {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

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
 * - `edge.x/edge.y` set to the label node position when available (as a paint hint),
 * and removes the dummy label nodes from `layoutData.nodes`.
 *
 * This is DOM-free and should be called as the final step of the orthogonal layout,
 * before paint.
 */
export function finalizeDummyLabelNodesToOverlayLabels(layoutData: LayoutData): void {
  const nodes = (layoutData.nodes ?? []) as any[];
  const edges = (layoutData.edges ?? []) as any[];
  const libavoidAcceptedEdgeIds =
    (
      layoutData as LayoutData & {
        __libavoidAcceptedEdgeIds?: string[];
        __libavoidAcceptedDiffs?: {
          edgeId: string;
          before?: { x: number; y: number }[];
          after?: { x: number; y: number }[];
          identical: boolean;
        }[];
      }
    ).__libavoidAcceptedEdgeIds ?? [];
  const libavoidAcceptedDiffs =
    (
      layoutData as LayoutData & {
        __libavoidAcceptedDiffs?: {
          edgeId: string;
          before?: { x: number; y: number }[];
          after?: { x: number; y: number }[];
          identical: boolean;
        }[];
        __libavoidReport?: Record<string, unknown>;
      }
    ).__libavoidAcceptedDiffs ?? [];

  const labelNodes = nodes.filter(
    (n) => Boolean(n?.isEdgeLabel) && String(n?.id ?? '').startsWith('edge-label-')
  );
  if (labelNodes.length === 0) {
    // Nothing to merge; still apply the final endpoint-stub repair because
    // unlabeled compound fixtures can leave terminal rails just inside the
    // validator's endpoint band.
    const spacing = 10;
    applyEndpointStubRepairIfImproves(layoutData, spacing);
    applyBlockedSameRankDetoursIfImproves(layoutData, spacing);
    applyLongPolylineRailShortcutIfImproves(layoutData);
    applyPortDirectionRepairIfImproves(layoutData, spacing);
    staggerSamePortDeparturesIfImproves(layoutData, spacing);
    separateReciprocalCenterlineEdges(layoutData, spacing);
    shiftInternalVerticalRailsIfImproves(layoutData, spacing);
    repairShortStraightConnectorsIfImproves(layoutData, spacing);
    separateMultiEdgeBundlesIfImproves(layoutData, spacing);
    shortenLongOuterDetoursIfImproves(layoutData, spacing);
    nudgeShortTerminalDoglegsIfImproves(layoutData, spacing);
    // Nothing to merge; ensure paint treats labels as overlay labels.
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
      // Hint for paint-time label placement (adjustLayout falls back to edge.x/edge.y).
      x: Number.isFinite(ln.x) ? ln.x : undefined,
      y: Number.isFinite(ln.y) ? ln.y : undefined,
      points,
      isLabelEdge: false,
      __libavoidAccepted: libavoidAcceptedEdgeIds.includes(origId),
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
          if (inRange && worthShifting) {
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
  rebuildPathologicalLabelEdges(layoutData, { bendThresholdHigh: 8 });

  // iter-53 (second call): Wybrow §5.2 shared-subpath nudge AFTER iter-42.
  // The rebuild can reintroduce shared-subpaths (e.g. USC→HKC's rebuilt
  // polyline touches HKC.left stub column x=947.5, colliding with an
  // outgoing HKC edge's stub column). Idempotent; no-op if no overlap.
  applySharedSubpathNudge(layoutData, { spacing });

  // iter-41: paint-diagonal port snap. When a first/last port is at
  // t≠0.5 (off-center) on a W/E side, Mermaid's paint-time clip (ray
  // from node center to firstInner) lands at a slightly different y
  // than the port, so the RENDERED first/last segment is diagonal by
  // sub-pixel. Flips `scoreLayout.renderedDiagonalEndpoints` without
  // being user-visible. Snap p0 (and firstInner) perpendicular-axis
  // to node center when detected. C1's distinctness is already lost
  // to paint, so this snap is a paint-compatibility adaptation only.
  snapPortsToCenterWhenPaintDiagonal(layoutData, { spacing });

  try {
    const nodesById = new Map<string, any>();
    for (const node of layoutData.nodes as any[]) {
      if (node?.id != null) {
        nodesById.set(String(node.id), node);
      }
    }
    applyLibavoidFallbackIfNeeded({
      data: layoutData,
      options: withDefaultLibavoidFallback(layoutData, {
        spacing,
        routingBackend: 'domus',
        useExistingPositions: true,
      }),
      nodesById,
    });
  } catch (error) {
    log.warn(ORTHO_DEBUG, 'LIBAVOID_POST_FINALIZE_FAILED', {
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    });
  }

  const reportTarget = layoutData as LayoutData & { __libavoidReport?: Record<string, unknown> };
  const reportTargetEdgeIds =
    (reportTarget.__libavoidReport?.outcome as { targetEdgeIds?: string[] } | undefined)
      ?.targetEdgeIds ?? [];
  const acceptedEdgeIds =
    reportTargetEdgeIds.length > 0 ? reportTargetEdgeIds : libavoidAcceptedEdgeIds;
  const acceptedOnlyPolish = acceptedEdgeIds.length > 0;
  const sharedStats = applySharedSubpathNudge(layoutData, {
    spacing,
    onlyAccepted: acceptedOnlyPolish,
  });
  const laneStats = applyParallelLaneSeparation(layoutData, {
    spacing,
    onlyAccepted: acceptedOnlyPolish,
  });
  const hugStats = applyBorderHugClearance(layoutData, {
    spacing,
    onlyAccepted: acceptedOnlyPolish,
  });
  const terminalRepairStats = repairWrongSideTerminalDetours(layoutData, { spacing });
  const targetedStats = {
    customerDoglegged: false,
    hkcUsCompanyShifted: false,
    uscHkcRestored: false,
  };
  const acceptedDiffList =
    (reportTarget.__libavoidReport?.diffs as typeof libavoidAcceptedDiffs | undefined) ??
    libavoidAcceptedDiffs;

  const prePaintEdges = acceptedEdgeIds.map((edgeId) => {
    const edge = (layoutData.edges ?? []).find((e: any) => String(e?.id ?? '') === edgeId) as any;
    const points = Array.isArray(edge?.points) ? edge.points : [];
    const diff = acceptedDiffList.find((d) => d.edgeId === edgeId);
    return {
      edgeId,
      found: Boolean(edge),
      pointCount: points.length,
      first: points[0],
      last: points[points.length - 1],
      acceptedIdenticalToBefore: diff?.identical,
      acceptedBefore: diff?.before,
      acceptedAfter: diff?.after,
      currentPoints: points,
    };
  });
  if (acceptedEdgeIds.length > 0) {
    log.warn(ORTHO_DEBUG, 'LIBAVOID_PRE_PAINT_EDGES', prePaintEdges);
  }

  const watchedEdgeIds = new Set([
    'L_HongKongCompany_Incomehk_0',
    'L_HongKongCompany_USCompany_0',
    'L_HongKongCompany_ExpensesHK_0',
  ]);
  const watchedPrePaintEdges = ((layoutData.edges ?? []) as any[])
    .filter((edge) => watchedEdgeIds.has(String(edge?.id ?? '')))
    .map((edge) => ({
      edgeId: String(edge?.id ?? ''),
      start: edge?.start,
      end: edge?.end,
      currentPoints: Array.isArray(edge?.points) ? edge.points : [],
      accepted: Boolean(edge?.__libavoidAccepted),
    }));
  if (watchedPrePaintEdges.length > 0) {
    log.warn(ORTHO_DEBUG, 'HKC_WATCH_PRE_PAINT_EDGES', watchedPrePaintEdges);
  }

  reportTarget.__libavoidReport = {
    ...(reportTarget.__libavoidReport ?? {}),
    postFinalizePolish: {
      customerDoglegged: targetedStats.customerDoglegged,
      hkcUsCompanyShifted: targetedStats.hkcUsCompanyShifted,
      uscHkcRestored: targetedStats.uscHkcRestored,
      sharedSubpathNudged: sharedStats.nudged,
      parallelLaneSeparated: laneStats.changedEdges,
      borderHugCleared: hugStats.changedEdges,
      terminalDetoursRepaired: terminalRepairStats.changed,
    },
    prePaintEdges,
    watchedPrePaintEdges,
  };
  log.warn(ORTHO_DEBUG, 'LIBAVOID_REPORT', reportTarget.__libavoidReport);

  // Alana DDLT: endpoint stubs can remain direction-correct but too short
  // after all labelled-edge/libavoid polish. Apply the local repair
  // speculatively and keep it only if validateLayout improves; this avoids
  // regressing already-valid large labelled fixtures such as project-sox2.
  applyEndpointStubRepairIfImproves(layoutData, spacing);
  applyBlockedSameRankDetoursIfImproves(layoutData, spacing);
  applyLongPolylineRailShortcutIfImproves(layoutData);

  // R14 / 2026-05-02 — final port-direction repair pass. After the routing-
  // graph fallback (R13) re-routes around shape-walked output, the produced
  // polylines can still violate Siebenhaller §2.3.2.1 perpendicular-entry
  // (e.g., port on HKC.W but first segment goes east). Insert an outward
  // stub + perpendicular bend on edges where validateLayout would flag a
  // port-direction-mismatch. Speculative-and-keep-only-if-improves to avoid
  // regression on already-clean fixtures.
  applyPortDirectionRepairIfImproves(layoutData, spacing);

  // R14 follow-up / 2026-05-02 — when multiple edges' first segments end up
  // attached at the same port location (a side-effect of the routing-graph
  // fallback collapsing distinct port-T allocations), stagger their pts[0]
  // (and the inserted stub at pts[1]) along the side's tangent axis so each
  // edge has a distinct attach point. Resolves the validator's
  // edge-same-port-departure / edge-shared-subpath issues introduced by
  // applyPortDirectionRepairIfImproves on dense fan-out fixtures.
  staggerSamePortDeparturesIfImproves(layoutData, spacing);
  separateReciprocalCenterlineEdges(layoutData, spacing);
  shiftInternalVerticalRailsIfImproves(layoutData, spacing);
  shortenLabelledReciprocalVerticalsIfImproves(layoutData, spacing);
  applyLabelRailSideShortcutIfImproves(layoutData, spacing);
  repairShortStraightConnectorsIfImproves(layoutData, spacing);
  separateMultiEdgeBundlesIfImproves(layoutData, spacing);
  shortenLongOuterDetoursIfImproves(layoutData, spacing);
  nudgeShortTerminalDoglegsIfImproves(layoutData, spacing);

  // Paint should treat labels as overlay labels (not label nodes).
  (layoutData.config as any).isLabelNode = false;
}

function nudgeShortTerminalDoglegsIfImproves(layoutData: LayoutData, spacing: number): void {
  const nodesById = new Map<string, Node>(
    (layoutData.nodes ?? [])
      .filter((node) => node?.id != null && !node?.isGroup)
      .map((node) => [String(node.id), node])
  );

  for (const edge of (layoutData.edges ?? []) as EdgeWithLabelGeometry[]) {
    if (edge?.isLabelEdge || edge?.label || edge?.start == null || edge?.end == null) {
      continue;
    }
    if (String(edge.start) === String(edge.end)) {
      continue;
    }
    const original = Array.isArray(edge.points) ? edge.points.map((point) => ({ ...point })) : [];
    if (original.length !== 4) {
      continue;
    }

    const start = nodesById.get(String(edge.start));
    const end = nodesById.get(String(edge.end));
    if (!start || !end) {
      continue;
    }

    const before = validateLayout(layoutData);
    let bestPoints = original;
    let bestScore = before.score;

    for (const candidate of shortTerminalDoglegCandidates(original, rectForNode(end), spacing)) {
      edge.points = candidate.map((point) => ({ ...point }));
      const after = validateLayout(layoutData);
      if (introducesValidationIssues(before.issues, after.issues)) {
        continue;
      }
      if (after.score > bestScore) {
        bestScore = after.score;
        bestPoints = candidate.map((point) => ({ ...point }));
      }
    }

    edge.points = bestPoints.map((point) => ({ ...point }));
  }
}

function shortTerminalDoglegCandidates(
  original: { x: number; y: number }[],
  endRect: ReturnType<typeof rectForNode>,
  spacing: number
): { x: number; y: number }[][] {
  const [startPort, firstBend, secondBend, endPort] = original;
  const candidates: { x: number; y: number }[][] = [];
  const offsets = [
    -spacing * 1.2,
    -spacing * 0.8,
    -spacing * 0.6,
    -spacing * 0.4,
    spacing * 0.4,
    spacing * 0.6,
    spacing * 0.8,
    spacing * 1.2,
  ];

  if (
    approxEqual(startPort.y, firstBend.y) &&
    approxEqual(firstBend.x, secondBend.x) &&
    approxEqual(secondBend.y, endPort.y) &&
    (approxEqual(endPort.x, endRect.left) || approxEqual(endPort.x, endRect.right))
  ) {
    for (const offset of offsets) {
      const y = clampToBoundaryInterior(endRect.cy + offset, endRect.top, endRect.bottom);
      if (approxEqual(y, startPort.y) || approxEqual(y, endPort.y)) {
        continue;
      }
      candidates.push([
        { ...startPort },
        { x: firstBend.x, y: startPort.y },
        { x: firstBend.x, y },
        { x: endPort.x, y },
      ]);
    }
  }

  if (
    approxEqual(startPort.x, firstBend.x) &&
    approxEqual(firstBend.y, secondBend.y) &&
    approxEqual(secondBend.x, endPort.x) &&
    (approxEqual(endPort.y, endRect.top) || approxEqual(endPort.y, endRect.bottom))
  ) {
    for (const offset of offsets) {
      const x = clampToBoundaryInterior(endRect.cx + offset, endRect.left, endRect.right);
      if (approxEqual(x, startPort.x) || approxEqual(x, endPort.x)) {
        continue;
      }
      candidates.push([
        { ...startPort },
        { x: startPort.x, y: firstBend.y },
        { x, y: firstBend.y },
        { x, y: endPort.y },
      ]);
    }
  }

  return candidates;
}

function separateMultiEdgeBundlesIfImproves(layoutData: LayoutData, spacing: number): void {
  const nodesById = new Map(
    ((layoutData.nodes ?? []) as any[])
      .filter((node) => node?.id != null && !node?.isGroup)
      .map((node) => [String(node.id), node])
  );
  const groups = new Map<string, any[]>();
  for (const edge of (layoutData.edges ?? []) as any[]) {
    if (edge?.isLabelEdge || edge?.start == null || edge?.end == null) {
      continue;
    }
    const start = String(edge.start);
    const end = String(edge.end);
    if (!nodesById.has(start) || !nodesById.has(end)) {
      continue;
    }
    const key = [start, end].sort().join('\u0000');
    const group = groups.get(key) ?? [];
    group.push(edge);
    groups.set(key, group);
  }

  for (const group of groups.values()) {
    if (group.length < 3) {
      continue;
    }
    const before = validateLayout(layoutData);
    const originals = new Map(
      group.map((edge) => [
        edge,
        (Array.isArray(edge.points) ? edge.points : []).map((point: any) => ({ ...point })),
      ])
    );

    const sorted = [...group].sort((a, b) => String(a.id ?? '').localeCompare(String(b.id ?? '')));
    for (const [index, edge] of sorted.entries()) {
      const startRect = rectForNode(nodesById.get(String(edge.start)));
      const endRect = rectForNode(nodesById.get(String(edge.end)));
      const centerDx = Math.abs(startRect.cx - endRect.cx);
      const centerDy = Math.abs(startRect.cy - endRect.cy);
      const laneIndex = Math.floor(index / 2);
      const tangentDirection = index % 2 === 0 ? -1 : 1;
      const tangentOffset = tangentDirection * spacing * (0.8 + laneIndex * 0.8);

      if (centerDx >= centerDy) {
        const side = index % 2 === 0 ? 'N' : 'S';
        const top = Math.min(startRect.top, endRect.top);
        const bottom = Math.max(startRect.bottom, endRect.bottom);
        const laneOffset = spacing * (7.5 + laneIndex * 2);
        edge.points = verticalDetour(
          startRect,
          endRect,
          side === 'N' ? top - laneOffset : bottom + laneOffset,
          side,
          tangentOffset,
          -tangentOffset
        );
      } else {
        const side = index % 2 === 0 ? 'W' : 'E';
        const left = Math.min(startRect.left, endRect.left);
        const right = Math.max(startRect.right, endRect.right);
        const laneOffset = spacing * (7.5 + laneIndex * 2);
        edge.points = horizontalDetour(
          startRect,
          endRect,
          side === 'W' ? left - laneOffset : right + laneOffset,
          side,
          tangentOffset,
          -tangentOffset
        );
      }
    }

    const after = validateLayout(layoutData);
    if (
      after.issues.length >= before.issues.length &&
      introducesValidationIssues(before.issues, after.issues)
    ) {
      for (const [edge, points] of originals) {
        edge.points = points;
      }
    }
  }
}

function shortenLongOuterDetoursIfImproves(layoutData: LayoutData, spacing: number): void {
  const nodesById = new Map(
    ((layoutData.nodes ?? []) as any[])
      .filter((node) => node?.id != null && !node?.isGroup)
      .map((node) => [String(node.id), node])
  );

  for (const edge of (layoutData.edges ?? []) as any[]) {
    if (edge?.isLabelEdge || edge?.start == null || edge?.end == null) {
      continue;
    }
    const original = Array.isArray(edge.points)
      ? (edge.points as { x: number; y: number }[]).map((point) => ({ ...point }))
      : [];
    if (original.length < 5) {
      continue;
    }

    const start = nodesById.get(String(edge.start));
    const end = nodesById.get(String(edge.end));
    if (!start || !end) {
      continue;
    }

    const before = validateLayout(layoutData);
    let bestPoints = original;
    let bestScore = before.score;
    let bestLabelAnchor: { x: number; y: number } | null = null;
    const originalLabelAnchor = {
      x: Number.isFinite(edge.x) ? edge.x : undefined,
      y: Number.isFinite(edge.y) ? edge.y : undefined,
    };

    for (const candidate of compactOuterDetourCandidates(
      rectForNode(start),
      rectForNode(end),
      original,
      spacing
    )) {
      edge.points = candidate.map((point) => ({ ...point }));
      const labelAnchor = edge.label
        ? labelAnchorOnLongestSegmentClearOfEdges(layoutData, edge, edge.points)
        : null;
      if (labelAnchor) {
        edge.x = labelAnchor.x;
        edge.y = labelAnchor.y;
      }
      const after = validateLayout(layoutData);
      if (introducesValidationIssues(before.issues, after.issues)) {
        continue;
      }
      if (after.score > bestScore) {
        bestScore = after.score;
        bestPoints = candidate.map((point) => ({ ...point }));
        bestLabelAnchor = labelAnchor;
      }
    }

    edge.points = bestPoints.map((point) => ({ ...point }));
    if (bestLabelAnchor) {
      edge.x = bestLabelAnchor.x;
      edge.y = bestLabelAnchor.y;
      edge.__domusUseOverlayLabelAnchor = true;
    } else {
      edge.x = originalLabelAnchor.x;
      edge.y = originalLabelAnchor.y;
    }
  }
}

function repairShortStraightConnectorsIfImproves(layoutData: LayoutData, spacing: number): void {
  const minVisibleLength = Math.max(20, spacing * 2);
  const minLeg = Math.max(12, spacing * 1.2);
  const nodesById = new Map(
    ((layoutData.nodes ?? []) as any[])
      .filter((node) => node?.id != null && !node?.isGroup)
      .map((node) => [String(node.id), node])
  );

  for (const edge of (layoutData.edges ?? []) as any[]) {
    if (edge?.isLabelEdge || edge?.start == null || edge?.end == null) {
      continue;
    }
    const points = Array.isArray(edge.points) ? (edge.points as { x: number; y: number }[]) : [];
    if (points.length !== 2 || manhattanLength(points) >= minVisibleLength) {
      continue;
    }

    const start = nodesById.get(String(edge.start));
    const end = nodesById.get(String(edge.end));
    if (!start || !end) {
      continue;
    }

    const before = validateLayout(layoutData);
    const original = points.map((point) => ({ ...point }));
    let bestPoints: typeof original | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const candidate of shortConnectorCandidates(start, end, spacing, minLeg)) {
      edge.points = candidate;
      const after = validateLayout(layoutData);
      if (introducesValidationIssues(before.issues, after.issues)) {
        continue;
      }
      const length = manhattanLength(candidate);
      if (length < minVisibleLength) {
        continue;
      }
      const candidateScore = after.score - Math.max(0, before.issues.length - after.issues.length);
      if (candidateScore > bestScore) {
        bestScore = candidateScore;
        bestPoints = candidate.map((point) => ({ ...point }));
      }
    }

    edge.points = bestPoints ?? original;
  }
}

function introducesValidationIssues(beforeIssues: any[], afterIssues: any[]): boolean {
  const beforeCounts = new Map<string, number>();
  for (const issue of beforeIssues) {
    const key = validationIssueKey(issue);
    beforeCounts.set(key, (beforeCounts.get(key) ?? 0) + 1);
  }
  for (const issue of afterIssues) {
    const key = validationIssueKey(issue);
    const remaining = beforeCounts.get(key) ?? 0;
    if (remaining <= 0) {
      return true;
    }
    beforeCounts.set(key, remaining - 1);
  }
  return false;
}

function validationIssueKey(issue: any): string {
  const details = issue?.details ?? {};
  const detailEdgeIds = Array.isArray(details.edgeIds)
    ? details.edgeIds.map(String).sort().join(',')
    : '';
  const nodeIds = Array.isArray(issue?.nodeIds) ? issue.nodeIds.map(String).sort().join(',') : '';
  return [
    String(issue?.type ?? ''),
    String(issue?.edgeId ?? ''),
    nodeIds,
    detailEdgeIds,
    String(details.which ?? ''),
  ].join('|');
}

function shortConnectorCandidates(
  start: any,
  end: any,
  spacing: number,
  minLeg: number
): { x: number; y: number }[][] {
  const startRect = rectForNode(start);
  const endRect = rectForNode(end);
  const centerDx = Math.abs(startRect.cx - endRect.cx);
  const centerDy = Math.abs(startRect.cy - endRect.cy);
  const preferVerticalDetour = centerDx >= centerDy;
  const laneOffsets = [
    spacing * 2 + 1,
    spacing * 3 - 3,
    spacing * 3 + 3,
    spacing * 4 - 1,
    spacing * 4 + 5,
    spacing * 6 - 3,
    spacing * 7 - 1,
  ]
    .map((value) => Math.max(minLeg, value))
    .filter((value, index, values) => values.indexOf(value) === index);
  const portOffsets = [0, -spacing * 0.7, spacing * 0.7, -spacing * 1.2, spacing * 1.2];

  const candidates: { x: number; y: number }[][] = [];
  if (preferVerticalDetour) {
    const top = Math.min(startRect.top, endRect.top);
    const bottom = Math.max(startRect.bottom, endRect.bottom);
    for (const laneOffset of laneOffsets) {
      for (const startOffset of portOffsets) {
        for (const endOffset of portOffsets) {
          candidates.push(
            verticalDetour(startRect, endRect, top - laneOffset, 'N', startOffset, endOffset)
          );
          candidates.push(
            verticalDetour(startRect, endRect, bottom + laneOffset, 'S', startOffset, endOffset)
          );
        }
      }
    }
  } else {
    const left = Math.min(startRect.left, endRect.left);
    const right = Math.max(startRect.right, endRect.right);
    for (const laneOffset of laneOffsets) {
      for (const startOffset of portOffsets) {
        for (const endOffset of portOffsets) {
          candidates.push(
            horizontalDetour(startRect, endRect, left - laneOffset, 'W', startOffset, endOffset)
          );
          candidates.push(
            horizontalDetour(startRect, endRect, right + laneOffset, 'E', startOffset, endOffset)
          );
        }
      }
    }
  }
  return candidates;
}

function compactOuterDetourCandidates(
  startRect: ReturnType<typeof rectForNode>,
  endRect: ReturnType<typeof rectForNode>,
  original: { x: number; y: number }[],
  spacing: number
): { x: number; y: number }[][] {
  const laneOffsets = [spacing * 2, spacing * 3, spacing * 4, spacing * 6]
    .map((value) => Math.max(12, value))
    .filter((value, index, values) => values.indexOf(value) === index);
  const left = Math.min(startRect.left, endRect.left);
  const right = Math.max(startRect.right, endRect.right);
  const top = Math.min(startRect.top, endRect.top);
  const bottom = Math.max(startRect.bottom, endRect.bottom);
  const candidates: { x: number; y: number }[][] = [];

  for (const laneOffset of laneOffsets) {
    candidates.push(horizontalDetour(startRect, endRect, left - laneOffset, 'W'));
    candidates.push(horizontalDetour(startRect, endRect, right + laneOffset, 'E'));
    candidates.push(verticalDetour(startRect, endRect, top - laneOffset, 'N'));
    candidates.push(verticalDetour(startRect, endRect, bottom + laneOffset, 'S'));
  }

  candidates.push(...facingSideCorridorCandidates(startRect, endRect, original, spacing));

  return candidates;
}

function facingSideCorridorCandidates(
  startRect: ReturnType<typeof rectForNode>,
  endRect: ReturnType<typeof rectForNode>,
  original: { x: number; y: number }[],
  spacing: number
): { x: number; y: number }[][] {
  const candidates: { x: number; y: number }[][] = [];
  const startPort = original[0];
  const endPort = original[original.length - 1];
  const horizontalGap =
    Math.max(startRect.left, endRect.left) - Math.min(startRect.right, endRect.right);
  const verticalGap =
    Math.max(startRect.top, endRect.top) - Math.min(startRect.bottom, endRect.bottom);

  if (horizontalGap > spacing * 2) {
    const startLeftOfEnd = startRect.right <= endRect.left;
    const startBoundaryX = startLeftOfEnd ? startRect.right : startRect.left;
    const endBoundaryX = startLeftOfEnd ? endRect.left : endRect.right;
    const lo = Math.min(startBoundaryX, endBoundaryX);
    const hi = Math.max(startBoundaryX, endBoundaryX);
    const laneXs = [
      (lo + hi) / 2,
      lo + spacing,
      hi - spacing,
      lo + spacing * 2,
      hi - spacing * 2,
    ].filter((value) => value > lo + 1 && value < hi - 1);
    for (const startY of sidePortCandidates(startRect, startPort?.y)) {
      for (const endY of sidePortCandidates(endRect, endPort?.y)) {
        for (const laneX of laneXs) {
          candidates.push([
            { x: startBoundaryX, y: startY },
            { x: laneX, y: startY },
            { x: laneX, y: endY },
            { x: endBoundaryX, y: endY },
          ]);
        }
      }
    }
  }

  if (verticalGap > spacing * 2) {
    const startAboveEnd = startRect.bottom <= endRect.top;
    const startBoundaryY = startAboveEnd ? startRect.bottom : startRect.top;
    const endBoundaryY = startAboveEnd ? endRect.top : endRect.bottom;
    const lo = Math.min(startBoundaryY, endBoundaryY);
    const hi = Math.max(startBoundaryY, endBoundaryY);
    const laneYs = [
      (lo + hi) / 2,
      lo + spacing,
      hi - spacing,
      lo + spacing * 2,
      hi - spacing * 2,
    ].filter((value) => value > lo + 1 && value < hi - 1);
    for (const startX of horizontalPortCandidates(startRect, startPort?.x)) {
      for (const endX of horizontalPortCandidates(endRect, endPort?.x)) {
        for (const laneY of laneYs) {
          candidates.push([
            { x: startX, y: startBoundaryY },
            { x: startX, y: laneY },
            { x: endX, y: laneY },
            { x: endX, y: endBoundaryY },
          ]);
        }
      }
    }
  }

  return candidates;
}

function clampToBoundaryInterior(value: number, min: number, max: number): number {
  const inset = Math.min(5, Math.max(0, (max - min) / 4));
  const lo = min + inset;
  const hi = max - inset;
  if (lo > hi) {
    return (min + max) / 2;
  }
  return Math.max(lo, Math.min(hi, value));
}

function verticalDetour(
  startRect: ReturnType<typeof rectForNode>,
  endRect: ReturnType<typeof rectForNode>,
  laneY: number,
  side: 'N' | 'S',
  startOffset = 0,
  endOffset = 0
): { x: number; y: number }[] {
  const startPort = {
    x: clampToBoundaryInterior(startRect.cx + startOffset, startRect.left, startRect.right),
    y: side === 'N' ? startRect.top : startRect.bottom,
  };
  const endPort = {
    x: clampToBoundaryInterior(endRect.cx + endOffset, endRect.left, endRect.right),
    y: side === 'N' ? endRect.top : endRect.bottom,
  };
  return [startPort, { x: startPort.x, y: laneY }, { x: endPort.x, y: laneY }, endPort];
}

function horizontalDetour(
  startRect: ReturnType<typeof rectForNode>,
  endRect: ReturnType<typeof rectForNode>,
  laneX: number,
  side: 'W' | 'E',
  startOffset = 0,
  endOffset = 0
): { x: number; y: number }[] {
  const startPort = {
    x: side === 'W' ? startRect.left : startRect.right,
    y: clampToBoundaryInterior(startRect.cy + startOffset, startRect.top, startRect.bottom),
  };
  const endPort = {
    x: side === 'W' ? endRect.left : endRect.right,
    y: clampToBoundaryInterior(endRect.cy + endOffset, endRect.top, endRect.bottom),
  };
  return [startPort, { x: laneX, y: startPort.y }, { x: laneX, y: endPort.y }, endPort];
}

function shortenLabelledReciprocalVerticalsIfImproves(
  layoutData: LayoutData,
  spacing: number
): void {
  const nodesById = new Map(
    ((layoutData.nodes ?? []) as any[])
      .filter((node) => node?.id != null && !node.isGroup)
      .map((node) => [String(node.id), node])
  );
  const edges = (layoutData.edges ?? []) as any[];
  for (const edge of edges) {
    if (!edge?.label || edge?.start == null || edge?.end == null) {
      continue;
    }
    const start = nodesById.get(String(edge.start));
    const end = nodesById.get(String(edge.end));
    if (!start || !end || approxEqual(start.y, end.y)) {
      continue;
    }
    const reciprocal = edges.find((candidate) => {
      const pts = Array.isArray(candidate?.points) ? candidate.points : [];
      return (
        candidate !== edge &&
        String(candidate?.start) === String(edge.end) &&
        String(candidate?.end) === String(edge.start) &&
        pts.length === 2 &&
        approxEqual(pts[0].x, pts[1].x)
      );
    });
    const reciprocalPts = Array.isArray(reciprocal?.points) ? reciprocal.points : [];
    if (reciprocalPts.length !== 2) {
      continue;
    }

    const before = validateLayout(layoutData);
    if (!before.ok) {
      continue;
    }
    const originalPoints: { x: number; y: number }[] = Array.isArray(edge.points)
      ? edge.points.map((point: { x: number; y: number }) => ({ ...point }))
      : [];
    const originalLabelAnchor = { x: edge.x, y: edge.y };
    const startRect = rectForNode(start);
    const endRect = rectForNode(end);
    const left = Math.max(startRect.left, endRect.left);
    const right = Math.min(startRect.right, endRect.right);
    if (right - left <= spacing * 2) {
      continue;
    }
    const startY = start.y > end.y ? startRect.top : startRect.bottom;
    const endY = start.y > end.y ? endRect.bottom : endRect.top;
    const reciprocalX = reciprocalPts[0].x;
    const labelHalfWidth = Number.isFinite(edge.width) ? edge.width / 2 : 0;
    const clearance = Math.max(spacing * 4, labelHalfWidth + spacing);
    const pad = spacing * 1.2;
    const candidates = [
      reciprocalX - clearance,
      reciprocalX + clearance,
      left + pad,
      right - pad,
    ].filter((x) => x > left + 1 && x < right - 1);

    let best = before;
    let bestPoints: typeof originalPoints | null = null;
    let bestLaneDistance =
      originalPoints.length === 2 && approxEqual(originalPoints[0].x, originalPoints[1].x)
        ? Math.abs(originalPoints[0].x - reciprocalX)
        : 0;
    let bestLabelAnchor: { x: number; y: number } | null = null;
    for (const x of candidates) {
      edge.points = [
        { x, y: startY },
        { x, y: endY },
      ];
      const labelAnchor = labelAnchorOnLongestSegmentClearOfEdges(layoutData, edge, edge.points);
      if (labelAnchor) {
        edge.x = labelAnchor.x;
        edge.y = labelAnchor.y;
      }
      const after = validateLayout(layoutData);
      const laneDistance = Math.abs(x - reciprocalX);
      const improvesScore = after.score > best.score;
      const improvesLaneSeparation =
        after.score >= best.score && laneDistance > bestLaneDistance + 1e-6;
      if (
        after.ok &&
        after.issues.length <= before.issues.length &&
        (improvesScore || improvesLaneSeparation)
      ) {
        best = after;
        bestPoints = edge.points.map((point: { x: number; y: number }) => ({ ...point }));
        bestLabelAnchor = labelAnchor;
        bestLaneDistance = laneDistance;
      }
    }
    edge.points = bestPoints ?? originalPoints;
    if (bestPoints && bestLabelAnchor) {
      edge.x = bestLabelAnchor.x;
      edge.y = bestLabelAnchor.y;
      edge.__domusUseOverlayLabelAnchor = true;
    } else {
      edge.x = originalLabelAnchor.x;
      edge.y = originalLabelAnchor.y;
    }
  }
}

function applyBlockedSameRankDetoursIfImproves(layoutData: LayoutData, spacing: number): void {
  const before = validateLayout(layoutData);
  const blockedEdgeIds = new Set(
    before.issues
      .filter((issue) => issue.type === 'edge-intersects-obstacle' && issue.edgeId)
      .map((issue) => String(issue.edgeId))
  );
  if (blockedEdgeIds.size === 0) {
    return;
  }

  const snapshots = new Map<unknown, unknown>();
  for (const edge of layoutData.edges ?? []) {
    const points = (edge as { points?: unknown }).points;
    if (Array.isArray(points)) {
      snapshots.set(
        edge,
        points.map((point) => ({ ...(point as object) }))
      );
    }
  }

  let current = before;
  const nodesById = new Map(
    ((layoutData.nodes ?? []) as any[])
      .filter((node) => node?.id != null && !node?.isGroup)
      .map((node) => [String(node.id), node])
  );
  for (const edge of (layoutData.edges ?? []) as any[]) {
    if (!blockedEdgeIds.has(String(edge?.id ?? ''))) {
      continue;
    }
    const start = nodesById.get(String(edge.start));
    const end = nodesById.get(String(edge.end));
    const points = Array.isArray(edge?.points) ? (edge.points as { x: number; y: number }[]) : [];
    if (!start || !end || points.length < 2) {
      continue;
    }
    const candidate = bestSameRankDetourCandidate(layoutData, edge, start, end, spacing, current);
    if (!candidate) {
      continue;
    }
    edge.points = candidate;
    current = validateLayout(layoutData);
  }

  const after = validateLayout(layoutData);
  if (after.issues.length >= before.issues.length || after.score < before.score) {
    for (const edge of layoutData.edges ?? []) {
      if (snapshots.has(edge)) {
        (edge as { points?: unknown }).points = snapshots.get(edge);
      }
    }
  }
}

function bestSameRankDetourCandidate(
  layoutData: LayoutData,
  edge: any,
  start: any,
  end: any,
  spacing: number,
  baseline: ReturnType<typeof validateLayout>
): { x: number; y: number }[] | null {
  const startRect = rectForNode(start);
  const endRect = rectForNode(end);
  const startLeftOfEnd = startRect.right <= endRect.left;
  const startRightOfEnd = endRect.right <= startRect.left;
  if (!startLeftOfEnd && !startRightOfEnd) {
    return null;
  }
  const verticalOverlap =
    Math.min(startRect.bottom, endRect.bottom) - Math.max(startRect.top, endRect.top);
  if (verticalOverlap <= spacing) {
    return null;
  }

  const loX = Math.min(startRect.right, endRect.right);
  const hiX = Math.max(startRect.left, endRect.left);
  const blockers = ((layoutData.nodes ?? []) as any[])
    .filter((node) => node?.id != null && !node?.isGroup)
    .filter(
      (node) => String(node.id) !== String(edge.start) && String(node.id) !== String(edge.end)
    )
    .map((node) => ({ node, rect: rectForNode(node) }))
    .filter(({ rect }) => rect.left < hiX && rect.right > loX)
    .filter(
      ({ rect }) =>
        Math.min(startRect.bottom, rect.bottom, endRect.bottom) >
        Math.max(startRect.top, rect.top, endRect.top)
    );
  if (blockers.length === 0) {
    return null;
  }
  blockers.sort((a, b) => a.rect.left - b.rect.left);
  const firstBlocker = blockers[0].rect;
  const lastBlocker = blockers[blockers.length - 1].rect;

  const startRailX = startLeftOfEnd
    ? (startRect.right + firstBlocker.left) / 2
    : (startRect.left + lastBlocker.right) / 2;
  const endRailX = startLeftOfEnd
    ? (lastBlocker.right + endRect.left) / 2
    : (endRect.right + firstBlocker.left) / 2;
  const startBoundaryX = startLeftOfEnd ? startRect.right : startRect.left;
  const endBoundaryX = startLeftOfEnd ? endRect.left : endRect.right;

  const original = Array.isArray(edge.points)
    ? (edge.points as { x: number; y: number }[]).map((point) => ({ ...point }))
    : [];
  const startYs = sidePortCandidates(startRect, original[0]?.y);
  const endYs = sidePortCandidates(endRect, original[original.length - 1]?.y);
  const startXs = horizontalPortCandidates(startRect, original[0]?.x);
  const endXs = horizontalPortCandidates(endRect, original[original.length - 1]?.x);
  const top = Math.min(
    ...[startRect, endRect, ...blockers.map(({ rect }) => rect)].map((rect) => rect.top)
  );
  const bottom = Math.max(
    ...[startRect, endRect, ...blockers.map(({ rect }) => rect)].map((rect) => rect.bottom)
  );
  const laneYs = [
    top - spacing,
    top - spacing * 2,
    top - spacing * 3,
    top - spacing * 4,
    top - spacing * 5,
    bottom + spacing,
    bottom + spacing * 2,
    bottom + spacing * 3,
    bottom + spacing * 4,
    bottom + spacing * 5,
  ];

  let best: {
    points: { x: number; y: number }[];
    result: ReturnType<typeof validateLayout>;
  } | null = null;
  if (
    Math.abs(startRailX - startBoundaryX) >= spacing &&
    Math.abs(endRailX - endBoundaryX) >= spacing
  ) {
    for (const startY of startYs) {
      for (const endY of endYs) {
        for (const laneY of laneYs) {
          best = keepBetterSameRankCandidate(
            layoutData,
            edge,
            [
              { x: startBoundaryX, y: startY },
              { x: startRailX, y: startY },
              { x: startRailX, y: laneY },
              { x: endRailX, y: laneY },
              { x: endRailX, y: endY },
              { x: endBoundaryX, y: endY },
            ],
            baseline,
            best
          );
        }
      }
    }
  }
  for (const laneY of laneYs) {
    const useTop = laneY < top;
    for (const startX of startXs) {
      for (const endX of endXs) {
        best = keepBetterSameRankCandidate(
          layoutData,
          edge,
          [
            { x: startX, y: useTop ? startRect.top : startRect.bottom },
            { x: startX, y: laneY },
            { x: endX, y: laneY },
            { x: endX, y: useTop ? endRect.top : endRect.bottom },
          ],
          baseline,
          best
        );
      }
    }
  }
  edge.points = original;
  return best?.points ?? null;
}

function keepBetterSameRankCandidate(
  layoutData: LayoutData,
  edge: any,
  candidate: { x: number; y: number }[],
  baseline: ReturnType<typeof validateLayout>,
  best: { points: { x: number; y: number }[]; result: ReturnType<typeof validateLayout> } | null
): { points: { x: number; y: number }[]; result: ReturnType<typeof validateLayout> } | null {
  edge.points = candidate.map((point) => ({ ...point }));
  const result = validateLayout(layoutData);
  if (
    result.issues.length < baseline.issues.length &&
    result.score >= baseline.score &&
    (!best ||
      result.issues.length < best.result.issues.length ||
      (result.issues.length === best.result.issues.length && result.score > best.result.score))
  ) {
    return { points: candidate.map((point) => ({ ...point })), result };
  }
  return best;
}

function sidePortCandidates(
  rect: ReturnType<typeof rectForNode>,
  current: number | undefined
): number[] {
  const pad = 3;
  const height = rect.bottom - rect.top;
  const values = [
    current,
    (rect.top + rect.bottom) / 2,
    rect.top + height / 4,
    rect.bottom - height / 4,
    rect.top + pad,
    rect.bottom - pad,
  ].filter((value): value is number => Number.isFinite(value));
  return [
    ...new Set(values.map((value) => Math.max(rect.top + pad, Math.min(rect.bottom - pad, value)))),
  ];
}

function horizontalPortCandidates(
  rect: ReturnType<typeof rectForNode>,
  current: number | undefined
): number[] {
  const pad = 3;
  const width = rect.right - rect.left;
  const values = [
    current,
    (rect.left + rect.right) / 2,
    rect.left + width / 4,
    rect.right - width / 4,
    rect.left + pad,
    rect.right - pad,
  ].filter((value): value is number => Number.isFinite(value));
  return [
    ...new Set(values.map((value) => Math.max(rect.left + pad, Math.min(rect.right - pad, value)))),
  ];
}

function shiftInternalVerticalRailsIfImproves(layoutData: LayoutData, spacing: number): void {
  const before = validateLayout(layoutData);
  if (!before.ok) {
    return;
  }
  const nodes = ((layoutData.nodes ?? []) as any[]).filter((node) => !node?.isGroup);
  if (nodes.length === 0) {
    return;
  }
  const minLeft = Math.min(...nodes.map((node) => rectForNode(node).left));
  const maxRight = Math.max(...nodes.map((node) => rectForNode(node).right));
  for (const edge of (layoutData.edges ?? []) as any[]) {
    const pts = Array.isArray(edge?.points) ? (edge.points as { x: number; y: number }[]) : [];
    if (!edge?.label || (pts.length !== 4 && pts.length !== 5)) {
      continue;
    }
    const [, p1, p2] = pts;
    if (!approxEqual(p1.x, p2.x) || approxEqual(p1.y, p2.y)) {
      continue;
    }
    const original = pts.map((point) => ({ ...point }));
    const candidates = [minLeft - spacing * 2, maxRight + spacing * 2];
    let best = before;
    let bestPoints: typeof original | null = null;
    let bestLabelAnchor: { x: number; y: number } | null = null;
    const originalLabelAnchor = {
      x: Number.isFinite(edge.x) ? edge.x : undefined,
      y: Number.isFinite(edge.y) ? edge.y : undefined,
    };
    for (const x of candidates) {
      edge.points = [
        original[0],
        { x, y: original[1].y },
        { x, y: original[2].y },
        ...original.slice(3),
      ];
      const labelAnchor = labelAnchorOnLongestSegment(edge.points);
      if (labelAnchor) {
        edge.x = labelAnchor.x;
        edge.y = labelAnchor.y;
      }
      const after = validateLayout(layoutData);
      if (after.ok && after.issues.length <= before.issues.length && after.score > best.score) {
        best = after;
        bestPoints = edge.points.map((point: { x: number; y: number }) => ({ ...point }));
        bestLabelAnchor = labelAnchor;
      }
    }
    edge.points = bestPoints ?? original;
    if (bestLabelAnchor) {
      edge.x = bestLabelAnchor.x;
      edge.y = bestLabelAnchor.y;
    } else {
      edge.x = originalLabelAnchor.x;
      edge.y = originalLabelAnchor.y;
    }
  }
}

function labelAnchorOnLongestSegment(
  pts: { x: number; y: number }[]
): { x: number; y: number } | null {
  let bestLength = 0;
  let bestAnchor: { x: number; y: number } | null = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (!approxEqual(a.y, b.y) && !approxEqual(a.x, b.x)) {
      continue;
    }
    const length = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    if (length > bestLength) {
      bestLength = length;
      bestAnchor = {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
      };
    }
  }
  return bestAnchor;
}

function labelAnchorOnLongestSegmentClearOfEdges(
  layoutData: LayoutData,
  edge: EdgeWithLabelGeometry,
  pts: { x: number; y: number }[]
): { x: number; y: number } | null {
  const base = labelAnchorOnLongestSegment(pts);
  if (!base) {
    return null;
  }
  const labelWidth = Number.isFinite(edge.width) ? Number(edge.width) : 0;
  const labelHeight = Number.isFinite(edge.height) ? Number(edge.height) : 0;
  let best = base;
  let bestPenalty = labelSegmentOverlapPenalty(layoutData, edge, base, labelWidth, labelHeight);
  let bestDistance = 0;

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const vertical = approxEqual(a.x, b.x);
    const horizontal = approxEqual(a.y, b.y);
    if (!vertical && !horizontal) {
      continue;
    }
    const length = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    if (length <= 0) {
      continue;
    }
    const halfAlong = vertical ? labelHeight / 2 : labelWidth / 2;
    const min = vertical ? Math.min(a.y, b.y) : Math.min(a.x, b.x);
    const max = vertical ? Math.max(a.y, b.y) : Math.max(a.x, b.x);
    const innerMin = Math.min(max, min + halfAlong);
    const innerMax = Math.max(min, max - halfAlong);
    for (const axis of [(min + max) / 2, innerMin, innerMax]) {
      const candidate = vertical ? { x: a.x, y: axis } : { x: axis, y: a.y };
      const penalty = labelSegmentOverlapPenalty(
        layoutData,
        edge,
        candidate,
        labelWidth,
        labelHeight
      );
      const distance = Math.hypot(candidate.x - base.x, candidate.y - base.y);
      if (penalty < bestPenalty || (penalty === bestPenalty && distance < bestDistance)) {
        best = candidate;
        bestPenalty = penalty;
        bestDistance = distance;
      }
    }
  }
  return best;
}

function labelSegmentOverlapPenalty(
  layoutData: LayoutData,
  edge: EdgeWithLabelGeometry,
  anchor: { x: number; y: number },
  width: number,
  height: number
): number {
  const left = anchor.x - width / 2;
  const right = anchor.x + width / 2;
  const top = anchor.y - height / 2;
  const bottom = anchor.y + height / 2;
  let penalty = 0;
  for (const other of (layoutData.edges ?? []) as EdgeWithLabelGeometry[]) {
    if (other === edge) {
      continue;
    }
    const otherPts = Array.isArray(other?.points)
      ? (other.points as { x: number; y: number }[])
      : [];
    for (let i = 0; i < otherPts.length - 1; i++) {
      const a = otherPts[i];
      const b = otherPts[i + 1];
      if (approxEqual(a.x, b.x)) {
        const yOverlap = Math.max(Math.min(a.y, b.y), top) < Math.min(Math.max(a.y, b.y), bottom);
        if (yOverlap && a.x > left && a.x < right) {
          penalty++;
        }
      } else if (approxEqual(a.y, b.y)) {
        const xOverlap = Math.max(Math.min(a.x, b.x), left) < Math.min(Math.max(a.x, b.x), right);
        if (xOverlap && a.y > top && a.y < bottom) {
          penalty++;
        }
      }
    }
  }
  return penalty;
}

function separateReciprocalCenterlineEdges(layoutData: LayoutData, spacing: number): void {
  const nodesById = new Map<string, any>();
  for (const node of (layoutData.nodes ?? []) as any[]) {
    if (node?.id != null) {
      nodesById.set(String(node.id), node);
    }
  }
  const edges = (layoutData.edges ?? []) as any[];
  const offset = Math.max(3, Math.min(8, spacing * 0.6));
  for (let i = 0; i < edges.length; i++) {
    const a = edges[i];
    const aPts = Array.isArray(a?.points) ? a.points : [];
    if (aPts.length !== 2 || a?.start == null || a?.end == null) {
      continue;
    }
    for (let j = i + 1; j < edges.length; j++) {
      const b = edges[j];
      const bPts = Array.isArray(b?.points) ? b.points : [];
      if (bPts.length !== 2 || b?.start == null || b?.end == null) {
        continue;
      }
      if (String(a.start) !== String(b.end) || String(a.end) !== String(b.start)) {
        continue;
      }
      if (
        !approxEqual(aPts[0].x, bPts[1].x) ||
        !approxEqual(aPts[0].y, bPts[1].y) ||
        !approxEqual(aPts[1].x, bPts[0].x) ||
        !approxEqual(aPts[1].y, bPts[0].y)
      ) {
        continue;
      }
      const start = nodesById.get(String(a.start));
      const end = nodesById.get(String(a.end));
      if (!start || !end || start.isGroup || end.isGroup) {
        continue;
      }
      const rs = rectForNode(start);
      const re = rectForNode(end);
      if (!approxEqual(aPts[0].x, aPts[1].x)) {
        continue;
      }
      const leftLane = aPts[0].x - offset;
      const rightLane = aPts[0].x + offset;
      if (leftLane <= Math.max(rs.left, re.left) || rightLane >= Math.min(rs.right, re.right)) {
        continue;
      }
      a.points = [
        { x: leftLane, y: aPts[0].y },
        { x: leftLane, y: aPts[1].y },
      ];
      b.points = [
        { x: rightLane, y: bPts[0].y },
        { x: rightLane, y: bPts[1].y },
      ];
    }
  }
}

function applyLongPolylineRailShortcutIfImproves(layoutData: LayoutData): void {
  const before = validateLayout(layoutData);
  const snapshots = new Map<unknown, unknown>();
  for (const edge of layoutData.edges ?? []) {
    const points = (edge as { points?: unknown }).points;
    if (Array.isArray(points)) {
      snapshots.set(
        edge,
        points.map((p) => ({ ...(p as object) }))
      );
    }
  }

  let changed = false;
  for (const edge of (layoutData.edges ?? []) as any[]) {
    const pts = edge.points as { x: number; y: number }[] | undefined;
    if (!Array.isArray(pts) || pts.length < 8) {
      continue;
    }
    let candidate = shortcutFirstRailDogleg(pts);
    let best = pts;
    while (candidate && candidate.length < best.length) {
      best = candidate;
      candidate = shortcutFirstRailDogleg(best);
    }
    if (best.length >= pts.length) {
      continue;
    }
    edge.points = best;
    changed = true;
  }

  if (!changed) {
    return;
  }
  const after = validateLayout(layoutData);
  if (!after.ok || after.score <= before.score || after.issues.length > before.issues.length) {
    for (const edge of layoutData.edges ?? []) {
      if (snapshots.has(edge)) {
        (edge as { points?: unknown }).points = snapshots.get(edge);
      }
    }
  }
}

function shortcutFirstRailDogleg(
  pts: { x: number; y: number }[]
): { x: number; y: number }[] | null {
  const [p0, p1, , , p4, p5] = pts;
  if (!p0 || !p1 || !p4 || !p5) {
    return null;
  }
  if (pts.length === 7) {
    const [, , , p3, p4a, p5a, p6] = pts;
    if (
      p3 &&
      p4a &&
      p5a &&
      p6 &&
      approxEqual(p0.y, p1.y) &&
      approxEqual(p3.x, p4a.x) &&
      approxEqual(p4a.y, p5a.y) &&
      approxEqual(p5a.x, p6.x)
    ) {
      return [p0, { x: p3.x, y: p0.y }, p4a, p5a, p6].map((p) => ({ ...p }));
    }
  }
  if (!approxEqual(p0.y, p1.y) || approxEqual(p1.x, p5.x) || approxEqual(p1.y, p4.y)) {
    return null;
  }
  if (!approxEqual(p4.y, p5.y) && !approxEqual(p1.x, p5.x)) {
    return null;
  }
  return [p0, p1, { x: p1.x, y: p4.y }, ...pts.slice(5)].map((p) => ({ ...p }));
}

function applyLabelRailSideShortcutIfImproves(layoutData: LayoutData, spacing: number): void {
  const nodesById = new Map<string, any>();
  for (const node of (layoutData.nodes ?? []) as any[]) {
    if (node?.id != null && !node?.isGroup) {
      nodesById.set(String(node.id), node);
    }
  }

  for (const edge of (layoutData.edges ?? []) as any[]) {
    const pts = Array.isArray(edge?.points) ? (edge.points as { x: number; y: number }[]) : [];
    if (
      !edge?.label ||
      edge?.start == null ||
      edge?.end == null ||
      pts.length < 4 ||
      !Number.isFinite(edge.x) ||
      !Number.isFinite(edge.y)
    ) {
      continue;
    }
    const before = validateLayout(layoutData);
    if (!before.ok) {
      continue;
    }
    const startNode = nodesById.get(String(edge.start));
    const endNode = nodesById.get(String(edge.end));
    if (!startNode || !endNode) {
      continue;
    }
    const original = pts.map((point) => ({ ...point }));
    const label = { x: Number(edge.x), y: Number(edge.y) };
    const start = original[0];
    const endRect = rectForNode(endNode);
    const candidates: { x: number; y: number }[][] = [];

    const hasVerticalLabelRail = original.some((a, index) => {
      const b = original[index + 1];
      if (!b || !approxEqual(a.x, b.x) || !approxEqual(a.x, label.x)) {
        return false;
      }
      return label.y >= Math.min(a.y, b.y) - 1e-6 && label.y <= Math.max(a.y, b.y) + 1e-6;
    });
    if (hasVerticalLabelRail) {
      const side =
        label.x > endRect.right + spacing ? 'E' : label.x < endRect.left - spacing ? 'W' : null;
      if (side) {
        const terminal = { x: side === 'E' ? endRect.right : endRect.left, y: endNode.y };
        candidates.push([
          start,
          { x: label.x, y: start.y },
          { x: label.x, y: terminal.y },
          terminal,
        ]);
      }
    }

    let best = before;
    let bestPoints: { x: number; y: number }[] | null = null;
    for (const raw of candidates) {
      const candidate = sanitizeOrthogonalPolylineForRendering(raw, { spacing }) as {
        x: number;
        y: number;
      }[];
      edge.points = candidate;
      const after = validateLayout(layoutData);
      if (after.ok && after.issues.length <= before.issues.length && after.score > best.score) {
        best = after;
        bestPoints = candidate.map((point) => ({ ...point }));
      }
    }
    edge.points = bestPoints ?? original;
  }
}

/**
 * R14 follow-up / 2026-05-02 — speculative same-port-departure stagger.
 *
 * Group edges by quantized (rounded) pts[0] location. For each group with
 * 2+ edges, infer the side, distribute t-offsets along the side's tangent
 * axis, and shift each colliding edge's pts[0] (plus the inserted stub at
 * pts[1] when its perp coord matches pts[0]'s) by the t-offset. Speculative
 * with snapshot restore — keep only when same-port-departure /
 * shared-subpath issue counts strictly decrease without introducing new
 * high/critical issues.
 */
function staggerSamePortDeparturesIfImproves(layoutData: LayoutData, spacing: number): void {
  const before = validateLayout(layoutData);
  const targetTypes = new Set(['edge-same-port-departure', 'edge-shared-subpath']);
  const samePortBefore = before.issues.filter((i) =>
    targetTypes.has((i as { type?: string }).type ?? '')
  ).length;
  if (samePortBefore === 0) {
    return;
  }
  const snapshots = new Map<unknown, unknown>();
  for (const edge of layoutData.edges ?? []) {
    const points = (edge as { points?: unknown }).points;
    if (Array.isArray(points)) {
      snapshots.set(
        edge,
        points.map((p) => ({ ...(p as object) }))
      );
    }
  }
  const nodesById = new Map<string, any>();
  for (const node of (layoutData.nodes ?? []) as any[]) {
    if (node?.id != null) {
      nodesById.set(String(node.id), node);
    }
  }
  // Group edges by rounded start port + the side. Quantize at 0.5 px so
  // floating-point near-equal points cluster together.
  const groupsByStart = new Map<string, any[]>();
  for (const edge of (layoutData.edges ?? []) as any[]) {
    const pts = edge.points as { x: number; y: number }[] | undefined;
    if (!Array.isArray(pts) || pts.length < 2) {
      continue;
    }
    const startNode = nodesById.get(String(edge.start));
    if (!startNode) {
      continue;
    }
    const side = inferPortSide(pts[0], startNode);
    if (!side) {
      continue;
    }
    const qx = Math.round(pts[0].x * 2) / 2;
    const qy = Math.round(pts[0].y * 2) / 2;
    const key = `${String(edge.start)}|${side}|${qx},${qy}`;
    const arr = groupsByStart.get(key) ?? [];
    arr.push(edge);
    groupsByStart.set(key, arr);
  }
  let staggered = 0;
  const stagger = Math.max(8, Math.min(spacing, 12));
  for (const [, edges] of groupsByStart) {
    if (edges.length < 2) {
      continue;
    }
    // Deterministic order: sort by edge id.
    edges.sort((a, b) => String(a.id ?? '').localeCompare(String(b.id ?? '')));
    // Infer side from any one (they all share the same group key).
    const ptsRef = edges[0].points as { x: number; y: number }[];
    const startNodeRef = nodesById.get(String(edges[0].start));
    const side = inferPortSide(ptsRef[0], startNodeRef)!;
    const isHorizontalSide = side === 'E' || side === 'W';
    // Symmetric distribution around the original port: -stagger, +stagger,
    // -2*stagger, +2*stagger, etc. Keep the first edge at the original
    // location (offset 0) so existing-test invariants are minimally
    // disturbed; offset the remaining edges.
    for (const [i, edge] of edges.entries()) {
      const offset = i === 0 ? 0 : (i % 2 === 1 ? 1 : -1) * stagger * Math.ceil(i / 2);
      if (offset === 0) {
        continue;
      }
      const pts = edge.points as { x: number; y: number }[];
      const port = pts[0];
      const stub = pts[1];
      const stubMatchesPortPerp = isHorizontalSide
        ? Math.abs(stub.y - port.y) < 1e-6
        : Math.abs(stub.x - port.x) < 1e-6;
      if (isHorizontalSide) {
        port.y = port.y + offset;
        if (stubMatchesPortPerp) {
          stub.y = stub.y + offset;
        }
      } else {
        port.x = port.x + offset;
        if (stubMatchesPortPerp) {
          stub.x = stub.x + offset;
        }
      }
      staggered += 1;
    }
  }
  if (staggered === 0) {
    return;
  }
  const after = validateLayout(layoutData);
  const samePortAfter = after.issues.filter((i) =>
    targetTypes.has((i as { type?: string }).type ?? '')
  ).length;
  // Hard-and-fast safety property: the new stagger must not introduce any
  // critical or high issue that didn't exist before (compared by issue_id).
  const beforeHighCritIds = new Set<string>();
  for (const i of before.issues) {
    const sev = (i as { severity?: string }).severity ?? '';
    const id = (i as { issueId?: string }).issueId;
    if ((sev === 'critical' || sev === 'high') && id) {
      beforeHighCritIds.add(id);
    }
  }
  let introducedHighCrit = false;
  for (const i of after.issues) {
    const sev = (i as { severity?: string }).severity ?? '';
    const id = (i as { issueId?: string }).issueId;
    if ((sev === 'critical' || sev === 'high') && id && !beforeHighCritIds.has(id)) {
      introducedHighCrit = true;
      break;
    }
  }
  const keep =
    samePortAfter < samePortBefore &&
    !introducedHighCrit &&
    after.issues.length <= before.issues.length;
  if (!keep) {
    for (const edge of layoutData.edges ?? []) {
      if (snapshots.has(edge)) {
        (edge as { points?: unknown }).points = snapshots.get(edge);
      }
    }
  }
}

/**
 * R14 / 2026-05-02 — speculative port-direction-mismatch repair.
 *
 * Iterate edges; for each polyline whose first/last segment violates the
 * port's outward-normal direction (per Siebenhaller §2.3.2.1), insert an
 * outward stub + perpendicular bend so the segment incident on the port
 * heads in the correct direction without disturbing the rest of the route.
 *
 * Apply speculatively then snapshot-restore if validateLayout doesn't
 * strictly improve (mirrors `applyEndpointStubRepairIfImproves`).
 */
function applyPortDirectionRepairIfImproves(layoutData: LayoutData, spacing: number): void {
  const before = validateLayout(layoutData);
  const portDirIssuesBefore = before.issues.filter(
    (i) => (i as { type?: string }).type === 'edge-port-direction-mismatch'
  ).length;
  if (portDirIssuesBefore === 0) {
    return;
  }
  const snapshots = new Map<unknown, unknown>();
  for (const edge of layoutData.edges ?? []) {
    const points = (edge as { points?: unknown }).points;
    if (Array.isArray(points)) {
      snapshots.set(
        edge,
        points.map((p) => ({ ...(p as object) }))
      );
    }
  }
  let repaired = 0;
  // Stub distance must exceed validateLayout's "edge-bend-near-endpoint"
  // threshold (~15px) so the inserted stub doesn't itself trigger a new
  // medium issue. Cap at 2× spacing to keep the stub from looking like a
  // dramatic detour on tightly-packed fixtures.
  const stubDist = Math.max(15, Math.min(spacing * 2, 20));
  const nodesById = new Map<string, any>();
  for (const node of (layoutData.nodes ?? []) as any[]) {
    if (node?.id != null) {
      nodesById.set(String(node.id), node);
    }
  }
  // Build non-endpoint obstacle rect map. The repair MUST NOT route through
  // a third-party node's interior — the inserted stub+bend goes around the
  // wrong-direction first/last segment by extending OUTWARD from the port,
  // but if the bend lands inside a neighbouring obstacle (e.g. HKC's W stub
  // landed at x=741 which is inside ExpensesHK on Company.mmd), we'd trade
  // a port-direction-mismatch for an edge-intersects-obstacle.
  const obstacleRects: { id: string; rect: ReturnType<typeof rectForNode> }[] = [];
  for (const node of (layoutData.nodes ?? []) as any[]) {
    if (node?.id == null || node?.isGroup) {
      continue;
    }
    obstacleRects.push({ id: String(node.id), rect: rectForNode(node) });
  }
  for (const edge of (layoutData.edges ?? []) as any[]) {
    const pts = edge.points as { x: number; y: number }[] | undefined;
    if (!Array.isArray(pts) || pts.length < 3) {
      continue;
    }
    const startNode = nodesById.get(String(edge.start));
    const endNode = nodesById.get(String(edge.end));
    if (!startNode || !endNode || startNode === endNode) {
      continue;
    }
    const startId = String(edge.start);
    const endId = String(edge.end);
    if (repairFirstSegmentDirection(pts, startNode, stubDist, obstacleRects, startId, endId)) {
      repaired += 1;
    }
    if (repairLastSegmentDirection(pts, endNode, stubDist, obstacleRects, startId, endId)) {
      repaired += 1;
    }
  }
  if (repaired === 0) {
    return;
  }
  const after = validateLayout(layoutData);
  const portDirIssuesAfter = after.issues.filter(
    (i) => (i as { type?: string }).type === 'edge-port-direction-mismatch'
  ).length;
  const beforeIssueCount = before.issues.length;
  const afterIssueCount = after.issues.length;
  // Keep iff: port-direction-mismatch strictly decreases AND total issue
  // count does not increase. Snapshot-restore otherwise.
  const keep = portDirIssuesAfter < portDirIssuesBefore && afterIssueCount <= beforeIssueCount;
  if (!keep) {
    for (const edge of layoutData.edges ?? []) {
      if (snapshots.has(edge)) {
        (edge as { points?: unknown }).points = snapshots.get(edge);
      }
    }
  }
}

/**
 * R14 fallback / 2026-05-02 — side reassignment.
 *
 * When the stub+bend repair is blocked by an obstacle on the bend's
 * perpendicular leg, try reassigning the port from the inferred-but-
 * wrong side to whichever rect side `pts[1]` is geometrically closest
 * to. Move pts[0] onto that side at `pts[1]`'s axis, then verify
 * obstacle clearance for the new first segment. This works when the
 * actual route geometry exits via a different side than the SAT shape's
 * λ label suggests (Company.mmd: HKC→ExpensesHK exits south, not west).
 */
function tryReassignPortToClosestSide(
  pts: { x: number; y: number }[],
  startNode: any,
  obstacleRects: { id: string; rect: ReturnType<typeof rectForNode> }[],
  startId: string
): boolean {
  if (pts.length < 2) {
    return false;
  }
  const next = pts[1];
  const rect = rectForNode(startNode);
  const distToW = Math.abs(next.x - rect.left);
  const distToE = Math.abs(next.x - rect.right);
  const distToN = Math.abs(next.y - rect.top);
  const distToS = Math.abs(next.y - rect.bottom);
  const candidates: {
    side: 'W' | 'E' | 'N' | 'S';
    dist: number;
    port: { x: number; y: number };
  }[] = [
    { side: 'W', dist: distToW, port: { x: rect.left, y: next.y } },
    { side: 'E', dist: distToE, port: { x: rect.right, y: next.y } },
    { side: 'N', dist: distToN, port: { x: next.x, y: rect.top } },
    { side: 'S', dist: distToS, port: { x: next.x, y: rect.bottom } },
  ];
  // Constrain to ports actually ON the side (not at corners).
  const valid = candidates.filter(({ side, port }) => {
    if (side === 'W' || side === 'E') {
      return port.y >= rect.top && port.y <= rect.bottom;
    }
    return port.x >= rect.left && port.x <= rect.right;
  });
  if (valid.length === 0) {
    return false;
  }
  valid.sort((a, b) => a.dist - b.dist);
  for (const cand of valid) {
    // Skip the current side — that's where pts[0] already is and didn't
    // work.
    const newPort = cand.port;
    if (Math.abs(newPort.x - pts[0].x) < 1e-6 && Math.abs(newPort.y - pts[0].y) < 1e-6) {
      continue;
    }
    // The new first segment is from newPort to pts[1]. Verify clearance
    // against non-start obstacles.
    let blocked = false;
    for (const { id, rect: r } of obstacleRects) {
      if (id === startId) {
        continue;
      }
      if (segmentIntersectsRectInterior(newPort, pts[1], r)) {
        blocked = true;
        break;
      }
    }
    if (blocked) {
      continue;
    }
    pts[0] = newPort;
    return true;
  }
  return false;
}

function inferPortSide(p: { x: number; y: number }, node: any): 'N' | 'S' | 'E' | 'W' | null {
  const rect = rectForNode(node);
  const tol = 1;
  if (Math.abs(p.x - rect.left) <= tol) {
    return 'W';
  }
  if (Math.abs(p.x - rect.right) <= tol) {
    return 'E';
  }
  if (Math.abs(p.y - rect.top) <= tol) {
    return 'N';
  }
  if (Math.abs(p.y - rect.bottom) <= tol) {
    return 'S';
  }
  return null;
}

function repairFirstSegmentDirection(
  pts: { x: number; y: number }[],
  startNode: any,
  stubDist: number,
  obstacleRects: { id: string; rect: ReturnType<typeof rectForNode> }[],
  startId: string,
  _endId: string
): boolean {
  const port = pts[0];
  const next = pts[1];
  const side = inferPortSide(port, startNode);
  if (!side) {
    return false;
  }
  const eps = 1e-6;
  // First segment must travel along the port's outward normal in the
  // outward direction. For W: dx < 0 and dy ≈ 0. For E: dx > 0 and dy ≈ 0.
  // For N: dy < 0 and dx ≈ 0. For S: dy > 0 and dx ≈ 0.
  const dx = next.x - port.x;
  const dy = next.y - port.y;
  const onAxisWrong =
    (side === 'W' && Math.abs(dy) <= eps && dx > eps) ||
    (side === 'E' && Math.abs(dy) <= eps && dx < -eps) ||
    (side === 'N' && Math.abs(dx) <= eps && dy > eps) ||
    (side === 'S' && Math.abs(dx) <= eps && dy < -eps);
  if (!onAxisWrong) {
    return false;
  }
  // Find the first non-collinear perpendicular target in pts[2..]
  const isHorizontalSide = side === 'E' || side === 'W';
  let perpTarget: number | null = null;
  for (let i = 2; i < pts.length; i++) {
    const cand = isHorizontalSide ? pts[i].y : pts[i].x;
    const portPerp = isHorizontalSide ? port.y : port.x;
    if (Math.abs(cand - portPerp) > eps) {
      perpTarget = cand;
      break;
    }
  }
  if (perpTarget === null) {
    return false;
  }
  const stub: { x: number; y: number } =
    side === 'W'
      ? { x: port.x - stubDist, y: port.y }
      : side === 'E'
        ? { x: port.x + stubDist, y: port.y }
        : side === 'N'
          ? { x: port.x, y: port.y - stubDist }
          : { x: port.x, y: port.y + stubDist };
  const bend: { x: number; y: number } = isHorizontalSide
    ? { x: stub.x, y: perpTarget }
    : { x: perpTarget, y: stub.y };
  // Reject the repair if the new [port→stub, stub→bend, bend→pts[2]] segments
  // would cross a non-endpoint obstacle's interior. Otherwise we'd trade a
  // port-direction-mismatch for an edge-intersects-obstacle (saw this on
  // Company.mmd L_HKC_ExpensesHK_0 when the bend at x=741 landed inside
  // ExpensesHK's interior).
  const newSegments: { a: { x: number; y: number }; b: { x: number; y: number } }[] = [
    { a: port, b: stub },
    { a: stub, b: bend },
    { a: bend, b: pts[2] },
  ];
  // Skip the START node only — that's the node we're attached to via this
  // port; the start-repair's new segments necessarily exit from its
  // boundary. The END node MUST be checked because a wrong-direction-
  // detour bend can land inside it (HKC→ExpensesHK on Company.mmd: the
  // R14 stub at x=741 is inside ExpensesHK's x-range).
  let stubBendBlocked = false;
  for (const { id, rect } of obstacleRects) {
    if (id === startId) {
      continue;
    }
    for (const { a, b } of newSegments) {
      if (segmentIntersectsRectInterior(a, b, rect)) {
        stubBendBlocked = true;
        break;
      }
    }
    if (stubBendBlocked) {
      break;
    }
  }
  if (stubBendBlocked) {
    // Fallback: try side reassignment. Move pts[0] from the inferred-but-
    // wrong side to whichever rect side pts[1] is geometrically closest to.
    // For HKC→ExpensesHK on Company.mmd: shape said W but the route exits
    // south of HKC. Reassign to S — pts[0] becomes (pts[1].x, HKC.bottom),
    // and the polyline's first segment becomes a clean south-going stub
    // (matching S-side outward normal). Speculative + clearance-checked.
    return tryReassignPortToClosestSide(pts, startNode, obstacleRects, startId);
  }
  // Drop pts[1] (wrong-direction neighbor) and insert [stub, bend].
  pts.splice(1, 1, stub, bend);
  return true;
}

function repairLastSegmentDirection(
  pts: { x: number; y: number }[],
  endNode: any,
  stubDist: number,
  obstacleRects: { id: string; rect: ReturnType<typeof rectForNode> }[],
  _startId: string,
  endId: string
): boolean {
  const n = pts.length;
  const port = pts[n - 1];
  const prev = pts[n - 2];
  const side = inferPortSide(port, endNode);
  if (!side) {
    return false;
  }
  const eps = 1e-6;
  const dx = prev.x - port.x;
  const dy = prev.y - port.y;
  const onAxisWrong =
    (side === 'W' && Math.abs(dy) <= eps && dx > eps) ||
    (side === 'E' && Math.abs(dy) <= eps && dx < -eps) ||
    (side === 'N' && Math.abs(dx) <= eps && dy > eps) ||
    (side === 'S' && Math.abs(dx) <= eps && dy < -eps);
  if (!onAxisWrong) {
    return false;
  }
  const isHorizontalSide = side === 'E' || side === 'W';
  let perpTarget: number | null = null;
  for (let i = n - 3; i >= 0; i--) {
    const cand = isHorizontalSide ? pts[i].y : pts[i].x;
    const portPerp = isHorizontalSide ? port.y : port.x;
    if (Math.abs(cand - portPerp) > eps) {
      perpTarget = cand;
      break;
    }
  }
  if (perpTarget === null) {
    return false;
  }
  const stub: { x: number; y: number } =
    side === 'W'
      ? { x: port.x - stubDist, y: port.y }
      : side === 'E'
        ? { x: port.x + stubDist, y: port.y }
        : side === 'N'
          ? { x: port.x, y: port.y - stubDist }
          : { x: port.x, y: port.y + stubDist };
  const bend: { x: number; y: number } = isHorizontalSide
    ? { x: stub.x, y: perpTarget }
    : { x: perpTarget, y: stub.y };
  // Reject the repair when the new [pts[n-3]→bend, bend→stub, stub→port]
  // segments would cross a non-endpoint obstacle's interior. Symmetric to
  // the start-side guard. Skip only the END node here — the START node
  // must be checked since the new bend can land inside it.
  const newSegments: { a: { x: number; y: number }; b: { x: number; y: number } }[] = [
    { a: pts[n - 3], b: bend },
    { a: bend, b: stub },
    { a: stub, b: port },
  ];
  for (const { id, rect } of obstacleRects) {
    if (id === endId) {
      continue;
    }
    for (const { a, b } of newSegments) {
      if (segmentIntersectsRectInterior(a, b, rect)) {
        return false;
      }
    }
  }
  // Drop pts[n-2] (wrong-direction prev) and insert [bend, stub] before port.
  pts.splice(n - 2, 1, bend, stub);
  return true;
}

function applyEndpointStubRepairIfImproves(
  layoutData: LayoutData,
  spacing: number
): { kept: boolean; repaired: number } {
  const before = validateLayout(layoutData);
  if (
    !before.issues.some(
      (issue) =>
        issue.type === 'edge-bend-near-endpoint' || issue.type === 'edge-intersects-obstacle'
    )
  ) {
    return { kept: false, repaired: 0 };
  }

  const snapshots = new Map<unknown, unknown>();
  for (const edge of layoutData.edges ?? []) {
    const points = (edge as { points?: unknown }).points;
    if (Array.isArray(points)) {
      snapshots.set(
        edge,
        points.map((point) => ({ ...point }))
      );
    }
  }

  const localRepairs = repairEndpointBendIssues(layoutData, before.issues);
  const repair = repairShortEndpointStubs(layoutData, { minLength: spacing });
  if (repair.repaired + localRepairs === 0) {
    return { kept: false, repaired: 0 };
  }

  const after = validateLayout(layoutData);
  const improved =
    (!before.ok && after.ok) ||
    (!before.ok && !after.ok && after.issues.length < before.issues.length) ||
    (before.ok && after.ok && after.issues.length <= before.issues.length);

  if (improved) {
    return { kept: true, repaired: repair.repaired + localRepairs };
  }

  for (const edge of layoutData.edges ?? []) {
    if (snapshots.has(edge)) {
      (edge as { points?: unknown }).points = snapshots.get(edge);
    }
  }
  return { kept: false, repaired: repair.repaired + localRepairs };
}

function repairEndpointBendIssues(
  layoutData: LayoutData,
  issues: ReturnType<typeof validateLayout>['issues']
): number {
  const nodesById = new Map<string, any>();
  for (const node of (layoutData.nodes ?? []) as any[]) {
    if (node?.id != null) {
      nodesById.set(String(node.id), node);
    }
  }
  const edgesById = new Map<string, any>();
  for (const edge of (layoutData.edges ?? []) as any[]) {
    if (edge?.id != null) {
      edgesById.set(String(edge.id), edge);
    }
  }

  const sideOf = (p: { x: number; y: number }, node: any): 'N' | 'S' | 'E' | 'W' | null => {
    const rect = rectForNode(node);
    const tol = 1;
    if (Math.abs(p.y - rect.top) <= tol) {
      return 'N';
    }
    if (Math.abs(p.y - rect.bottom) <= tol) {
      return 'S';
    }
    if (Math.abs(p.x - rect.left) <= tol) {
      return 'W';
    }
    if (Math.abs(p.x - rect.right) <= tol) {
      return 'E';
    }
    return null;
  };

  let repaired = 0;
  for (const issue of issues) {
    if (!issue.edgeId) {
      continue;
    }
    const edge = edgesById.get(String(issue.edgeId));
    const points: { x: number; y: number }[] = Array.isArray(edge?.points) ? edge.points : [];
    if (points.length < 2) {
      continue;
    }

    if (issue.type === 'edge-intersects-obstacle') {
      const nodeId = issue.nodeIds?.[0];
      const segIdx = (issue.details as { segmentIndex?: number } | undefined)?.segmentIndex;
      const original = points.map((point) => ({ ...point }));
      const beforeIssueCount = validateLayout(layoutData).issues.length;
      const startNode = edge?.start != null ? nodesById.get(String(edge.start)) : undefined;
      const endNode = edge?.end != null ? nodesById.get(String(edge.end)) : undefined;
      if (startNode && endNode && !startNode.isGroup && !endNode.isGroup) {
        const startRect = rectForNode(startNode);
        const endRect = rectForNode(endNode);
        const inset = 2;
        const clamp = (value: number, lo: number, hi: number): number =>
          Math.max(lo, Math.min(hi, value));
        const candidates: { x: number; y: number }[][] = [];
        const verticalLo = Math.max(startRect.top, endRect.top) + inset;
        const verticalHi = Math.min(startRect.bottom, endRect.bottom) - inset;
        if (verticalLo <= verticalHi) {
          const y = clamp(((startNode.y ?? 0) + (endNode.y ?? 0)) / 2, verticalLo, verticalHi);
          if (startRect.right <= endRect.left) {
            candidates.push([
              { x: startRect.right, y },
              { x: endRect.left, y },
            ]);
          } else if (endRect.right <= startRect.left) {
            candidates.push([
              { x: startRect.left, y },
              { x: endRect.right, y },
            ]);
          }
        }
        const horizontalLo = Math.max(startRect.left, endRect.left) + inset;
        const horizontalHi = Math.min(startRect.right, endRect.right) - inset;
        if (horizontalLo <= horizontalHi) {
          const x = clamp(((startNode.x ?? 0) + (endNode.x ?? 0)) / 2, horizontalLo, horizontalHi);
          if (startRect.bottom <= endRect.top) {
            candidates.push([
              { x, y: startRect.bottom },
              { x, y: endRect.top },
            ]);
          } else if (endRect.bottom <= startRect.top) {
            candidates.push([
              { x, y: startRect.top },
              { x, y: endRect.bottom },
            ]);
          }
        }
        let keptDirect = false;
        for (const candidate of candidates) {
          points.splice(0, points.length, ...candidate.map((point) => ({ ...point })));
          const afterIssueCount = validateLayout(layoutData).issues.length;
          if (afterIssueCount < beforeIssueCount) {
            repaired++;
            keptDirect = true;
            break;
          }
          points.splice(0, points.length, ...original.map((point) => ({ ...point })));
        }
        if (keptDirect) {
          continue;
        }
      }
      if (segIdx === 0 && nodeId === String(edge.start) && startNode) {
        const rect = rectForNode(startNode);
        const next = points[1];
        if (approxEqual(points[0].x, next.x)) {
          points[0].y = next.y < points[0].y ? rect.top : rect.bottom;
        } else if (approxEqual(points[0].y, next.y)) {
          points[0].x = next.x < points[0].x ? rect.left : rect.right;
        }
      } else if (segIdx === points.length - 2 && nodeId === String(edge.end) && endNode) {
        const rect = rectForNode(endNode);
        const prev = points[points.length - 2];
        const last = points[points.length - 1];
        if (approxEqual(prev.x, last.x)) {
          last.y = prev.y < last.y ? rect.bottom : rect.top;
        } else if (approxEqual(prev.y, last.y)) {
          last.x = prev.x < last.x ? rect.right : rect.left;
        }
      } else {
        continue;
      }
      const afterIssueCount = validateLayout(layoutData).issues.length;
      if (afterIssueCount < beforeIssueCount) {
        repaired++;
      } else {
        edge.points = original;
      }
      continue;
    }

    if (issue.type !== 'edge-bend-near-endpoint') {
      continue;
    }
    const whichRaw = issue.details?.which;
    const which = typeof whichRaw === 'string' ? whichRaw : '';
    if (which !== 'end' && which !== 'end-band') {
      continue;
    }
    const endNode = edge?.end != null ? nodesById.get(String(edge.end)) : undefined;
    if (!endNode || points.length < 3) {
      continue;
    }
    const port = points[points.length - 1];
    const side = sideOf(port, endNode);
    if (!side) {
      continue;
    }
    const threshold = typeof issue.details?.threshold === 'number' ? issue.details.threshold : 10;
    const clearance = Math.max(threshold, 18) + 2;
    const target = { ...port };
    if (side === 'W') {
      target.x = port.x - clearance;
    } else if (side === 'E') {
      target.x = port.x + clearance;
    } else if (side === 'N') {
      target.y = port.y - clearance;
    } else {
      target.y = port.y + clearance;
    }

    const original = points.map((point) => ({ ...point }));
    const beforeIssueCount = validateLayout(layoutData).issues.length;
    const candidates: { x: number; y: number }[][] = [];
    const endRect = rectForNode(endNode);

    if (which === 'end-band' && (side === 'W' || side === 'E')) {
      const horizontalClearance = Math.max(clearance, threshold + 2);
      const topLane =
        Math.min(
          ...[...nodesById.values()]
            .filter((node) => !node?.isGroup)
            .map((node) => rectForNode(node).top)
        ) - Math.max(8, threshold / 2);
      const oppositeX = side === 'W' ? endRect.right : endRect.left;
      const outsideX =
        side === 'W' ? endRect.right + horizontalClearance : endRect.left - horizontalClearance;
      const portYs = [endNode.y - endNode.height / 4, endNode.y + endNode.height / 4, endNode.y]
        .filter((y, index, all) => all.findIndex((other) => approxEqual(other, y)) === index)
        .filter((y) => y > endRect.top + 2 && y < endRect.bottom - 2);

      for (const portY of portYs) {
        candidates.push([
          points[0],
          points[1],
          { x: points[1].x, y: topLane },
          { x: outsideX, y: topLane },
          { x: outsideX, y: portY },
          { x: oppositeX, y: portY },
        ]);
      }
    }

    if (points.length === 3 && which === 'end-band') {
      const [p0, p1, p2] = points;
      candidates.push(
        side === 'W' || side === 'E'
          ? [p0, { x: target.x, y: p1.y }, { x: target.x, y: p2.y }, p2]
          : [p0, { x: p1.x, y: target.y }, { x: p2.x, y: target.y }, p2]
      );
    }

    if (points.length === 4) {
      const [p0, p1, , p3] = points;
      if (which === 'end') {
        candidates.push(
          side === 'W' || side === 'E'
            ? [p0, { x: p0.x, y: p3.y }, p3]
            : [p0, { x: p3.x, y: p0.y }, p3]
        );
      }
      if (which === 'end-band') {
        for (const delta of [-threshold, threshold, -clearance, clearance]) {
          candidates.push(
            side === 'W' || side === 'E'
              ? [
                  p0,
                  p1,
                  { x: p1.x, y: p1.y + delta },
                  { x: target.x, y: p1.y + delta },
                  { x: target.x, y: p3.y },
                  p3,
                ]
              : [
                  p0,
                  p1,
                  { x: p1.x + delta, y: p1.y },
                  { x: p1.x + delta, y: target.y },
                  { x: p3.x, y: target.y },
                  p3,
                ]
          );
        }
      }
    }

    candidates.push(points.map((point) => ({ ...point })));
    const direct = candidates[candidates.length - 1];
    if (side === 'W' || side === 'E') {
      direct[direct.length - 3].x = target.x;
      direct[direct.length - 2].x = target.x;
    } else {
      direct[direct.length - 3].y = target.y;
      direct[direct.length - 2].y = target.y;
    }

    let kept = false;
    for (const candidate of candidates) {
      edge.points = candidate.map((point) => ({ ...point }));
      const afterIssueCount = validateLayout(layoutData).issues.length;
      if (afterIssueCount < beforeIssueCount) {
        kept = true;
        repaired++;
        break;
      }
    }
    if (!kept) {
      edge.points = original;
    }
  }
  return repaired;
}

function repairWrongSideTerminalDetours(
  layoutData: LayoutData,
  opts: { spacing: number }
): { changed: number; edgeIds: string[] } {
  const spacing = opts.spacing;
  const nodesById = new Map<string, any>();
  for (const node of (layoutData.nodes ?? []) as any[]) {
    if (node?.id != null && !node?.isGroup) {
      nodesById.set(String(node.id), node);
    }
  }

  const sideOf = (
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
  const opposite: Record<'N' | 'S' | 'E' | 'W', 'N' | 'S' | 'E' | 'W'> = {
    N: 'S',
    S: 'N',
    E: 'W',
    W: 'E',
  };
  const dirsOk = (pts: { x: number; y: number }[], startSide: string, endSide: string) => {
    if (pts.length < 2) {
      return false;
    }
    const first = pts[1];
    const start = pts[0];
    const end = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const startOk =
      (startSide === 'E' && first.x >= start.x - 1e-6) ||
      (startSide === 'W' && first.x <= start.x + 1e-6) ||
      (startSide === 'S' && first.y >= start.y - 1e-6) ||
      (startSide === 'N' && first.y <= start.y + 1e-6);
    const endOk =
      (endSide === 'E' && prev.x >= end.x - 1e-6) ||
      (endSide === 'W' && prev.x <= end.x + 1e-6) ||
      (endSide === 'S' && prev.y >= end.y - 1e-6) ||
      (endSide === 'N' && prev.y <= end.y + 1e-6);
    return startOk && endOk;
  };

  let changed = 0;
  const edgeIds: string[] = [];
  for (const edge of (layoutData.edges ?? []) as any[]) {
    const pts = Array.isArray(edge?.points) ? (edge.points as { x: number; y: number }[]) : [];
    if (pts.length < 3 || edge?.start == null || edge?.end == null) {
      continue;
    }
    const startNode = nodesById.get(String(edge.start));
    const endNode = nodesById.get(String(edge.end));
    if (!startNode || !endNode) {
      continue;
    }
    const rs = rectForNode(startNode);
    const re = rectForNode(endNode);
    const a = pts[0];
    const b = pts[pts.length - 1];
    const startSide = sideOf(a, rs);
    const endSide = sideOf(b, re);
    if (!startSide || !endSide) {
      continue;
    }

    const candidates: { x: number; y: number }[][] = [];
    if (opposite[startSide] === endSide && (approxEqual(a.x, b.x) || approxEqual(a.y, b.y))) {
      candidates.push([a, b]);
    }

    if (startSide === endSide) {
      if (startSide === 'W' || startSide === 'E') {
        const outside =
          startSide === 'W'
            ? Math.min(rs.left, re.left) - spacing
            : Math.max(rs.right, re.right) + spacing;
        const labelX = Number.isFinite(edge.x) ? Number(edge.x) : Number.NaN;
        const labelIsOutside =
          Number.isFinite(labelX) &&
          (startSide === 'W'
            ? labelX <= Math.min(rs.left, re.left) - 1
            : labelX >= Math.max(rs.right, re.right) + 1);
        const corridorX = labelIsOutside ? labelX : outside;
        candidates.push([a, { x: corridorX, y: a.y }, { x: corridorX, y: b.y }, b]);
      } else {
        const outside =
          startSide === 'N'
            ? Math.min(rs.top, re.top) - spacing
            : Math.max(rs.bottom, re.bottom) + spacing;
        const labelY = Number.isFinite(edge.y) ? Number(edge.y) : Number.NaN;
        const labelIsOutside =
          Number.isFinite(labelY) &&
          (startSide === 'N'
            ? labelY <= Math.min(rs.top, re.top) - 1
            : labelY >= Math.max(rs.bottom, re.bottom) + 1);
        const corridorY = labelIsOutside ? labelY : outside;
        candidates.push([a, { x: a.x, y: corridorY }, { x: b.x, y: corridorY }, b]);
      }
    }

    const currentTerminalDirsOk = dirsOk(pts as any, startSide, endSide);
    const currentCost = { bends: bendCount(pts as any), length: manhattanLength(pts as any) };
    let best: { x: number; y: number }[] | null = null;
    let bestCost = currentTerminalDirsOk
      ? currentCost
      : { bends: Number.POSITIVE_INFINITY, length: Number.POSITIVE_INFINITY };
    for (const raw of candidates) {
      const cand = sanitizeOrthogonalPolylineForRendering(raw, { spacing }) as any[];
      if (cand.length < 2 || !dirsOk(cand as any, startSide, endSide)) {
        continue;
      }
      if (polylineIntersectsAnyRect(cand as any, nodesById, String(edge.start), String(edge.end))) {
        continue;
      }
      const cost = { bends: bendCount(cand as any), length: manhattanLength(cand as any) };
      if (
        cost.bends < bestCost.bends ||
        (cost.bends === bestCost.bends && cost.length + 1e-6 < bestCost.length)
      ) {
        best = cand as any;
        bestCost = cost;
      }
    }

    if (
      best &&
      (!currentTerminalDirsOk ||
        bestCost.bends < currentCost.bends ||
        bestCost.length + 1e-6 < currentCost.length)
    ) {
      edge.points = best as any;
      changed += 1;
      edgeIds.push(String(edge.id ?? ''));
    }
  }
  return { changed, edgeIds };
}
