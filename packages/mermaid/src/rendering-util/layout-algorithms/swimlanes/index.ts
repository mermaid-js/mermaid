import type { LayoutData } from '../../types.js';
import type {
  CommonLayoutMeasure,
  CommonLayoutPaintContext,
  CommonLayoutRenderContext,
} from '../common/index.js';
import { createCommonLayoutRenderer, defaultMeasureLayout } from '../common/index.js';
import { applySwimlaneLineJumps } from './adjustLayout.js';
import { measurePhaseTitles, paintPhaseBands } from './phaseBands.js';
import { prepareLayoutForSwimlanes } from './helpers.js';
import { createEdgeLabelNodes } from './edgeLabelNodes.js';
import { runSwimlaneLayoutCore } from './layoutCore.js';

function prepareSwimlaneLayout(data4Layout: LayoutData): void {
  prepareLayoutForSwimlanes(data4Layout);

  const transformedData = createEdgeLabelNodes(data4Layout);
  data4Layout.nodes = transformedData.nodes;
  data4Layout.edges = transformedData.edges;
}

async function afterSwimlanePaint(
  data4Layout: LayoutData,
  context: CommonLayoutPaintContext
): Promise<void> {
  await paintPhaseBands(data4Layout, context);
  applySwimlaneLineJumps(data4Layout, context);
}

async function measureSwimlaneLayout(
  data4Layout: LayoutData,
  context: CommonLayoutRenderContext
): Promise<CommonLayoutMeasure> {
  const measure = await defaultMeasureLayout(data4Layout, context);
  await measurePhaseTitles(data4Layout, context.element);
  return measure;
}

export const render = createCommonLayoutRenderer({
  prepareLayout: prepareSwimlaneLayout,
  measureLayout: measureSwimlaneLayout,
  runLayoutCore: runSwimlaneLayoutCore,
  afterPaint: afterSwimlanePaint,
});
