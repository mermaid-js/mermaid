import { describe, expect, it } from 'vitest';
import type { LayoutData, Node } from '../../types.js';
import { loadDdltFixture } from '../ddlt/loadDdltFixture.js';
import { validateLayout } from '../layout-utils/validateLayout.js';

const FIXTURE_ID = 'swimlanes/pebr-3-process-too-wide-in-lane';
const MIN_LANE_CHILD_HORIZONTAL_PADDING = 12;

function rect(node: Node): { left: number; right: number } {
  const x = node.x ?? 0;
  const width = node.width ?? 0;
  return {
    left: x - width / 2,
    right: x + width / 2,
  };
}

function topLevelSwimlanes(layout: LayoutData): Node[] {
  return (layout.nodes ?? []).filter((node) => node.isGroup && !node.parentId);
}

describe('Swimlanes DDLT - pebr-3-process-too-wide-in-lane.mmd', () => {
  it('keeps process nodes padded away from the swimlane border', async () => {
    const layout = await loadDdltFixture(FIXTURE_ID, { backendId: 'swimlanes' });
    const result = validateLayout(layout);

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);

    for (const lane of topLevelSwimlanes(layout)) {
      const laneRect = rect(lane);
      const children = (layout.nodes ?? []).filter((node) => node.parentId === lane.id);
      expect(children.length).toBeGreaterThan(0);

      for (const child of children) {
        const childRect = rect(child);
        expect(childRect.left - laneRect.left).toBeGreaterThanOrEqual(
          MIN_LANE_CHILD_HORIZONTAL_PADDING
        );
        expect(laneRect.right - childRect.right).toBeGreaterThanOrEqual(
          MIN_LANE_CHILD_HORIZONTAL_PADDING
        );
      }
    }
  });
});
