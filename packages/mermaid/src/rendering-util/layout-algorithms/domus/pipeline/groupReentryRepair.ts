/**
 * Repair for `edge-reenters-own-group` (hard since the 2026-08-26 validation
 * rules): a route with one endpoint inside a group must cross that group's
 * frame exactly once, but a mid-route rail that happens to fall inside the
 * frame's span adds a second interior run — the edge "leaves its own container
 * and comes back", which the validator rightly invalidates.
 *
 * The observed shape (architecture5-components, L_ALBs_Render_0) is a single
 * transit rail lying a few px inside the frame edge: the route passes through
 * the group on its way around it, then re-enters for the real approach. The
 * repair slides that rail just OUTSIDE the frame (nearest side first), keeping
 * every other point fixed — the two neighbouring perpendicular segments simply
 * lengthen or shorten.
 *
 * No local cleverness decides acceptance: each shift is applied and judged by
 * the full validator (this rule is only computed un-focused, so a focused
 * check cannot see it) — fewer issues and no new issue key, the standard
 * monotone contract for repairs on invalid layouts.
 */
import type { LayoutData, Node } from '../../../types.js';
import { checkLayout } from '../validateLayoutProxy.js';
import { rectForNode, segmentIntersectsRectInterior } from '../core/helpers.js';

interface Point {
  x: number;
  y: number;
}

type Rect = ReturnType<typeof rectForNode>;

/** Maximal runs of consecutive segments that cut the rect's interior. */
function interiorRuns(pts: Point[], rect: Rect): { from: number; to: number }[] {
  const runs: { from: number; to: number }[] = [];
  let open: { from: number; to: number } | null = null;
  for (let i = 0; i < pts.length - 1; i++) {
    if (segmentIntersectsRectInterior(pts[i], pts[i + 1], rect)) {
      if (open) {
        open.to = i;
      } else {
        open = { from: i, to: i };
        runs.push(open);
      }
    } else {
      open = null;
    }
  }
  return runs;
}

function issueKeys(issues: readonly { type: string; edgeId?: string; nodeIds?: string[] }[]) {
  return issues.map((i) => `${i.type}|${i.edgeId ?? ''}|${(i.nodeIds ?? []).join(',')}`);
}

export function repairGroupReentryWhenIssuesImprove(
  layout: LayoutData,
  opts: { spacing?: number } = {}
): void {
  const spacing = opts.spacing ?? 10;
  let current = checkLayout(layout);
  const offenders = current.issues.filter((i) => i.type === 'edge-reenters-own-group');
  if (offenders.length === 0) {
    return;
  }

  const byId = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      byId.set(String(n.id), n);
    }
  }
  const edgesById = new Map<string, { points?: Point[]; start?: string; end?: string }>();
  for (const e of (layout.edges ?? []) as { id?: string | number }[]) {
    if (e?.id != null) {
      edgesById.set(String(e.id), e as never);
    }
  }

  const isInGroup = (nodeId: string | undefined, gId: string): boolean => {
    let n = nodeId != null ? byId.get(nodeId) : undefined;
    while (n) {
      const parent = (n as { parentId?: string | number }).parentId;
      if (parent == null) {
        return false;
      }
      if (String(parent) === gId) {
        return true;
      }
      n = byId.get(String(parent));
    }
    return false;
  };

  for (const iss of offenders) {
    const edge = iss.edgeId != null ? edgesById.get(String(iss.edgeId)) : undefined;
    const gId = iss.nodeIds?.[0];
    const group = gId != null ? byId.get(String(gId)) : undefined;
    const pts = edge?.points;
    if (!edge || !group || !Array.isArray(pts) || pts.length < 4) {
      continue;
    }
    const rect = rectForNode(group);
    const runs = interiorRuns(pts, rect);
    if (runs.length < 2) {
      continue;
    }
    // The run that carries the inside endpoint is the legitimate crossing.
    const startInside = isInGroup(edge.start, String(gId));
    const anchored = startInside ? runs[0] : runs[runs.length - 1];

    for (const run of runs) {
      if (run === anchored) {
        continue;
      }
      // Only the single-segment transit rail is handled: one segment passing
      // through the frame, with a perpendicular neighbour on each side.
      if (run.from !== run.to || run.from === 0 || run.to >= pts.length - 2) {
        continue;
      }
      const i = run.from;
      const p = pts[i];
      const q = pts[i + 1];
      const vertical = Math.abs(p.x - q.x) < 1e-6;
      const coordinate = vertical ? p.x : p.y;
      const lo = vertical ? rect.left : rect.top;
      const hi = vertical ? rect.right : rect.bottom;
      const candidates = [hi + spacing, lo - spacing].sort(
        (a, b) => Math.abs(a - coordinate) - Math.abs(b - coordinate)
      );

      for (const target of candidates) {
        const oldP = { ...p };
        const oldQ = { ...q };
        if (vertical) {
          p.x = target;
          q.x = target;
        } else {
          p.y = target;
          q.y = target;
        }
        const next = checkLayout(layout);
        const beforeKeys = new Set(issueKeys(current.issues));
        const grewNewKey = issueKeys(next.issues).some((k) => !beforeKeys.has(k));
        const improved = next.issues.length < current.issues.length && !grewNewKey;
        if (improved) {
          current = next;
          break;
        }
        p.x = oldP.x;
        p.y = oldP.y;
        q.x = oldQ.x;
        q.y = oldQ.y;
      }
    }
  }
}
