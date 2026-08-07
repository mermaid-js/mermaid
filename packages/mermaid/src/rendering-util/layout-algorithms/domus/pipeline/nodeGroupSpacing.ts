/**
 * Score-gated node-vs-group spacing (finalize stage).
 *
 * `validateLayout` flags `node-too-close-to-group` (a graded soft penalty) when
 * a non-member leaf node faces a foreign subgraph frame across too small a gap
 * (e.g. subgraph-variation's P5 only 10px off the P1.5 frame). This pass repairs
 * it by sliding the offending node directly away from the frame until it clears
 * NODE_GROUP_CLEARANCE, carrying each incident edge endpoint along (and
 * translating a perpendicular terminal segment so it stays orthogonal).
 *
 * Two slide strategies are tried, cheapest first:
 *  1. Single-node — slide just the flagged node. Works when the node is free to
 *     move without deforming an incident straight edge.
 *  2. Rigid-column fallback — when (1) is rejected because the node is locked to
 *     axis-aligned neighbours by straight edges (e.g. deploy-pipeline's D/E/C
 *     column, connected by vertical edges: moving one node alone jogs those
 *     edges and the score gate rejects it), slide the whole aligned leaf group
 *     as a rigid unit so the internal edges keep their shape.
 *
 * Fully score-gated: every candidate slide is kept only when the unified
 * validator score strictly improves, so a move that would collide the node with
 * something or break one of its edges is rejected. Because (2) is only attempted
 * after (1) fails and is subject to the same gate, this pass can only ever raise
 * a fixture's score or leave it unchanged — never regress it. Nodes are spaced
 * worst-gap first.
 */
import type { LayoutData, Node } from '../../../types.js';
import { rectForNode } from '../core/helpers.js';
import { validateLayout } from '../validateLayoutProxy.js';

interface Point {
  x: number;
  y: number;
}

interface SpacingEdge {
  id?: string;
  start?: string;
  end?: string;
  points?: Point[];
  /** Overlay label center (finalizeOverlayLabels.ts) — must ride along with the
   * polyline or the label falls off the edge (`edge-label-off-edge`). */
  x?: number;
  y?: number;
  label?: unknown;
}

const EPS = 1e-6;
/** Two leaf centres within this on the motion axis count as aligned (a straight
 * edge between them would jog if only one endpoint moved). */
const ALIGN_EPS = 1.5;
/** Guard against a rigid set fanning out across the whole drawing. */
const MAX_RIGID_SET = 8;
/** Matches validateLayout's NODE_GROUP_CLEARANCE. */
const CLEARANCE = 20;

/** Walk the parentId chain to test group membership (skip the frame we space off). */
function isDescendantOfGroup(node: Node, groupId: string, byId: Map<string, Node>): boolean {
  const seen = new Set<string>();
  let cur: Node | undefined = node;
  while (cur?.parentId != null) {
    const pid = String(cur.parentId);
    if (seen.has(pid)) {
      return false;
    }
    if (pid === groupId) {
      return true;
    }
    seen.add(pid);
    cur = byId.get(pid);
  }
  return false;
}

export function spaceNodesOffGroupFramesWhenScoreImproves(layout: LayoutData): void {
  let current = validateLayout(layout);
  const flags = current.issues.filter((i) => i.type === 'node-too-close-to-group');
  if (flags.length === 0) {
    return;
  }

  const nodeById = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      nodeById.set(String(n.id), n);
    }
  }
  const edges = (layout.edges ?? []) as SpacingEdge[];

  /** Leaf neighbours joined to `seedId` by a chain of edges whose endpoints are
   * aligned on `axis` — the rigid set that must translate together to keep those
   * straight edges straight. Excludes members of `groupId` (never drag the frame's
   * own children) and caps its size as a runaway guard. */
  const buildRigidSet = (seedId: string, axis: 'x' | 'y', groupId: string): Set<string> => {
    const set = new Set<string>([seedId]);
    const queue = [seedId];
    while (queue.length > 0) {
      const u = queue.pop()!;
      const un = nodeById.get(u);
      if (!un) {
        continue;
      }
      const uc = axis === 'x' ? (un.x ?? 0) : (un.y ?? 0);
      for (const e of edges) {
        const s = e.start != null ? String(e.start) : '';
        const t = e.end != null ? String(e.end) : '';
        const other = s === u ? t : t === u ? s : '';
        if (!other || set.has(other)) {
          continue;
        }
        const on = nodeById.get(other);
        if (!on || (on as { isGroup?: boolean }).isGroup) {
          continue;
        }
        if (isDescendantOfGroup(on, groupId, nodeById)) {
          continue;
        }
        // Aligned on the motion axis ⇒ the u→other edge is perpendicular to the
        // slide and would jog unless `other` moves too.
        const oc = axis === 'x' ? (on.x ?? 0) : (on.y ?? 0);
        if (Math.abs(oc - uc) <= ALIGN_EPS) {
          set.add(other);
          if (set.size >= MAX_RIGID_SET) {
            return set;
          }
          queue.push(other);
        }
      }
    }
    return set;
  };

  /** Translate every node in `moveIds` by `delta` along `axis`, dragging edge
   * geometry (and overlay labels) so incident edges stay orthogonal, then score
   * the result. With `commit`, the move is kept iff the global score strictly
   * improves; otherwise (or when `commit` is false) everything is restored.
   * Returns the candidate's score either way, so callers can compare candidates
   * before committing. */
  const tryTranslate = (
    moveIds: Set<string>,
    delta: number,
    axis: 'x' | 'y',
    commit: boolean
  ): number => {
    const snapPos = new Map<string, { x: number; y: number }>();
    for (const id of moveIds) {
      const n = nodeById.get(id);
      if (n) {
        snapPos.set(id, { x: n.x ?? 0, y: n.y ?? 0 });
      }
    }
    const snapPts = edges.map((e) => e.points?.map((p) => ({ ...p })));
    const snapLabels = edges.map((e) => ({ x: e.x, y: e.y }));

    /** Ride the overlay label along by `shift` on the motion axis. */
    const moveLabel = (e: SpacingEdge, shift: number): void => {
      if (typeof e.label !== 'string' || e.label.length === 0) {
        return;
      }
      if (axis === 'x' && typeof e.x === 'number') {
        e.x += shift;
      } else if (axis === 'y' && typeof e.y === 'number') {
        e.y += shift;
      }
    };

    for (const id of moveIds) {
      const n = nodeById.get(id);
      if (!n) {
        continue;
      }
      if (axis === 'x') {
        (n as { x?: number }).x = (n.x ?? 0) + delta;
      } else {
        (n as { y?: number }).y = (n.y ?? 0) + delta;
      }
    }

    for (const e of edges) {
      const pts = e.points;
      if (!Array.isArray(pts) || pts.length < 2) {
        continue;
      }
      const sIn = e.start != null && moveIds.has(String(e.start));
      const eIn = e.end != null && moveIds.has(String(e.end));
      if (sIn && eIn) {
        // Internal edge — rigid translation keeps its shape; label rides fully.
        for (const p of pts) {
          if (axis === 'x') {
            p.x += delta;
          } else {
            p.y += delta;
          }
        }
        moveLabel(e, delta);
        continue;
      }
      if (!sIn && !eIn) {
        continue;
      }
      // One endpoint moves: the polyline midpoint shifts ~half; nudge the label
      // with it so it stays on the deformed edge.
      moveLabel(e, delta / 2);
      const idxs: number[] = [];
      if (sIn) {
        idxs.push(0);
      }
      if (eIn) {
        idxs.push(pts.length - 1);
      }
      for (const idx of idxs) {
        const pN = pts[idx];
        const pAdj = pts[idx === 0 ? 1 : pts.length - 2];
        // Parallel terminal segment just lengthens; a perpendicular one must
        // translate (shift its far end too) to stay orthogonal.
        const parallel =
          axis === 'x' ? Math.abs(pN.y - pAdj.y) <= EPS : Math.abs(pN.x - pAdj.x) <= EPS;
        if (axis === 'x') {
          pN.x += delta;
          if (!parallel) {
            pAdj.x += delta;
          }
        } else {
          pN.y += delta;
          if (!parallel) {
            pAdj.y += delta;
          }
        }
      }
    }

    const next = validateLayout(layout);
    if (commit && next.score > current.score) {
      current = next;
      return next.score;
    }
    // Restore.
    for (const [id, pos] of snapPos) {
      const n = nodeById.get(id);
      if (n) {
        (n as { x?: number }).x = pos.x;
        (n as { y?: number }).y = pos.y;
      }
    }
    edges.forEach((e, i) => {
      if (snapPts[i]) {
        e.points = snapPts[i];
      }
      e.x = snapLabels[i].x;
      e.y = snapLabels[i].y;
    });
    return next.score;
  };

  // Worst (smallest gap) first.
  const sorted = [...flags].sort(
    (a, b) => ((a.details?.gap as number) ?? 0) - ((b.details?.gap as number) ?? 0)
  );

  for (const issue of sorted) {
    const [nId, gId] = issue.nodeIds ?? [];
    const node = nId != null ? nodeById.get(nId) : undefined;
    const group = gId != null ? nodeById.get(gId) : undefined;
    if (!node || !group || nId == null || gId == null) {
      continue;
    }
    const nr = rectForNode(node);
    const gr = rectForNode(group);
    const gap = (issue.details?.gap as number) ?? 0;

    // Slide along the separation axis, away from the group.
    const xOverlap = nr.left < gr.right && gr.left < nr.right;
    const yOverlap = nr.top < gr.bottom && gr.top < nr.bottom;
    let axis: 'x' | 'y';
    let sign: number;
    if (xOverlap && !yOverlap) {
      axis = 'y';
      sign = nr.bottom <= gr.top ? -1 : 1;
    } else if (yOverlap && !xOverlap) {
      axis = 'x';
      sign = nr.right <= gr.left ? -1 : 1;
    } else {
      continue;
    }

    const need = CLEARANCE - gap;

    // Two move shapes: single-node (frees a node not tied to neighbours) and a
    // rigid co-move of the node's axis-aligned straight-edge column (frees a
    // node whose vertical/horizontal edges would jog if it moved alone, e.g.
    // deploy-pipeline's D/E/C). The rigid move can clear several crowded nodes
    // in the column at once. Probe every candidate without committing, then
    // commit the single highest-scoring one that beats the current score.
    const rigid = buildRigidSet(nId, axis, gId);
    const candidates: { ids: Set<string>; delta: number }[] = [];
    for (const extra of [2, 6, 12]) {
      const delta = sign * (need + extra);
      if (rigid.size >= 2) {
        candidates.push({ ids: rigid, delta });
      }
      candidates.push({ ids: new Set([nId]), delta });
    }

    let best: { ids: Set<string>; delta: number } | null = null;
    let bestScore = current.score;
    for (const c of candidates) {
      const s = tryTranslate(c.ids, c.delta, axis, false);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }
    if (best) {
      tryTranslate(best.ids, best.delta, axis, true);
    }
  }
}
