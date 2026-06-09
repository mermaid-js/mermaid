import type { LayoutData, Node } from '../../../types.js';
import { insertBoundaryWaypointsForCrossBoundaryEdge, normalizePolyline } from './polyline.js';
import { applyMultiCrossingCleanup } from './multiCrossing.js';
import { reconcilePortsToLaneOrderRoutingGraph } from './portReconcile.js';
import { isEdgeLabelNodeId } from '../core/labels.js';
import type { OrthogonalOptions } from '../types.js';
import { applyNudgingConstraints, applyPathOrderingAndSpacing } from './postRouting.js';
import { nudgeSegmentsOffObstacleBorders } from './alleyMidpointNudge.js';
import { reselectPortSideForPerpendicularEntry } from './portSideReselect.js';
import { sanitizeOrthogonalPolylineForRendering } from './sanitize.js';
import { polylineIntersectsAnyRect } from '../core/routing.js';
import { approxEqual, bendCount, manhattanLength } from '../core/helpers.js';

export function applyPostRoutingPasses(args: {
  data: LayoutData;
  nodesById: Map<string, Node>;
  nodesByIdNoGroups: Map<string, Node>;
  groupsById: Map<string, Node>;
  backend: NonNullable<OrthogonalOptions['routingBackend']>;
  spacing: number;
  clearance: number;
  options: OrthogonalOptions;
  incrementalEnabled: boolean;
}): void {
  const {
    data,
    nodesById,
    nodesByIdNoGroups,
    groupsById,
    backend,
    spacing,
    clearance,
    options,
    incrementalEnabled,
  } = args;

  // In incremental mode, keep non-affected edges unchanged by skipping global
  // post-routing passes (these can move or reorder other edges).
  if (incrementalEnabled) {
    return;
  }

  // Stage 3b: reduce multi-crossings by subpath swapping where applicable.
  applyMultiCrossingCleanup(data);

  // Basic post-routing stage: path ordering and spacing/nudging for simple
  // parallel edges that currently share the same straight segment.
  applyPathOrderingAndSpacing(data, nodesByIdNoGroups, spacing);

  // Stage 5 (initial cut): nudge internal tracks to satisfy δ_min from boxes and
  // preserve inter-track spacing when bundles get pushed by obstacle constraints.
  applyNudgingConstraints(data, nodesByIdNoGroups, spacing);

  // Re-sanitize after nudging: the nudger can move only a subset of points (segment endpoints),
  // which can temporarily introduce diagonal segments if upstream polylines are not in the
  // expected canonical form. The renderer/validator require strict orthogonality.
  for (const e of data.edges ?? []) {
    if ((e as any).__orthoCompound) {
      continue;
    }
    if (!e?.points || e.points.length < 2) {
      continue;
    }
    e.points = sanitizeOrthogonalPolylineForRendering(e.points as any, { spacing });
  }

  // Post-route port reconciliation: reorder ports along each node side to match the
  // lane order outside the node halo (prevents local swaps/Z-bends).
  // IMPORTANT: this reconciliation is specific to routing-graph routing (anchors/stubs and
  // inflated-obstacle model). Running it after aligned/L-shape routing can move endpoints
  // off boundaries and break the simpler spacing invariants.
  if (backend === 'routing-graph') {
    reconcilePortsToLaneOrderRoutingGraph(data, nodesByIdNoGroups, spacing, clearance, {
      includeLabelEdges: true,
      model: options.routingGraphModel,
    });
    // After reconciliation, label-split edges may have been re-routed using only leaf obstacles.
    // Re-insert explicit compound boundary waypoints so cross-boundary label edges still
    // expose their group entry/exit points (strict tests + validateLayout semantics).
    for (const e of data.edges ?? []) {
      if (!e?.points || e.points.length < 2 || e.start == null || e.end == null) {
        continue;
      }
      const sId = String(e.start);
      const tId = String(e.end);
      if (!(isEdgeLabelNodeId(sId) || isEdgeLabelNodeId(tId))) {
        continue;
      }
      const sNode = nodesById.get(sId);
      const tNode = nodesById.get(tId);
      if (!sNode || !tNode) {
        continue;
      }
      e.points = insertBoundaryWaypointsForCrossBoundaryEdge(e.points, sNode, tNode, nodesById);
      e.points = normalizePolyline(e.points, groupsById);
    }
  }

  // Final post-pass: if an edge route has grown into a long polyline but a simple straight
  // or single-bend L-shape would be obstacle-free, prefer the simpler route.
  //
  // This addresses cases like Company.mmd where the USCompany -> HongKongCompany edge can
  // end up with unnecessary extra bends after spacing/nudging.
  for (const e of data.edges ?? []) {
    if ((e as any).__orthoCompound) {
      continue;
    }
    if (!e?.points || e.points.length < 2 || e.start == null || e.end == null) {
      continue;
    }
    const startId = String(e.start);
    const endId = String(e.end);
    // Self-loops intentionally use a small U-turn polyline on a free side of the node.
    // Do NOT shortcut these into a 2-point straight segment, even if it would be obstacle-free.
    if (startId === endId) {
      continue;
    }
    const pts = e.points as any;
    // Some upstream stages (esp. label-edge merge/rewrite) can leave a polyline whose
    // point order is reversed relative to (edge.start -> edge.end). Since the shortcut
    // check must exclude the correct endpoint nodes, normalize orientation here.
    const sNode = nodesByIdNoGroups.get(startId);
    const tNode = nodesByIdNoGroups.get(endId);
    const sCenter = sNode
      ? { x: Number((sNode as any).x ?? 0), y: Number((sNode as any).y ?? 0) }
      : null;
    const tCenter = tNode
      ? { x: Number((tNode as any).x ?? 0), y: Number((tNode as any).y ?? 0) }
      : null;

    const dist2 = (p: any, c: any) => {
      const dx = Number(p.x ?? 0) - Number(c.x ?? 0);
      const dy = Number(p.y ?? 0) - Number(c.y ?? 0);
      return dx * dx + dy * dy;
    };

    let oriented = pts;
    let reversed = false;
    if (sCenter && tCenter && pts.length >= 2) {
      const d0s = dist2(pts[0], sCenter);
      const dNs = dist2(pts[pts.length - 1], sCenter);
      // If the "first" point is much closer to the target center than the source center,
      // assume the polyline is reversed.
      if (d0s > dNs) {
        oriented = [...pts].reverse();
        reversed = true;
      }
    }

    const a = oriented[0];
    const b = oriented[oriented.length - 1];
    if (!a || !b) {
      continue;
    }

    const candidates: any[] = [];
    if (approxEqual(a.x, b.x) || approxEqual(a.y, b.y)) {
      candidates.push([a, b]);
    } else {
      candidates.push([a, { x: a.x, y: b.y }, b]);
      candidates.push([a, { x: b.x, y: a.y }, b]);
    }

    const currentCost = { bends: bendCount(oriented), length: manhattanLength(oriented) };
    let best: any[] | null = null;
    let bestCost = currentCost;
    for (const cand of candidates) {
      const cPts = sanitizeOrthogonalPolylineForRendering(cand, { spacing });
      if (polylineIntersectsAnyRect(cPts as any, nodesByIdNoGroups, startId, endId)) {
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
      e.points = (reversed ? [...(best as any)].reverse() : best) as any;
    }
  }

  // Kandinsky perpendicular-entry invariant (Siebenhaller §5.2.1, Def. 2.5): the
  // final (and first) segment must enter the attached vertex side perpendicularly.
  // A vertical segment ending on a left/right side, or a horizontal segment ending
  // on a top/bottom side, runs flush along the obstacle border. The shortcut pass
  // above can pick an L-shape candidate whose last/first segment is parallel to the
  // endpoint side (since its obstacle-intersection check excludes the endpoint's own
  // rectangle). Redirect the port to the perpendicular side facing the approach
  // direction before the alley nudge runs.
  reselectPortSideForPerpendicularEntry(data, nodesByIdNoGroups);

  // Wybrow §5.2 — shift interior segments off non-endpoint obstacle borders into the
  // clearance alley. The channels routing graph lists raw obstacle sides as legal
  // columns, so Dijkstra can land a middle segment flush on a rectangle it does not
  // terminate at. Run after port reconciliation and shortcut detection so no later
  // pass undoes the nudge.
  nudgeSegmentsOffObstacleBorders(data, nodesByIdNoGroups, spacing);

  // Final sanity: ensure we did not introduce any diagonal segments during port reconciliation
  // or shortcutting. This also removes micro-segments that can create weird rounded-corner arcs.
  for (const e of data.edges ?? []) {
    if ((e as any).__orthoCompound) {
      continue;
    }
    if (!e?.points || e.points.length < 2) {
      continue;
    }
    e.points = sanitizeOrthogonalPolylineForRendering(e.points as any, { spacing });
  }
}
