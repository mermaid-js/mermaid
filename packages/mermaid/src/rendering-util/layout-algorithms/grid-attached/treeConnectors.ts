/**
 * Tree edges, routed from the finished positions (guide §15.2).
 *
 * HOLA hands a placed tree's connectors to its orthogonal router. There is no
 * router here — the core is drawn with straight centre-to-centre lines and is not
 * this layout's to re-route — so every tree edge is re-derived from the final node
 * positions with HOLA's own rank connector, `routeRankEdgeTowards`.
 *
 * Re-deriving rather than rotating the routes the tree layout produced is not an
 * optimisation, it is what makes the endpoints land on the node boundaries: a point
 * half a *height* below a node's centre is half a height to its *side* after a
 * quarter turn, which is off the boundary unless the node is square.
 *
 * On its own that leaves three ways for two connectors to be drawn as one line, and
 * all three show up in real diagrams:
 *
 *   - **one parent, several children.** Every connector would leave through the
 *     same point and turn at the same place, so a fan of eight arrives as one thick
 *     stem and one thick bar. The ports are spread along the parent's side with
 *     HOLA's own `spreadPorts`, and the turns are nested into a *comb* — each
 *     connector turning at its own level inside the rank gap. `combLevels` explains
 *     why the nesting order is the one that keeps the comb crossing-free.
 *   - **one node, several trees.** Leaf peeling can hang three separate trees off
 *     one core node, and each is placed on its own, so nothing would stop their
 *     three connectors leaving through the same point. The fan is therefore keyed on
 *     the *node and side*, not on the tree: every connector leaving one side of one
 *     node is spread with all the others, whichever tree it belongs to.
 *   - **two independent runs on one line.** Two fans elsewhere in the drawing can
 *     still put a run on the same coordinate — nothing connects them. So the comb
 *     level is a *preference*, and a run that would land on an occupied line takes
 *     the next free level of its own fan instead. Nesting is worth a lot, but two
 *     edges drawn as one line is worth less than a crossing.
 *
 * All of which is why routing is a single pass over a whole component rather than
 * per tree: the collisions are between trees, so no per-tree pass can see them.
 *
 * One more thing decides where a connector meets a node. The layout works in
 * rectangles, but a diamond or a circle does not reach the corners of its own
 * bounding box, so a port placed out along a bounding-box side lands in the empty
 * gap between the box and the shape and the connector appears to start in mid-air.
 * HOLA already solves this for its router — `silhouetteBand` says how much of a side
 * a shape can actually accept, `silhouettePort` moves the port inwards along the
 * approach axis onto the boundary — and both are used here for the same reason. The
 * port only ever moves along that axis, so the terminal leg stays orthogonal; it
 * just starts on the shape instead of on its box.
 */

import type { Point } from '../../../types.js';
import type { Cardinal, HolaGraph, Rect, Side, Silhouette } from '../hola-faithful/model.js';
import { oppositeSide, sideOfCardinal } from '../hola-faithful/model.js';
import { silhouetteBand, silhouettePort } from '../hola-faithful/adapter/silhouette.js';
import { spreadPorts } from '../hola-faithful/routing/finalRouting.js';
import { routeRankEdgeTowards, rootTree } from '../hola-faithful/trees/symmetricTreeLayout.js';
import type { TreeLayout } from '../hola-faithful/trees/symmetricTreeLayout.js';
import type { DecomposedTree } from '../hola-faithful/decomposition/peelCoreAndTrees.js';
import { findTopologicalEdge } from '../hola-faithful/decomposition/peelCoreAndTrees.js';
import type { GridAttachedOptions } from './options.js';

/** A node rectangle, plus the outline of its shape when it is not a rectangle. */
export interface ShapedRect extends Rect {
  silhouette?: Silhouette;
}

export interface TreeConnector {
  /** The original Mermaid edge this route belongs to. */
  originalEdgeId: string;
  /** Node the route leaves — the core node itself for a first-rank connector. */
  parentId: string;
  childId: string;
  /** True for a connector between the core node and the tree's first rank. */
  fromRoot: boolean;
  points: Point[];
}

/** One placed tree, ready to have its edges routed. */
export interface TreeRouteRequest {
  tree: DecomposedTree;
  /** The tree at its final position, root copy included. */
  transformed: TreeLayout;
  /**
   * Rectangle standing in for the tree's copied root. The copy *is* the core node,
   * so the first rank's connectors start on the core node's own boundary. For a
   * cardinal placement the copy sits exactly on it and the two are the same
   * rectangle; for a corner placement the copy sits beside it and only the core
   * node's boundary is a legitimate place for an arrow to start.
   */
  rootRect: ShapedRect;
  growth: Cardinal;
  /** The gap this tree was drawn with; its fans' combs have to fit inside it. */
  rankGap: number;
}

/** Smallest usable margin from a side's corners; a fan never reaches them. */
const FAN_PORT_MARGIN = 8;

const EPSILON = 1e-9;
/** Two runs closer than this on the same line read as one line. */
const SAME_LINE = 2;

/**
 * Route every tree edge of one connected component.
 *
 * Whole-component rather than per-tree on purpose: two of the three ways two
 * connectors end up drawn as one line are collisions *between* trees, which a
 * per-tree pass cannot see.
 */
export function routeComponentTrees(
  requests: TreeRouteRequest[],
  options: GridAttachedOptions,
  /**
   * Offsets along `nodeId|side` already taken by edges this layout may not move —
   * the core's own. A tree hanging off a core node has to attach beside them.
   */
  reserved = new Map<string, number[]>()
): TreeConnector[] {
  const legs = requests.flatMap((request) => collectLegs(request));
  if (legs.length === 0) {
    return [];
  }

  assignPorts(legs, reserved, options);
  for (const leg of legs) {
    leg.points = routeRankEdgeTowards(
      portedRect(leg.parent, leg.parentPort, leg.growth),
      portedRect(leg.child, leg.childPort, leg.growth),
      leg.growth,
      leg.rankGap
    );
  }
  assignTurns(legs, options);
  // Last, so the comb above reasoned about the bounding-box spans every leg shares.
  // Moving a terminal onto its shape only lengthens the leg it is on: it slides
  // *inwards* along the approach axis, away from the bend, never past it.
  for (const leg of legs) {
    insetTerminals(leg);
  }

  return legs.map((leg) => ({
    originalEdgeId: leg.originalEdgeId,
    parentId: leg.parentId,
    childId: leg.childId,
    fromRoot: leg.fromRoot,
    points: leg.points,
  }));
}

/**
 * One tree's edges, with no cross-tree coordination. Used while a placement is
 * still being evaluated, where the other trees' final geometry is not known yet;
 * the ports it produces differ from the committed ones only by the width of a
 * node's side, which is far below what the corridor check is looking for.
 */
export function routeTreeEdges(
  tree: DecomposedTree,
  transformed: TreeLayout,
  rootRect: Rect,
  growth: Cardinal,
  options: GridAttachedOptions,
  rankGap: number,
  reserved?: Map<string, number[]>
): TreeConnector[] {
  return routeComponentTrees([{ tree, transformed, rootRect, growth, rankGap }], options, reserved);
}

// ---------------------------------------------------------------------------
// Legs
// ---------------------------------------------------------------------------

/** One original Mermaid edge, as a parent-to-child connector to be routed. */
interface Leg {
  originalEdgeId: string;
  parentId: string;
  childId: string;
  fromRoot: boolean;
  parent: ShapedRect;
  child: ShapedRect;
  growth: Cardinal;
  rankGap: number;
  /** Which fan this leg belongs to: one parent, one side. */
  fan: string;
  /** Across-coordinate the route leaves the parent / enters the child at. */
  parentPort: number;
  childPort: number;
  points: Point[];
}

function collectLegs(request: TreeRouteRequest): Leg[] {
  const { tree, transformed, rootRect, growth, rankGap } = request;
  const rooted = rootTree(tree.graph, tree.rootCopyId);
  const rectOf = (id: string): ShapedRect | undefined => {
    if (id === tree.rootCopyId) {
      return rootRect;
    }
    const node = transformed.nodes.get(id);
    if (!node) {
      return undefined;
    }
    return {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      // The tree layout works in plain rectangles; the shape's outline comes from
      // the node the adapter measured.
      silhouette: tree.graph.nodes.get(id)?.silhouette,
    };
  };

  const legs: Leg[] = [];
  for (const [rawParentId, childIds] of rooted.children) {
    const parent = rectOf(rawParentId);
    if (!parent || childIds.length === 0) {
      continue;
    }
    const fromRoot = rawParentId === tree.rootCopyId;
    const parentId = fromRoot ? tree.coreNodeId : rawParentId;

    for (const childId of childIds) {
      const child = rectOf(childId);
      if (!child) {
        continue;
      }
      // A bundle of parallel edges between the same pair becomes several legs, so
      // each gets its own port at both ends instead of being drawn once on top of
      // itself.
      const topological = findTopologicalEdge(tree.graph, rawParentId, childId);
      const originalEdgeIds =
        topological && topological.originalEdgeIds.length > 0
          ? topological.originalEdgeIds
          : [`${parentId}-${childId}`];

      for (const originalEdgeId of originalEdgeIds) {
        legs.push({
          originalEdgeId,
          parentId,
          childId,
          fromRoot,
          parent,
          child,
          growth,
          rankGap,
          fan: `${parentId}|${growth}`,
          parentPort: across(parent, growth),
          childPort: across(child, growth),
          points: [],
        });
      }
    }
  }

  return legs;
}

function vertical(growth: Cardinal): boolean {
  return growth === 'N' || growth === 'S';
}

function across(rect: Rect, growth: Cardinal): number {
  return vertical(growth) ? rect.x : rect.y;
}

function acrossExtent(rect: Rect, growth: Cardinal): number {
  return vertical(growth) ? rect.width : rect.height;
}

/**
 * Move a route's two terminals from their bounding-box sides onto the shapes
 * themselves.
 *
 * Only the along-axis coordinate changes, so the terminal legs stay axis-aligned and
 * the bends do not move. For a rectangle both insets are zero and nothing happens.
 */
function insetTerminals(leg: Leg): void {
  const parentSide = sideOfCardinal(leg.growth);
  const childSide = oppositeSide(parentSide);
  const last = leg.points.length - 1;
  if (last < 1) {
    return;
  }

  if (leg.parent.silhouette) {
    leg.points[0] = silhouettePort(
      leg.parent.silhouette,
      leg.parent,
      parentSide,
      leg.parentPort - across(leg.parent, leg.growth)
    );
  }
  if (leg.child.silhouette) {
    leg.points[last] = silhouettePort(
      leg.child.silhouette,
      leg.child,
      childSide,
      leg.childPort - across(leg.child, leg.growth)
    );
  }
}

/** The rectangle `routeRankEdgeTowards` should treat as the endpoint's own. */
function portedRect(rect: Rect, port: number, growth: Cardinal): Rect {
  return vertical(growth) ? { ...rect, x: port } : { ...rect, y: port };
}

// ---------------------------------------------------------------------------
// Ports (guide §23: one attachment point per edge)
// ---------------------------------------------------------------------------

/**
 * Where each connector leaves its parent and enters its child.
 *
 * Both ends are spread, and both are keyed on the **node and side** rather than on
 * the tree or the parent: every connector using one side of one node competes for
 * room on it, whether it belongs to the same fan, to a sibling tree hanging off the
 * same core node, or to the other half of a pair of antiparallel edges.
 *
 * A side used by a single connector keeps its centre, which is what leaves a chain
 * of degree-one nodes perfectly straight.
 */
function assignPorts(
  legs: Leg[],
  reserved: Map<string, number[]>,
  options: GridAttachedOptions
): void {
  // Leaving side: the parent's rank-facing side. Each leg wants to leave nearest
  // its own child.
  spreadGroups(
    legs,
    (leg) => `${leg.parentId}|out|${leg.growth}`,
    (leg) => leg.parent,
    (leg) => sideOfCardinal(leg.growth),
    (leg) => across(leg.child, leg.growth),
    (leg, port) => (leg.parentPort = port),
    (leg) => reserved.get(`${leg.parentId}|${sideOfCardinal(leg.growth)}`) ?? [],
    options
  );

  // Entering side: the child's side facing the parent's rank. Each leg wants to
  // enter nearest wherever it came from.
  spreadGroups(
    legs,
    (leg) => `${leg.childId}|in|${leg.growth}`,
    (leg) => leg.child,
    (leg) => oppositeSide(sideOfCardinal(leg.growth)),
    (leg) => across(leg.parent, leg.growth),
    (leg, port) => (leg.childPort = port),
    (leg) => reserved.get(`${leg.childId}|${oppositeSide(sideOfCardinal(leg.growth))}`) ?? [],
    options
  );
}

function spreadGroups(
  legs: Leg[],
  keyOf: (leg: Leg) => string,
  rectOf: (leg: Leg) => ShapedRect,
  sideOf: (leg: Leg) => Side,
  wishOf: (leg: Leg) => number,
  assign: (leg: Leg, port: number) => void,
  reservedFor: (leg: Leg) => number[],
  options: GridAttachedOptions
): void {
  const groups = new Map<string, Leg[]>();
  for (const leg of legs) {
    const key = keyOf(leg);
    const group = groups.get(key);
    if (group) {
      group.push(leg);
    } else {
      groups.set(key, [leg]);
    }
  }

  for (const group of groups.values()) {
    const taken = reservedFor(group[0]);
    // A single connector normally keeps the centre of its side, which is what leaves
    // a chain of degree-one nodes perfectly straight. Not when something already
    // holds that centre: then even one connector has to move.
    if (group.length < 2 && taken.length === 0) {
      continue;
    }
    const rect = rectOf(group[0]);
    const growth = group[0].growth;
    const sideLength = acrossExtent(rect, growth);
    const centre = across(rect, growth);
    const margin = Math.min(FAN_PORT_MARGIN, sideLength / 4);
    // A shape that does not reach the corners of its box cannot take a port there,
    // so the fan spreads over what the shape actually offers.
    const band = rect.silhouette
      ? silhouetteBand(rect.silhouette, rect, sideOf(group[0]))
      : { min: -sideLength / 2, max: sideLength / 2 };
    const low = centre + Math.max(-sideLength / 2 + margin, band.min);
    const high = centre + Math.min(sideLength / 2 - margin, band.max);
    if (high <= low) {
      continue;
    }

    // Order by the *unclamped* wish. Every connector whose far end lies beyond the
    // side clamps to the same limit, so ordering on the clamped value would leave
    // those tied and settle them on their edge id — which is unrelated to where
    // they are going, and would put a nearer branch outside a further one. Clamping
    // is monotone, so this still hands `spreadPorts` an ascending list.
    const order = [...group].sort((a, b) => {
      const delta = wishOf(a) - wishOf(b);
      return delta !== 0 ? delta : a.originalEdgeId.localeCompare(b.originalEdgeId);
    });
    const wanted = order.map((leg) => Math.max(low, Math.min(high, wishOf(leg))));
    const spread =
      taken.length > 0
        ? spreadAvoiding(
            wanted,
            low,
            high,
            options.treeFanPortSpacing,
            taken.map((offset) => centre + offset)
          )
        : spreadPorts(wanted, low, high, options.treeFanPortSpacing);
    order.forEach((leg, index) => assign(leg, spread[index]));
  }
}

/**
 * Positions in `[low, high]` at least `gap` apart from each other *and* from every
 * reserved position, as close to `wanted` as those two conditions allow.
 *
 * `spreadPorts` cannot do this: it spreads a set of ports that may all move, and
 * here some of them may not — a core edge's attachment point is fixed, because this
 * layout is not allowed to change the core. So the side is cut into the stretches
 * the reserved positions leave free, each stretch is divided into slots a gap apart,
 * and the wanted ports are assigned to slots in order.
 *
 * Assigning in order is what keeps the fan from crossing itself: `wanted` arrives
 * sorted by where each connector is going, so taking slots in the same order keeps a
 * nearer branch inside a further one.
 *
 * A side with no room left falls back to `spreadPorts` over the whole band. That
 * overlaps a reserved port, which is the very thing being avoided — but a drawing
 * with one doubled port beats one where several connectors pile onto the same point.
 */
export function spreadAvoiding(
  wanted: number[],
  low: number,
  high: number,
  gap: number,
  reserved: number[]
): number[] {
  const slots = freeSlots(low, high, gap, reserved);
  if (slots.length < wanted.length) {
    return spreadPorts(wanted, low, high, gap);
  }

  // Walk both lists forward together, taking the slot nearest each wish while
  // leaving enough slots behind for everything still to come.
  const chosen: number[] = [];
  let next = 0;
  wanted.forEach((wish, index) => {
    const spare = slots.length - wanted.length + index;
    while (next < spare && Math.abs(slots[next + 1] - wish) <= Math.abs(slots[next] - wish)) {
      next++;
    }
    chosen.push(slots[next]);
    next++;
  });

  return chosen;
}

/** Positions a gap apart inside `[low, high]`, skipping every reserved neighbourhood. */
function freeSlots(low: number, high: number, gap: number, reserved: number[]): number[] {
  const blocked = reserved
    .map((position) => [position - gap, position + gap] as const)
    .sort((a, b) => a[0] - b[0]);

  const free: [number, number][] = [];
  let cursor = low;
  for (const [from, to] of blocked) {
    if (from > cursor) {
      free.push([cursor, Math.min(from, high)]);
    }
    cursor = Math.max(cursor, to);
  }
  if (cursor < high) {
    free.push([cursor, high]);
  }

  const slots: number[] = [];
  for (const [from, to] of free) {
    if (to < from) {
      continue;
    }
    for (let at = from; at <= to + EPSILON; at += gap) {
      slots.push(Math.min(at, to));
    }
  }
  return slots.sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Turns: the comb (guide §15.2, one turn between the two ranks)
// ---------------------------------------------------------------------------

/** A settled axis-aligned run, for the collision check. */
interface Run {
  at: number;
  from: number;
  to: number;
}

function assignTurns(legs: Leg[], options: GridAttachedOptions): void {
  const fans = new Map<string, Leg[]>();
  for (const leg of legs) {
    const group = fans.get(leg.fan);
    if (group) {
      group.push(leg);
    } else {
      fans.set(leg.fan, [leg]);
    }
  }

  const plans: TurnPlan[] = [];
  for (const fan of fans.values()) {
    plans.push(...planFan(fan));
  }

  // Every run of every route counts as occupied, not just the turns. A connector
  // whose child is straight ahead is one long run with no turn at all, so it never
  // gets a plan — and left out of the reckoning it is exactly what a turn lands on
  // top of. Its line is fixed, so it is claimed first, along with every other run no
  // choice here can move.
  const occupied = new Map<Orientation, Run[]>([
    ['horizontal', []],
    ['vertical', []],
  ]);
  const claim = (leg: Leg): void => {
    for (const run of runsOfRoute(leg.points)) {
      occupied.get(run.orientation)!.push(run.run);
    }
  };

  const planned = new Set(plans.map((plan) => plan.leg));
  for (const leg of legs) {
    if (planned.has(leg)) {
      // The two legs into the ranks sit on lines the *ports* fixed, so they are known
      // before any turn is chosen even though their length is not. Claiming them now,
      // at the longest they could be, is what stops a turn landing on one: a turn is
      // always across the ranks and a terminal leg always along them, so these never
      // block the very leg they belong to — only other trees' turns, which is the
      // point.
      claimTerminalLines(leg, occupied);
    } else {
      claim(leg);
    }
  }
  if (plans.length === 0) {
    return;
  }

  // Bigger fans first: they have the most levels to fit and the least freedom to
  // give one up, so they get their preferred lines before anything else claims one.
  plans.sort((a, b) => {
    if (a.levels !== b.levels) {
      return b.levels - a.levels;
    }
    if (a.leg.fan !== b.leg.fan) {
      return a.leg.fan < b.leg.fan ? -1 : 1;
    }
    if (a.level !== b.level) {
      return a.level - b.level;
    }
    return a.leg.originalEdgeId.localeCompare(b.leg.originalEdgeId);
  });

  for (const plan of plans) {
    const orientation: Orientation = vertical(plan.leg.growth) ? 'horizontal' : 'vertical';
    const taken = occupied.get(orientation)!;
    const run = { from: plan.from, to: plan.to, at: 0 };

    let chosen = plan.candidates[0];
    for (const candidate of plan.candidates) {
      run.at = candidate;
      if (!collides(run, taken, options)) {
        chosen = candidate;
        break;
      }
    }

    applyTurn(plan.leg, chosen);
    // Only the turn is new; the terminal lines were claimed before the loop.
    taken.push({ ...run, at: chosen });
  }
}

/**
 * Reserve the lines a leg's two terminal runs sit on, for their whole possible
 * extent.
 *
 * For a tree grown vertically those runs are vertical, on the two ports' `x`; for one
 * grown horizontally they are horizontal, on the two ports' `y`. Either way they are
 * the opposite orientation to the turn between them, so a leg never blocks its own
 * turn — and the span claimed is the full distance between the two ranks, which is
 * the most either run can reach once the turn settles somewhere between them.
 */
function claimTerminalLines(leg: Leg, occupied: Map<Orientation, Run[]>): void {
  if (leg.points.length < 2) {
    return;
  }
  const upright = vertical(leg.growth);
  const orientation: Orientation = upright ? 'vertical' : 'horizontal';
  const first = leg.points[0];
  const last = leg.points[leg.points.length - 1];
  const from = Math.min(upright ? first.y : first.x, upright ? last.y : last.x);
  const to = Math.max(upright ? first.y : first.x, upright ? last.y : last.x);
  if (to - from <= EPSILON) {
    return;
  }

  const lines = occupied.get(orientation)!;
  for (const at of [leg.parentPort, leg.childPort]) {
    lines.push({ at, from, to });
  }
}

type Orientation = 'horizontal' | 'vertical';

/** Every axis-aligned run of a settled route, tagged with its orientation. */
function runsOfRoute(points: Point[]): { orientation: Orientation; run: Run }[] {
  const runs: { orientation: Orientation; run: Run }[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const horizontal = Math.abs(a.y - b.y) < EPSILON;
    const upright = Math.abs(a.x - b.x) < EPSILON;
    if (horizontal === upright) {
      continue;
    }
    const [from, to] = horizontal ? [a.x, b.x] : [a.y, b.y];
    if (Math.abs(to - from) <= EPSILON) {
      continue;
    }
    runs.push({
      orientation: horizontal ? 'horizontal' : 'vertical',
      run: { at: horizontal ? a.y : a.x, from: Math.min(from, to), to: Math.max(from, to) },
    });
  }
  return runs;
}

interface TurnPlan {
  leg: Leg;
  /** Levels this leg's fan needs; the sort key that gives crowded fans priority. */
  levels: number;
  level: number;
  /** Across-range the run covers, for the collision check. */
  from: number;
  to: number;
  /** Turn coordinates to try, most preferred first. */
  candidates: number[];
}

/**
 * The comb one fan wants.
 *
 * A run only collides with another if the two share a stretch of the across axis,
 * and that gives the nesting order for free:
 *
 *   - two children on *opposite* sides of their ports never share such a stretch,
 *     because the ports are ordered by child position — so both sides can use the
 *     same levels, and a fan of `n` needs only about `n/2` of them;
 *   - two children on the *same* side always do share one, so they need different
 *     levels, and the order is forced: the further child must turn *first*, nearer
 *     the parent. Turning later would put its run below the nearer child's
 *     descending leg, and the two would cross. Nest the runs the other way round
 *     and every pair on that side crosses instead.
 *
 * A connector whose child is already on its port's axis has no run at all — it is a
 * straight line — so it takes no level and cannot collide with anything.
 */
function planFan(fan: Leg[]): TurnPlan[] {
  const turning = fan.filter(
    (leg) => leg.points.length === 4 && Math.abs(leg.childPort - leg.parentPort) > EPSILON
  );
  if (turning.length === 0) {
    return [];
  }

  const before = turning.filter((leg) => leg.childPort < leg.parentPort);
  const after = turning.filter((leg) => leg.childPort > leg.parentPort);
  // Furthest child first on each side, which is the level nearest the parent.
  before.sort((a, b) => a.childPort - b.childPort);
  after.sort((a, b) => b.childPort - a.childPort);

  const levels = Math.max(before.length, after.length);
  const level = new Map<Leg, number>();
  before.forEach((leg, index) => level.set(leg, index));
  after.forEach((leg, index) => level.set(leg, index));

  // Levels are measured from the *shortest* span in the fan, so every run on a
  // level turns on the same line even when the children on that rank are not all
  // the same height.
  let shortest = Number.POSITIVE_INFINITY;
  for (const leg of turning) {
    shortest = Math.min(shortest, Math.abs(alongOf(leg, 3) - alongOf(leg, 0)));
  }
  if (!Number.isFinite(shortest) || shortest <= 0) {
    return [];
  }

  return turning.map((leg) => {
    const start = alongOf(leg, 0);
    const sign = Math.sign(alongOf(leg, 3) - start) || 1;
    const preferred = level.get(leg)!;
    const at = (fraction: number): number => start + sign * shortest * fraction;

    // Own level first, then the fan's other levels nearest to it, then the lines
    // half way between them. Giving up a level costs a crossing inside the fan;
    // keeping one that is already occupied costs two edges drawn as one line, which
    // is worse.
    const fractions = [preferred, ...others(preferred, levels)].map(
      (candidate) => (candidate + 1) / (levels + 1)
    );
    const between = fractions.slice(1).map((fraction) => fraction - 0.5 / (levels + 1));

    // A fan of one has a single level, so the two lists above offer it a single
    // place to turn and it cannot move at all — which is how a lone connector ends
    // up sharing a line with another tree's. These are the fallbacks: no longer the
    // tidy nesting, but anywhere between the ranks beats being drawn as one line.
    const anywhere = [0.5, 0.35, 0.65, 0.25, 0.75, 0.15, 0.85];

    const seen = new Set<number>();
    const candidates: number[] = [];
    for (const fraction of [...fractions, ...between, ...anywhere]) {
      const key = Math.round(fraction * 1e4);
      if (fraction > 0 && fraction < 1 && !seen.has(key)) {
        seen.add(key);
        candidates.push(at(fraction));
      }
    }

    return {
      leg,
      levels,
      level: preferred,
      from: Math.min(leg.parentPort, leg.childPort),
      to: Math.max(leg.parentPort, leg.childPort),
      candidates,
    };
  });
}

/** The fan's other levels, nearest the preferred one first. */
function others(preferred: number, levels: number): number[] {
  const rest: number[] = [];
  for (let distance = 1; distance < levels; distance++) {
    for (const candidate of [preferred - distance, preferred + distance]) {
      if (candidate >= 0 && candidate < levels) {
        rest.push(candidate);
      }
    }
  }
  return rest;
}

function alongOf(leg: Leg, index: number): number {
  const point = leg.points[index];
  return vertical(leg.growth) ? point.y : point.x;
}

function collides(run: Run, taken: Run[], options: GridAttachedOptions): boolean {
  const separation = Math.min(SAME_LINE, options.treeBendSpacing / 2);
  return taken.some(
    (other) =>
      Math.abs(other.at - run.at) < separation &&
      Math.min(other.to, run.to) - Math.max(other.from, run.from) > separation
  );
}

/**
 * Move one route's turn onto its chosen line.
 *
 * `routeRankEdgeTowards` has already settled both endpoints on the node boundaries
 * and put the turn half way between the ranks; only the two middle points move, so
 * the endpoints, the ports and the orthogonality are exactly what HOLA computed.
 */
function applyTurn(leg: Leg, turn: number): void {
  const [start, first, second, end] = leg.points;
  leg.points = vertical(leg.growth)
    ? [start, { x: first.x, y: turn }, { x: second.x, y: turn }, end]
    : [start, { x: turn, y: first.y }, { x: turn, y: second.y }, end];
}

// ---------------------------------------------------------------------------
// Rank gap sizing
// ---------------------------------------------------------------------------

/**
 * Levels the combs of one tree need, so the rank gap can be made wide enough to
 * hold them before the tree is drawn.
 *
 * Read off the *across* coordinates, which the rank gap does not influence: sibling
 * packing spaces children by their own widths and `siblingGap`, so a tree drawn
 * with a wider rank gap has the very same fan shapes. The count is therefore stable
 * enough to size the gap the fans will need.
 */
export function combLevelsNeeded(layout: TreeLayout, graph: HolaGraph, growth: Cardinal): number {
  const rooted = rootTree(graph, layout.rootId);
  const acrossOf = (id: string): number | undefined => {
    const node = layout.nodes.get(id);
    if (!node) {
      return undefined;
    }
    return vertical(growth) ? node.x : node.y;
  };

  let needed = 0;
  for (const [parentId, childIds] of rooted.children) {
    const parentAcross = acrossOf(parentId);
    if (parentAcross === undefined || childIds.length < 2) {
      continue;
    }
    let before = 0;
    let after = 0;
    for (const childId of childIds) {
      const childAcross = acrossOf(childId);
      if (childAcross === undefined || Math.abs(childAcross - parentAcross) < EPSILON) {
        continue;
      }
      if (childAcross < parentAcross) {
        before++;
      } else {
        after++;
      }
    }
    needed = Math.max(needed, before, after);
  }

  return needed;
}

/**
 * A tree node's self-loop, as a rectangular detour on a side the tree does not use
 * for ranks (guide §23: the finished drawing stays orthogonal).
 *
 * HOLA's own `routeSelfLoop` always leaves through the top, which is right for a
 * core node but wrong here: in a tree growing SOUTH the top of every node is exactly
 * where its parent's connector lands, and the loop would be drawn over it. The rank
 * axis is known, so the loop goes across it instead — beside a vertically grown
 * tree, below a horizontal one — where nothing arrives.
 *
 * `index` separates several loops on the same node by pushing each one further out.
 */
export function routeTreeSelfLoop(
  node: ShapedRect,
  growth: Cardinal,
  index: number,
  clearance: number
): Point[] {
  const depth = clearance * 2 + index * clearance;
  const upright = vertical(growth);
  // A loop leaves and re-enters one side, so both of its feet are ports on that
  // side and both have to sit on the shape rather than on its box.
  const side: Side = upright ? 'right' : 'bottom';
  const halfSpan = Math.max((upright ? node.height : node.width) / 4, 8);
  const foot = (offset: number): Point =>
    node.silhouette
      ? silhouettePort(node.silhouette, node, side, offset)
      : upright
        ? { x: node.x + node.width / 2, y: node.y + offset }
        : { x: node.x + offset, y: node.y + node.height / 2 };

  const near = foot(-halfSpan);
  const far = foot(halfSpan);
  // The detour reaches out from the *box*, so the loop clears the shape whatever
  // its feet were pulled in to.
  const out = upright ? node.x + node.width / 2 + depth : node.y + node.height / 2 + depth;

  return upright
    ? [near, { x: out, y: near.y }, { x: out, y: far.y }, far]
    : [near, { x: near.x, y: out }, { x: far.x, y: out }, far];
}
