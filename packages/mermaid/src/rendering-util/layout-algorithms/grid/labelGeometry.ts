import type { Node } from '../../types.js';
import type { GridOrientation } from './types.js';
import { isFinitePositiveNumber } from './types.js';

export const GRID_LABEL_CLEARANCE = 6;
export const GRID_EDGE_END_MARKER_CLEARANCE = 12;
export const GRID_LABEL_SPAN_MARGIN = 2;

export interface GridLabelSpanRequirement {
  along: number;
  cross: number;
  startInset: number;
  endInset: number;
  requiredAlongSpan: number;
}

export function gridLabelSpanRequirement(
  labelNode: Node,
  orientation: GridOrientation
): GridLabelSpanRequirement | null {
  if (!isFinitePositiveNumber(labelNode.width) || !isFinitePositiveNumber(labelNode.height)) {
    return null;
  }

  const along = orientation === 'H' ? labelNode.width : labelNode.height;
  const cross = orientation === 'H' ? labelNode.height : labelNode.width;
  const startInset = Math.max(GRID_LABEL_CLEARANCE, GRID_EDGE_END_MARKER_CLEARANCE);
  const endInset = Math.max(GRID_LABEL_CLEARANCE, GRID_EDGE_END_MARKER_CLEARANCE);

  return {
    along,
    cross,
    startInset,
    endInset,
    requiredAlongSpan: along + startInset + endInset + GRID_LABEL_SPAN_MARGIN,
  };
}

export function gridLabelRequiredSegmentLength(
  labelNode: Node,
  orientation: GridOrientation
): number {
  const along = orientation === 'H' ? labelNode.width : labelNode.height;
  return isFinitePositiveNumber(along) ? along + GRID_LABEL_CLEARANCE * 2 : 0;
}
