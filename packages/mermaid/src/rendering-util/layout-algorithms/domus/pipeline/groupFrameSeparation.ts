/**
 * Group-frame separation (winner-only validity repair).
 *
 * `validateLayout` flags `group-group-padding` (HARD) when two group frames
 * with no ancestry between them face each other across less than
 * GROUP_GROUP_PADDING — kissing frames read as one merged container
 * (mermaid-chart-architecture ships errlog~metricly 0.69px apart). No existing
 * pass can reach this: the leaf nudgers move leaves, never frames, and the
 * compound arrangement search decides group ORDER, not clearance.
 *
 * The repair translates one offender's entire subtree — the group node, every
 * descendant (nested frames included) and all wholly-internal edge geometry —
 * as a rigid unit away from the other frame, so nothing inside the group can
 * deform. Boundary edges (one endpoint inside) have their terminal point
 * dragged along, translating a perpendicular terminal segment so the route
 * stays orthogonal — the same treatment `nodeGroupSpacing`'s slide uses.
 *
 * Acceptance mirrors the other passes in the winner-only block: on a VALID
 * layout a candidate must strictly raise the unified score; on an INVALID one
 * (the score is clamped to 0, so a score gate is dead code) it must strictly
 * reduce the issue count without introducing any new issue key. The smaller
 * subtree moves first (cheapest disruption); if every rung fails, the other
 * side gets its turn.
 */
import { GROUP_GROUP_PADDING } from '../../layout-utils/validateLayout.js';
import type { LayoutData, Node } from '../../../types.js';
import { rectForNode } from '../core/helpers.js';
import { checkLayout } from '../validateLayoutProxy.js';
import { log } from '../../../../logger.js';

interface Point {
  x: number;
  y: number;
}

interface SeparationEdge {
  id?: string;
  start?: string;
  end?: string;
  points?: Point[];
  /** Overlay label center — rides with the polyline (see nodeGroupSpacing). */
  x?: number;
  y?: number;
  label?: unknown;
}

const EPS = 1e-6;
/** Escalation rungs past the exact deficit, in px. */
const EXTRA_RUNGS = [2, 6, 12];
/** A dragged terminal segment may shrink, but not below this stub length. */
const MIN_STUB = 6;

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

export function separateGroupFramesWhenIssuesImprove(
  layout: LayoutData,
  opts: { acceptWhenInvalid?: boolean } = {}
): void {
  let current = checkLayout(layout);
  const hasFlags = current.issues.some((i) => i.type === 'group-group-padding');
  log.debug(
    `GGSEP: enter ok=${current.ok} issues=${current.issues.length} flags=${current.issues.filter((i) => i.type === 'group-group-padding').length}`
  );
  if (!hasFlags) {
    return;
  }
  const acceptWhenInvalid = Boolean(opts.acceptWhenInvalid);

  const nodeById = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      nodeById.set(String(n.id), n);
    }
  }
  const edges = (layout.edges ?? []) as SeparationEdge[];

  const keyOf = (i: { type: string; edgeId?: string; nodeIds?: string[] }): string =>
    `${i.type}|${i.edgeId ?? ''}|${(i.nodeIds ?? []).join(',')}`;

  const subtreeOf = (groupId: string): Set<string> => {
    const ids = new Set<string>([groupId]);
    for (const n of layout.nodes ?? []) {
      if (n?.id != null && isDescendantOfGroup(n, groupId, nodeById)) {
        ids.add(String(n.id));
      }
    }
    return ids;
  };

  /** Rigidly translate `moveIds` (and their internal edge geometry) by `delta`
   * on `axis`; drag boundary-edge terminals so routes stay orthogonal. Commit
   * iff the acceptance gate passes; otherwise restore. Returns true on commit. */
  const tryTranslate = (moveIds: Set<string>, delta: number, axis: 'x' | 'y'): boolean => {
    const snapPos = new Map<string, { x: number; y: number }>();
    for (const id of moveIds) {
      const n = nodeById.get(id);
      if (n) {
        snapPos.set(id, { x: n.x ?? 0, y: n.y ?? 0 });
      }
    }
    const snapPts = edges.map((e) => e.points?.map((p) => ({ ...p })));
    const snapLabels = edges.map((e) => ({ x: e.x, y: e.y }));

    const moveLabel = (e: SeparationEdge, shift: number): void => {
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
        const adjIdx = idx === 0 ? 1 : pts.length - 2;
        const pAdj = pts[adjIdx];
        const parallel =
          axis === 'x' ? Math.abs(pN.y - pAdj.y) <= EPS : Math.abs(pN.x - pAdj.x) <= EPS;
        const coord = (p: Point): number => (axis === 'x' ? p.x : p.y);
        const setCoord = (p: Point, v: number): void => {
          if (axis === 'x') {
            p.x = v;
          } else {
            p.y = v;
          }
        };
        if (!parallel) {
          // Perpendicular terminal: translate the whole stub so it stays
          // orthogonal (the segment after pAdj runs on the motion axis and
          // absorbs the length change).
          setCoord(pN, coord(pN) + delta);
          setCoord(pAdj, coord(pAdj) + delta);
          continue;
        }
        // Parallel terminal: the port moves with the node and the segment
        // absorbs the shift — unless that would invert it or shrink it below
        // MIN_STUB, where the port would travel past its own first bend and
        // the route would dive through the node. Then the following
        // perpendicular rail (pAdj and its partner point) shifts along too,
        // and the segment AFTER the rail absorbs the change instead.
        const before = coord(pAdj) - coord(pN);
        const after = before - delta;
        const inverted = Math.sign(after) !== Math.sign(before) || Math.abs(after) < MIN_STUB;
        setCoord(pN, coord(pN) + delta);
        if (inverted) {
          const railPartnerIdx = idx === 0 ? 2 : pts.length - 3;
          setCoord(pAdj, coord(pAdj) + delta);
          if (railPartnerIdx >= 0 && railPartnerIdx < pts.length) {
            const partner = pts[railPartnerIdx];
            // Only a true perpendicular rail may shift (same motion-axis
            // coordinate as pAdj before the move); anything else would mint a
            // diagonal, which the gate would reject anyway.
            if (Math.abs(coord(partner) - (coord(pAdj) - delta)) <= EPS) {
              setCoord(partner, coord(partner) + delta);
            }
          }
        }
      }
    }

    const next = checkLayout(layout);
    let better: boolean;
    if (current.ok) {
      better = next.score > current.score;
    } else if (acceptWhenInvalid) {
      const beforeKeys = new Set(current.issues.map(keyOf));
      const fresh = next.issues.filter((i) => !beforeKeys.has(keyOf(i)));
      better = fresh.length === 0 && next.issues.length < current.issues.length;
      if (better) {
        log.debug(
          `GGSEP: commit axis=${axis} delta=${delta.toFixed(1)} move=${moveIds.size} issues ${current.issues.length}->${next.issues.length}`
        );
      }
    } else {
      better = false;
    }
    if (better) {
      current = next;
      return true;
    }
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
    return false;
  };

  // Re-read the flags each round: separating one pair can change another's gap.
  for (let round = 0; round < 6; round++) {
    const flags = current.issues
      .filter((i) => i.type === 'group-group-padding')
      .sort((a, b) => ((a.details?.gap as number) ?? 0) - ((b.details?.gap as number) ?? 0));
    if (flags.length === 0) {
      return;
    }
    let movedAny = false;
    for (const issue of flags) {
      const [aId, bId] = issue.nodeIds ?? [];
      const a = aId != null ? nodeById.get(aId) : undefined;
      const b = bId != null ? nodeById.get(bId) : undefined;
      if (!a || !b || aId == null || bId == null) {
        continue;
      }
      const ar = rectForNode(a);
      const br = rectForNode(b);
      const gap = (issue.details?.gap as number) ?? 0;
      const threshold = (issue.details?.threshold as number) ?? GROUP_GROUP_PADDING;
      const need = threshold - gap;

      // Facing axis: the axis whose projections do NOT overlap is the
      // separation axis (rectFacingGap's contract).
      const xOverlap = ar.left < br.right && br.left < ar.right;
      const yOverlap = ar.top < br.bottom && br.top < ar.bottom;
      let axis: 'x' | 'y';
      if (xOverlap && !yOverlap) {
        axis = 'y';
      } else if (yOverlap && !xOverlap) {
        axis = 'x';
      } else {
        continue;
      }

      // Smaller subtree moves first — cheapest disruption.
      const subA = subtreeOf(aId);
      const subB = subtreeOf(bId);
      const order: { ids: Set<string>; rect: typeof ar; other: typeof br }[] =
        subA.size <= subB.size
          ? [
              { ids: subA, rect: ar, other: br },
              { ids: subB, rect: br, other: ar },
            ]
          : [
              { ids: subB, rect: br, other: ar },
              { ids: subA, rect: ar, other: br },
            ];

      let committed = false;
      for (const mover of order) {
        // Away from the fixed frame.
        const moverBefore =
          axis === 'x'
            ? mover.rect.right <= mover.other.left
            : mover.rect.bottom <= mover.other.top;
        const sign = moverBefore ? -1 : 1;
        for (const extra of EXTRA_RUNGS) {
          if (tryTranslate(mover.ids, sign * (need + extra), axis)) {
            committed = true;
            break;
          }
        }
        if (committed) {
          break;
        }
      }
      if (committed) {
        movedAny = true;
        break; // flags are stale after a commit — re-read them
      }
    }
    if (!movedAny) {
      return;
    }
  }
}
