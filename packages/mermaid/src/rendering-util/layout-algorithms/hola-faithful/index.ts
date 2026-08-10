import type { LayoutData } from '../../types.js';
import { createCommonLayoutRenderer } from '../common/index.js';
import { runHolaFaithfulLayoutCore } from './layoutCore.js';
import { prepareHolaFaithfulLayout } from './prepareLayout.js';

/**
 * The faithful HOLA layout, exposed as `layout: 'hola-faithful'` alongside the
 * existing experimental `hola` implementation.
 *
 * `prepareLayout` only removes what will not be drawn (guide §3.2). Edge labels
 * are deliberately *not* rewritten into nodes (guide §3.3): the measure stage
 * sets `edge.width`/`edge.height` from the rendered label, which is exactly what
 * the layout reads when it reserves space and places the label afterwards.
 */
export const render = createCommonLayoutRenderer({
  prepareLayout: (data4Layout: LayoutData) => prepareHolaFaithfulLayout(data4Layout),
  runLayoutCore: (data4Layout: LayoutData) => {
    runHolaFaithfulLayoutCore(data4Layout);
  },
  paintOptions: {
    // The router anchors both endpoints on the node boundary, so re-clipping
    // at paint time would bend the last segment of a settled route.
    skipIntersect: true,
  },
});

export { runHolaFaithfulLayoutCore } from './layoutCore.js';
export type { HolaFaithfulResult } from './layoutCore.js';
export { prepareHolaFaithfulLayout } from './prepareLayout.js';
export type { PreparedHolaFaithfulLayout } from './prepareLayout.js';
export { DEFAULT_HOLA_OPTIONS, resolveOptions } from './options.js';
export type { HolaOptions } from './options.js';
export type { HolaDiagnostic, HolaDiagnosticCode } from './diagnostics.js';
