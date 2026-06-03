import type { LayoutData } from '../../types.js';
import { postProcessSwimlaneLayout, validateSwimlanesLayout } from './postProcessing.js';
import { toGraphView, writeBackToLayoutData } from './helpers.js';
import { sugiyamaLayout } from './pipeline.js';
import { routeEdgesOrthogonal } from './orthogonalRouter/router.js';

export type SwimlaneDirection = 'TB' | 'LR' | 'BT' | 'RL';

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
  const nodeGap = data4Layout.config.flowchart?.nodeSpacing ?? 40;
  const layerGap = data4Layout.config.flowchart?.rankSpacing ?? 100;
  const ignoreCrossLaneEdges = data4Layout.config.swimlane?.ignoreCrossLaneEdges ?? true;
  const optimizeRanksByCrossings = data4Layout.config.swimlane?.optimizeRanksByCrossings ?? true;
  const direction = getSwimlaneDirection(data4Layout);

  const { ordered, coordinates } = sugiyamaLayout(g, {
    nodeGap,
    layerGap,
    ignoreCrossLaneEdges,
    optimizeRanksByCrossings,
    direction,
  });
  writeBackToLayoutData(g, ordered, coordinates, { nodeGap, layerGap });

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
