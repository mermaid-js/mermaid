import { createCommonLayoutRenderer } from '../common/index.js';
import { prepareGridLayout } from './edgeLabels.js';
import { runGridLayoutCore } from './layoutCore.js';

export { prepareGridLayout, runGridLayoutCore };

export const render = createCommonLayoutRenderer({
  prepareLayout: prepareGridLayout,
  runLayoutCore: (data4Layout) => runGridLayoutCore(data4Layout),
});
