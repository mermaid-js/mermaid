import type { LayoutData } from '../../../types.js';
import { buildLaneModel } from '../lanes.js';
import { collectAnchoredIds } from '../anchoredNodes.js';

type LayoutNode = NonNullable<LayoutData['nodes']>[number] & { swimlaneContentTop?: number };

/** The strip along a band's edge that its title is drawn in. */
const TITLE_BAND = 24;

/**
 * Puts a frame around each pool's lanes, with the pool's own name band above them.
 *
 * Laid out downwards, a lane is sized and placed on its own and a pool takes its extent
 * from the nodes inside it. Neither leaves room for the other's name, so the two bands
 * are drawn one over the other and the lane comes out taller than the pool that is
 * supposed to hold it. The lanes are moved down to clear the pool's band, and the pool
 * is then sized to enclose the run.
 *
 * Anchored nodes are not moved: they are placed from their host afterwards, so moving
 * them here would be undone.
 */
export function framePoolsTb(layout: LayoutData): void {
  const nodes = (layout.nodes ?? []) as LayoutNode[];
  const laneModel = buildLaneModel(nodes);
  if (!laneModel.hasPools) {
    return;
  }
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const anchoredIds = collectAnchoredIds(nodes);

  const pooled = new Set<string>();
  for (const laneIds of laneModel.lanesByPool.values()) {
    for (const laneId of laneIds) {
      pooled.add(laneId);
    }
  }
  const movesWithItsLane = (node: LayoutNode) => {
    const laneId = laneModel.laneIdOf(node.id);
    return laneId !== null && pooled.has(laneId);
  };

  for (const node of nodes) {
    if (typeof node.y !== 'number') {
      continue;
    }
    const isPooledLane = laneModel.isLane(node.id) && pooled.has(node.id);
    const isPooledContent =
      !node.isGroup && !anchoredIds.has(node.id) && !laneModel.isLane(node.id) && movesWithItsLane(node);
    if (!isPooledLane && !isPooledContent) {
      continue;
    }
    node.y += TITLE_BAND;
    if (isPooledLane && typeof node.swimlaneContentTop === 'number') {
      node.swimlaneContentTop += TITLE_BAND;
    }
    if (node.groupTitleRect) {
      node.groupTitleRect.top += TITLE_BAND;
      node.groupTitleRect.bottom += TITLE_BAND;
    }
  }

  for (const [poolId, laneIds] of laneModel.lanesByPool) {
    const pool = byId.get(poolId);
    const lanes = laneIds
      .map((id: string) => byId.get(id))
      .filter((lane): lane is LayoutNode => Boolean(lane));
    if (!pool || lanes.length === 0) {
      continue;
    }
    const left = Math.min(...lanes.map((lane) => (lane.x ?? 0) - (lane.width ?? 0) / 2));
    const right = Math.max(...lanes.map((lane) => (lane.x ?? 0) + (lane.width ?? 0) / 2));
    const laneTop = Math.min(...lanes.map((lane) => (lane.y ?? 0) - (lane.height ?? 0) / 2));
    const bottom = Math.max(...lanes.map((lane) => (lane.y ?? 0) + (lane.height ?? 0) / 2));
    const top = laneTop - TITLE_BAND;

    pool.x = (left + right) / 2;
    pool.width = right - left;
    pool.y = (top + bottom) / 2;
    pool.height = bottom - top;
    // Its own content begins where the lanes do, which is what sizes its name band.
    pool.swimlaneContentTop = laneTop;
    pool.groupTitleRect = { left, right, top, bottom: laneTop };
  }
}
