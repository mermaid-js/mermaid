import type { LayoutData, Node } from '../../../types.js';
import {
  applyNudgingConstraintsLocal,
  applyPathOrderingAndSpacingLocal,
  segmentKeyForSpacing,
} from './postRouting.js';

export function applyIncrementalNeighborhoodPostprocess(args: {
  data: LayoutData;
  nodesByIdNoGroups: Map<string, Node>;
  spacing: number;
  incrementalEnabled: boolean;
  changedEdgeIds: Set<string>;
}): void {
  const { data, nodesByIdNoGroups, spacing, incrementalEnabled, changedEdgeIds } = args;

  if (!incrementalEnabled || spacing <= 0) {
    return;
  }

  // Local neighborhood: edges whose (simple) spacing key matches any affected edge.
  const keys = new Set<string>();
  for (const edge of data.edges ?? []) {
    const edgeId = edge?.id != null ? String(edge.id) : '';
    if (!edgeId || !changedEdgeIds.has(edgeId)) {
      continue;
    }
    const k = edge.points ? segmentKeyForSpacing(edge.points) : null;
    if (k) {
      keys.add(k);
    }
  }

  const neighborhood = new Set<string>();
  for (const edge of data.edges ?? []) {
    const edgeId = edge?.id != null ? String(edge.id) : '';
    if (!edgeId) {
      continue;
    }
    const k = edge.points ? segmentKeyForSpacing(edge.points) : null;
    if (k && keys.has(k)) {
      neighborhood.add(edgeId);
    }
  }

  // Apply local ordering + nudging only inside the neighborhood, so unrelated edges remain unchanged.
  applyPathOrderingAndSpacingLocal(data, nodesByIdNoGroups, spacing, neighborhood);
  applyNudgingConstraintsLocal(data, nodesByIdNoGroups, spacing, neighborhood);
}
