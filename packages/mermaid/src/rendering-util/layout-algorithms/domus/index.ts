import type { SVG } from '../../../mermaid.js';
import { repairGroupReentryWhenIssuesImprove } from './pipeline/groupReentryRepair.js';
import { repairRailProximityWhenIssuesImprove } from './pipeline/railShiftRepairs.js';
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
import {
  finalizeDummyLabelNodesToOverlayLabels,
  relocateOverlayLabelsOffForeignEdgesFinal,
} from './finalizeOverlayLabels.js';
import { simplifyEdgeJogsWhenScoreImproves } from './pipeline/simplifyEdgeJogs.js';
import { clearArrowheadBendsWhenScoreImproves } from './pipeline/arrowheadBendClearance.js';
import { repairPortDirectionMismatchWhenScoreImproves } from './pipeline/portDirectionRepair.js';
import { relocateOffEdgeLabelsWhenScoreImproves } from './pipeline/offEdgeLabelRelocation.js';
import {
  remediateFlaggedEdgesWhenMonotone,
  simplifyPathologicalRoutesWhenMonotone,
  straightenParallelZsWhenScoreImproves,
  swingReroutesWhenScoreImproves,
  rerouteTopCrossersWhenScoreImproves,
} from './pipeline/flaggedEdgeRemediation.js';
import { spaceNodesOffGroupFramesWhenScoreImproves } from './pipeline/nodeGroupSpacing.js';
import { alignStraightLeafEdgesWhenValid } from './pipeline/straightLeafAlignment.js';
import { isEdgeLabelNodeId } from './core/labels.js';
import { profiler } from '../../../profiler.js';
import { totalLayoutCost } from '../layout-utils/layoutCost.js';
import { checkLayout } from './validateLayoutProxy.js';
import { widenEndpointApproachBands } from './pipeline/endpointBandWidening.js';
import { escapeCornerConnections } from './pipeline/cornerEscapeRepair.js';
import { preprocessClusters } from './cluster.js';
import { compactGroupSlack } from './pipeline/groupSlackCompaction.js';
import { nodeGroupClearanceOf } from '../layout-utils/validateLayout.js';
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
  (data4Layout as any).layoutAlgorithm = 'domus';
  // R12: turn on edge-label dummy-node handling. Without this, DOMUS compacts
  // the primary nodes with no knowledge of label widths, so labels wider than
  // the inter-node gap paint on top of the flanking rectangles.
  // `finalizeOverlayLabels.ts` resets this flag to `false` after DOMUS finishes.
  (data4Layout as any).config ??= {};
  (data4Layout as any).config.isLabelNode = true;

  // Inject the edge-label dummy nodes explicitly, exactly as `measure()` does.
  // The flag above is read by `adjustLayout.ts`, not by `createGraphWithElements`
  // — nothing in `createGraph.ts` injects label nodes on its own. Without this
  // call this stage produced a LayoutData with no `edge-label-*` nodes while the
  // browser path produced one with them, so the two seams laid out different
  // graphs and pre-adjustLayout assertions could not see what ships.
  injectDomusEdgeLabelNodes(data4Layout);

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
  const baseline = checkLayout(data4Layout);
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

  const candidateResult = checkLayout(candidate);
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
export function runLateQualityPasses(
  data4Layout: LayoutData,
  opts: { skipSwingReroutes?: boolean } = {}
): void {
  // Re-exit terminals the validator flags as port-direction-mismatched onto a
  // perpendicular side with a clean L. Runs before jog simplification so the new
  // route can be further straightened if that helps.
  repairPortDirectionMismatchWhenScoreImproves(data4Layout);

  // General monotone remediation for multi-defect invalid layouts: chips one
  // validator issue at a time (clean re-routes / rail shifts) until valid. A
  // no-op on valid layouts; never adds an issue, so it cannot regress.
  // Spanned separately: this one pass is over half of layout time on broken
  // layouts (it searches reroutes for every flagged edge), so a `domus:polish`
  // total without it split out hides where the time actually goes.
  if (injected.profiling) {
    profiler.spanSync('domus:remediate', () => remediateFlaggedEdgesWhenMonotone(data4Layout));
  } else {
    remediateFlaggedEdgesWhenMonotone(data4Layout);
  }

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

  // ── Crossing reduction is intentionally NOT performed here ────────────────
  //
  // DOMUS implements "A Walk on the Wild Side: A Shape-First Methodology for
  // Orthogonal Drawings" (LIPIcs.GD.2025.35), which trades crossings away for
  // bends on purpose: "orthogonal crossings are known to have a limited impact
  // on readability, suggesting that crossing minimization may not always be the
  // optimal goal." The paper reports being sharply outperformed on crossings by
  // TSM implementations and treats bounding them as an open problem.
  //
  // The passes that used to run here (reduceCrossingsWithPortSideCandidates,
  // reorderSiblingPortsToUncross, rerouteTopCrossers, reorderPortFans,
  // untangleSharedTerminalPairs) bought back that traded-away metric by
  // re-routing individual edges and re-scoring the whole layout per candidate.
  // Measured over the DDLT sweep they cost 55% of total layout time and were
  // worth 81 points of 18807 (0.4%), with 14 of 19 fixtures completely
  // unaffected and none becoming invalid. They are still exported and tested;
  // only the wiring is gone.
  //
  // Validity and bend repair below are unaffected and still run.
  // ──────────────────────────────────────────────────────────────────────────

  // Center degree-1 leaves on clean straight settled edges. This is intentionally
  // final and validator-gated: it tidies Mermaid-specific post-DOMUS drift
  // without feeding new coordinates back into the DOMUS shape construction.
  alignStraightLeafEdgesWhenValid(data4Layout, { spacing: 10 });

  // Some valid-layout simplifications only become available after the late
  // label/crossing/port-order passes have settled geometry.
  simplifyEdgeJogsWhenScoreImproves(data4Layout);

  // Parallel-side Z routes whose side spans overlap become 2-point straights
  // via legal port slides (+5 each, zero new bends).
  straightenParallelZsWhenScoreImproves(data4Layout);
  // Same-side swings the crossing pass cannot reach: flatten leftover
  // staircases and escape congested corridors via free-slot ports. Skipped
  // inside the placement tournament's per-variant polish (both variants gain
  // roughly equally from it, and it is too slow to run per variant); the
  // final polish below always runs it.
  if (!opts.skipSwingReroutes) {
    // ── The two validity repairs run FIRST, ahead of everything score-gated ──
    //
    // They used to close this block, and that ordering silently disabled every
    // score-gated pass in it on precisely the drawings that needed them most.
    // Those passes accept a candidate only when the whole layout's score
    // strictly improves, and the score is clamped to zero while any hard issue
    // stands — so on a layout these two repairs are about to rescue, all of
    // them run against a score of 0, can never improve on it, and return
    // having done nothing. `domus/mermaid-chart-architecture` entered
    // `untangleSharedTerminalPairs` at `ok=false score=0 crossings=50` and
    // bailed on the first line, then became valid two passes later and shipped
    // every one of those crossings.
    //
    // Repairing validity first costs nothing extra — same guard, same passes,
    // same single run on the winning variant — and hands the score-gated
    // passes a layout they can actually grade: mermaid-chart-architecture
    // 298 -> 897, architecture5-components 595 -> 780, triage 563 -> 641.
    //
    // Push an approach rail out of its end node's parallel band — the OTHER
    // half of the `edge-bend-near-endpoint` rule from the stub repair above:
    // that one lengthens a final segment, this one moves the rail before it.
    //
    // Winner only, for the same reason as the crossing pass beside it. It opens
    // with a full `checkLayout` to find its candidates, and `runLateQualityPasses`
    // runs once per tournament variant — paying that per variant measured
    // +100M work units, most of the 113.3% of ceiling this pass first cost.
    const bands = widenEndpointApproachBands(data4Layout);

    // Slide any endpoint sitting on a node corner onto a free slot on the side
    // the edge actually uses. Winner-only for the same reason as the passes
    // above. It reuses the band pass's validation when that pass changed
    // nothing, which is the common case and saves a whole `checkLayout` per
    // fixture.
    escapeCornerConnections(data4Layout, bands.changed ? undefined : bands.validation);

    // Slide a transit rail that cuts the edge's OWN group frame just outside
    // it — the `edge-reenters-own-group` repair. Winner-only like its two
    // siblings above, and for the same cost reason: it opens with a full
    // checkLayout (the rule it repairs is only computed un-focused).
    repairGroupReentryWhenIssuesImprove(data4Layout, { spacing: 10 });

    // Separate a too-close parallel rail pair, and shift a foreign rail off a
    // label that has nowhere to go — the two pairwise rules no existing pass
    // can reach (see railShiftRepairs.ts). Winner-only, monotone.
    repairRailProximityWhenIssuesImprove(data4Layout, { spacing: 10 });

    swingReroutesWhenScoreImproves(data4Layout);

    // Crossing reduction, wired back on its own out of the group that was
    // unwired together. It is the only one of those passes whose objective the
    // corpus ranks ABOVE the metric DOMUS optimises for: the readability study
    // `diss` §2.2 reports "CROSSING was found to be the most important,
    // followed by BEND and SYMMETRY", and both libavoid papers state the
    // post-routing rule as a conjunction — an adjustment must not introduce
    // "unnecessary crossings or bends" — never as a trade of one for the other.
    // Giving crossings away during ROUTING is DOMUS's bargain; it is not a
    // reason to decline a free clean-up afterwards.
    //
    // It sits inside this guard for the same reason `swingReroutes` does, and
    // that placement is the whole difference between affordable and not.
    // `runLateQualityPasses` runs once per variant of the compound-placement
    // tournament, and this pass re-validates the entire layout per candidate
    // route. Run per variant it cost +43% of the corpus's total routing work
    // for +55 aggregate — 111% of the cost ceiling, an automatic revert.
    // Restricting its candidate set instead was measured and was worse on both
    // axes at once (+25 aggregate, 113% of ceiling), because the cost is not in
    // its own search but in what the geometry it changes does to every pass
    // downstream. Running it once, on the winning variant only, is the version
    // that pays.
    rerouteTopCrossersWhenScoreImproves(data4Layout);
  }
  simplifyEdgeJogsWhenScoreImproves(data4Layout);
}

/**
 * Final safety net before the geometry leaves the DOM-free layout stage: drop
 * consecutive coincident points from every edge polyline. A zero-length segment
 * is invisible to the validator (`normalizePolyline` collapses it) but makes the
 * renderer's curve interpolation divide by the segment length and emit NaN path
 * coordinates, truncating the painted edge. Any producer pass can leave one
 * behind; enforcing "no degenerate polyline reaches the renderer" here is the
 * single guarantee that covers all of them. Never drops below a 2-point route.
 */
function stripDegenerateEdgePoints(data4Layout: LayoutData): void {
  const EPS_COINCIDENT = 1e-3;
  for (const e of data4Layout.edges ?? []) {
    const pts = (e as { points?: { x: number; y: number }[] }).points;
    if (!Array.isArray(pts) || pts.length < 2) {
      continue;
    }
    const out: { x: number; y: number }[] = [];
    for (const p of pts) {
      const last = out[out.length - 1];
      if (
        last &&
        Math.abs(last.x - p.x) <= EPS_COINCIDENT &&
        Math.abs(last.y - p.y) <= EPS_COINCIDENT
      ) {
        continue;
      }
      out.push(p);
    }
    // Keep a drawable 2-point minimum even if the whole route collapsed.
    if (out.length >= 2 && out.length !== pts.length) {
      (e as { points: { x: number; y: number }[] }).points = out;
    }
  }
}

/**
 * Profiling seams for `layout()`.
 *
 * The layout is one synchronous block with four distinct stages, and which of
 * them dominates depends entirely on the diagram — on
 * `layout-tests/domus/mermaid-chart-architecture.mmd` the compound-placement
 * tournament is ~64% of layout while the initial placement is ~5%, and on a
 * simple flowchart it is the other way round. A single `layout` number cannot
 * show that, so each stage gets its own span. `spanSync` keeps `layout()`
 * synchronous and costs nothing when the profiler is off (and nothing at all in
 * production builds, where `injected.profiling` folds the branch away).
 *
 * Names are prefixed `domus:` so they cannot collide with the generic phase
 * names (`measure`, `layout`, `paint`) that consumers resolve by searching the
 * span tree — see `.esbuild/dev-explorer/diagram-viewer.ts`.
 */
function domusStage<T>(name: string, fn: () => T): T {
  return injected.profiling ? profiler.spanSync(name, fn) : fn();
}

/**
 * Bounding-box area over all placed nodes.
 *
 * The validator has no area term, so a tight drawing and a sprawling one are
 * indistinguishable to it. This is consulted only to break a tie between
 * candidates that are equally valid and equally scored, never to trade score
 * for density. HOLA measures the same quantity as its compactness aesthetic and
 * reports it positively correlated with user preference.
 */
function drawingArea(layout: LayoutData): number {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const n of layout.nodes ?? []) {
    const nx = Number((n as { x?: number }).x);
    const ny = Number((n as { y?: number }).y);
    if (!Number.isFinite(nx) || !Number.isFinite(ny)) {
      continue;
    }
    const hw = Number(n.width ?? 0) / 2;
    const hh = Number(n.height ?? 0) / 2;
    x0 = Math.min(x0, nx - hw);
    y0 = Math.min(y0, ny - hh);
    x1 = Math.max(x1, nx + hw);
    y1 = Math.max(y1, ny + hh);
  }
  return Number.isFinite(x0) ? (x1 - x0) * (y1 - y0) : Number.POSITIVE_INFINITY;
}

/**
 * Slack multiplier on the node-to-group clearance when compacting.
 *
 * NOT 1. Compacting all the way to the minimum clearance produces a drawing the
 * router cannot then serve: on `domus/events` it reclaims 1261px and the
 * re-route comes back invalid, so the candidate is thrown away and the slack
 * stays. At twice the clearance the same fixture compacts, re-routes cleanly,
 * and scores BETTER than the drawing it replaces (995 against 987).
 *
 * This is the corpus's own finding rather than a tuned constant. Freivalds and
 * Glagolevs (1807.09368v1) carry an explicit slack coefficient through compaction and keep it
 * above its minimum on purpose, decaying it only in the final iterations,
 * because a larger value "leaves some empty places between nodes giving
 * additional freedom for node movement to find a better solution". Compaction
 * that leaves no room to route is compaction that gets rejected.
 *
 * Measured on `domus/events`: 1x invalid, 2x valid and tighter, 3x valid but no
 * longer tighter than the baseline, 4x valid and worse. The window is real and
 * it is narrow.
 */
const COMPACTION_SLACK = 2;

/**
 * Slack the compaction must reclaim, as a fraction of the drawing's own
 * width + height, before its re-route is worth paying for.
 *
 * Measured on the compacted-but-unrouted geometry, so it costs nothing. The
 * naive gate — total drawing area — does not work: on `domus/events` `Deck`
 * loses most of its height while the drawing as a whole shrinks by 1%, because
 * other content sets the bounding box. Reclaimed slack measures what the pass
 * actually did; there it is 1261px against an extent of 2592.
 */
const MIN_RECLAIM_FRACTION = 0.15;

/**
 * Node count above which a second routing pass is not worth its cost.
 *
 * Was 0 (pass retained but inert) while the score had no area term: re-enabling
 * measured ~36M work for 0 points. The 2026-08-26 `group-dead-space` /
 * `group-elongation` rules price exactly what this candidate reclaims, so the
 * gate is re-opened at the last value that earned its cost (18 — `domus/events`
 * has 16 nodes and was the visible win).
 */
const MAX_COMPACTION_NODES = 18;

/**
 * Skip the compaction candidate when this drawing's layout has already cost
 * more work than this — see the ledger gate in `tryGroupCompactionCandidate`.
 * `domus/events` and `domus/payments1` arrive here well under 10M and earn
 * +80 aggregate between them; `domus/co-pilot-extension` arrives at ~15M and
 * its candidate measured +106M for nothing.
 */
const COMPACTION_REROUTE_WORK_BUDGET = 10_000_000;

/** Width + height of the drawing's bounding box. */
function drawingExtent(layout: LayoutData): number {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const n of layout.nodes ?? []) {
    const nx = Number((n as { x?: number }).x);
    const ny = Number((n as { y?: number }).y);
    if (!Number.isFinite(nx) || !Number.isFinite(ny)) {
      continue;
    }
    x0 = Math.min(x0, nx - Number(n.width ?? 0) / 2);
    y0 = Math.min(y0, ny - Number(n.height ?? 0) / 2);
    x1 = Math.max(x1, nx + Number(n.width ?? 0) / 2);
    y1 = Math.max(y1, ny + Number(n.height ?? 0) / 2);
  }
  return Number.isFinite(x0) ? x1 - x0 + (y1 - y0) : 0;
}

/**
 * Compact group slack on the winning geometry and re-route; keep the result
 * only when it is no worse and genuinely tighter.
 */
function tryGroupCompactionCandidate(data4Layout: LayoutData): void {
  // Re-routing is the entire cost of this candidate and it scales with the
  // drawing. The corpus's large fixtures are already 200M+ work units each, so
  // paying a second routing pass on one of those swamps anything the compaction
  // can earn: without these gates the candidate measured +5 aggregate for +452M work, 135%
  // of the ceiling. Small drawings are where a re-route is affordable, and they
  // are also where a single empty frame is most of what the reader sees.
  if ((data4Layout.nodes ?? []).length > MAX_COMPACTION_NODES) {
    return;
  }

  const baseline = checkLayout(data4Layout);
  // The candidate's entire cost is its re-route; only pay it when the score
  // has something to reclaim here — a frame the validator says is too empty
  // or too elongated. Without this, every small fixture paid a second
  // routing pass whether or not compaction could earn anything (measured:
  // +117M, 109.8% of the cost ceiling, for gains confined to fixtures that
  // DO carry frame-shape issues).
  const hasFrameShapeIssue = baseline.issues.some(
    (i) => i.type === 'group-dead-space' || i.type === 'group-elongation'
  );
  if (!hasFrameShapeIssue) {
    return;
  }
  // The candidate's price is a second full route of this drawing, and that
  // price scales with how hostile the drawing already is to routing — which
  // the work ledger has been measuring all along. co-pilot-extension (16
  // nodes, same as events) spent 106M work units on a candidate it then
  // rejected, 7x its whole baseline layout, purely because its geometry makes
  // every repair pass iterate. What routing has already cost here is the best
  // available forecast of what routing again will cost.
  if (totalLayoutCost() > COMPACTION_REROUTE_WORK_BUDGET) {
    return;
  }
  const baselineArea = drawingArea(data4Layout);

  const candidate = cloneLayoutForFallbackCandidate(data4Layout);
  const compaction = compactGroupSlack(candidate, {
    minGap: COMPACTION_SLACK * nodeGroupClearanceOf(candidate),
  });
  if (!compaction.changed) {
    return;
  }
  // Pay for the re-route only where there is real slack to reclaim.
  //
  // The compaction has already run, so the area it would save is known BEFORE
  // any routing happens — and routing is the entire cost of this candidate. Run
  // unconditionally it re-routes every diagram in the corpus for a saving most
  // of them do not have, which measured at 134.6% of the routing-work ceiling.
  // Gating on the saving keeps the re-route for the handful of drawings with a
  // genuine void in them and skips it everywhere else.
  const extent = drawingExtent(data4Layout);
  if (compaction.reclaimed < MIN_RECLAIM_FRACTION * extent) {
    return;
  }

  // Frames moved, so the cluster geometry the router reads has to be rebuilt
  // before it routes, and the routes themselves are stale the moment an
  // endpoint moves — hence a full re-route rather than a repair pass.
  preprocessClusters(candidate, { spacing: 10, groupPadding: COMPOUND_GROUP_PAD });
  runRP1OrthogonalPipeline(candidate, {
    spacing: 10,
    routingBackend: 'routing-graph',
    routingGraphModel: 'channels',
    useExistingPositions: true,
    groupPadding: COMPOUND_GROUP_PAD,
  });
  runLateQualityPasses(candidate, { skipSwingReroutes: true });

  const result = checkLayout(candidate);
  const tighter = drawingArea(candidate) < baselineArea;
  // Both-invalid needs its own arm. `score >= score` is `0 >= 0` while the
  // score is clamped, so without it ANY invalid-but-tighter candidate would
  // replace an invalid baseline — which is how a compacted `domus/state-machine`
  // briefly shipped two issues it did not start with.
  const accept =
    tighter &&
    (result.ok
      ? !baseline.ok || result.score >= baseline.score
      : !baseline.ok && result.issues.length < baseline.issues.length);
  if (!accept) {
    return;
  }
  copyLayoutGeometry(data4Layout, candidate);
}

export function layout(data4Layout: LayoutData): void {
  // Stage 1: flat DOMUS placement (SAT shape construction) + initial routing.
  domusStage('domus:core', () =>
    runRP1OrthogonalPipeline(data4Layout, {
      spacing: 10,
      routingBackend: 'domus',
      useExistingPositions: false,
    })
  );

  const preFinalizeLayout = cloneLayoutForFallbackCandidate(data4Layout);

  // Convert internal dummy label nodes back into overlay labels (DOM-free) so
  // paint's `adjustLayout` will treat labels as overlays and draw a single
  // semantic edge per `(start, end)` pair.
  finalizeDummyLabelNodesToOverlayLabels(data4Layout);
  // Stage 2: layered fallback candidate (score-gated).
  domusStage('domus:fallback', () =>
    tryLayeredFallbackCandidateWhenScoreImproves(data4Layout, preFinalizeLayout)
  );

  // Compound (per-group) DOMUS placement candidate for multi-group layouts the
  // flat placement left invalid or weak. Score-gated inside; see
  // `pipeline/compoundPlacement.ts` for the paper trail.
  // Stage 3: compound (per-group) placement tournament. Each variant is routed
  // AND polished, so this span contains nested `domus:route` / `domus:polish`
  // spans — which is exactly what makes it the biggest entry on grouped diagrams.
  domusStage('domus:compound', () =>
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
      polish: (candidate: LayoutData) =>
        runLateQualityPasses(candidate, { skipSwingReroutes: true }),
    })
  );

  // Stage 4: group-slack compaction, as ONE candidate on the winning geometry.
  //
  // A group frame is derived, so nothing in placement resists stretching it and
  // a group whose members are pulled apart by their own outside edges drags an
  // empty frame out behind them — on `domus/events`, 738px of nothing inside
  // `Deck`, 58% of its height.
  //
  // It runs HERE, once, rather than inside the placement paths, and that
  // placement is the whole design. Compaction spends routing freedom to buy
  // density, so it has to be judged on a ROUTED drawing, not a placed one.
  // Applied inside every candidate arm instead, it cost 953 aggregate points
  // and pushed routing work to 101.7% of its ceiling: `domus/architecture-
  // ecosystem` went invalid on a single `edge-intersects-obstacle`, because
  // compaction had taken the space that edge needed AND the arm without
  // compaction that used to rescue it no longer existed. Doing it once on the winner costs
  // one re-route instead of one per arm, and applies to whichever path won.
  // Stage 5: the quality tail on the winning geometry.
  domusStage('domus:polish', () => runLateQualityPasses(data4Layout));

  // Stage 6: group-slack compaction, AFTER the polish above and not before it.
  // The candidate is polished too, so comparing it against an unpolished
  // baseline would flatter it — `domus/co-pilot-extension` was accepted that
  // way with two issues the baseline's own polish would have cleared.
  domusStage('domus:compact', () => tryGroupCompactionCandidate(data4Layout));

  // Labels move LAST, on final geometry: a label slid off a foreign edge is
  // pure gain here, while the same move made mid-finalize changes the
  // monotone accounting of every route repair that follows it.
  relocateOverlayLabelsOffForeignEdgesFinal(data4Layout);

  // Final safety net: no zero-length segments reach the renderer (NaN paths).
  stripDegenerateEdgePoints(data4Layout);
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
  // Phase names match the shared harness in `layout-algorithms/common/index.ts`
  // (`measure` / `layout` / `paint`) so DOMUS populates the same profile columns
  // as dagre and elk instead of showing blanks. DOMUS does not go through that
  // harness — it owns its three-stage measure/layout/paint split — so the spans
  // have to be emitted here.
  if (!injected.profiling) {
    const ctx = await measure(data4Layout, svg);
    layout(data4Layout);
    await paint(data4Layout, svg, ctx);
    return;
  }
  const ctx = await profiler.span('measure', () => measure(data4Layout, svg));
  profiler.spanSync('layout', () => layout(data4Layout));
  await profiler.span('paint', () => paint(data4Layout, svg, ctx));
}
