import { describe, expect, it } from 'vitest';
import type { Node } from '../../types.js';
import {
  GRID_EDGE_END_MARKER_CLEARANCE,
  GRID_LABEL_CLEARANCE,
  GRID_LABEL_SPAN_MARGIN,
  gridLabelRequiredSegmentLength,
  gridLabelSpanRequirement,
} from './labelGeometry.js';

function label(width: number | undefined, height: number | undefined): Node {
  return { id: 'label', width, height, isGroup: false } as Node;
}

describe('grid label geometry', () => {
  it('maps horizontal and vertical label dimensions to their route axes', () => {
    expect(gridLabelSpanRequirement(label(90, 20), 'H')).toEqual({
      along: 90,
      cross: 20,
      startInset: GRID_EDGE_END_MARKER_CLEARANCE,
      endInset: GRID_EDGE_END_MARKER_CLEARANCE,
      requiredAlongSpan: 90 + GRID_EDGE_END_MARKER_CLEARANCE * 2 + GRID_LABEL_SPAN_MARGIN,
    });
    expect(gridLabelSpanRequirement(label(90, 20), 'V')).toEqual({
      along: 20,
      cross: 90,
      startInset: GRID_EDGE_END_MARKER_CLEARANCE,
      endInset: GRID_EDGE_END_MARKER_CLEARANCE,
      requiredAlongSpan: 20 + GRID_EDGE_END_MARKER_CLEARANCE * 2 + GRID_LABEL_SPAN_MARGIN,
    });
  });

  it('retains the existing nonterminal segment clearance calculation', () => {
    expect(gridLabelRequiredSegmentLength(label(90, 20), 'H')).toBe(90 + GRID_LABEL_CLEARANCE * 2);
    expect(gridLabelRequiredSegmentLength(label(90, 20), 'V')).toBe(20 + GRID_LABEL_CLEARANCE * 2);
  });

  it.each([
    [undefined, 20],
    [90, undefined],
    [0, 20],
    [90, Number.NaN],
  ])('rejects an invalid %s by %s measurement', (width, height) => {
    expect(gridLabelSpanRequirement(label(width, height), 'H')).toBeNull();
  });
});
