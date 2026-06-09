import type { LayoutData } from '../../types.js';
import { log } from '../../../logger.js';
import { ORTHO_DEBUG } from './debug.js';
import { buildOrthoPipelineContext } from './pipeline/context.js';
import {
  maybeApplyCompoundDomusPlacementOnly,
  maybeHandleDomusBackend,
} from './pipeline/domusBackend.js';
import { runNonDomusPipeline } from './pipeline/nonDomusPipeline.js';

// Re-export types from the shared types module for backwards compatibility
export type {
  Point,
  Rect,
  PortSide,
  AssignedPorts,
  OrthoStageName,
  OrthoStageTrace,
  OrthoRouteCost,
  OrthoRouteTrace,
  OrthoPortsTrace,
  OrthoEdgeTrace,
  OrthogonalTrace,
  OrthogonalOptions,
} from './types.js';

import type { OrthogonalOptions } from './types.js';

// Re-export layoutOrthogonalNodes from core module for backwards compatibility
export { layoutOrthogonalNodes } from './core/nodeLayout.js';

// Core routing, post-processing, and DOMUS plumbing are implemented in extracted pipeline modules.

/**
 * Run the orthogonal edge-routing pipeline on a LayoutData whose node
 * rectangles (x, y, width, height) are already fixed by an upstream layout.
 *
 * This initial implementation only covers a very small, but deterministic,
 * subset of the full RP1 pipeline:
 * - aligned nodes get straight segments between boundary ports
 * - non-aligned nodes get an L-shaped, orthogonal polyline
 * It is structured so that later stages (routing graph, ordering, nudging)
 * can replace these helpers without changing the public contract.
 */
export function runOrthogonalEdgePipeline(
  data: LayoutData,
  options: OrthogonalOptions = {}
): LayoutData {
  // Minimal debug hook: visible in the console when explicitly enabled.

  log.debug(ORTHO_DEBUG, 'PIPELINE_ENTER', {
    nodes: (data.nodes ?? []).length,
    edges: (data.edges ?? []).length,
    routingBackend: options.routingBackend ?? 'aligned',
    useExistingPositions: options.useExistingPositions,
  });

  const ctx = buildOrthoPipelineContext(data, options);
  const analysis = ctx.analysis;
  log.debug(ORTHO_DEBUG, 'GRAPH_ANALYSIS', {
    hasCycle: analysis.hasCycle,
    antiParallelPairs: analysis.antiParallelPairs.length,
    multiEdgeGroups: analysis.multiEdgeGroups.length,
  });
  const backend = ctx.backend;
  const hasGroups = ctx.hasGroups;
  const requestedBackend = ctx.requestedBackend;

  const domusHandled = maybeHandleDomusBackend({
    data,
    options,
    ctx: {
      analysis,
      spacing: ctx.spacing,
      preferAxisForVerticalFlow: ctx.preferAxisForVerticalFlow,
    },
    backend,
    routeWithRoutingGraph: (overrides) => {
      const nextOptions = { ...options, ...overrides };
      const nextCtx = buildOrthoPipelineContext(data, nextOptions);
      return runNonDomusPipeline({ data, options: nextOptions, ctx: nextCtx });
    },
  });
  if (domusHandled) {
    return domusHandled;
  }

  maybeApplyCompoundDomusPlacementOnly({
    data,
    options,
    hasGroups,
    requestedBackend,
    backend,
  });

  return runNonDomusPipeline({ data, options, ctx });
}
