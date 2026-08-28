import type { Node } from '../../types.js';

/** What a container is, when a diagram says so explicitly. */
export type LaneRole = 'pool' | 'lane';

/**
 * The role a container declares for itself, carried in `node.metadata.laneRole`.
 *
 * Roles are opt-in. Without one, every top-level group is a lane, which is what
 * `swimlane-beta` has always done - inferring a pool from nesting instead would silently
 * restyle any existing diagram that nests a subgraph.
 */
export function readLaneRole(node: Node | undefined): LaneRole | undefined {
  const role = node?.metadata?.laneRole;
  return role === 'pool' || role === 'lane' ? role : undefined;
}

/** The position a lane states for itself, carried in `node.metadata.laneIndex`. */
export function readLaneIndex(node: Node | undefined): number | undefined {
  const index = node?.metadata?.laneIndex;
  return typeof index === 'number' && Number.isFinite(index) ? index : undefined;
}

/**
 * Which containers are lanes, which enclose them, and which lane a node sits in.
 *
 * A lane is the band that constrains placement; a pool is a band of lanes. A group
 * marked `pool` that holds no lanes is treated as a lane, which is also how the notation
 * draws a pool with a single unnamed lane.
 */
export interface LaneModel {
  isPool: (id: string) => boolean;
  isLane: (id: string) => boolean;
  /**
   * The lane enclosing a node, or null when it sits outside every lane. A lane resolves
   * to null rather than to itself, so a caller can tell a band from its content.
   *
   * Content inside a pool resolves to its lane rather than to the pool, so lanes stay
   * the unit that constrains placement.
   */
  laneIdOf: (id: string) => string | null;
  /** The pool enclosing a node, or null. */
  poolIdOf: (id: string) => string | null;
  /** Lane ids per pool, in declaration order, for the pools that have any. */
  lanesByPool: Map<string, string[]>;
  hasPools: boolean;
}

export function buildLaneModel(nodes: Node[]): LaneModel {
  const byId = new Map<string, Node>();
  const groupChildCount = new Map<string, number>();
  for (const node of nodes) {
    byId.set(node.id, node);
    if (node.isGroup && node.parentId) {
      groupChildCount.set(node.parentId, (groupChildCount.get(node.parentId) ?? 0) + 1);
    }
  }

  // Only a group that declares itself a pool and holds at least one group is one; a
  // declared pool with nothing inside falls through to being a lane below.
  const pools = new Set<string>();
  for (const node of nodes) {
    if (node.isGroup && readLaneRole(node) === 'pool' && (groupChildCount.get(node.id) ?? 0) > 0) {
      pools.add(node.id);
    }
  }

  const lanes = new Set<string>();
  const lanesByPool = new Map<string, string[]>();
  for (const node of nodes) {
    if (!node.isGroup || pools.has(node.id)) {
      continue;
    }
    if (node.parentId && pools.has(node.parentId)) {
      lanes.add(node.id);
      const siblings = lanesByPool.get(node.parentId) ?? [];
      siblings.push(node.id);
      lanesByPool.set(node.parentId, siblings);
    } else if (!node.parentId) {
      lanes.add(node.id);
    }
  }

  const walk = (id: string, stopAt: Set<string>): string | null => {
    // `seen` guards a malformed parent cycle, which would otherwise not terminate.
    const seen = new Set<string>([id]);
    let current = byId.get(id)?.parentId;
    while (current && !seen.has(current)) {
      if (stopAt.has(current)) {
        return current;
      }
      seen.add(current);
      current = byId.get(current)?.parentId;
    }
    return null;
  };

  const laneCache = new Map<string, string | null>();
  const laneIdOf = (id: string): string | null => {
    const cached = laneCache.get(id);
    if (cached !== undefined) {
      return cached;
    }
    const lane = walk(id, lanes);
    laneCache.set(id, lane);
    return lane;
  };

  return {
    isPool: (id) => pools.has(id),
    isLane: (id) => lanes.has(id),
    laneIdOf,
    poolIdOf: (id) => (pools.has(id) ? id : walk(id, pools)),
    lanesByPool,
    hasPools: pools.size > 0,
  };
}
