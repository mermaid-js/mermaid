import type { LayoutData, Node } from '../../types.js';
import { log } from '../../../logger.js';
import { ORTHO_DEBUG } from './debug.js';
import { rectForNode } from './core/helpers.js';
import { isEdgeLabelNodeId } from './core/labels.js';
import { NODE_NODE_PADDING, isLabelDummy } from '../layout-utils/validateLayout.js';

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

/**
 * How much extra separation a pair needs on each axis for a `padding` gap.
 *
 * `min(right) - max(left)` is the overlap when positive and the negated gap when
 * negative, so `+ padding` covers both cases in one expression: an overlapping
 * pair needs `overlap + padding`, a pair sitting `g` apart needs `padding - g`,
 * and a pair already `padding` or more apart needs nothing. Returns `null` when
 * neither axis is deficient.
 *
 * A pair only counts as a violation when BOTH axes are deficient — clearing
 * either one leaves the boxes `padding` apart, which is the whole requirement.
 *
 * This is what makes `padding` mean a minimum gap rather than merely how far to
 * push boxes that already collide. `nudgeOverlappingLeafNodes` resolves the worst
 * pair per iteration, so its own pushes routinely park some *other* pair a hair
 * apart — measured on Company.mmd as 1.9px between `Tax` and `USCompany` despite
 * `padding: 10`. Those pairs no longer overlap, so the old overlap-only test
 * declared victory, and the drawing shipped with boxes visibly touching and no
 * room to route between them.
 */
function separationDeficit(
  a: ReturnType<typeof rectForNode>,
  b: ReturnType<typeof rectForNode>,
  padding: number,
  enforceGap: boolean
): { x: number; y: number } | null {
  const rawX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const rawY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  // Pairs this pass has not touched only have to stop OVERLAPPING. Applying the
  // gap requirement to every pair in the drawing turns a shrinking problem into a
  // spreading one — each widening creates new tight neighbours — and on
  // `domus/architecture` (60+ nodes) that cascade ran past a 120s budget.
  if (!enforceGap && (rawX <= 0 || rawY <= 0)) {
    return null;
  }
  const needX = rawX + padding;
  const needY = rawY + padding;
  if (needX <= 0 || needY <= 0) {
    return null;
  }
  return { x: needX, y: needY };
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

  // Nodes this pass has displaced. Only these (and their new neighbours) are held
  // to the `padding` gap — see `separationDeficit`.
  const movedIds = new Set<string>();

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
        const ov = separationDeficit(
          ra,
          rectForNode(b),
          padding,
          movedIds.has(leaves[i]) || movedIds.has(leaves[j])
        );
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
        const ov = separationDeficit(
          ra,
          rectForNode(b),
          padding,
          movedIds.has(aId) || movedIds.has(bId)
        );
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
    // `separationDeficit` already folded `padding` in.
    const dx = worst.ov.x;
    const dy = worst.ov.y;

    const ax = Number((a as any).x ?? 0);
    const ay = Number((a as any).y ?? 0);
    const bx = Number((b as any).x ?? 0);
    const by = Number((b as any).y ?? 0);

    const wantX = preferAxis === 'x';
    const wantY = preferAxis === 'y';

    const chooseX = (wantX && dx > 0) || (!wantY && dx <= dy);
    if (chooseX) {
      // Separate along x: each node moves AWAY from the other. Geometry decides
      // the direction; the id order is only a deterministic tie-break for the
      // degenerate case of identical centres, where neither direction is "away".
      //
      // This used to consult geometry for edge-label pairs ONLY and fall back to
      // alphabetical id order for everything else. When that order disagreed with
      // the actual arrangement, the pass pushed the pair THROUGH each other,
      // overlapping them worse, and iterating swapped their positions outright.
      const eps = 1e-6;
      const pushA =
        Math.abs(ax - bx) > eps
          ? ax < bx
            ? -1
            : 1
          : worst.aId.localeCompare(worst.bId) <= 0
            ? -1
            : 1;
      const pushB = -pushA;
      (a as any).x = ax + (pushA * dx) / 2;
      (b as any).x = bx + (pushB * dx) / 2;
      movedIds.add(worst.aId);
      movedIds.add(worst.bId);
    } else {
      // Separate along y — same rule as the x branch above: away from each other,
      // by geometry, with the id order only breaking exact ties.
      //
      // `edge-types` at `look=classic` is the case that exposed the old id-order
      // rule: `C` sits BELOW `M1` but sorts before it, so C was pushed up and M1
      // down, driving them through each other until they swapped. That put `M1`
      // under `C` in a `flowchart TD` — against both the flow direction and the
      // `D` shape label DOMUS had assigned — and left C's downward edges running
      // straight into M1.
      const eps = 1e-6;
      const pushA =
        Math.abs(ay - by) > eps
          ? ay < by
            ? -1
            : 1
          : worst.aId.localeCompare(worst.bId) <= 0
            ? -1
            : 1;
      const pushB = -pushA;
      (a as any).y = ay + (pushA * dy) / 2;
      (b as any).y = by + (pushB * dy) / 2;
      movedIds.add(worst.aId);
      movedIds.add(worst.bId);
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

/**
 * Convergent overlap removal, run once at the end of coordinate assignment.
 *
 * `nudgeOverlappingLeafNodes` picks the single worst overlapping pair and pushes
 * both halfway apart, repeatedly. That has no convergence guarantee: separating
 * A from B can drive either into C, which becomes the next worst pair and pushes
 * back. On `domus/architecture4` it made 400 moves across 400 iterations and
 * cleared 6 of 25 pairs — not slow progress, oscillation.
 *
 * This is a single-axis sweep. Sort by centre along one axis, walk in that order,
 * and push each node just clear of every earlier node it still overlaps. Nodes
 * only ever move forward and are visited in sorted order, so a pair separated at
 * step i cannot be re-overlapped at step j \> i: one pass removes every overlap,
 * with no iteration limit involved.
 *
 * Two rectangles overlap only if they overlap on BOTH axes, so separating on
 * either axis alone suffices; which one is purely aesthetic, so both are computed
 * and the smaller total displacement wins — the choice that disturbs DOMUS's
 * arrangement least.
 *
 * WHERE this runs matters as much as what it does. It belongs at the end of
 * coordinate assignment, before any edge is routed: routing then sees final,
 * non-overlapping geometry, and the repair passes downstream have nothing to
 * chase. Run instead as a post-pass after routing, it has to fight the Gx-class
 * snap (which pulls nodes back onto shared columns and silently undoes it) and
 * it re-opens every route it moves an endpoint of — measured at 2.5x the corpus
 * work budget for no score gain.
 */
export function separateOverlapsBySweep(
  layout: LayoutData,
  opts: { padding?: number; preferAxis?: 'x' | 'y'; maxExtentGrowth?: number } = {}
): BoxNudgeResult {
  const padding = opts.padding ?? 10;
  // Refuse to apply a sweep that inflates the drawing past this factor. A
  // forward-only sweep chains: each node is pushed clear of the earlier nodes it
  // overlaps, so a cluster of near-coincident boxes spreads by roughly the sum of
  // their widths. On a 60-node fixture that grew the extent enough that the
  // channels routing graph tried to allocate a grid from it and V8 died with
  // "invalid table size" — reproducibly, and still at --max-old-space-size=8192.
  // Overlap is a validity failure worth some displacement, but not any amount:
  // past this factor the layout is no longer the one DOMUS chose, and the caller
  // is better served by the overlaps than by an unbounded drawing.
  const maxExtentGrowth = opts.maxExtentGrowth ?? 1.5;
  const nodes = (layout.nodes ?? []).filter((n) => n?.id != null && isLeaf(n));
  if (nodes.length < 2) {
    return { changed: false, moves: 0, iterations: 0, remainingOverlaps: 0 };
  }

  let initial = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      if (a && b && overlapAmount(rectForNode(a), rectForNode(b))) {
        initial++;
      }
    }
  }
  if (initial === 0) {
    return { changed: false, moves: 0, iterations: 0, remainingOverlaps: 0 };
  }

  const origin = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    origin.set(String(n.id), { x: Number((n as any).x ?? 0), y: Number((n as any).y ?? 0) });
  }

  const sweep = (axis: 'x' | 'y'): { pos: Map<string, number>; displacement: number } => {
    const other = axis === 'x' ? 'y' : 'x';
    const halfOn = (n: Node) => Number((axis === 'x' ? n.width : n.height) ?? 0) / 2;
    const halfOff = (n: Node) => Number((other === 'x' ? n.width : n.height) ?? 0) / 2;

    const pos = new Map<string, number>();
    for (const n of nodes) {
      pos.set(String(n.id), origin.get(String(n.id))![axis]);
    }
    const order = [...nodes].sort((a, b) => {
      const d = origin.get(String(a.id))![axis] - origin.get(String(b.id))![axis];
      return d !== 0 ? d : String(a.id).localeCompare(String(b.id));
    });

    for (let i = 1; i < order.length; i++) {
      const cur = order[i];
      const curId = String(cur.id);
      const curOff = origin.get(curId)![other];
      let lowestAllowed = pos.get(curId)!;
      for (let j = 0; j < i; j++) {
        const prev = order[j];
        const prevId = String(prev.id);
        if (Math.abs(curOff - origin.get(prevId)![other]) >= halfOff(cur) + halfOff(prev)) {
          continue;
        }
        // Two REAL leaves that face each other owe the validator's
        // `node-node-padding` floor, not just the router's clearance — a sweep
        // that separates an overlap to 10 has traded a hard `node-overlap` for
        // a hard `node-node-padding` and the layout is invalid either way.
        // Label dummies keep the smaller padding (the validator exempts them).
        const pairPad =
          isLabelDummy(cur) || isLabelDummy(prev) ? padding : Math.max(padding, NODE_NODE_PADDING);
        const required = pos.get(prevId)! + halfOn(prev) + pairPad + halfOn(cur);
        if (required > lowestAllowed) {
          lowestAllowed = required;
        }
      }
      pos.set(curId, lowestAllowed);
    }

    let displacement = 0;
    for (const n of nodes) {
      displacement += Math.abs(pos.get(String(n.id))! - origin.get(String(n.id))![axis]);
    }
    return { pos, displacement };
  };

  const candidates: { axis: 'x' | 'y'; pos: Map<string, number>; displacement: number }[] = [];
  if (opts.preferAxis !== 'y') {
    candidates.push({ axis: 'x', ...sweep('x') });
  }
  if (opts.preferAxis !== 'x') {
    candidates.push({ axis: 'y', ...sweep('y') });
  }
  candidates.sort((a, b) => a.displacement - b.displacement || a.axis.localeCompare(b.axis));
  const chosen = candidates[0];

  // Extent guard. Measured on the sweep axis only — the other axis is untouched.
  const half = (n: Node) => Number((chosen.axis === 'x' ? n.width : n.height) ?? 0) / 2;
  let beforeLo = Infinity;
  let beforeHi = -Infinity;
  let afterLo = Infinity;
  let afterHi = -Infinity;
  for (const n of nodes) {
    const id = String(n.id);
    const h = half(n);
    beforeLo = Math.min(beforeLo, origin.get(id)![chosen.axis] - h);
    beforeHi = Math.max(beforeHi, origin.get(id)![chosen.axis] + h);
    afterLo = Math.min(afterLo, chosen.pos.get(id)! - h);
    afterHi = Math.max(afterHi, chosen.pos.get(id)! + h);
  }
  const beforeSpan = Math.max(1, beforeHi - beforeLo);
  const afterSpan = Math.max(1, afterHi - afterLo);
  if (afterSpan > beforeSpan * maxExtentGrowth) {
    log.debug(ORTHO_DEBUG, 'SWEEP_SEPARATE_SKIPPED', {
      axis: chosen.axis,
      beforeSpan: Math.round(beforeSpan),
      afterSpan: Math.round(afterSpan),
      growth: Number((afterSpan / beforeSpan).toFixed(2)),
      maxExtentGrowth,
      initialOverlaps: initial,
    });
    return { changed: false, moves: 0, iterations: 1, remainingOverlaps: initial };
  }

  let moves = 0;
  for (const n of nodes) {
    const id = String(n.id);
    const next = chosen.pos.get(id)!;
    if (Math.abs(next - origin.get(id)![chosen.axis]) > 1e-6) {
      (n as any)[chosen.axis] = next;
      moves++;
    }
  }

  let remaining = 0;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      if (a && b && overlapAmount(rectForNode(a), rectForNode(b))) {
        remaining++;
      }
    }
  }

  log.debug(ORTHO_DEBUG, 'SWEEP_SEPARATE', {
    axis: chosen.axis,
    displacement: Math.round(chosen.displacement),
    initialOverlaps: initial,
    moves,
    remainingOverlaps: remaining,
  });

  return { changed: moves > 0, moves, iterations: 1, remainingOverlaps: remaining };
}
