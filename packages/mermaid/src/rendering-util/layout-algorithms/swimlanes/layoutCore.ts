import type { LayoutData } from '../../types.js';
import { postProcessSwimlaneLayout, validateSwimlanesLayout } from './postProcessing.js';
import { toGraphView, writeBackToLayoutData } from './helpers.js';
import { phaseShortfalls } from './phaseBands.js';
import type { PhaseGrowth } from './phases.js';
import { warnUnusedPhases } from './phases.js';
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
/**
 * Places the nodes. A band can only be measured once the nodes are placed, so a title too
 * long for its band sends the layout round again with the room it lacks.
 */
function spacingOf(data4Layout: LayoutData) {
  return {
    nodeGap: data4Layout.config.flowchart?.nodeSpacing ?? 40,
    layerGap: data4Layout.config.flowchart?.rankSpacing ?? 100,
  };
}

function layeringOf(data4Layout: LayoutData) {
  return {
    ignoreCrossLaneEdges: data4Layout.config.swimlane?.ignoreCrossLaneEdges ?? true,
    optimizeRanksByCrossings: data4Layout.config.swimlane?.optimizeRanksByCrossings ?? true,
    automaticLaneOrdering: data4Layout.config.swimlane?.automaticLaneOrdering ?? false,
  };
}

function placeNodes(data4Layout: LayoutData, direction: SwimlaneDirection): void {
  const spacing = spacingOf(data4Layout);
  const layering = layeringOf(data4Layout);

  const place = (phaseGrowth?: PhaseGrowth) => {
    const graph = toGraphView(data4Layout);
    const { ordered, coordinates } = sugiyamaLayout(graph, {
      ...spacing,
      ...layering,
      direction,
      phaseGrowth,
    });
    writeBackToLayoutData(graph, ordered, coordinates, spacing);
  };
  warnUnusedPhases(data4Layout);
  place();
  const shortfalls = phaseShortfalls(data4Layout);
  if (Object.keys(shortfalls).length > 0) {
    place(shortfalls);
  }
}

export function runSwimlaneLayoutCore(data4Layout: LayoutData): SwimlaneDirection {
  const direction = getSwimlaneDirection(data4Layout);
  placeNodes(data4Layout, direction);

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
