/**
 * DOMUS Heuristics
 *
 * This module provides heuristics for deciding when to use DOMUS routing.
 */

import type { LayoutData } from '../../../types.js';
import { layoutDataToDomusInput } from './conversion.js';

/**
 * Check if DOMUS routing is appropriate for a given graph.
 *
 * DOMUS is most effective for:
 * - Graphs with many cycles (where shape matters)
 * - Graphs where bend minimization is important
 * - Graphs without too many high-degree vertices
 *
 * @param layout - The LayoutData to check
 * @returns Whether DOMUS is recommended
 */
export function shouldUseDomus(layout: LayoutData): {
  recommended: boolean;
  reason: string;
} {
  const { vertexIds, edges } = layoutDataToDomusInput(layout);

  // Too few edges: DOMUS overhead not worth it
  if (edges.length < 3) {
    return { recommended: false, reason: 'Too few edges for DOMUS overhead' };
  }

  // Check for high-degree vertices
  const degrees = new Map<string, number>();
  for (const v of vertexIds) {
    degrees.set(v, 0);
  }
  for (const e of edges) {
    degrees.set(e.from, (degrees.get(e.from) ?? 0) + 1);
    degrees.set(e.to, (degrees.get(e.to) ?? 0) + 1);
  }

  const maxDegree = Math.max(...degrees.values());
  if (maxDegree > 8) {
    return {
      recommended: false,
      reason: `High-degree vertex (degree ${maxDegree}) may cause many edge splits`,
    };
  }

  // Check if graph has cycles (DOMUS is especially useful for cyclic graphs)
  const hasCycles = edges.length >= vertexIds.length;
  if (hasCycles) {
    return { recommended: true, reason: 'Graph has cycles; DOMUS optimizes bend count' };
  }

  // Default: DOMUS is a good choice for general graphs
  return { recommended: true, reason: 'DOMUS provides optimal orthogonal shape' };
}
