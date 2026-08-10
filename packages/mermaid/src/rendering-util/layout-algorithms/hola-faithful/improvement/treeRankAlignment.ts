/**
 * Cross-tree rank alignment.
 *
 * HOLA lays every tree out on its own and places it against its own root, so two
 * trees on the same side of the core come out staggered — one tree's second rank
 * level with another's third — and the side reads as a jumble rather than a
 * hierarchy. This pass gives every tree growing the same way one shared set of
 * rank lines: one x per rank for trees growing east or west (so each level is
 * vertically aligned), one y per rank for trees growing north or south.
 *
 * It runs on the restored real tree nodes, after the constraint work and before
 * final routing, so it moves node positions directly and every tree edge is
 * routed afterwards against the result.
 *
 * Opportunistic in the sense of guide §18.1: applied where it is clearly right,
 * abandoned where it is not.
 */

import type { Axis, Cardinal, HolaNode } from '../model.js';
import { nodeBounds, rectsOverlap } from '../model.js';
import type { HolaOptions } from '../options.js';

/** A tree as it was just put back into the drawing, indexed by rank. */
export interface RestoredTree {
  growth: Cardinal;
  /** Core node the tree hangs from; it *is* rank 0. */
  rootId: string;
  /** Node ids by depth. Index 0 is empty — rank 0 is the core node. */
  ranks: string[][];
}

/** The axis a tree extends along, and which way along it. */
const ALONG_AXIS: Record<Cardinal, Axis> = { N: 'y', S: 'y', E: 'x', W: 'x' };
const GROWTH_SIGN: Record<Cardinal, 1 | -1> = { S: 1, E: 1, N: -1, W: -1 };

/**
 * Give every tree growing the same way one shared set of rank lines.
 *
 * Each tree is laid out and placed on its own, so its ranks sit at its own root's
 * distance plus its own spacing. Two trees on the same side of the core therefore
 * come out staggered — one tree's second rank level with another's third — and the
 * side reads as a jumble instead of a hierarchy. Trees that grow east or west get
 * one x per rank (each level vertically aligned); trees that grow north or south
 * get one y per rank.
 *
 * This is opportunistic in the sense of guide §18.1: it is applied where it is
 * clearly right and abandoned where it is not.
 *
 * - Only trees growing in the same direction share lines. A tree growing east and
 *   one growing south have nothing to align.
 * - Only trees standing side by side *across* the growth axis. Two trees stacked
 *   along it (one further out than the other) would be pulled into each other.
 * - Ranks only ever move outwards, away from the core, so no rank can be pushed
 *   back over its own parent, and the spacing needed by the widest node of each
 *   rank is enforced across the whole group.
 * - If the result overlaps anything, the group is put back as it was.
 */
export function alignTreeRanks(
  nodes: Map<string, HolaNode>,
  trees: RestoredTree[],
  options: HolaOptions
): void {
  const byGrowth = new Map<Cardinal, RestoredTree[]>();
  for (const tree of trees) {
    const group = byGrowth.get(tree.growth);
    if (group) {
      group.push(tree);
    } else {
      byGrowth.set(tree.growth, [tree]);
    }
  }

  for (const [growth, group] of byGrowth) {
    if (group.length < 2) {
      continue;
    }
    const axis = ALONG_AXIS[growth];
    const sign = GROWTH_SIGN[growth];
    if (!sideBySideAcross(group, nodes, axis)) {
      continue;
    }

    // Two candidate line sets, tightest first.
    //
    // `tight` is derived from geometry alone — root extent, rank gap, and the
    // largest node of each rank across the group — so it is the closest the ranks
    // can legally sit to the core, and it discards any slide a tree happened to
    // carry. `outermost` keeps every tree at least where it already was, which
    // always fits but hands each tree the largest slide in the group.
    const candidates = [
      tightRankLines(group, nodes, axis, sign, options),
      outermostRankLines(group, nodes, axis, sign, options),
    ];

    const before = new Map<string, { x: number; y: number }>();
    for (const tree of group) {
      for (const rank of tree.ranks) {
        for (const id of rank ?? []) {
          const node = nodes.get(id);
          if (node) {
            before.set(id, { x: node.x, y: node.y });
          }
        }
      }
    }

    for (const lines of candidates) {
      applyRankLines(group, nodes, axis, sign, lines);
      if (!anyNodesOverlap(nodes)) {
        break;
      }
      for (const [id, position] of before) {
        const node = nodes.get(id);
        if (node) {
          node.x = position.x;
          node.y = position.y;
        }
      }
    }
  }
}

/** Depth of the deepest rank anywhere in the group. */
function deepestRank(group: RestoredTree[]): number {
  return Math.max(...group.map((tree) => tree.ranks.length - 1));
}

/**
 * The closest the shared rank lines can sit to the core: every root's own extent
 * plus one rank gap, then rank gaps sized by the largest node of each rank across
 * the whole group. Independent of where the trees currently are, so a tree that
 * was slid outwards is pulled back in.
 */
function tightRankLines(
  group: RestoredTree[],
  nodes: Map<string, HolaNode>,
  axis: Axis,
  sign: 1 | -1,
  options: HolaOptions
): number[] {
  const lines: number[] = [];
  const maxDepth = deepestRank(group);

  for (let depth = 1; depth <= maxDepth; depth++) {
    let line = Number.NEGATIVE_INFINITY;
    if (depth === 1) {
      // Clear of every root in the group, each measured against its own tree's
      // first rank: no tree may end up with its first rank on top of its root.
      for (const tree of group) {
        const root = nodes.get(tree.rootId);
        if (!root) {
          continue;
        }
        const ownFirstRank = halfExtentOfRank([tree], nodes, 1, axis);
        line = Math.max(
          line,
          sign * along(root, axis) + halfAlong(root, axis) + options.treeRankGap + ownFirstRank
        );
      }
    } else {
      line =
        lines[depth - 1] +
        halfExtentOfRank(group, nodes, depth - 1, axis) +
        options.treeRankGap +
        halfExtentOfRank(group, nodes, depth, axis);
    }
    lines[depth] = isFinite(line) ? line : (lines[depth - 1] ?? 0);
  }
  return lines;
}

/**
 * Shared rank lines at the outermost position any tree in the group already uses,
 * so no rank is dragged back towards the core. Always geometrically safe, at the
 * cost of giving every tree the largest gap in the group.
 */
function outermostRankLines(
  group: RestoredTree[],
  nodes: Map<string, HolaNode>,
  axis: Axis,
  sign: 1 | -1,
  options: HolaOptions
): number[] {
  const lines: number[] = [];
  const maxDepth = deepestRank(group);

  for (let depth = 1; depth <= maxDepth; depth++) {
    let line = Number.NEGATIVE_INFINITY;
    for (const tree of group) {
      for (const id of tree.ranks[depth] ?? []) {
        const node = nodes.get(id);
        if (node) {
          line = Math.max(line, sign * along(node, axis));
        }
      }
    }
    if (!isFinite(line)) {
      lines[depth] = lines[depth - 1] ?? 0;
      continue;
    }
    if (depth > 1) {
      // The largest node of either rank can belong to any tree in the group, so
      // the clearance has to be taken across the group, not per tree.
      line = Math.max(
        line,
        lines[depth - 1] +
          halfExtentOfRank(group, nodes, depth - 1, axis) +
          options.treeRankGap +
          halfExtentOfRank(group, nodes, depth, axis)
      );
    }
    lines[depth] = line;
  }
  return lines;
}

function applyRankLines(
  group: RestoredTree[],
  nodes: Map<string, HolaNode>,
  axis: Axis,
  sign: 1 | -1,
  lines: number[]
): void {
  for (const tree of group) {
    for (let depth = 1; depth < lines.length; depth++) {
      const target = sign * lines[depth];
      for (const id of tree.ranks[depth] ?? []) {
        const node = nodes.get(id);
        if (!node) {
          continue;
        }
        if (axis === 'x') {
          node.x = target;
        } else {
          node.y = target;
        }
      }
    }
  }
}

function halfAlong(node: HolaNode, axis: Axis): number {
  return (axis === 'x' ? node.width : node.height) / 2;
}

function along(node: HolaNode, axis: Axis): number {
  return axis === 'x' ? node.x : node.y;
}

function halfExtentOfRank(
  group: RestoredTree[],
  nodes: Map<string, HolaNode>,
  depth: number,
  axis: Axis
): number {
  let half = 0;
  for (const tree of group) {
    for (const id of tree.ranks[depth] ?? []) {
      const node = nodes.get(id);
      if (node) {
        half = Math.max(half, (axis === 'x' ? node.width : node.height) / 2);
      }
    }
  }
  return half;
}

/**
 * Do the trees occupy disjoint bands across their growth axis? Only then can they
 * share rank lines: trees that are stacked along the growth axis are at different
 * distances from the core on purpose, and pulling their ranks together would put
 * one inside the other.
 */
function sideBySideAcross(
  group: RestoredTree[],
  nodes: Map<string, HolaNode>,
  axis: Axis
): boolean {
  const bands = group.map((tree) => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const rank of tree.ranks) {
      for (const id of rank ?? []) {
        const node = nodes.get(id);
        if (!node) {
          continue;
        }
        const centre = axis === 'x' ? node.y : node.x;
        const half = (axis === 'x' ? node.height : node.width) / 2;
        min = Math.min(min, centre - half);
        max = Math.max(max, centre + half);
      }
    }
    return { min, max };
  });

  for (let i = 0; i < bands.length; i++) {
    for (let j = i + 1; j < bands.length; j++) {
      if (bands[i].min < bands[j].max && bands[j].min < bands[i].max) {
        return false;
      }
    }
  }
  return true;
}

function anyNodesOverlap(nodes: Map<string, HolaNode>): boolean {
  const sized = [...nodes.values()].filter((node) => node.width > 0 && node.height > 0);
  for (let i = 0; i < sized.length; i++) {
    for (let j = i + 1; j < sized.length; j++) {
      if (rectsOverlap(nodeBounds(sized[i]), nodeBounds(sized[j]))) {
        return true;
      }
    }
  }
  return false;
}
