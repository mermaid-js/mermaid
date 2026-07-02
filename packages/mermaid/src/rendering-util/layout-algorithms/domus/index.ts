import type { SVG } from '../../../mermaid.js';
import type { D3Selection } from '../../../types.js';
import { createGraphWithElements } from '../../createGraph.js';
import { injectDomusEdgeLabelNodes } from './injectEdgeLabelNodes.js';
import insertMarkers from '../../rendering-elements/markers.js';
import { log } from '../../../logger.js';
import { clear as clearGraphlib } from '../dagre/mermaid-graphlib.js';
import { clear as clearNodes } from '../../rendering-elements/nodes.js';
import { clear as clearClusters } from '../../rendering-elements/clusters.js';
import { clear as clearEdges } from '../../rendering-elements/edges.js';
import type { LayoutData } from '../../types.js';
import { adjustLayout } from './adjustLayout.js';
import { layoutOrthogonalNodes } from './pipeline.js';
import { runRP1OrthogonalPipeline } from './rp1Pipeline.js';
import { ORTHO_DEBUG } from './debug.js';
import { finalizeDummyLabelNodesToOverlayLabels } from './finalizeOverlayLabels.js';
import { simplifyEdgeJogsWhenScoreImproves } from './pipeline/simplifyEdgeJogs.js';
import { clearArrowheadBendsWhenScoreImproves } from './pipeline/arrowheadBendClearance.js';
import { repairPortDirectionMismatchWhenScoreImproves } from './pipeline/portDirectionRepair.js';
import { relocateOffEdgeLabelsWhenScoreImproves } from './pipeline/offEdgeLabelRelocation.js';
import {
  remediateFlaggedEdgesWhenMonotone,
  reorderPortFansWhenScoreImproves,
  rerouteTopCrossersWhenScoreImproves,
  simplifyPathologicalRoutesWhenMonotone,
} from './pipeline/flaggedEdgeRemediation.js';
import { spaceNodesOffGroupFramesWhenScoreImproves } from './pipeline/nodeGroupSpacing.js';
import { reorderSiblingPortsToUncrossWhenScoreImproves } from './pipeline/siblingPortReorder.js';
import { alignStraightLeafEdgesWhenValid } from './pipeline/straightLeafAlignment.js';
import { isEdgeLabelNodeId } from './core/labels.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { reduceCrossingsWithPortSideCandidatesWhenScoreImproves } from './pipeline/crossingPortRepair.js';
import {
  COMPOUND_GROUP_PAD,
  tryCompoundGroupPlacementCandidateWhenScoreImproves,
} from './pipeline/compoundPlacement.js';
import { isHorizontalOrthoDirection, oppositeOrthoDirection } from './core/direction.js';

function oppositeDirection(dir: string): string | null {
  return oppositeOrthoDirection(dir) ?? null;
}

function directionViolationRatio(layout: LayoutData, dirOverride?: string): number {
  const dir = (dirOverride ?? ((layout as any)?.direction as string | undefined))?.trim();
  if (!dir) {
    return 0;
  }

  const nodesById = new Map<string, any>();
  for (const n of layout.nodes ?? []) {
    nodesById.set(String(n.id ?? ''), n);
  }

  let total = 0;
  let bad = 0;

  const expect = (a: any, b: any): boolean => {
    if (!a || !b) {
      return true;
    }
    const ax = a.x ?? 0;
    const ay = a.y ?? 0;
    const bx = b.x ?? 0;
    const by = b.y ?? 0;
    switch (dir) {
      case 'TB':
        return by >= ay;
      case 'BT':
        return by <= ay;
      case 'LR':
        return bx >= ax;
      case 'RL':
        return bx <= ax;
      default:
        return true;
    }
  };

  for (const e of layout.edges ?? []) {
    if (!e.start || !e.end) {
      continue;
    }
    const s = String(e.start);
    const t = String(e.end);

    // Ignore label split edges; we care about semantic node ordering.
    if (isEdgeLabelNodeId(s) || isEdgeLabelNodeId(t)) {
      continue;
    }
    const sn = nodesById.get(s);
    const tn = nodesById.get(t);
    if (!sn || !tn) {
      continue;
    }
    if (sn.isGroup || tn.isGroup) {
      continue;
    }

    total++;
    if (!expect(sn, tn)) {
      bad++;
    }
  }
  if (total === 0) {
    return 0;
  }
  return bad / total;
}

function mirrorLeafNodes(layout: LayoutData, axis: 'x' | 'y'): void {
  const leaf = (layout.nodes ?? []).filter((n: any) => !n?.isGroup);
  if (leaf.length === 0) {
    return;
  }
  const coords = leaf.map((n: any) => (axis === 'x' ? (n.x ?? 0) : (n.y ?? 0)));
  const min = Math.min(...coords);
  const max = Math.max(...coords);
  const c = (min + max) / 2;
  for (const n of leaf as any[]) {
    if (axis === 'x') {
      n.x = 2 * c - (n.x ?? 0);
    } else {
      n.y = 2 * c - (n.y ?? 0);
    }
  }
}

export async function renderPreAdjustLayout(
  data4Layout: LayoutData,
  svg: SVG
): Promise<{
  groups: Awaited<ReturnType<typeof createGraphWithElements>>['groups'];
}> {
  // Ensure edge labels are represented as dummy label nodes for orthogonal layout.
  // `createGraphWithElements` uses this flag to decide whether to inject edge-label nodes/edges.
  (data4Layout as any).layoutAlgorithm = 'domus';
  // R12: turn on edge-label dummy-node injection. Without this, createGraph's
  // `createGraph.ts:159` gate is false and DOMUS compacts the primary nodes
  // with no knowledge of label widths, so labels wider than the inter-node
  // gap paint on top of the flanking rectangles. `finalizeOverlayLabels.ts`
  // resets this flag to `false` after DOMUS finishes.
  (data4Layout as any).config ??= {};
  (data4Layout as any).config.isLabelNode = true;

  const element = svg.select('g') as unknown as D3Selection<SVGElement>;
  // Insert markers and clear previous elements
  insertMarkers(element, data4Layout.markers ?? [], data4Layout.type, data4Layout.diagramId);
  clearNodes();
  clearEdges();
  clearClusters();
  clearGraphlib();
  const { groups } = await createGraphWithElements(element, data4Layout);

  // Debug aid: after graph construction (which may inject edge-label dummy nodes/edges),
  // log a sanitized view of the LayoutData so we can inspect missing nodes / dangling edges.
  // Single shared prefix: ORTHO_DEBUG
  try {
    const nodes = (data4Layout.nodes ?? []).map((n: any) => ({
      id: String(n?.id ?? ''),
      label: n?.label,
      isGroup: Boolean(n?.isGroup),
      parentId: n?.parentId != null ? String(n.parentId) : undefined,
      shape: n?.shape,
      isEdgeLabel: Boolean(n?.isEdgeLabel),
      edgeStart: n?.edgeStart,
      edgeEnd: n?.edgeEnd,
    }));
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = (data4Layout.edges ?? []).map((e: any) => ({
      id: String(e?.id ?? ''),
      start: e?.start != null ? String(e.start) : '',
      end: e?.end != null ? String(e.end) : '',
      label: e?.label,
      isLabelEdge: Boolean(e?.isLabelEdge),
    }));
    const dangling = edges.filter(
      (e) => !e.start || !e.end || !nodeIds.has(e.start) || !nodeIds.has(e.end)
    );

    log.debug(ORTHO_DEBUG, 'ORTHO_DATA4LAYOUT_POST_CREATE_GRAPH', {
      summary: {
        nodes: nodes.length,
        edges: edges.length,
        danglingEdges: dangling.length,
      },
      nodes,
      edges,
      dangling,
    });
  } catch (err) {
    log.debug(ORTHO_DEBUG, 'ORTHO_DATA4LAYOUT_POST_CREATE_GRAPH_LOGGING_FAILED', {
      error: String(err),
    });
  }

  // DOMUS currently handles both node placement and edge routing for the
  // orthogonal layout. Edge endpoints must still be clipped to node borders
  // by Mermaid rendering (`insertEdge`), so DOMUS routes should be expressed
  // in the Mermaid style (inner points, with border intersection handled in
  // the renderer), not by hard-pinning all ports to a single side.
  // Layout stage (DOM-free): compute placement and routes based on measured sizes.
  const result = runRP1OrthogonalPipeline(data4Layout, {
    spacing: 10,
    routingBackend: 'domus',
    useExistingPositions: false,
  });

  // If DOMUS-based placement failed (e.g. no drawable shape found within limits),
  // or if it produced a degenerate layout (all nodes at same position),
  // fall back to the default TSM-style layering so nodes don't overlap.
  const nodes = result.geometry.layout.nodes.filter((n) => !n.isGroup);
  const firstNode = nodes[0];
  const allAtSamePos = nodes.every((n) => n.x === firstNode?.x && n.y === firstNode?.y);

  const dir = (data4Layout as any)?.direction as string | undefined;
  const violation = directionViolationRatio(result.geometry.layout as any);
  const violatesDirection = violation >= 0.6;

  log.debug(ORTHO_DEBUG, 'ORTHO_RENDER_DOMUS_PASS', {
    allAtSamePos,
    violatesDirection,
    violation,
    direction: (data4Layout as any)?.direction,
  });

  if (allAtSamePos || !nodes.some((n) => n.x !== 0 || n.y !== 0) || violatesDirection) {
    let correctedByMirror = false;
    const opp = dir ? oppositeDirection(dir) : null;
    if (dir && opp && violatesDirection) {
      const oppViolation = directionViolationRatio(result.geometry.layout as any, opp);
      // If the opposite direction has a much lower violation ratio, the layout is
      // likely just globally mirrored. Prefer mirroring to preserve DOMUS geometry.
      if (oppViolation <= 0.3) {
        mirrorLeafNodes(data4Layout, isHorizontalOrthoDirection(dir) ? 'x' : 'y');
        correctedByMirror = true;
        log.debug(ORTHO_DEBUG, 'ORTHO_RENDER_MIRROR_APPLIED', {
          direction: dir,
          violation,
          oppositeDirection: opp,
          oppositeViolation: oppViolation,
          axis: isHorizontalOrthoDirection(dir) ? 'x' : 'y',
        });
      }
    }

    // If mirroring wasn’t applied (or isn’t applicable), fall back to the
    // default TSM-style layering so nodes don't violate directional flow.
    if (!correctedByMirror) {
      await layoutOrthogonalNodes(data4Layout);
      log.debug(ORTHO_DEBUG, 'ORTHO_RENDER_FALLBACK_APPLIED', {
        direction: (data4Layout as any)?.direction,
      });
    }

    // Re-run routing only with fixed positions (either mirrored DOMUS placement
    // or layered fallback placement).
    runRP1OrthogonalPipeline(data4Layout, {
      spacing: 10,
      routingBackend: 'domus',
      useExistingPositions: true,
    });
  }

  // Post-pipeline sanity: if the issue is "edges start without node" / "node missing",
  // it should show up here as invalid node geometry or unrouted edges (still pre-adjustLayout).
  try {
    const nodes = (data4Layout.nodes ?? []).map((n: any) => ({
      id: String(n?.id ?? ''),
      isGroup: Boolean(n?.isGroup),
      x: n?.x,
      y: n?.y,
      width: n?.width,
      height: n?.height,
      hasIntersect: typeof n?.intersect === 'function',
      isEdgeLabel: Boolean(n?.isEdgeLabel),
    }));
    const badNodes = nodes.filter((n) => {
      if (n.isGroup) {
        return false;
      }
      const okXY = Number.isFinite(n.x) && Number.isFinite(n.y);
      const okWH =
        Number.isFinite(n.width) && Number.isFinite(n.height) && n.width > 0 && n.height > 0;
      return !okXY || !okWH;
    });

    const nodesById = new Map(nodes.map((n) => [n.id, n]));
    const edges = (data4Layout.edges ?? []).map((e: any) => ({
      id: String(e?.id ?? ''),
      start: e?.start != null ? String(e.start) : '',
      end: e?.end != null ? String(e.end) : '',
      pointsLen: Array.isArray(e?.points) ? e.points.length : 0,
      first: Array.isArray(e?.points) && e.points.length ? e.points[0] : undefined,
      last: Array.isArray(e?.points) && e.points.length ? e.points[e.points.length - 1] : undefined,
      isLabelEdge: Boolean(e?.isLabelEdge),
    }));
    const unrouted = edges.filter((e) => e.pointsLen < 2);
    const endpointGeometryMissing = edges.filter((e) => {
      const s = nodesById.get(e.start);
      const t = nodesById.get(e.end);
      if (!s || !t) {
        return true;
      }
      const okS =
        Number.isFinite(s.x) &&
        Number.isFinite(s.y) &&
        Number.isFinite(s.width) &&
        Number.isFinite(s.height);
      const okT =
        Number.isFinite(t.x) &&
        Number.isFinite(t.y) &&
        Number.isFinite(t.width) &&
        Number.isFinite(t.height);
      return !okS || !okT;
    });

    log.debug(ORTHO_DEBUG, 'ORTHO_LAYOUT_POST_PIPELINE_PRE_ADJUST', {
      summary: {
        nodes: nodes.length,
        edges: edges.length,
        badNodes: badNodes.length,
        unroutedEdges: unrouted.length,
        edgesWithBadEndpointGeometry: endpointGeometryMissing.length,
      },
      badNodes,
      unrouted,
      edgesWithBadEndpointGeometry: endpointGeometryMissing,
    });
  } catch (err) {
    log.debug(ORTHO_DEBUG, 'ORTHO_LAYOUT_POST_PIPELINE_PRE_ADJUST_LOGGING_FAILED', {
      error: String(err),
    });
  }

  return { groups };
}

// ─────────────────────────────────────────────────────────────────────────────
// Staged orthogonal execution (measurement → layout → paint)
//
// The DOM is built **once** during `measure()` and the resulting groups +
// node elements are threaded through `layout()` (DOM-free) into `paint()`.
// `paint()` never calls `createGraphWithElements` again — it just moves the
// already-inserted nodes to their final positions and draws clusters/edges.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render context carried from `measure` through `layout` to `paint`.
 * Holds the SVG groups created by `createGraphWithElements` and the per-node
 * D3 selection map keyed by node id, so paint can reuse them.
 */
export interface DomusRenderContext {
  groups: Awaited<ReturnType<typeof createGraphWithElements>>['groups'];
  nodeElements: Awaited<ReturnType<typeof createGraphWithElements>>['nodeElements'];
}

/**
 * Stage 0 (DOM allowed): build the SVG graph once and measure node + edge-label sizes
 * via `getBBox`. Does NOT run any layout algorithm. Returns the groups/nodeElements so
 * `paint` can reuse the inserted DOM without rebuilding it.
 */
export async function measure(data4Layout: LayoutData, svg: SVG): Promise<DomusRenderContext> {
  (data4Layout as any).layoutAlgorithm = 'domus';
  (data4Layout as any).config ??= {};
  (data4Layout as any).config.isLabelNode = true;

  // Inject edge-label dummy nodes + split labeled edges into
  // start->label->end BEFORE measuring. This is the SAME structure DDLT builds
  // via `injectDomusEdgeLabelNodes`, so the browser layout reserves space for
  // labels and produces an authoritative `edge.x/edge.y` anchor — exactly what
  // the DDLT sweep validates. Each dummy renders as a `labelRect` carrying the
  // edge's label text, so `createGraphWithElements` below measures it via
  // `getBBox` (the dummy's 0×0 placeholder size is overwritten by the real
  // text bbox). Without this, the browser shipped raw labels at a guessed path
  // midpoint that `validateLayout` never checked. `finalizeDummyLabelNodes-
  // ToOverlayLabels` merges the dummies back into overlay labels for paint and
  // resets `isLabelNode` to false.
  injectDomusEdgeLabelNodes(data4Layout);

  const element = svg.select('g') as unknown as D3Selection<SVGElement>;
  // Reset all module-level renderer state from any previous render before we
  // build a new graph; otherwise `nodeElems`/`clusters`/`edges` maps would
  // accumulate across renders (e.g. multiple diagrams on one page).
  clearNodes();
  clearEdges();
  clearClusters();
  clearGraphlib();
  insertMarkers(element, data4Layout.markers ?? [], data4Layout.type, data4Layout.diagramId);

  const { groups, nodeElements } = await createGraphWithElements(element, data4Layout);
  return { groups, nodeElements };
}

/** Stage 1 (DOM-free): run orthogonal placement + routing using already-measured sizes. */
function cloneLayoutForFallbackCandidate(layout: LayoutData): LayoutData {
  return {
    ...layout,
    nodes: (layout.nodes ?? []).map((node) => ({
      ...(node as unknown as Record<string, unknown>),
    })) as unknown as LayoutData['nodes'],
    edges: (layout.edges ?? []).map((edge) => ({
      ...(edge as unknown as Record<string, unknown>),
      points: edge.points?.map((point) => ({ x: point.x, y: point.y })),
    })) as unknown as LayoutData['edges'],
  };
}

function copyLayoutGeometry(target: LayoutData, source: LayoutData): void {
  target.nodes = source.nodes;
  target.edges = source.edges;
}

function tryLayeredFallbackCandidateWhenScoreImproves(
  data4Layout: LayoutData,
  preFinalizeLayout: LayoutData
): void {
  const baseline = validateLayout(data4Layout);
  if (!baseline.ok || baseline.breakdown.crossings === 0 || baseline.score >= 953) {
    return;
  }

  const candidate = cloneLayoutForFallbackCandidate(preFinalizeLayout);
  // `layoutOrthogonalNodes` is currently synchronous despite its Promise
  // signature (kept for future async stages). Calling it here mirrors the
  // renderPreAdjust fallback without changing this DOM-free layout API.
  void layoutOrthogonalNodes(candidate);
  runRP1OrthogonalPipeline(candidate, {
    spacing: 10,
    routingBackend: 'domus',
    routingGraphModel: 'channels',
    ocrFallback: true,
    ocrMaxExpansions: 50_000,
    useExistingPositions: true,
  });
  finalizeDummyLabelNodesToOverlayLabels(candidate);
  reduceCrossingsWithPortSideCandidatesWhenScoreImproves(candidate, { spacing: 10 });

  const candidateResult = validateLayout(candidate);
  if (
    candidateResult.ok &&
    candidateResult.issues.length === 0 &&
    candidateResult.breakdown.crossings <= baseline.breakdown.crossings &&
    candidateResult.score > baseline.score
  ) {
    copyLayoutGeometry(data4Layout, candidate);
  }
}

/**
 * The full post-candidate quality tail: monotone repairs, bend reduction,
 * score-gated simplifiers and crossing passes. Shared between `layout()` and
 * the compound-placement tournament — each placement variant must be judged
 * on its POLISHED quality (hook-stage issue counts misjudge the final).
 */
export function runLateQualityPasses(data4Layout: LayoutData): void {
  // Re-exit terminals the validator flags as port-direction-mismatched onto a
  // perpendicular side with a clean L. Runs before jog simplification so the new
  // route can be further straightened if that helps.
  repairPortDirectionMismatchWhenScoreImproves(data4Layout);

  // General monotone remediation for multi-defect invalid layouts: chips one
  // validator issue at a time (clean re-routes / rail shifts) until valid. A
  // no-op on valid layouts; never adds an issue, so it cannot regress.
  remediateFlaggedEdgesWhenMonotone(data4Layout);

  // Bend reduction for exponential-tier routes (8+ points). The score-gated
  // simplifiers below are dormant while the score is clamped at 0, so this
  // accepts on a strict per-edge point-count decrease under the same
  // no-new-issues gate.
  simplifyPathologicalRoutesWhenMonotone(data4Layout);

  // Slide leaf nodes that crowd a foreign group frame away until they clear,
  // carrying their edge endpoints along. Score-gated; runs after edge repair so
  // it acts on settled routes.
  spaceNodesOffGroupFramesWhenScoreImproves(data4Layout);

  // iter-62: generic jog simplification. Runs last, on the final geometry,
  // for labeled and unlabeled layouts alike — the finalize tail above is
  // label-gated and never sees unlabeled fixtures.
  simplifyEdgeJogsWhenScoreImproves(data4Layout);

  // Lengthen any terminal stub whose first bend sits inside its arrowhead marker
  // (the soft edge-bend-overlaps-arrowhead penalty). Score-gated; runs after jog
  // simplification so it only sees stubs the simplifier could not already erase.
  clearArrowheadBendsWhenScoreImproves(data4Layout);

  // Place any label the validator flags as off-edge back onto its (now final)
  // polyline at a clear anchor. Score-gated; runs last so the route is settled.
  relocateOffEdgeLabelsWhenScoreImproves(data4Layout);

  // Reduce edge-edge crossings on the fully settled, valid routes via rail
  // shifts / endpoint detours. Score-gated; previously only ran on the
  // layered-fallback candidate, so the main path never de-crossed (e.g. Company
  // kept all 5 crossings). Runs last so it sees the final geometry.
  reduceCrossingsWithPortSideCandidatesWhenScoreImproves(data4Layout, { spacing: 10 });

  // Reorder a node side's ports when two of its own edges still cross because
  // their ports are ordered opposite to their far endpoints; a directed router
  // re-routes them honouring each port's side. Score-gated.
  reorderSiblingPortsToUncrossWhenScoreImproves(data4Layout);

  // Center degree-1 leaves on clean straight settled edges. This is intentionally
  // final and validator-gated: it tidies Mermaid-specific post-DOMUS drift
  // without feeding new coordinates back into the DOMUS shape construction.
  alignStraightLeafEdgesWhenValid(data4Layout, { spacing: 10 });

  // Some valid-layout simplifications only become available after the late
  // label/crossing/port-order passes have settled geometry.
  simplifyEdgeJogsWhenScoreImproves(data4Layout);

  // Spend the remaining crossing budget on the worst offenders with the full
  // candidate library (score-gated; no-op while the score is clamped at 0).
  rerouteTopCrossersWhenScoreImproves(data4Layout);

  // Shared-node port fans whose order disagrees with their far endpoints
  // guarantee pairwise crossings no single-edge move can fix; permute the fan
  // and reroute it as one transaction.
  reorderPortFansWhenScoreImproves(data4Layout);
  rerouteTopCrossersWhenScoreImproves(data4Layout);
  simplifyEdgeJogsWhenScoreImproves(data4Layout);
}

export function layout(data4Layout: LayoutData): void {
  runRP1OrthogonalPipeline(data4Layout, {
    spacing: 10,
    routingBackend: 'domus',
    useExistingPositions: false,
  });

  const preFinalizeLayout = cloneLayoutForFallbackCandidate(data4Layout);

  // Convert internal dummy label nodes back into overlay labels (DOM-free) so
  // paint's `adjustLayout` will treat labels as overlays and draw a single
  // semantic edge per `(start, end)` pair.
  finalizeDummyLabelNodesToOverlayLabels(data4Layout);
  tryLayeredFallbackCandidateWhenScoreImproves(data4Layout, preFinalizeLayout);

  // Compound (per-group) DOMUS placement candidate for multi-group layouts the
  // flat placement left invalid or weak. Score-gated inside; see
  // `pipeline/compoundPlacement.ts` for the paper trail.
  tryCompoundGroupPlacementCandidateWhenScoreImproves(data4Layout, preFinalizeLayout, {
    spacing: 10,
    routeWithRoutingGraph: (candidate) => {
      runRP1OrthogonalPipeline(candidate, {
        spacing: 10,
        routingBackend: 'routing-graph',
        routingGraphModel: 'channels',
        useExistingPositions: true,
        groupPadding: COMPOUND_GROUP_PAD,
      });
    },
    polish: runLateQualityPasses,
  });

  runLateQualityPasses(data4Layout);
}

/**
 * Stage 2 (DOM allowed): paint-only. Moves the nodes already inserted in `measure()`
 * into their final positions and draws clusters / edges / overlay labels. Never
 * re-creates node DOM elements.
 *
 * Removes any stale DOM elements for nodes that `layout()` finalized away (e.g. the
 * `edge-label-*` dummies that `finalizeDummyLabelNodesToOverlayLabels` merges back
 * into a single semantic edge) so the final SVG matches the post-layout `LayoutData`.
 */
export async function paint(
  data4Layout: LayoutData,
  _svg: SVG,
  ctx: DomusRenderContext
): Promise<void> {
  const liveIds = new Set<string>();
  for (const n of data4Layout.nodes ?? []) {
    if (n?.id != null) {
      liveIds.add(String(n.id));
    }
  }

  for (const [id, el] of [...ctx.nodeElements.entries()]) {
    if (!liveIds.has(id)) {
      try {
        el.remove();
      } catch (err) {
        log.debug(ORTHO_DEBUG, 'ORTHO_PAINT_REMOVE_DUMMY_FAILED', {
          id,
          error: String(err),
        });
      }
      ctx.nodeElements.delete(id);
    }
  }

  await adjustLayout(data4Layout, ctx.groups);
}

/** Public `LayoutAlgorithm.render` entry: orchestrates the three stages with shared context. */
export async function render(data4Layout: LayoutData, svg: SVG) {
  const ctx = await measure(data4Layout, svg);
  layout(data4Layout);
  await paint(data4Layout, svg, ctx);
}
