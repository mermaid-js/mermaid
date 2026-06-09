import type { SVG } from '../../../mermaid.js';
import type { D3Selection } from '../../../types.js';
import { createGraphWithElements } from '../../createGraph.js';
import insertMarkers from '../../rendering-elements/markers.js';
import { log } from '../../../logger.js';
import { clear as clearGraphlib } from '../dagre/mermaid-graphlib.js';
import { clear as clearNodes } from '../../rendering-elements/nodes.js';
import { clear as clearClusters } from '../../rendering-elements/clusters.js';
import { clear as clearEdges } from '../../rendering-elements/edges.js';
import type { LayoutData } from '../../types.js';
import { adjustLayout } from './adjustLayout.js';
import { layoutOrthogonalNodes } from './pipeline.js';
import type { OrthogonalTrace } from './pipeline.js';
import { runRP1OrthogonalPipeline } from './rp1Pipeline.js';
import { ORTHO_DEBUG } from './debug.js';
import { finalizeDummyLabelNodesToOverlayLabels } from './finalizeOverlayLabels.js';
import { isEdgeLabelNodeId } from './core/labels.js';
import { isHorizontalOrthoDirection, oppositeOrthoDirection } from './core/direction.js';
import { preparePaintReadyNodeGeometry } from './paintReadyLayout.js';
import {
  preloadLibavoidAdapterForLayout,
  withDefaultLibavoidFallback,
} from './pipeline/libavoidAdapter.js';
import { applyTopPocketCrossingRepairIfImproves } from './pipeline/topPocketCrossingRepair.js';

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
  // @ts-expect-error TODO(domus-wildside-drift): createGraphWithElements signature expects 2 args; the 3rd options bag ({ labelMode, measureNodes }) is a wild-side overload that doesn't exist on the current authoritative signature.
  const { groups } = await createGraphWithElements(element, data4Layout, {
    labelMode: 'nodes',
    measureNodes: true,
  });

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
  await preloadLibavoidAdapterForLayout(data4Layout);
  const result = runRP1OrthogonalPipeline(
    data4Layout,
    withDefaultLibavoidFallback(data4Layout, {
      spacing: 10,
      routingBackend: 'domus',
      routingGraphModel: 'channels',
      ocrFallback: true,
      ocrMaxExpansions: 50_000,
      useExistingPositions: false,
    })
  );

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
    runRP1OrthogonalPipeline(
      data4Layout,
      withDefaultLibavoidFallback(data4Layout, {
        spacing: 10,
        routingBackend: 'domus',
        routingGraphModel: 'channels',
        ocrFallback: true,
        ocrMaxExpansions: 50_000,
        useExistingPositions: true,
      })
    );
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
// Staged orthogonal execution (measurement → layout → finalize → paint)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stage 0 (DOM allowed): measure node + edge-label sizes and produce a sized LayoutData.
 *
 * This stage may insert temporary SVG elements for sizing via `getBBox`, but it must
 * not run any layout algorithm.
 *
 * NOTE: This stage always injects edge-label dummy nodes for orthogonal diagrams,
 * regardless of whether labels are later rendered as overlay labels or as nodes.
 */
export async function measure(data4Layout: LayoutData, svg: SVG): Promise<void> {
  (data4Layout as any).layoutAlgorithm = 'domus';
  // R12: see renderPreAdjustLayout above — `createGraphWithElements` gates
  // edge-label dummy-node injection on `config.isLabelNode`, which defaults
  // to `false`. Without this the measure stage rehearses the node graph
  // without label vertices, so DOMUS (called in `layout()`) never sees them
  // and compacts the flanking nodes without reserving space for label widths.
  (data4Layout as any).config ??= {};
  (data4Layout as any).config.isLabelNode = true;

  // Use a hidden layer so sizing does not pollute the final DOM.
  const element = svg.select('g') as unknown as D3Selection<SVGElement>;
  const measureLayer = element.insert('g').attr('class', 'orthogonal-measure').attr('opacity', 0);
  try {
    // @ts-expect-error TODO(domus-wildside-drift): createGraphWithElements signature expects 2 args; the 3rd options bag is a wild-side overload that doesn't exist on the current authoritative signature.
    await createGraphWithElements(measureLayer as any, data4Layout, {
      labelMode: 'nodes',
      measureNodes: true,
    });
    await preloadLibavoidAdapterForLayout(data4Layout);
  } finally {
    // Remove the temporary sizing layer; sizes remain on LayoutData.
    measureLayer.remove();
  }
}

/**
 * Stage 1 (DOM-free): run the orthogonal layout algorithm using already-measured sizes.
 *
 * Must execute the same pipeline as the DDLT entry
 * (`ddlt/backends.ts:runDomusOrthogonalDdlt`) so the browser and DDLT validate
 * the same routes. Any divergence breaks the "fix it in DDLT, browser inherits"
 * contract.
 */
export function layout(
  data4Layout: LayoutData,
  options?: { trace?: OrthogonalTrace | undefined }
): void {
  runRP1OrthogonalPipeline(
    data4Layout,
    withDefaultLibavoidFallback(data4Layout, {
      spacing: 10,
      routingBackend: 'domus',
      routingGraphModel: 'channels',
      ocrFallback: true,
      ocrMaxExpansions: 50_000,
      useExistingPositions: false,
      trace: options?.trace,
    })
  );

  preparePaintReadyNodeGeometry(data4Layout, 'post-layout');
  finalizeDummyLabelNodesToOverlayLabels(data4Layout);
  applyTopPocketCrossingRepairIfImproves(data4Layout, { spacing: 10 });
  preparePaintReadyNodeGeometry(data4Layout, 'post-finalize');
}

/**
 * Stage 2 (DOM-free): merge label-node edges back into a single semantic edge + overlay label.
 *
 * After this, painting will treat labels as overlay labels and will not render dummy label nodes.
 */
export function finalizeForPaint(data4Layout: LayoutData): void {
  finalizeDummyLabelNodesToOverlayLabels(data4Layout);
  preparePaintReadyNodeGeometry(data4Layout, 'finalizeForPaint');
}

/**
 * Stage 3 (DOM allowed): paint-only. No layout logic here.
 */
export async function paint(data4Layout: LayoutData, svg: SVG): Promise<void> {
  const element = svg.select('g') as unknown as D3Selection<SVGElement>;
  // Insert markers and clear previous elements
  insertMarkers(element, data4Layout.markers ?? [], data4Layout.type, data4Layout.diagramId);
  clearNodes();
  clearEdges();
  clearClusters();
  clearGraphlib();

  // Build DOM elements for painting without mutating sizes or injecting label nodes.
  // @ts-expect-error TODO(domus-wildside-drift): createGraphWithElements signature expects 2 args; the 3rd options bag is a wild-side overload that doesn't exist on the current authoritative signature.
  const { groups } = await createGraphWithElements(element, data4Layout, {
    labelMode: 'overlay',
    measureNodes: false,
  });
  await adjustLayout(data4Layout, groups);
}

// Legacy compatibility: keep `render` export, but implement it via staged execution.
export async function render(data4Layout: LayoutData, svg: SVG) {
  await measure(data4Layout, svg);
  layout(data4Layout);
  await paint(data4Layout, svg);
}
