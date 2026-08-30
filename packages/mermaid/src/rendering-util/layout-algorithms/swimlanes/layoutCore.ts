import type { LayoutData } from '../../types.js';
import { getUserDefinedConfig } from '../../../config.js';
import { postProcessSwimlaneLayout, validateSwimlanesLayout } from './postProcessing.js';
import { toGraphView, writeBackToLayoutData } from './helpers.js';
import { sugiyamaLayout } from './pipeline.js';
import { routeEdgesOrthogonal } from './orthogonalRouter/router.js';
import { pinAnchoredNodes } from './anchoredNodes.js';

export type SwimlaneDirection = 'TB' | 'LR' | 'BT' | 'RL';

/** A finite number at `key`, or undefined. The top-level override has no declared type. */
function numberAt(source: object | undefined, key: string): number | undefined {
  const value = source === undefined ? undefined : Reflect.get(source, key);
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * The gap to lay out with.
 *
 * Precedence: an explicit top-level config override, which exists only when a user sets
 * one, then the value the diagram's own renderer put on the layout data, then the
 * flowchart config as a generic fallback. The flowchart keys carry schema defaults and so
 * always exist, which is why they come last - ahead of the diagram's own they would
 * silently shadow it, as they did for dagre until #7932.
 */
function spacing(layout: LayoutData, key: 'nodeSpacing' | 'rankSpacing', fallback: number) {
  return (
    numberAt(layout.config, key) ??
    numberAt(layout, key) ??
    numberAt(layout.config.flowchart, key) ??
    fallback
  );
}

/**
 * Whether a lane holds at most one node per layer.
 *
 * One node deep reads well for a role band, where the lane is the subject and the work
 * passing through it is a single line. It reads wrongly for a process whose branches
 * carry meaning: two paths out of a gateway happen at the same time, and laying them
 * end to end says they happen one after the other.
 *
 * A diagram states which it wants; an explicit setting still decides it either way.
 */
function compactsLanesToOneRow(data4Layout: LayoutData): boolean {
  const chosen = getUserDefinedConfig().swimlane?.ignoreCrossLaneEdges;
  if (typeof chosen === 'boolean') {
    return chosen;
  }
  return data4Layout.laneLayering !== 'branches';
}

function getSwimlaneDirection(data4Layout: LayoutData): SwimlaneDirection {
  return ((data4Layout as LayoutData & { direction?: string }).direction ??
    'TB') as SwimlaneDirection;
}

/**
 * Pure swimlane layout core shared by browser rendering and DDLT.
 *
 * The browser measures DOM nodes before this runs; DDLT injects captured sizes
 * before calling the same function.
 */
export function runSwimlaneLayoutCore(data4Layout: LayoutData): SwimlaneDirection {
  const g = toGraphView(data4Layout);
  // Precedence: an explicit top-level config override (only present when a user sets it -
  // it has no schema default) > the value the diagram's own renderer put on data4Layout >
  // the flowchart config as a generic fallback. The flowchart keys have schema defaults
  // and therefore always exist, so they must come last or they silently shadow every
  // diagram's own spacing (see #7932, where dagre was given the same order).
  const nodeGap = spacing(data4Layout, 'nodeSpacing', 40);
  const layerGap = spacing(data4Layout, 'rankSpacing', 100);
  const ignoreCrossLaneEdges = compactsLanesToOneRow(data4Layout);
  const optimizeRanksByCrossings = data4Layout.config.swimlane?.optimizeRanksByCrossings ?? true;
  const automaticLaneOrdering = data4Layout.config.swimlane?.automaticLaneOrdering ?? false;
  const direction = getSwimlaneDirection(data4Layout);

  const { ordered, coordinates } = sugiyamaLayout(g, {
    nodeGap,
    layerGap,
    ignoreCrossLaneEdges,
    optimizeRanksByCrossings,
    automaticLaneOrdering,
    direction,
    // Only a diagram that asked for its branches side by side puts several nodes in one
    // lane and layer, and only then does each node's own extent across the lane matter.
    spreadByOwnExtent: data4Layout.laneLayering === 'branches',
  });
  writeBackToLayoutData(g, ordered, coordinates, { nodeGap, layerGap });

  // Anchored nodes were held out of the layout, so give them a position now that their
  // hosts have one. This is canonical space, which gives the router a real port to route
  // from; postProcessSwimlaneLayout pins them again against the final geometry.
  pinAnchoredNodes(data4Layout, { space: 'canonical', direction });

  // The layout phases above position nodes only; they do not emit edge routing.
  // Reset any edge points carried on the input so routeEdgesOrthogonal below is
  // the single source of truth for swimlane edge geometry.
  for (const edge of data4Layout.edges ?? []) {
    delete edge.points;
  }
  routeEdgesOrthogonal(data4Layout, direction);

  for (const edge of data4Layout.edges ?? []) {
    if (!edge.curve || edge.curve === 'basis') {
      edge.curve = 'rounded';
    }
  }

  postProcessSwimlaneLayout(data4Layout, direction);

  validateSwimlanesLayout(data4Layout);

  return direction;
}
