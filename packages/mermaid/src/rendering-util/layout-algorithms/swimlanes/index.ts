import { getUserDefinedConfig } from '../../../config.js';
import type { LayoutData } from '../../types.js';
import { createCommonLayoutRenderer } from '../common/index.js';
import { applySwimlaneLineJumps } from './adjustLayout.js';
import { prepareLayoutForSwimlanes } from './helpers.js';
import { createEdgeLabelNodes } from './edgeLabelNodes.js';
import { runSwimlaneLayoutCore } from './layoutCore.js';

/** Hands the engine what the author chose for ignoreCrossLaneEdges, which the merged config cannot tell from the default. */
export function prepareSwimlaneLayout(data4Layout: LayoutData): void {
  const chosen = getUserDefinedConfig().swimlane?.ignoreCrossLaneEdges;
  if (typeof chosen === 'boolean') {
    data4Layout.ignoreCrossLaneEdgesChosen = chosen;
  }
  prepareLayoutForSwimlanes(data4Layout);

  const transformedData = createEdgeLabelNodes(data4Layout);
  data4Layout.nodes = transformedData.nodes;
  data4Layout.edges = transformedData.edges;
}

export const render = createCommonLayoutRenderer({
  prepareLayout: prepareSwimlaneLayout,
  runLayoutCore: runSwimlaneLayoutCore,
  afterPaint: applySwimlaneLineJumps,
});
