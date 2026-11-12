import { createCommonLayoutRenderer } from '../common/index.js';
import { prepareGridLayout } from './edgeLabels.js';
import { runGridLayoutCore } from './layoutCore.js';
import { applyGridLineJumps } from './lineHops.js';

export { prepareGridLayout, runGridLayoutCore };

export const render = createCommonLayoutRenderer({
  prepareLayout: prepareGridLayout,
  runLayoutCore: (data) => runGridLayoutCore(data),
  afterPaint: applyGridLineJumps,
});
