import type { Edge, LayoutData } from '../../types.js';
import { createCommonLayoutRenderer } from '../common/index.js';
import { injectHolaEdgeLabelNodes } from './injectEdgeLabelNodes.js';
import { runHolaLayoutCore } from './layoutCore.js';

function prepareHolaLayout(data4Layout: LayoutData): void {
  // Edge labels have to reserve space before positions are decided, so each
  // labelled edge becomes `start → label → end` around a dummy node that the
  // measure stage sizes from its real text. Must run before measurement.
  injectHolaEdgeLabelNodes(data4Layout);
}

export const render = createCommonLayoutRenderer({
  prepareLayout: prepareHolaLayout,
  runLayoutCore: runHolaLayoutCore,
  paintOptions: {
    // HOLA's orthogonal router anchors both endpoints on the node boundary
    // itself. Re-clipping those against the node shape at paint time would
    // bend the final segment of a route the layout already settled.
    skipIntersect: (edge: Edge) => Boolean(edge.hasIntersectionPoints),
  },
});
