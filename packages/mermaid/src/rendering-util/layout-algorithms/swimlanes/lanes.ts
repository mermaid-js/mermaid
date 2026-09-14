import type { Node } from '../../types.js';

/**
 * Which containers are lanes, and which lane a node sits in.
 *
 * A lane is a group with no parent. It is the band that constrains placement, so the
 * layout keys ranking, ordering, column assignment, routing and title placement off it.
 */
export interface LaneModel {
  /** True for a group that is itself a lane. */
  isLane: (id: string) => boolean;
  /**
   * The lane enclosing a node, or null when it sits outside every lane.
   *
   * A lane resolves to null rather than to itself, so a caller can distinguish "this is
   * a band" from "this sits in a band". Content nested several levels deep resolves to
   * the outermost container, not the nearest one.
   */
  laneIdOf: (id: string) => string | null;
}

export function buildLaneModel(nodes: Node[]): LaneModel {
  const byId = new Map<string, Node>();
  const lanes = new Set<string>();
  for (const node of nodes) {
    byId.set(node.id, node);
    if (node.isGroup && !node.parentId) {
      lanes.add(node.id);
    }
  }

  const cache = new Map<string, string | null>();
  const laneIdOf = (id: string): string | null => {
    const cached = cache.get(id);
    if (cached !== undefined) {
      return cached;
    }
    // `seen` guards a malformed parent cycle, which would otherwise not terminate.
    const seen = new Set<string>([id]);
    let current = byId.get(id)?.parentId;
    let lane: string | null = null;
    while (current && !seen.has(current)) {
      seen.add(current);
      lane = current;
      current = byId.get(current)?.parentId;
    }
    cache.set(id, lane);
    return lane;
  };

  return {
    isLane: (id) => lanes.has(id),
    laneIdOf,
  };
}
