import type { LayoutData } from '../../types.js';
import type { GridRoutingInstrumentation } from './routerInstrumentation.js';
import type { RouterSearchCaps } from './routerSearch.js';
import { GridEdgeRoutingSession } from './routerSession.js';
import type { TopologyResourceCaps } from './routerTopology.js';
import type { GridLayoutResult } from './types.js';

// Public routing facade. The implementation is split by phase so callers only depend on the
// stable options and compatibility exports that predate the module extraction.
export {
  areExactlyAxisAligned,
  boundedAlternativePortalCoordinates,
} from './routerCompatibility.js';
export { validateSameContainerRoute } from './routerConstraint.js';
export { assignCompactPortalCoordinates } from './routerPlanning.js';

export interface GridRoutingDualRouteComparison {
  edgeId: string;
  sparse: { valid: boolean; length: number; bends: number };
  legacy: { valid: boolean; length: number; bends: number };
}

export interface GridRoutingOptions {
  // Caps are also test seams, so enabling them deliberately bypasses compatibility fast paths.
  topologyCaps?: TopologyResourceCaps;
  searchCaps?: RouterSearchCaps;
  onDualRouteComparison?: (comparison: GridRoutingDualRouteComparison) => void;
}

export function routeGridEdges(
  layout: LayoutData,
  result: GridLayoutResult,
  metrics?: GridRoutingInstrumentation,
  options: GridRoutingOptions = {}
): void {
  // A fresh session owns every mutable routing structure and commits routes in deterministic order.
  new GridEdgeRoutingSession(layout, result, metrics, options).route();
}
