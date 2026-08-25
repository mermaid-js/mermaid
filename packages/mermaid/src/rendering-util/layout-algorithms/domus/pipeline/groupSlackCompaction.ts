/**
 * Pull a group's members together along an axis the group is slack on.
 *
 * A group frame is not placed — it is *derived*, recomputed from wherever its
 * descendants happened to land. Nothing in placement resists stretching it, so
 * two members pulled apart by their own outside edges drag the frame out behind
 * them and leave the middle empty.
 *
 * `domus/events` is the case. `Deck` holds exactly two members, `Knob` and the
 * `Console` subgroup, and there is NO edge between them — they are siblings and
 * nothing more. `Knob` is pulled up towards `handlePointerTap`, `Console` down
 * towards `consoleManager`, and the frame stretches to 391 by 1277 to cover
 * both, with 738px of nothing in between: 58 percent of its height. Every other
 * node in that band sits clear of Deck's x-span, so the gap holds nothing.
 *
 * Paper background, with an honest note. The corpus does NOT contain this pass:
 * across all 39 papers, no source compacts a cluster frame to fit its contents.
 * Siebenhaller makes cluster frames deliberately RIGID rectangles and aligns
 * their borders to a single compaction-graph vertex — the frame is a shape
 * constraint there, never something that shrinks. The one source that shrinks a
 * frame at all is Dwyer, Marriott and Wybrow, and not by compaction: a stress
 * term pulls the boundary toward an ideal perimeter.
 *
 * What the corpus does supply is why this is tractable. Eiglsperger and
 * Kaufmann's prescribed-size compaction needs a PAIRED plus-height/minus-height
 * edge to pin a sized vertex to exactly its extent, which puts negative edges
 * and cycles into the constraint graph and is precisely why longest paths stop
 * working there. A frame has no such requirement: it wants only "at least large
 * enough to contain the children", a plain difference constraint with no
 * negative edge and no cycle. A frame is an EASIER object than a sized vertex,
 * and can be compacted greedily per axis.
 *
 * Two invariants are enforced, both corpus-backed. Containment: Dwyer et al.
 * require that the nodes inside a cluster's region are exactly the nodes in
 * that cluster. Separation: every compaction formulation in the corpus is an
 * optimum *subject to* separation constraints, and none relaxes them — so a
 * move stops `minGap` short of the first thing it would meet, measured against
 * every node in the drawing rather than only siblings.
 *
 * Compaction is not free, and the caller must treat it as a candidate rather
 * than a step. It spends routing freedom to buy density — Freivalds and
 * Glagolevs keep their slack coefficient above 1 during search for exactly that
 * reason, decaying it only at the end, "to give additional freedom for node
 * movement". Applied unconditionally it costs more than it earns.
 */
import type { LayoutData, Node } from '../../../types.js';

export interface GroupCompactionResult {
  /** Groups whose members were pulled together. */
  groups: number;
  /** Nodes translated (members plus their descendants). */
  moved: number;
  /** Slack removed, in pixels, summed over accepted moves. */
  reclaimed: number;
  changed: boolean;
}

const NO_CHANGE: GroupCompactionResult = { groups: 0, moved: 0, reclaimed: 0, changed: false };

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

type Axis = 'x' | 'y';

function boxOf(node: Node): Box {
  const cx = Number((node as { x?: number }).x ?? 0);
  const cy = Number((node as { y?: number }).y ?? 0);
  const hw = Number(node.width ?? 0) / 2;
  const hh = Number(node.height ?? 0) / 2;
  return { x0: cx - hw, y0: cy - hh, x1: cx + hw, y1: cy + hh };
}

function unionBox(a: Box, b: Box): Box {
  return {
    x0: Math.min(a.x0, b.x0),
    y0: Math.min(a.y0, b.y0),
    x1: Math.max(a.x1, b.x1),
    y1: Math.max(a.y1, b.y1),
  };
}

/** True when the boxes overlap on the axis perpendicular to `axis`. */
function overlapsPerp(a: Box, b: Box, axis: Axis): boolean {
  return axis === 'y' ? a.x0 < b.x1 && b.x0 < a.x1 : a.y0 < b.y1 && b.y0 < a.y1;
}

function boxesIntersect(a: Box, b: Box): boolean {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

function isPlaced(node: Node | undefined): boolean {
  return (
    node?.id != null &&
    Number.isFinite(Number((node as { x?: unknown }).x)) &&
    Number.isFinite(Number((node as { y?: unknown }).y)) &&
    Number.isFinite(Number(node.width)) &&
    Number.isFinite(Number(node.height))
  );
}

/**
 * How many (group, foreign node) pairs sit closer than `clearance`.
 *
 * The checker flags a node that merely HUGS a frame it does not belong to, not
 * only one that overlaps it, so overlap alone is not the test. Counted rather
 * than asserted: a layout that already crowds a frame somewhere would make an
 * absolute test unsatisfiable, every move would fail, and the pass would
 * silently do nothing. Comparing counts judges a move on what IT changes.
 */
function countFrameCrowding(
  placed: Node[],
  isDescendantOf: (nodeId: string, ancestorId: string) => boolean,
  clearance: number
): number {
  let count = 0;
  for (const group of placed) {
    if (!group.isGroup) {
      continue;
    }
    const gb = boxOf(group);
    const inflated = {
      x0: gb.x0 - clearance,
      y0: gb.y0 - clearance,
      x1: gb.x1 + clearance,
      y1: gb.y1 + clearance,
    };
    for (const node of placed) {
      if (node.isGroup || isDescendantOf(String(node.id), String(group.id))) {
        continue;
      }
      if (boxesIntersect(boxOf(node), inflated)) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Compact each group's members toward the group's leading edge on whichever
 * axis carries slack. Mutates node positions in place.
 */
export function compactGroupSlack(
  layout: LayoutData,
  opts: { minGap?: number } = {}
): GroupCompactionResult {
  const minGap = Math.max(1, opts.minGap ?? 20);
  const placed = (layout.nodes ?? []).filter((n) => isPlaced(n));
  if (placed.length < 2) {
    return NO_CHANGE;
  }

  const byId = new Map<string, Node>();
  for (const n of placed) {
    byId.set(String(n.id), n);
  }

  const childrenOf = new Map<string, Node[]>();
  for (const n of placed) {
    const parent = (n as { parentId?: string }).parentId;
    if (parent == null || !byId.has(parent)) {
      continue;
    }
    const list = childrenOf.get(parent);
    if (list) {
      list.push(n);
    } else {
      childrenOf.set(parent, [n]);
    }
  }

  const groups = placed.filter((n) => n.isGroup && (childrenOf.get(String(n.id))?.length ?? 0) > 0);
  if (groups.length === 0) {
    return NO_CHANGE;
  }

  const isDescendantOf = (nodeId: string, ancestorId: string): boolean => {
    let cur = (byId.get(nodeId) as { parentId?: string } | undefined)?.parentId;
    while (cur != null) {
      if (cur === ancestorId) {
        return true;
      }
      cur = (byId.get(cur) as { parentId?: string } | undefined)?.parentId;
    }
    return false;
  };

  const depthOf = (node: Node): number => {
    let d = 0;
    let cur = (node as { parentId?: string }).parentId;
    while (cur != null && byId.has(cur)) {
      d++;
      cur = (byId.get(cur) as { parentId?: string } | undefined)?.parentId;
    }
    return d;
  };

  /** A member plus every node beneath it: what has to move together. */
  const subtreeOf = (root: Node): Node[] => {
    const out: Node[] = [root];
    const stack = [String(root.id)];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      for (const kid of childrenOf.get(cur) ?? []) {
        out.push(kid);
        stack.push(String(kid.id));
      }
    }
    return out;
  };

  // A group's box is derived and, at this point, stale — it still describes
  // where its members used to be. Each group's current padding is measured once
  // per side from the gap between its box and its members' bbox, which
  // self-calibrates: the compound path pads more than the flat one, the top side
  // carries the group label, and none of that has to be known here.
  const framePad = new Map<string, { l: number; r: number; t: number; b: number }>();
  for (const g of groups) {
    const kids = childrenOf.get(String(g.id)) ?? [];
    let kb = boxOf(kids[0]);
    for (const k of kids) {
      kb = unionBox(kb, boxOf(k));
    }
    const gb = boxOf(g);
    framePad.set(String(g.id), {
      l: Math.max(0, kb.x0 - gb.x0),
      r: Math.max(0, gb.x1 - kb.x1),
      t: Math.max(0, kb.y0 - gb.y0),
      b: Math.max(0, gb.y1 - kb.y1),
    });
  }

  const deepestFirst = [...groups].sort((a, b) => depthOf(b) - depthOf(a));

  /** Rebuild every frame around its members, deepest first. */
  const refreshFrames = (): void => {
    for (const g of deepestFirst) {
      const kids = childrenOf.get(String(g.id)) ?? [];
      const pad = framePad.get(String(g.id));
      if (kids.length === 0 || !pad) {
        continue;
      }
      let kb = boxOf(kids[0]);
      for (const k of kids) {
        kb = unionBox(kb, boxOf(k));
      }
      const gg = g as { x: number; y: number; width: number; height: number };
      gg.width = kb.x1 - kb.x0 + pad.l + pad.r;
      gg.height = kb.y1 - kb.y0 + pad.t + pad.b;
      gg.x = kb.x0 - pad.l + gg.width / 2;
      gg.y = kb.y0 - pad.t + gg.height / 2;
    }
  };

  // Cheap pre-scan before any of the expensive machinery below.
  //
  // The move loop is O(moves x groups x nodes) once `countFrameCrowding` and
  // `refreshFrames` run per trial, and it was charging that to EVERY diagram in
  // the corpus while only a handful have a void worth closing — measured at
  // 135% of the routing-work ceiling, almost none of it the re-route the caller
  // pays for separately. A group can only be compacted if two of its members
  // are further apart than the minimum gap on some axis, and that is answerable
  // in O(groups x members).
  let worthTrying = false;
  for (const g of groups) {
    const members = childrenOf.get(String(g.id)) ?? [];
    if (members.length < 2) {
      continue;
    }
    for (const axis of ['y', 'x'] as Axis[]) {
      const lo = axis === 'y' ? 'y0' : 'x0';
      const hi = axis === 'y' ? 'y1' : 'x1';
      const spans = members.map((m) => boxOf(m)).sort((a, b) => a[lo] - b[lo]);
      let reach = spans[0][hi];
      for (let i = 1; i < spans.length; i++) {
        if (spans[i][lo] - reach > minGap) {
          worthTrying = true;
          break;
        }
        reach = Math.max(reach, spans[i][hi]);
      }
      if (worthTrying) {
        break;
      }
    }
    if (worthTrying) {
      break;
    }
  }
  if (!worthTrying) {
    return NO_CHANGE;
  }

  refreshFrames();
  let crowding = countFrameCrowding(placed, isDescendantOf, minGap);

  let movedNodes = 0;
  let reclaimed = 0;
  let touchedGroups = 0;

  // Deepest groups first: a nested group must be tight before its parent tries
  // to slide it, or the parent moves a body that is itself still slack.
  for (const group of deepestFirst) {
    const members = childrenOf.get(String(group.id)) ?? [];
    if (members.length < 2) {
      continue;
    }
    let groupChanged = false;

    for (const axis of ['y', 'x'] as Axis[]) {
      const lo = axis === 'y' ? 'y0' : 'x0';
      const hi = axis === 'y' ? 'y1' : 'x1';

      const order = [...members].sort((a, b) => boxOf(a)[lo] - boxOf(b)[lo]);
      const leadingEdge = boxOf(order[0])[lo];

      for (let i = 1; i < order.length; i++) {
        const body = subtreeOf(order[i]);
        const bodyIds = new Set(body.map((n) => String(n.id)));
        let bodyBox = boxOf(body[0]);
        for (const n of body) {
          bodyBox = unionBox(bodyBox, boxOf(n));
        }

        // The group's own leading edge is the floor: pulling a member past the
        // first one would grow the frame at the other end, not shrink it.
        //
        // That floor is the load-bearing part. When a member is clear of its
        // siblings on the perpendicular axis NOTHING blocks it, and an
        // obstacle-only limit would leave it exactly where it was — which is
        // the `domus/events` case, where `Console` and `Knob` never meet in x
        // and the 738px between them survived purely because no blocker existed
        // to pull against.
        let limit = leadingEdge;
        for (const other of placed) {
          const oid = String(other.id);
          if (bodyIds.has(oid) || oid === String(group.id) || other.isGroup) {
            continue;
          }
          const ob = boxOf(other);
          if (!overlapsPerp(bodyBox, ob, axis)) {
            continue;
          }
          if (ob[hi] <= bodyBox[lo]) {
            limit = Math.max(limit, ob[hi] + minGap);
          }
        }

        const delta = limit - bodyBox[lo];
        if (delta >= -1) {
          continue;
        }

        const previous = new Map<string, { x: number; y: number }>();
        for (const n of body) {
          const nn = n as { x: number; y: number };
          previous.set(String(n.id), { x: nn.x, y: nn.y });
          if (axis === 'y') {
            nn.y += delta;
          } else {
            nn.x += delta;
          }
        }
        refreshFrames();

        let ok = true;
        for (const n of body) {
          if (n.isGroup) {
            continue;
          }
          const nb = boxOf(n);
          for (const other of placed) {
            if (bodyIds.has(String(other.id)) || other.isGroup) {
              continue;
            }
            if (boxesIntersect(nb, boxOf(other))) {
              ok = false;
              break;
            }
          }
          if (!ok) {
            break;
          }
        }

        const crowdingAfter = ok
          ? countFrameCrowding(placed, isDescendantOf, minGap)
          : Number.POSITIVE_INFINITY;
        if (!ok || crowdingAfter > crowding) {
          for (const n of body) {
            const prev = previous.get(String(n.id))!;
            (n as { x: number }).x = prev.x;
            (n as { y: number }).y = prev.y;
          }
          refreshFrames();
          continue;
        }

        crowding = crowdingAfter;
        movedNodes += body.length;
        reclaimed += -delta;
        groupChanged = true;
      }
    }

    if (groupChanged) {
      touchedGroups++;
    }
  }

  return { groups: touchedGroups, moved: movedNodes, reclaimed, changed: movedNodes > 0 };
}
