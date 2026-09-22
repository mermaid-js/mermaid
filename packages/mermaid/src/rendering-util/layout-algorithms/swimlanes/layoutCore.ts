import type { LayoutData } from '../../types.js';
import { getUserDefinedConfig } from '../../../config.js';
import { postProcessSwimlaneLayout, validateSwimlanesLayout } from './postProcessing.js';
import { toGraphView, writeBackToLayoutData } from './helpers.js';
import { sugiyamaLayout } from './pipeline.js';
import { routeEdgesOrthogonal } from './orthogonalRouter/router.js';
import { pinAnchoredNodes } from './anchoredNodes.js';

export type SwimlaneDirection = 'TB' | 'LR' | 'BT' | 'RL';

function numberAt(source: object | undefined, key: string): number | undefined {
  const value = source === undefined ? undefined : Reflect.get(source, key);
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function spacing(layout: LayoutData, key: 'nodeSpacing' | 'rankSpacing', fallback: number) {
  return (
    numberAt(layout.config, key) ??
    numberAt(layout, key) ??
    numberAt(layout.config.flowchart, key) ??
    fallback
  );
}

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
    spreadByOwnExtent: data4Layout.laneLayering === 'branches',
    gapIsRoomBetween: data4Layout.laneLayering === 'branches',
  });
  writeBackToLayoutData(g, ordered, coordinates, { nodeGap, layerGap });

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
