import { createCommonLayoutRenderer } from '../common/index.js';
import { prepareGridLayout } from './edgeLabels.js';
import { runGridLayoutCore } from './layoutCore.js';

// Keep this adapter deliberately small: the common renderer owns the public render lifecycle,
// while grid-specific preparation and layout remain reusable by DDLT and focused tests.
export { prepareGridLayout, runGridLayoutCore };

export const render = createCommonLayoutRenderer({
  prepareLayout: prepareGridLayout,
  runLayoutCore: (data4Layout) => runGridLayoutCore(data4Layout),
});
