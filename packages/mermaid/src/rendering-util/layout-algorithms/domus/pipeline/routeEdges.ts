import type { LayoutData, Node, Edge } from '../../../types.js';
import { log } from '../../../../logger.js';
import { ORTHO_DEBUG } from '../debug.js';
import type {
  Point,
  OrthogonalOptions,
  OrthoRouteTrace,
  OrthoRouteCost,
  Rect,
  PortSide,
  RoutingAttempt,
} from '../types.js';
import { nodeSummary, isSubgraphRelevantEdge, polylineIsOrthogonal } from './diagnostics.js';
import { insertBoundaryWaypointsForCrossBoundaryEdge, normalizePolyline } from './polyline.js';
import { sanitizeOrthogonalPolylineForRendering } from './sanitize.js';
import { inferPortSideFromPointOnRect, snapPortForRoutingOnSide } from './ports.js';
import {
  buildCompoundBoundarySteps,
  snapBoundaryPortAtT,
  snapPoint,
  chooseSideBetweenPointAndRect,
  concatPolylines,
  preferredTForSide,
  type CompoundBoundaryStep,
} from './compoundBoundary.js';
import { ancestorGroupIds, commonPrefixLen } from './groups.js';
import {
  allowedRectForInsideGroups,
  lShapeWithinRect,
  polylineWithinRectInclusive,
  routeLShapeBetweenPorts,
} from './containment.js';

import {
  rectForNode,
  approxEqual,
  manhattanLength,
  bendCount,
  manhattanDistance,
} from '../core/helpers.js';
import { computeBoundaryPortAtT } from '../core/geometry.js';
import type { AssignedPortPlan } from '../core/portAssignment.js';
import {
  assignPortsForEdge,
  assignPortsForGraph,
  chooseBoundaryPortOutsideOtherNodes,
} from '../core/portAssignment.js';
import {
  buildRoutingGraphFromChannels,
  buildRoutingGraphFromRepresentatives,
  buildRoutingGraphFromRects,
  collectObstacleRects,
  detourAlignedIfBlocked,
  findRoutingGraphPathBetweenPorts,
  findRoutingGraphPathBetweenPortsWithObstacles,
  inflateRect,
  polylineIntersectsAnyRect,
  routeAligned,
  routeLShape,
} from '../core/routing.js';
import { findOcrPathBetweenPortsWithObstacles } from '../core/ocr/index.js';
import { computeBoundaryPort } from '../core/helpers.js';
import { isEdgeLabelNodeId } from '../core/labels.js';

export function routeEdges(args: {
  data: LayoutData;
  options: OrthogonalOptions;
  backend: NonNullable<OrthogonalOptions['routingBackend']>;
  nodesById: Map<string, Node>;
  nodesByIdNoGroups: Map<string, Node>;
  groupsById: Map<string, Node>;
  spacing: number;
  clearance: number;
  /**
   * Iter-29: no longer consumed by `routeEdges` itself — the removed
   * dead OCR→grid-fallback block was the only reader. Kept in the
   * arg signature so callers (`nonDomusPipeline.ts`) stay unchanged;
   * the context flag is still logged at the call site.
   */
  shouldHardenPorts: boolean;
  incrementalEnabled: boolean;
  shouldRouteEdge: (edge: Edge) => boolean;
  changedEdgeIds: Set<string>;
  trace?: { stages: any[]; edges: Record<string, any> } | undefined;
  compoundStepsByEdgeId: Map<string, CompoundBoundaryStep[]>;
  boundaryTByRequestId: Map<string, number>;
  tByEdgeEndpointKey: Map<string, number>;
  ensureTsForNodeSide: (nodeId: string, side: PortSide) => void;
}): void {
  const {
    data,
    options,
    backend,
    nodesById,
    nodesByIdNoGroups,
    groupsById,
    spacing,
    clearance,
    incrementalEnabled,
    shouldRouteEdge,
    changedEdgeIds,
    trace,
    compoundStepsByEdgeId,
    boundaryTByRequestId,
    tByEdgeEndpointKey,
    ensureTsForNodeSide,
  } = args;

  // Lazily computed port plan for self-loops. The graph-level plan assigns loops to a free side
  // and provides two distinct ports on that same side.
  let selfLoopPortPlan: AssignedPortPlan | null = null;

  for (const edge of data.edges ?? []) {
    if (!shouldRouteEdge(edge)) {
      continue;
    }
    if (!(edge as any).start || !(edge as any).end) {
      continue;
    }
    const startNodeId = String((edge as any).start);
    const endNodeId = String((edge as any).end);
    const isSelfLoop = startNodeId === endNodeId;
    const startNode = nodesById.get(startNodeId);
    const endNode = nodesById.get(endNodeId);
    if (!startNode || !endNode) {
      continue;
    }

    // Self-loop: route with a deterministic orthogonal U-turn polyline around the node.
    // Points start/end on the boundary; insertEdge will clip properly for any node shape.
    if (startNodeId === endNodeId) {
      const r = rectForNode(startNode);
      const pad = Math.max(20, spacing * 4);
      const edgeIdKey = String((edge as any).id ?? `${startNodeId}->${endNodeId}`);

      selfLoopPortPlan ??= assignPortsForGraph(data, nodesById, spacing);
      const startEp = selfLoopPortPlan.startByEdgeId.get(edgeIdKey);
      const endEp = selfLoopPortPlan.endByEdgeId.get(edgeIdKey);
      // Defensive fallback: if the plan is missing, use the east side.
      const side: PortSide = startEp?.side ?? endEp?.side ?? 'E';
      const pStart = startEp?.port ?? computeBoundaryPortAtT(r, side, 0.4);
      const pEnd = endEp?.port ?? computeBoundaryPortAtT(r, side, 0.6);

      // Route a small U-turn outside the chosen side.
      // Points: boundary → outside corner → outside corner → boundary
      let points: Point[];
      if (side === 'E' || side === 'W') {
        const xOut = side === 'E' ? r.right + pad : r.left - pad;
        points = [pStart, { x: xOut, y: pStart.y }, { x: xOut, y: pEnd.y }, pEnd];
      } else {
        const yOut = side === 'S' ? r.bottom + pad : r.top - pad;
        points = [pStart, { x: pStart.x, y: yOut }, { x: pEnd.x, y: yOut }, pEnd];
      }

      (edge as any).points = points as any;
      changedEdgeIds.add(edgeIdKey);
      // Phase E1: minimal trace entry for self-loops. The main
      // trace-write site at the bottom of the loop is unreachable
      // here (continue above), so record cascade telemetry inline.
      if (trace) {
        const existing = (trace as any).edges[edgeIdKey] ?? {};
        (trace as any).edges[edgeIdKey] = {
          ...existing,
          startNodeId,
          endNodeId,
          route: {
            ...(existing.route ?? {}),
            algorithm: 'l-shape',
            points: [...points],
            cost: {
              length: manhattanLength(points),
              bends: bendCount(points),
            },
            routingAttempts: [{ level: 1, kind: 'self-loop', outcome: 'success' }],
          },
        };
      }
      continue;
    }

    const ports = assignPortsForEdge(startNode, endNode);
    const debugEdge = isSubgraphRelevantEdge(startNode, endNode);
    if (debugEdge) {
      log.debug(ORTHO_DEBUG, 'EDGE_ROUTE_BEGIN', {
        edgeId: String((edge as any).id ?? ''),
        startNodeId,
        endNodeId,
        start: nodeSummary(startNode),
        end: nodeSummary(endNode),
        backend,
        spacing,
        routingGraphModel: options.routingGraphModel ?? 'grid',
        ports,
      });
    }

    let algorithm: OrthoRouteTrace['algorithm'] = 'aligned';
    let points: Point[] | null = null;
    let routingGraphStats: OrthoRouteTrace['routingGraph'] | undefined;
    // Phase E1 failure telemetry — ordered attempts in the fallback
    // cascade for this edge. Appended in-order at each decision point;
    // flushed into `trace.edges[id].route.routingAttempts` at the end.
    const attempts: RoutingAttempt[] = [];

    if (backend === 'routing-graph') {
      algorithm = 'routing-graph';
      const edgeIdKey = String((edge as any).id ?? `${startNodeId}->${endNodeId}`);
      const rs0 = rectForNode(startNode);
      const re0 = rectForNode(endNode);
      // For self-loops we force both endpoints onto the same side. This avoids the
      // degenerate case where the routing graph sees an "edge" that starts and ends
      // at the same boundary point.
      const startSide = ports.startSide;
      const endSide = isSelfLoop ? ports.startSide : ports.endSide;
      // If t-allocations are missing, fill lazily for the involved node sides.
      if (!tByEdgeEndpointKey.has(`${edgeIdKey}|start`)) {
        ensureTsForNodeSide(startNodeId, startSide);
      }
      if (!tByEdgeEndpointKey.has(`${edgeIdKey}|end`)) {
        ensureTsForNodeSide(endNodeId, endSide);
      }
      const tStart = tByEdgeEndpointKey.get(`${edgeIdKey}|start`) ?? 0.5;
      const tEnd = tByEdgeEndpointKey.get(`${edgeIdKey}|end`) ?? 0.5;
      const startCandidate = computeBoundaryPortAtT(rs0, startSide, tStart);
      const endCandidate = computeBoundaryPortAtT(re0, endSide, tEnd);

      const safeStartPortRaw =
        chooseBoundaryPortOutsideOtherNodes(startNodeId, endNodeId, nodesById, {
          preferredSide: startSide,
          candidatePort: startCandidate,
        }) ?? startCandidate;
      const safeEndPortRaw =
        chooseBoundaryPortOutsideOtherNodes(endNodeId, startNodeId, nodesById, {
          preferredSide: endSide,
          candidatePort: endCandidate,
        }) ?? endCandidate;
      const model = options.routingGraphModel ?? 'grid';

      // Compound routing: if start/end are in different group contexts, route via explicit
      // boundary waypoints (enter/exit groups) so paths can traverse group interiors
      // while still attaching at boundaries.
      const startAnc = ancestorGroupIds(startNode, nodesById);
      const endAnc = ancestorGroupIds(endNode, nodesById);
      const cp = commonPrefixLen(startAnc, endAnc);
      const leaving = startAnc.slice(cp).reverse(); // innermost -> outermost
      let entering = endAnc.slice(cp); // outermost -> innermost

      // Defensive: if ancestry lookup fails to detect a simple "outside -> inside group"
      // relationship (should not happen, but can if parent metadata is inconsistent),
      // fall back to the direct group parent on the endpoint.
      if (leaving.length === 0 && entering.length === 0) {
        const endPid = (endNode as any).parentId != null ? String((endNode as any).parentId) : null;
        const startPid =
          (startNode as any).parentId != null ? String((startNode as any).parentId) : null;
        if (endPid && !startPid) {
          const g = nodesById.get(endPid);
          if (g?.isGroup) {
            entering = [endPid];
          }
        }
      }

      if (leaving.length > 0 || entering.length > 0) {
        const rs = rectForNode(startNode);
        const re = rectForNode(endNode);
        const ss = inferPortSideFromPointOnRect(safeStartPortRaw, rs) ?? ports.startSide;
        const es = inferPortSideFromPointOnRect(safeEndPortRaw, re) ?? ports.endSide;
        const safeStartPort = snapPortForRoutingOnSide(rs, ss, safeStartPortRaw, spacing);
        const safeEndPort = snapPortForRoutingOnSide(re, es, safeEndPortRaw, spacing);

        (edge as any).__orthoCompound = true;
        const edgeKey = String((edge as any).id ?? `${startNodeId}->${endNodeId}`);
        // Prefer the precomputed (bundle-stable) boundary steps, but if they are missing
        // (e.g. due to upstream mutation or edge-id mismatch), compute them on the fly so
        // compound routes still explicitly touch group boundaries.
        let steps = compoundStepsByEdgeId.get(edgeKey) ?? [];
        if (steps.length === 0) {
          steps = buildCompoundBoundarySteps(edgeKey, startNode, endNode, nodesById, safeStartPort);
        }
        // If we *still* have no steps even though we decided the edge is cross-boundary,
        // synthesize minimal boundary steps from the already-computed ancestry diffs.
        if (steps.length === 0 && (leaving.length > 0 || entering.length > 0)) {
          const synth: CompoundBoundaryStep[] = [];
          let prev = snapPoint(safeStartPort);
          let idx = 0;
          for (const gid of leaving) {
            const g = nodesById.get(gid);
            if (!g) {
              continue;
            }
            const r = rectForNode(g);
            const side = chooseSideBetweenPointAndRect(prev, r) as PortSide;
            const preferredT = preferredTForSide(prev, r, side);
            synth.push({ groupId: gid, side, requestId: `${edgeKey}:synth:${idx++}`, preferredT });
            prev = snapPoint(computeBoundaryPort(r, side));
          }
          for (const gid of entering) {
            const g = nodesById.get(gid);
            if (!g) {
              continue;
            }
            const r = rectForNode(g);
            const side = chooseSideBetweenPointAndRect(prev, r) as PortSide;
            const preferredT = preferredTForSide(prev, r, side);
            synth.push({ groupId: gid, side, requestId: `${edgeKey}:synth:${idx++}`, preferredT });
            prev = snapPoint(computeBoundaryPort(r, side));
          }
          steps = synth;
        }
        const waypoints: Point[] = [snapPoint(safeStartPort)];
        const wpGroupIds: (string | null)[] = [null];
        for (const step of steps) {
          const g = nodesById.get(step.groupId);
          if (!g) {
            continue;
          }
          const r = rectForNode(g);
          const t = boundaryTByRequestId.get(step.requestId) ?? (step as any).preferredT ?? 0.5;
          const p = snapBoundaryPortAtT(r, step.side, t, spacing);
          waypoints.push(p);
          wpGroupIds.push(step.groupId);
        }
        waypoints.push(snapPoint(safeEndPort));
        wpGroupIds.push(null);

        // Route segment-by-segment, updating obstacle set based on current inside-groups context.
        const inside = new Set<string>(startAnc);
        points = [];

        for (let i = 0; i < waypoints.length - 1; i++) {
          const a = waypoints[i];
          const b = waypoints[i + 1];

          // Update inside-groups AFTER reaching the boundary waypoint.
          // Leaving: remove, Entering: add. We disambiguate by membership in start/end chains.
          if (i > 0) {
            const gid = wpGroupIds[i];
            if (gid) {
              if (inside.has(gid) && !endAnc.includes(gid)) {
                inside.delete(gid);
              } else if (!inside.has(gid) && endAnc.includes(gid)) {
                inside.add(gid);
              }
            }
          }

          const obstacleRects: Rect[] = [];
          for (const [id, node] of nodesById) {
            // Never include the actual endpoints as obstacles.
            if (id === startNodeId || id === endNodeId) {
              continue;
            }
            // When inside a group, do not treat that group's boundary as an obstacle.
            if ((node as any).isGroup && inside.has(id)) {
              continue;
            }
            obstacleRects.push(rectForNode(node));
          }

          if (debugEdge) {
            log.debug(ORTHO_DEBUG, 'EDGE_ROUTE_SEGMENT', {
              edgeId: String((edge as any).id ?? ''),
              segmentIndex: i,
              a,
              b,
              insideGroups: [...inside].sort((x, y) => x.localeCompare(y)),
              obstacleCount: obstacleRects.length,
            });
          }

          const allowed = allowedRectForInsideGroups(inside, nodesById);

          const seg =
            (obstacleRects.length > 0
              ? model === 'ocr'
                ? findOcrPathBetweenPortsWithObstacles(a, b, obstacleRects, spacing, {
                    maxExpansions: options.ocrMaxExpansions ?? 50_000,
                  }).points
                : findRoutingGraphPathBetweenPortsWithObstacles(a, b, obstacleRects, spacing, {
                    model,
                  })
              : null) ??
            // Fallback: if we didn't have explicit obstacles, try the standard path finder.
            // This can still be useful if other non-group nodes exist.
            (model === 'ocr'
              ? findOcrPathBetweenPortsWithObstacles(
                  a,
                  b,
                  collectObstacleRects(nodesById, startNodeId, endNodeId, 0),
                  spacing,
                  { maxExpansions: options.ocrMaxExpansions ?? 50_000 }
                ).points
              : findRoutingGraphPathBetweenPorts(a, b, nodesById, startNodeId, endNodeId, spacing, {
                  model,
                })) ??
            // Last resort: always keep the polyline orthogonal.
            routeLShapeBetweenPorts(a, b);

          // Enforce containment for segments that are inside one or more groups:
          // if the candidate path leaves the allowed region (intersection of ancestor groups),
          // fall back to a deterministic in-rect L-shape.
          const segClipped =
            allowed && !polylineWithinRectInclusive(seg, allowed)
              ? lShapeWithinRect(a, b, allowed)
              : seg;

          points = concatPolylines(points, segClipped);
        }
        // Phase E1: compound (cross-group) routing recorded as a
        // single summary attempt. Per-segment detail is Phase E2.
        attempts.push({
          level: 1,
          kind: 'routing-graph:compound',
          outcome: points && points.length > 0 ? 'success' : 'null',
          reason: `model=${options.routingGraphModel ?? 'grid'}`,
        });
      } else {
        if (trace) {
          // Build graph to expose statistics for debugging/visualization.
          // NOTE: `collectObstacleRects(..., 0)` returns *un-inflated* obstacles.
          // We pass `clearance` into the graph builders so they apply it exactly once.
          const obstacleRects = collectObstacleRects(nodesById, startNodeId, endNodeId, 0);
          const safeStartPort = safeStartPortRaw;
          const safeEndPort = safeEndPortRaw;
          if (model === 'ocr') {
            const ocr = findOcrPathBetweenPortsWithObstacles(
              safeStartPort,
              safeEndPort,
              obstacleRects,
              spacing,
              {
                maxExpansions: options.ocrMaxExpansions ?? 50_000,
              }
            );
            routingGraphStats = { model: 'ocr', nodes: ocr.stats.nodes, edges: ocr.stats.edges };
          } else {
            const g =
              model === 'channels'
                ? buildRoutingGraphFromChannels(
                    safeStartPort,
                    safeEndPort,
                    obstacleRects,
                    spacing,
                    clearance
                  )
                : model === 'representatives'
                  ? buildRoutingGraphFromRepresentatives(
                      safeStartPort,
                      safeEndPort,
                      obstacleRects,
                      spacing,
                      clearance
                    )
                  : buildRoutingGraphFromRects(
                      safeStartPort,
                      safeEndPort,
                      obstacleRects,
                      spacing,
                      clearance
                    );
            if (g) {
              // Count undirected edges once.
              const edges = g.adj.reduce((s, a) => s + a.length, 0) / 2;
              routingGraphStats = { model, nodes: g.nodes.length, edges };
            } else {
              routingGraphStats = { model, nodes: 0, edges: 0 };
            }
          }
        }
        // Port-stub anchors + clearance model:
        // - Route between "anchor points" outside each endpoint along the port normal.
        // - Include ALL leaf nodes (including endpoints) as inflated obstacles for the routed portion.
        const stubDist = Math.max(0, clearance) + Math.max(0, spacing);
        const anchorForSide = (p: Point, side: PortSide): Point => {
          switch (side) {
            case 'N':
              return { x: p.x, y: p.y - stubDist };
            case 'S':
              return { x: p.x, y: p.y + stubDist };
            case 'E':
              return { x: p.x + stubDist, y: p.y };
            case 'W':
              return { x: p.x - stubDist, y: p.y };
          }
        };

        const startSide = inferPortSideFromPointOnRect(safeStartPortRaw, rs0) ?? ports.startSide;
        const endSide = inferPortSideFromPointOnRect(safeEndPortRaw, re0) ?? ports.endSide;
        const startAnchor = anchorForSide(safeStartPortRaw, startSide);
        const endAnchor = anchorForSide(safeEndPortRaw, endSide);
        // iter-52: helper to compute anchor at arbitrary distance (for reduced stub retry).
        const anchorForSideAtDistance = (p: Point, side: PortSide, dist: number): Point => {
          switch (side) {
            case 'N':
              return { x: p.x, y: p.y - dist };
            case 'S':
              return { x: p.x, y: p.y + dist };
            case 'E':
              return { x: p.x + dist, y: p.y };
            case 'W':
              return { x: p.x - dist, y: p.y };
          }
        };

        // Inflate leaf obstacles (including real endpoints) so the routed path cannot "hug" borders.
        // Special-case: if an endpoint is an edge-label dummy, do not treat that endpoint as an obstacle
        // for its owning split-edge (the edge is allowed to approach/attach to it cleanly).
        const inflatedObstacles: Rect[] = [];
        for (const n of nodesByIdNoGroups.values()) {
          const nid = String((n as any).id ?? '');
          if ((nid === startNodeId || nid === endNodeId) && isEdgeLabelNodeId(nid)) {
            continue;
          }
          inflatedObstacles.push(inflateRect(rectForNode(n), clearance));
        }

        if (debugEdge) {
          log.debug(ORTHO_DEBUG, 'CLEARANCE_MODEL', {
            edgeId: String((edge as any).id ?? ''),
            clearance,
            spacing,
            stubDist,
            startSide,
            endSide,
            startPort: safeStartPortRaw,
            endPort: safeEndPortRaw,
            startAnchor,
            endAnchor,
            obstacleCount: inflatedObstacles.length,
          });
        }

        let routedBetweenAnchors: Point[] | null =
          model === 'ocr'
            ? findOcrPathBetweenPortsWithObstacles(
                startAnchor,
                endAnchor,
                inflatedObstacles,
                spacing,
                {
                  maxExpansions: options.ocrMaxExpansions ?? 50_000,
                }
              ).points
            : findRoutingGraphPathBetweenPortsWithObstacles(
                startAnchor,
                endAnchor,
                inflatedObstacles,
                spacing,
                {
                  model,
                  clearance: 0, // already inflated above; avoid double-inflation
                }
              );

        // iter-52: retry routing with a smaller stub distance when anchors land
        // inside inflated obstacles (tight layouts like multiple-edges).
        if (!routedBetweenAnchors && model !== 'ocr') {
          for (let reduced = stubDist - 1; reduced >= 1; reduced--) {
            const sa = anchorForSideAtDistance(safeStartPortRaw, startSide, reduced);
            const ea = anchorForSideAtDistance(safeEndPortRaw, endSide, reduced);
            const retry = findRoutingGraphPathBetweenPortsWithObstacles(
              sa,
              ea,
              inflatedObstacles,
              spacing,
              { model, clearance: 0 }
            );
            if (retry) {
              routedBetweenAnchors = retry;
              break;
            }
          }
        }

        if (routedBetweenAnchors) {
          // Stitch: port -> anchor -> routed -> anchor -> port (dedupe shared points).
          const stitched: Point[] = [];
          stitched.push(safeStartPortRaw, startAnchor);
          for (const p of routedBetweenAnchors as any) {
            stitched.push(p);
          }
          stitched.push(endAnchor, safeEndPortRaw);
          points = stitched;
          // Phase E1: level-1 primary model success.
          attempts.push({
            level: 1,
            kind: `routing-graph:${model}`,
            outcome: 'success',
          });
        } else {
          // Phase E1: level-1 primary model returned null. Record the
          // null-outcome attempt before taking the deterministic
          // fallback — so callers can see the cascade walked.
          attempts.push({
            level: 1,
            kind: `routing-graph:${model}`,
            outcome: 'null',
            reason: 'no-path',
          });
          // Deterministic fallback: keep orthogonal and avoid obvious obstacle crossings.
          // Prefer a simple aligned detour when endpoints are aligned (common in tests/fixtures).
          if (
            approxEqual(safeStartPortRaw.x, safeEndPortRaw.x) ||
            approxEqual(safeStartPortRaw.y, safeEndPortRaw.y)
          ) {
            const detoured = detourAlignedIfBlocked(
              [safeStartPortRaw, safeEndPortRaw],
              nodesById,
              startNodeId,
              endNodeId,
              spacing
            );
            points = detoured;
            attempts.push({
              level: 1,
              kind: 'aligned-deterministic-fallback',
              outcome: points && points.length > 0 ? 'success' : 'null',
            });
          } else {
            points = routeLShapeBetweenPorts(safeStartPortRaw, safeEndPortRaw);
            attempts.push({
              level: 1,
              kind: 'l-shape-deterministic-fallback',
              outcome: points && points.length > 0 ? 'success' : 'null',
            });
          }
        }
      }
      // Iter-29: the prior `if (!points)` cascade (OCR→grid fallback,
      // routeAligned L3, routeLShape L4) was unreachable — the
      // deterministic-fallback branch above always sets `points` via
      // detourAlignedIfBlocked or routeLShapeBetweenPorts (both
      // non-nullable). Removed ~50 lines of dead code + dead iter-28
      // telemetry push sites.
    } else {
      // Self-loop on the simple (aligned/L) backend: generate a deterministic U-shaped
      // polyline that exits the node, loops around outside, and re-enters.
      if (isSelfLoop) {
        const r = rectForNode(startNode);
        const side: PortSide = ports.startSide;
        // Pick two different attachment positions along the chosen side.
        // Use fixed values for determinism; sanitizer will clean up micro-segments.
        const t1 = 0.35;
        const t2 = 0.65;
        const startPort = computeBoundaryPortAtT(r, side, t1);
        const endPort = computeBoundaryPortAtT(r, side, t2);
        const stub = Math.max(spacing, clearance, 8);
        const anchorForSide = (p: Point, s: PortSide, dist: number): Point => {
          switch (s) {
            case 'E':
              return { x: p.x + dist, y: p.y };
            case 'W':
              return { x: p.x - dist, y: p.y };
            case 'N':
              return { x: p.x, y: p.y - dist };
            case 'S':
              return { x: p.x, y: p.y + dist };
          }
        };
        const a = anchorForSide(startPort, side, stub);
        const b = anchorForSide(endPort, side, stub);
        points = sanitizeOrthogonalPolylineForRendering([startPort, a, b, endPort], { spacing });
        algorithm = 'l-shape';
        log.debug(ORTHO_DEBUG, 'EDGE_ROUTE_SELF_LOOP', {
          edgeId: String((edge as any).id ?? ''),
          nodeId: startNodeId,
          side,
          t1,
          t2,
          stub,
          pointsLen: points.length,
        });
      } else {
        points = routeAligned(startNode, endNode) as any;
        if (points) {
          // Override the aligned ports with the stage-1 assigned ports so routing is
          // consistent and traceable.
          const startPort = ports.startPort;
          const endPort = ports.endPort;
          points = [startPort, endPort];
          points = detourAlignedIfBlocked(
            points,
            nodesById,
            startNodeId,
            endNodeId,
            spacing
          ) as any;
          attempts.push({
            level: 1,
            kind: 'aligned-primary',
            outcome: 'success',
          });
        } else {
          attempts.push({
            level: 1,
            kind: 'aligned-primary',
            outcome: 'null',
          });
          algorithm = 'l-shape';
          const lShape = routeLShape(startNode, endNode, ports) as any;
          if (polylineIntersectsAnyRect(lShape, nodesById, startNodeId, endNodeId)) {
            // The naive L-shape collides with at least one other node. Before we
            // hand over to the grid-based router, pick boundary ports that are
            // themselves outside the interiors of all other nodes when possible.
            const safeStartPort =
              chooseBoundaryPortOutsideOtherNodes(startNodeId, endNodeId, nodesById, {
                preferredSide: ports.startSide,
                candidatePort: lShape[0],
              }) ?? lShape[0];
            const safeEndPort =
              chooseBoundaryPortOutsideOtherNodes(endNodeId, startNodeId, nodesById, {
                preferredSide: ports.endSide,
                candidatePort: lShape[lShape.length - 1],
              }) ?? lShape[lShape.length - 1];
            const fallbackModel =
              options.routingGraphModel && options.routingGraphModel !== 'ocr'
                ? options.routingGraphModel
                : 'grid';
            const routed = findRoutingGraphPathBetweenPorts(
              safeStartPort,
              safeEndPort,
              nodesById,
              startNodeId,
              endNodeId,
              spacing,
              { model: fallbackModel }
            );
            if (
              routed &&
              !polylineIntersectsAnyRect(routed as any, nodesById, startNodeId, endNodeId)
            ) {
              points = routed as any;
              log.info(ORTHO_DEBUG, 'edge', (edge as any).id, 'graph-routed', routed);
              attempts.push({
                level: 3,
                kind: `routing-graph-escalation:${fallbackModel}`,
                outcome: 'success',
              });
            } else {
              points = lShape;
              attempts.push({
                level: 3,
                kind: `routing-graph-escalation:${fallbackModel}`,
                outcome: 'null',
              });
              attempts.push({
                level: 2,
                kind: 'l-shape-primary',
                outcome: 'success',
                reason: 'collides-with-other-nodes',
              });
            }
          } else {
            points = lShape;
            attempts.push({
              level: 2,
              kind: 'l-shape-primary',
              outcome: 'success',
            });
          }
        }
      }
    }

    (edge as any).points = points;
    // Ensure cross-boundary edges include explicit group-boundary waypoints.
    // This is critical for compound semantics and for validateLayout/tests that
    // reason about boundary crossings.
    (edge as any).points = insertBoundaryWaypointsForCrossBoundaryEdge(
      (edge as any).points,
      startNode,
      endNode,
      nodesById
    );
    (edge as any).points = normalizePolyline((edge as any).points, groupsById);
    // Final geometry sanitizer to prevent rendering artifacts (micro-segments / hairpins).
    if (
      !(edge as any).__orthoCompound &&
      (edge as any).points &&
      (edge as any).points.length >= 2
    ) {
      const beforeMin =
        (edge as any).points.length >= 2
          ? Math.min(
              ...(edge as any).points
                .slice(1)
                .map((p: any, i: number) => manhattanDistance((edge as any).points[i], p))
            )
          : 0;
      (edge as any).points = sanitizeOrthogonalPolylineForRendering((edge as any).points, {
        spacing,
      });
      const afterMin =
        (edge as any).points.length >= 2
          ? Math.min(
              ...(edge as any).points
                .slice(1)
                .map((p: any, i: number) => manhattanDistance((edge as any).points[i], p))
            )
          : 0;
      if (debugEdge) {
        log.debug(ORTHO_DEBUG, 'EDGE_SANITIZE', {
          edgeId: String((edge as any).id ?? ''),
          spacing,
          beforeMin,
          afterMin,
          pointsLen: (edge as any).points.length,
        });
      }
    }
    if (debugEdge) {
      log.debug(ORTHO_DEBUG, 'EDGE_ROUTE_END', {
        edgeId: String((edge as any).id ?? ''),
        algorithm,
        pointsLen: (points as any)?.length ?? 0,
        orthogonal: points ? polylineIsOrthogonal(points) : false,
        points,
      });
    }
    if (incrementalEnabled) {
      const edgeId = (edge as any)?.id != null ? String((edge as any).id) : '';
      if (edgeId) {
        // Track routed edges so we can compute a local neighborhood for post-processing.
        changedEdgeIds.add(edgeId);
      }
    }

    if (trace) {
      const edgeId = String((edge as any).id ?? `${startNodeId}->${endNodeId}`);
      const existing = (trace as any).edges[edgeId] ?? {};
      const cost: OrthoRouteCost = {
        length: manhattanLength(points as any),
        bends: bendCount(points as any),
      };
      (trace as any).edges[edgeId] = {
        ...existing,
        startNodeId,
        endNodeId,
        ports: {
          startPort: { x: (ports as any).startPort.x, y: (ports as any).startPort.y },
          endPort: { x: (ports as any).endPort.x, y: (ports as any).endPort.y },
        },
        route: {
          algorithm,
          points: [...(points as any)],
          cost,
          routingGraph: routingGraphStats,
          routingAttempts: attempts,
        },
      };
    }
  }
}
