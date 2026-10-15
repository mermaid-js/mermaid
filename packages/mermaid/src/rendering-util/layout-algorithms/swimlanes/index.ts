import type { LayoutData } from '../../types.js';
import type { CommonLayoutPaintContext } from '../common/index.js';
import { createCommonLayoutRenderer } from '../common/index.js';
import { applySwimlaneLineJumps } from './adjustLayout.js';
import { paintPhaseBands } from './phaseBands.js';
import { prepareLayoutForSwimlanes } from './helpers.js';
import { createEdgeLabelNodes } from './edgeLabelNodes.js';
import { runSwimlaneLayoutCore } from './layoutCore.js';

function prepareSwimlaneLayout(data4Layout: LayoutData): void {
  prepareLayoutForSwimlanes(data4Layout);

  const transformedData = createEdgeLabelNodes(data4Layout);
  data4Layout.nodes = transformedData.nodes;
  data4Layout.edges = transformedData.edges;
}

function afterSwimlanePaint(data4Layout: LayoutData, context: CommonLayoutPaintContext): void {
  paintPhaseBands(data4Layout, context);
  applySwimlaneLineJumps(data4Layout, context);
}

export const render = createCommonLayoutRenderer({
  prepareLayout: prepareSwimlaneLayout,
  runLayoutCore: runSwimlaneLayoutCore,
  afterPaint: afterSwimlanePaint,
});
