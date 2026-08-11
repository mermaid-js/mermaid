import type { LayoutData, Node } from '../../types.js';
import { log } from '../../../logger.js';
import { ORTHO_DEBUG } from './debug.js';
import { rectForNode } from './core/helpers.js';
import { isEdgeLabelNodeId } from './core/labels.js';

export interface BoxNudgeResult {
  changed: boolean;
  moves: number;
  iterations: number;
  remainingOverlaps: number;
}

function isLeaf(n: Node): boolean {
  return Boolean(n) && !n.isGroup;
}

function overlapAmount(
  a: ReturnType<typeof rectForNode>,
  b: ReturnType<typeof rectForNode>
): { x: number; y: number } | null {
  const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  if (overlapX <= 0 || overlapY <= 0) {
    return null;
  }
  return { x: overlapX, y: overlapY };
}

function isAncestorGroup(ancestorId: string, node: Node, byId: Map<string, Node>): boolean {
  const seen = new Set<string>();
  let cur: Node | undefined = node;
  while ((cur as { parentId?: unknown } | undefined)?.parentId != null) {
    const parentId = String((cur as { parentId?: unknown }).parentId);
    if (seen.has(parentId)) {
      return false;
    }
    if (parentId === ancestorId) {
      return true;
    }
    seen.add(parentId);
    cur = byId.get(parentId);
  }
  return false;
}

/**
 * Step 4 safety net (prompt.md): when placement yields overlapping boxes,
 * minimally separate *leaf* nodes until overlaps are resolved or we hit an iteration limit.
 *
 * Conservative properties:
 * - only moves nodes (not edges) and only when gated by validator failure
 * - deterministic tie-breaking
 */
export function nudgeLeafNodesAwayFromNonAncestorGroups(
  layout: LayoutData,
  opts: { padding?: number; maxIterations?: number; preferAxis?: 'x' | 'y' } = {}
): BoxNudgeResult {
  const padding = opts.padding ?? 10;
  const maxIterations = opts.maxIterations ?? 50;
  const preferAxis = opts.preferAxis;

  const nodes = layout.nodes ?? [];
  const byId = new Map<string, Node>();
  for (const n of nodes) {
    if (n?.id != null) {
      byId.set(String(n.id), n);
    }
  }

  const groups = nodes
    .filter((n) => n?.id != null && n.isGroup)
    .map((n) => String(n.id))
    .sort((a, b) => a.localeCompare(b));
  const leaves = nodes
    .filter(
      (n) =>
        n?.id != null &&
        isLeaf(n) &&
        !(n as { isEdgeLabel?: boolean }).isEdgeLabel &&
        !isEdgeLabelNodeId(String(n.id))
    )
    .map((n) => String(n.id))
    .sort((a, b) => a.localeCompare(b));

  const computeRemaining = (): number => {
    let rem = 0;
    for (const groupId of groups) {
      const group = byId.get(groupId);
      if (!group) {
        continue;
      }
      const groupRect = rectForNode(group);
      for (const leafId of leaves) {
        const leaf = byId.get(leafId);
        if (!leaf || isAncestorGroup(groupId, leaf, byId)) {
          continue;
        }
        if (overlapAmount(groupRect, rectForNode(leaf))) {
          rem++;
        }
      }
    }
    return rem;
  };

  const before = new Map<string, { x: number; y: number }>();
  for (const id of leaves) {
    const n = byId.get(id);
    if (!n) {
      continue;
    }
    before.set(id, { x: Number((n as any).x ?? 0), y: Number((n as any).y ?? 0) });
  }

  let moves = 0;
  let iterations = 0;

  for (iterations = 0; iterations < maxIterations; iterations++) {
    let worst: {
      groupId: string;
      leafId: string;
      ov: { x: number; y: number };
      area: number;
    } | null = null;

    for (const groupId of groups) {
      const group = byId.get(groupId);
      if (!group) {
        continue;
      }
      const groupRect = rectForNode(group);
      for (const leafId of leaves) {
        const leaf = byId.get(leafId);
        if (!leaf || isAncestorGroup(groupId, leaf, byId)) {
          continue;
        }
        const ov = overlapAmount(groupRect, rectForNode(leaf));
        if (!ov) {
          continue;
        }
        const area = ov.x * ov.y;
        if (
          !worst ||
          area > worst.area ||
          (area === worst.area &&
            (groupId.localeCompare(worst.groupId) < 0 ||
              (groupId === worst.groupId && leafId.localeCompare(worst.leafId) < 0)))
        ) {
          worst = { groupId, leafId, ov, area };
        }
      }
    }

    if (!worst) {
      break;
    }

    const group = byId.get(worst.groupId)!;
    const leaf = byId.get(worst.leafId)!;
    const gx = Number((group as any).x ?? 0);
    const gy = Number((group as any).y ?? 0);
    const lx = Number((leaf as any).x ?? 0);
    const ly = Number((leaf as any).y ?? 0);
    const dx = worst.ov.x + padding;
    const dy = worst.ov.y + padding;

    const wantX = preferAxis === 'x';
    const wantY = preferAxis === 'y';
    const chooseX = (wantX && dx > 0) || (!wantY && dx <= dy);

    if (chooseX) {
      const direction = lx < gx ? -1 : 1;
      (leaf as any).x = lx + direction * dx;
    } else {
      const direction = ly < gy ? -1 : 1;
      (leaf as any).y = ly + direction * dy;
    }
    moves++;
  }

  const remaining = computeRemaining();
  const movedNodes: { id: string; dx: number; dy: number }[] = [];
  for (const id of leaves) {
    const n = byId.get(id);
    const b = before.get(id);
    if (!n || !b) {
      continue;
    }
    const x = Number((n as any).x ?? 0);
    const y = Number((n as any).y ?? 0);
    const dx = x - b.x;
    const dy = y - b.y;
    if (Math.abs(dx) > 1e-6 || Math.abs(dy) > 1e-6) {
      movedNodes.push({ id, dx, dy });
    }
  }
  const payload = {
    moves,
    iterations,
    remainingOverlaps: remaining,
    padding,
    preferAxis,
    movedNodes,
  };
  log.debug(ORTHO_DEBUG, 'GROUP_BOX_NUDGE', payload, JSON.stringify(payload));
  return { changed: moves > 0, moves, iterations, remainingOverlaps: remaining };
}

export function nudgeOverlappingLeafNodes(
  layout: LayoutData,
  opts: { padding?: number; maxIterations?: number; preferAxis?: 'x' | 'y' } = {}
): BoxNudgeResult {
  const padding = opts.padding ?? 10;
  const maxIterations = opts.maxIterations ?? 50;
  const preferAxis = opts.preferAxis;

  const nodes = layout.nodes ?? [];
  const leaves = nodes
    .filter((n) => n?.id != null && isLeaf(n))
    .map((n) => String(n.id))
    .sort((a, b) => a.localeCompare(b));

  const byId = new Map<string, Node>();
  for (const n of nodes) {
    if (n?.id != null) {
      byId.set(String(n.id), n);
    }
  }

  const computeRemaining = (): number => {
    let rem = 0;
    for (let i = 0; i < leaves.length; i++) {
      const a = byId.get(leaves[i]);
      if (!a) {
        continue;
      }
      const ra = rectForNode(a);
      for (let j = i + 1; j < leaves.length; j++) {
        const b = byId.get(leaves[j]);
        if (!b) {
          continue;
        }
        const ov = overlapAmount(ra, rectForNode(b));
        if (ov) {
          rem++;
        }
      }
    }
    return rem;
  };

  const before = new Map<string, { x: number; y: number }>();
  for (const id of leaves) {
    const n = byId.get(id);
    if (!n) {
      continue;
    }
    before.set(id, { x: Number((n as any).x ?? 0), y: Number((n as any).y ?? 0) });
  }

  let moves = 0;
  let iterations = 0;

  for (iterations = 0; iterations < maxIterations; iterations++) {
    let movedThisIter = 0;

    // Resolve overlaps by picking the worst overlapping pair and pushing them apart.
    let worst: { aId: string; bId: string; ov: { x: number; y: number }; area: number } | null =
      null;

    for (let i = 0; i < leaves.length; i++) {
      const aId = leaves[i];
      const a = byId.get(aId);
      if (!a) {
        continue;
      }
      const ra = rectForNode(a);
      for (let j = i + 1; j < leaves.length; j++) {
        const bId = leaves[j];
        const b = byId.get(bId);
        if (!b) {
          continue;
        }
        const ov = overlapAmount(ra, rectForNode(b));
        if (!ov) {
          continue;
        }
        const area = ov.x * ov.y;
        if (
          !worst ||
          area > worst.area ||
          (area === worst.area &&
            (aId.localeCompare(worst.aId) < 0 ||
              (aId === worst.aId && bId.localeCompare(worst.bId) < 0)))
        ) {
          worst = { aId, bId, ov, area };
        }
      }
    }

    if (!worst) {
      break;
    }

    const a = byId.get(worst.aId)!;
    const b = byId.get(worst.bId)!;
    const dx = worst.ov.x + padding;
    const dy = worst.ov.y + padding;

    const ax = Number((a as any).x ?? 0);
    const ay = Number((a as any).y ?? 0);
    const bx = Number((b as any).x ?? 0);
    const by = Number((b as any).y ?? 0);

    const wantX = preferAxis === 'x';
    const wantY = preferAxis === 'y';

    const chooseX = (wantX && dx > 0) || (!wantY && dx <= dy);
    if (chooseX) {
      // Separate along x (tie-break deterministic by id).
      const eps = 1e-6;
      const labelPair = isEdgeLabelNodeId(worst.aId) || isEdgeLabelNodeId(worst.bId);
      const pushA =
        labelPair && Math.abs(ax - bx) > eps
          ? ax < bx
            ? -1
            : 1
          : worst.aId.localeCompare(worst.bId) <= 0
            ? -1
            : 1;
      const pushB = -pushA;
      (a as any).x = ax + (pushA * dx) / 2;
      (b as any).x = bx + (pushB * dx) / 2;
    } else {
      // Separate along y.
      const eps = 1e-6;
      const labelPair = isEdgeLabelNodeId(worst.aId) || isEdgeLabelNodeId(worst.bId);
      const pushA =
        labelPair && Math.abs(ay - by) > eps
          ? ay < by
            ? -1
            : 1
          : worst.aId.localeCompare(worst.bId) <= 0
            ? -1
            : 1;
      const pushB = -pushA;
      (a as any).y = ay + (pushA * dy) / 2;
      (b as any).y = by + (pushB * dy) / 2;
    }

    moves++;
    movedThisIter++;

    if (movedThisIter === 0) {
      break;
    }
  }

  const remaining = computeRemaining();
  const movedNodes: { id: string; dx: number; dy: number }[] = [];
  for (const id of leaves) {
    const n = byId.get(id);
    const b = before.get(id);
    if (!n || !b) {
      continue;
    }
    const x = Number((n as any).x ?? 0);
    const y = Number((n as any).y ?? 0);
    const dx = x - b.x;
    const dy = y - b.y;
    if (Math.abs(dx) > 1e-6 || Math.abs(dy) > 1e-6) {
      movedNodes.push({ id, dx, dy });
    }
  }
  const payload = {
    moves,
    iterations,
    remainingOverlaps: remaining,
    padding,
    preferAxis,
    movedNodes,
  };
  // Always log so real executions can confirm it ran and whether it moved Y.
  log.debug(ORTHO_DEBUG, 'BOX_NUDGE', payload, JSON.stringify(payload));
  return { changed: moves > 0, moves, iterations, remainingOverlaps: remaining };
}
