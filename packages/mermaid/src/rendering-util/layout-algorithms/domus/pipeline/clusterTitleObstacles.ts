import type { Node } from '../../../types.js';
import type { Rect } from '../types.js';
import { rectForNode } from '../core/helpers.js';

export function clusterTitleObstacleRect(group: Node, spacing: number): Rect | null {
  if (!group.isGroup) {
    return null;
  }
  const rect = rectForNode(group);
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  if (width <= 1 || height <= 1) {
    return null;
  }

  const sideInset = Math.min(Math.max(2, spacing / 2), width / 3);
  const bandHeight = Math.min(height, Math.max(24, spacing * 3));
  const left = rect.left + sideInset;
  const right = rect.right - sideInset;
  const top = rect.top;
  const bottom = rect.top + bandHeight;
  return {
    left,
    right,
    top,
    bottom,
    cx: (left + right) / 2,
    cy: (top + bottom) / 2,
  };
}
