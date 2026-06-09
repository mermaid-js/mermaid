import type { LayoutData } from '../../../types.js';
import { cleanupMultipleCrossingsBetweenTwoPaths } from '../multiCrossingCleanup.js';

export function applyMultiCrossingCleanup(data: LayoutData): void {
  const edges = data.edges ?? [];
  if (edges.length < 2) {
    return;
  }

  const isSelfLoop = (edge: (typeof edges)[number]): boolean =>
    edge?.start != null && edge?.end != null && String(edge.start) === String(edge.end);

  // O(m^2) pairwise cleanup. Good enough for the current Mermaid-scale graphs;
  // if needed we can optimize by spatial indexing later.
  for (let i = 0; i < edges.length; i++) {
    const a = edges[i];
    if (!a.points || a.points.length < 3 || isSelfLoop(a)) {
      continue;
    }
    for (let j = i + 1; j < edges.length; j++) {
      const b = edges[j];
      if (!b.points || b.points.length < 3 || isSelfLoop(b)) {
        continue;
      }
      const res = cleanupMultipleCrossingsBetweenTwoPaths(a.points, b.points);
      if (res.changed) {
        a.points = res.a;
        b.points = res.b;
      }
    }
  }
}
