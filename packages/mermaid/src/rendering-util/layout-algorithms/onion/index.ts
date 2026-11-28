import { createCommonLayoutRenderer, defaultMeasureLayout } from '../common/index.js';
import { runOnionLayoutCore } from './layoutCore.js';
import { findSideGroupIds } from './structure.js';

export const render = createCommonLayoutRenderer({
  // Frames size their title band from a one-line title, as the painter draws it.
  measureLayout: (data4Layout, context) =>
    defaultMeasureLayout(data4Layout, context, { unwrapGroupLabels: true }),
  runLayoutCore: (data4Layout, context) => {
    runOnionLayoutCore(
      data4Layout,
      context.options?.algorithm === 'onion-vertical' ? 'vertical' : 'horizontal'
    );
  },
  // A rectangle frame cannot draw a sector, so the side groups are laid out but never painted.
  paintOptions: {
    // The core ends every edge on its nodes' outlines and places the labels against those ends.
    skipIntersect: true,
    getNodes: (data4Layout) => {
      const sideGroupIds = findSideGroupIds(data4Layout.nodes);
      return data4Layout.nodes.filter((node) => !sideGroupIds.has(node.id));
    },
  },
});
