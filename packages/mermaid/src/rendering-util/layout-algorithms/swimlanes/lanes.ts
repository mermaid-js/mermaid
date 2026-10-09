import type { Node } from '../../types.js';

export type LaneRole = 'pool' | 'lane';

export function readLaneRole(node: Node | undefined): LaneRole | undefined {
  const role = node?.metadata?.laneRole;
  return role === 'pool' || role === 'lane' ? role : undefined;
}

export function readLaneIndex(node: Node | undefined): number | undefined {
  const index = node?.metadata?.laneIndex;
  return typeof index === 'number' && Number.isFinite(index) ? index : undefined;
}

export interface LaneModel {
  isPool: (id: string) => boolean;
  isLane: (id: string) => boolean;

  laneIdOf: (id: string) => string | null;

  poolIdOf: (id: string) => string | null;

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
