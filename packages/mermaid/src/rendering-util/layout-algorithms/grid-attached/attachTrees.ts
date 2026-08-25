/**
 * HOLA Step 3c: tree placement, against a core that cannot move (guide §17).
 *
 * The selection machinery is HOLA's and is not re-litigated here:
 *
 *   - trees are placed **largest-first**, by descending bounding-box perimeter,
 *     stable on id (§17.1);
 *   - a candidate is a (face, placement direction, growth direction, flip)
 *     tuple, and a direction is only a candidate if it points into the angular
 *     **wedge** the face occupies at the tree's root (§17.2) — `faceWedgeAt`,
 *     unchanged, reading the faces of the routed core;
 *   - an ordinal placement is a *corner* placement, offset clear of its own root
 *     along the ordinal's other component (§17.2), with HOLA's `clearanceShift`;
 *   - selection is **lexicographic, not a weighted score** (§17.6): cardinal
 *     beats ordinal, then external face beats internal, then lower cost, then a
 *     deterministic tie-break;
 *   - a candidate is represented by its **footprint** rather than by inserting
 *     the tree, so a rejected candidate leaves no trace (invariant 16).
 *
 * One thing is necessarily different. HOLA makes room by *face expansion*: it
 * pushes the obstructing face boundary outwards through its constraint solver,
 * moving core nodes. Here the core is a finished grid-like drawing and moving one
 * of its nodes would destroy the alignments that make it grid-like, so the two
 * remedies are:
 *
 *   - **sliding** — the tree moves further out along its growth direction until
 *     its footprint is clear. This is HOLA's own hinged (non-rigid) anchor
 *     (§17.3), and it costs exactly what HOLA charges it: a dead stub on the
 *     connector, priced into the candidate's cost;
 *   - **enlargement** — the caller stretches every core edge and asks again. That
 *     is face expansion applied uniformly instead of locally: it is the only
 *     change to the core drawing this layout is allowed to make, and it is what
 *     stops two trees from having to slide past each other.
 *
 * Nothing here mutates anything. It reads the core's geometry and returns
 * placements, so the enlargement ladder can call it once per rung.
 */

import type { Point } from '../../../types.js';
import type {
  Bounds,
  Cardinal,
  Direction,
  HolaNode,
  Ordinal,
  Rect,
} from '../hola-faithful/model.js';
import {
  ALL_DIRECTIONS,
  boundsHeight,
  boundsWidth,
  nodeBounds,
  unionBounds,
} from '../hola-faithful/model.js';
import {
  faceWedgeAt,
  clearanceShift,
  layoutForGrowth,
  ordinalComponents,
  ROTATION_FOR_GROWTH,
} from '../hola-faithful/placement/placeTrees.js';
import type { PlaceableTree } from '../hola-faithful/placement/placeTrees.js';
import type { PlanarisedCore } from '../hola-faithful/planarization/planarise.js';
import { transformTreeLayout, treePerimeter } from '../hola-faithful/trees/symmetricTreeLayout.js';
import type { TreeLayout } from '../hola-faithful/trees/symmetricTreeLayout.js';
import type { DecomposedTree } from '../hola-faithful/decomposition/peelCoreAndTrees.js';
import type { CoreSegment } from './coreDrawing.js';
import {
  polylineCrossesSegment,
  polylineHitsBounds,
  polylineHitsRect,
  pushPastRect,
  pushPastSegment,
  stepOf,
} from './geometry.js';
import type { Segment } from './geometry.js';
import type { GridAttachedOptions } from './options.js';
import { routeTreeEdges } from './treeConnectors.js';

const EPSILON = 1e-6;

/** One tree, placed. */
export interface Attachment {
  treeId: string;
  coreNodeId: string;
  placementDirection: Direction;
  growth: Cardinal;
  flip: boolean;
  faceIndex: number;
  isExternalFace: boolean;
  /** Absolute position the tree's copied root was anchored at. */
  anchor: Point;
  /** Dead stub on the root connector: how far the tree was pushed outwards. */
  slide: number;
  /** Root connectors that run into something they should have cleared. */
  violations: number;
  /** The tree at its final position, root copy included. */
  transformed: TreeLayout;
  /** Space the tree's own nodes occupy; excludes the root copy and the connector. */
  footprint: Bounds;
  /**
   * The placement could not satisfy every rule and was kept anyway, because a
   * drawing with a flaw beats no drawing (guide §25). Either the stub exceeds
   * `maxSlide` or a root connector runs into something.
   */
  relaxed: boolean;
  cost: number;
}

/**
 * A tree ready to be placed: HOLA's `PlaceableTree` plus the rank gap each of its
 * two drawings was built with. The connectors are re-derived from the final
 * positions, and they need the same gap the drawing reserved.
 *
 * One gap per drawing, because the two are used for different growth directions and
 * what has to fit in the gap differs: a label's height for a tree grown vertically,
 * its width for one grown horizontally.
 */
export interface AttachableTree extends PlaceableTree {
  rankGapVertical: number;
  rankGapHorizontal: number;
}

/** The rank gap the drawing for this growth direction was built with. */
export function rankGapFor(
  tree: AttachableTree | undefined,
  growth: Cardinal,
  options: GridAttachedOptions
): number {
  if (!tree) {
    return options.treeRankGap;
  }
  return growth === 'E' || growth === 'W' ? tree.rankGapHorizontal : tree.rankGapVertical;
}

export interface AttachInput {
  /** Core node rectangles at their current, enlarged positions. */
  coreRects: Map<string, HolaNode>;
  /** The core's edges, for both the wedges and the obstacles. */
  coreSegments: CoreSegment[];
  /** Faces of the core drawing. Absent when it could not be embedded. */
  planar?: PlanarisedCore;
  /** Where the core's own edges attach, so a trial connector starts where the real one will. */
  reservedPorts?: Map<string, number[]>;
  trees: AttachableTree[];
  /** The decomposed trees, by tree id, for connector routing. */
  sources: Map<string, DecomposedTree>;
  /** Growth direction the diagram's declared direction asks for, if any. */
  flowGrowth?: Cardinal;
  options: GridAttachedOptions;
}

export interface AttachResult {
  attachments: Attachment[];
  /** Trees for which not even a relaxed placement could be evaluated. */
  unplaced: string[];
  /** How many placements had to be relaxed. */
  relaxedCount: number;
  /** Longest dead stub in the result. */
  maxSlide: number;
  /**
   * What the dead stubs in this result are worth, in pixels.
   *
   * Quadratic in the stub's length, relative to one rank gap: a tree a few pixels
   * off its natural distance is barely worth noticing, while one pushed a whole
   * tree's width away is the thing the enlargement ladder exists to cure. This is
   * the convention HOLA prices a slid tree with (guide §17.5), which charges the
   * squared excess over the natural attachment distance.
   */
  stubPenalty: number;
}

export function attachTrees(input: AttachInput): AttachResult {
  const { options } = input;

  // Guide §17.1: descending bounding-box perimeter, stable on id.
  const ordered = [...input.trees].sort((a, b) => {
    const difference = treePerimeter(b.layout) - treePerimeter(a.layout);
    if (Math.abs(difference) > EPSILON) {
      return difference;
    }
    return a.id < b.id ? -1 : 1;
  });

  // The core's routes are orthogonal and already clipped to the node boundaries,
  // so every piece of them is drawn and every piece is an obstacle.
  const obstacles: Segment[] = input.coreSegments.map((segment) => ({
    a: segment.a,
    b: segment.b,
  }));
  const coreBounds = unionBounds([...input.coreRects.values()].map((rect) => nodeBounds(rect))) ?? {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
  };

  const attachments: Attachment[] = [];
  const unplaced: string[] = [];
  const committed: Bounds[] = [];
  let drawn = coreBounds;

  for (const tree of ordered) {
    const source = input.sources.get(tree.id);
    const root = input.coreRects.get(tree.coreNodeId);
    if (!source || !root) {
      unplaced.push(tree.id);
      continue;
    }

    const context: EvaluationContext = {
      input,
      tree,
      source,
      root,
      obstacles,
      committed,
      drawn,
    };

    const evaluated = enumerateCandidates(input, tree)
      .map((candidate) => evaluate(context, candidate))
      .filter((entry): entry is Evaluated => entry !== null);

    if (evaluated.length === 0) {
      unplaced.push(tree.id);
      continue;
    }

    evaluated.sort((a, b) => compareCandidates(a, b, options));
    const winner = evaluated[0];

    attachments.push(winner.attachment);
    committed.push(winner.attachment.footprint);
    drawn = unionBounds([drawn, winner.attachment.footprint]) ?? drawn;
  }

  const relaxedCount = attachments.filter((attachment) => attachment.relaxed).length;
  const maxSlide = attachments.reduce((most, attachment) => Math.max(most, attachment.slide), 0);
  const stubPenalty = attachments.reduce(
    (total, attachment) =>
      total + (attachment.slide * attachment.slide) / Math.max(options.treeRankGap, 1),
    0
  );

  return { attachments, unplaced, relaxedCount, maxSlide, stubPenalty };
}

// ---------------------------------------------------------------------------
// Candidate enumeration (guide §17.2)
// ---------------------------------------------------------------------------

interface Candidate {
  faceIndex: number;
  isExternalFace: boolean;
  placementDirection: Direction;
  growth: Cardinal;
  flip: boolean;
}

function isCardinal(direction: Direction): direction is Cardinal {
  return direction.length === 1;
}

function enumerateCandidates(input: AttachInput, tree: AttachableTree): Candidate[] {
  const candidates: Candidate[] = [];
  const add = (faceIndex: number, isExternalFace: boolean, direction: Direction): void => {
    const growths = isCardinal(direction) ? [direction] : ordinalComponents(direction as Ordinal);
    for (const growth of growths) {
      candidates.push({
        faceIndex,
        isExternalFace,
        placementDirection: direction,
        growth,
        flip: false,
      });
      candidates.push({
        faceIndex,
        isExternalFace,
        placementDirection: direction,
        growth,
        flip: true,
      });
    }
  };

  const planar = input.planar;
  if (planar) {
    for (const faceIndex of planar.dcel.facesAtVertex.get(tree.coreNodeId) ?? []) {
      const face = planar.dcel.faces[faceIndex];
      const wedge = faceWedgeAt(planar, face, tree.coreNodeId);
      for (const direction of ALL_DIRECTIONS) {
        if (wedge(direction)) {
          add(faceIndex, face.isExternal, direction);
        }
      }
    }
  }

  // No embedding, or a root whose faces admit nothing: fall back to every
  // direction. That gives up the wedge restriction, which is a loss of quality,
  // but never the drawing (guide §25).
  if (candidates.length === 0) {
    for (const direction of ALL_DIRECTIONS) {
      add(-1, true, direction);
    }
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// Candidate evaluation
// ---------------------------------------------------------------------------

interface EvaluationContext {
  input: AttachInput;
  tree: AttachableTree;
  source: DecomposedTree;
  root: HolaNode;
  obstacles: Segment[];
  committed: Bounds[];
  /** Everything drawn so far, for the compactness term. */
  drawn: Bounds;
}

interface Evaluated {
  candidate: Candidate;
  attachment: Attachment;
}

/** Slide is a monotone advance along one direction, so this bound is generous. */
const MAX_SLIDE_PASSES = 32;

function evaluate(context: EvaluationContext, candidate: Candidate): Evaluated | null {
  const { input, tree, root } = context;
  const options = input.options;
  const drawing = layoutForGrowth(tree, candidate.growth);
  const rotation = ROTATION_FOR_GROWTH[candidate.growth];
  const step = stepOf(candidate.growth);

  let shift: Point = { x: 0, y: 0 };
  const draw = (): { transformed: TreeLayout; footprint: Bounds } | null => {
    const transformed = transformTreeLayout(drawing, rotation, candidate.flip, {
      x: root.x + shift.x,
      y: root.y + shift.y,
    });
    const footprint = footprintOf(transformed, tree.rootCopyId);
    return footprint ? { transformed, footprint } : null;
  };

  let placed = draw();
  if (!placed) {
    return null;
  }

  // A corner placement has to *be* a corner, not just be labelled one: without
  // the offset the tree is centred on its root's row or column exactly as the
  // cardinal candidate is, and the two are the same drawing scored twice
  // (guide §17.2 — an ordinal wedge is the quadrant between two neighbours).
  //
  // Clearing the root is the least the offset must do. It then keeps going until
  // the quadrant is genuinely free, which is what makes a corner a real
  // alternative when the four sides of a node are already taken: the tree steps
  // sideways past whatever holds the side, instead of being slid outwards past it.
  //
  // Every pixel of that step is charged, exactly like a slide. A corner connector is
  // an L either way, so a *short* step really is free — but the step is a fixed
  // point that keeps going while anything blocks, and left uncharged it once carried
  // a leaf two thousand pixels clear of its own core node while still scoring a
  // perfect nothing.
  let sideways = 0;
  if (!isCardinal(candidate.placementDirection)) {
    const other = ordinalComponents(candidate.placementDirection as Ordinal).find(
      (component) => component !== candidate.growth
    );
    if (other) {
      const corner = clearanceShift(other, root, placed.footprint, options.treeClearance);
      shift = { x: shift.x + corner.x, y: shift.y + corner.y };
      sideways += Math.abs(corner.x) + Math.abs(corner.y);
      placed = draw() ?? placed;

      const step = stepOf(other);
      for (let pass = 0; pass < MAX_SLIDE_PASSES; pass++) {
        const push = requiredPush(context, placed.footprint, other);
        if (push <= EPSILON) {
          break;
        }
        sideways += push;
        shift = { x: shift.x + step.x * push, y: shift.y + step.y * push };
        const moved = draw();
        if (!moved) {
          return null;
        }
        placed = moved;
      }
    }
  }

  // Slide outwards until the footprint is clear of everything. Each pass advances
  // strictly along one direction, so the loop settles.
  //
  let slide = 0;
  let clear = false;
  for (let pass = 0; pass < MAX_SLIDE_PASSES; pass++) {
    const push = requiredPush(context, placed.footprint, candidate.growth);
    if (push <= EPSILON) {
      clear = true;
      break;
    }
    slide += push;
    shift = { x: shift.x + step.x * push, y: shift.y + step.y * push };
    const moved = draw();
    if (!moved) {
      return null;
    }
    placed = moved;
  }
  if (!clear) {
    return null;
  }

  const violations = countConnectorViolations(context, placed.transformed, candidate.growth);
  const relaxed = violations > 0 || slide > options.maxSlide;

  const cost =
    slide +
    // The corner step is connector too, so it competes on the same terms — but only
    // here. It deliberately stays out of `slide`, which feeds the enlargement
    // ladder: stretching the core is not what fixes a tree that had to go round a
    // corner, and pricing it there made the ladder inflate the whole drawing.
    sideways +
    options.compactnessWeight * outlineGrowth(context.drawn, placed.footprint) +
    (input.flowGrowth && candidate.growth !== input.flowGrowth ? options.flowPenalty : 0);

  return {
    candidate,
    attachment: {
      treeId: tree.id,
      coreNodeId: tree.coreNodeId,
      placementDirection: candidate.placementDirection,
      growth: candidate.growth,
      flip: candidate.flip,
      faceIndex: candidate.faceIndex,
      isExternalFace: candidate.isExternalFace,
      anchor: { x: root.x + shift.x, y: root.y + shift.y },
      slide,
      violations,
      transformed: placed.transformed,
      footprint: placed.footprint,
      relaxed,
      cost,
    },
  };
}

/**
 * How far the footprint still has to move along `growth`.
 *
 * The obstacles are every core node other than the tree's own root, the drawn
 * part of every core edge, and the footprint of every tree already placed — the
 * last of which is what makes two trees on the same core open up against each
 * other rather than collide.
 */
function requiredPush(context: EvaluationContext, footprint: Bounds, growth: Cardinal): number {
  const clearance = context.input.options.treeClearance;
  let push = 0;

  for (const rect of context.input.coreRects.values()) {
    if (rect.id === context.tree.coreNodeId) {
      continue;
    }
    push = Math.max(push, pushPastRect(footprint, nodeBounds(rect), growth, clearance));
  }
  for (const other of context.committed) {
    push = Math.max(push, pushPastRect(footprint, other, growth, clearance));
  }
  for (const segment of context.obstacles) {
    push = Math.max(push, pushPastSegment(footprint, segment, growth, clearance));
  }

  return push;
}

/**
 * How many of the tree's root connectors run into something they must not: a core
 * node they do not touch, a core edge, or a tree already placed.
 *
 * Only the connectors between the core node and the first rank are checked. Every
 * deeper edge of the tree runs between two ranks and within the footprint, which
 * `requiredPush` has already cleared.
 */
function countConnectorViolations(
  context: EvaluationContext,
  transformed: TreeLayout,
  growth: Cardinal
): number {
  const { input, tree, source, root } = context;
  const rootRect: Rect = { x: root.x, y: root.y, width: root.width, height: root.height };
  const connectors = routeTreeEdges(
    source,
    transformed,
    rootRect,
    growth,
    input.options,
    rankGapFor(tree, growth, input.options),
    input.reservedPorts
  ).filter((connector) => connector.fromRoot);

  let violations = 0;
  for (const connector of connectors) {
    for (const rect of input.coreRects.values()) {
      if (rect.id === tree.coreNodeId) {
        continue;
      }
      if (polylineHitsRect(connector.points, rect)) {
        violations++;
      }
    }
    for (const segment of context.obstacles) {
      if (polylineCrossesSegment(connector.points, segment)) {
        violations++;
      }
    }
    for (const other of context.committed) {
      if (polylineHitsBounds(connector.points, other)) {
        violations++;
      }
    }
  }

  return violations;
}

/** The space the tree's own nodes take. The copied root *is* the core node. */
function footprintOf(layout: TreeLayout, rootCopyId: string): Bounds | undefined {
  const parts: Bounds[] = [];
  for (const node of layout.nodes.values()) {
    if (node.id === rootCopyId) {
      continue;
    }
    parts.push(nodeBounds(node));
  }
  return unionBounds(parts);
}

/**
 * How much adding this footprint stretches the drawing's outline, as the growth of
 * its bounding-box perimeter. A tree tucked into a face that is already inside the
 * outline scores zero; one hanging off the far side scores its own reach.
 */
function outlineGrowth(drawn: Bounds, footprint: Bounds): number {
  const merged = unionBounds([drawn, footprint]);
  if (!merged) {
    return 0;
  }
  const before = boundsWidth(drawn) + boundsHeight(drawn);
  const after = boundsWidth(merged) + boundsHeight(merged);
  return Math.max(0, after - before);
}

/**
 * Guide §17.6, as priorities rather than multipliers — with two keys ahead of it.
 *
 * A drawing that is *correct* outranks one that is merely well-placed, so the
 * number of connectors running into something comes first and an over-long stub
 * comes second. Only among candidates that are equally sound does §17.6's own
 * order — cardinal, external face, then cost — get to decide.
 */
function compareCandidates(a: Evaluated, b: Evaluated, options: GridAttachedOptions): number {
  const byViolations = a.attachment.violations - b.attachment.violations;
  if (byViolations !== 0) {
    return byViolations;
  }
  const byStub =
    Number(a.attachment.slide > options.maxSlide) - Number(b.attachment.slide > options.maxSlide);
  if (byStub !== 0) {
    return byStub;
  }
  if (options.favourCardinalPlacement) {
    const byClass =
      Number(!isCardinal(a.candidate.placementDirection)) -
      Number(!isCardinal(b.candidate.placementDirection));
    if (byClass !== 0) {
      return byClass;
    }
  }
  if (options.favourExternalFace) {
    const byFace = Number(!a.candidate.isExternalFace) - Number(!b.candidate.isExternalFace);
    if (byFace !== 0) {
      return byFace;
    }
  }
  if (Math.abs(a.attachment.cost - b.attachment.cost) > EPSILON) {
    return a.attachment.cost - b.attachment.cost;
  }
  return describe(a.candidate).localeCompare(describe(b.candidate));
}

function describe(candidate: Candidate): string {
  return `${candidate.faceIndex}:${candidate.placementDirection}:${candidate.growth}:${
    candidate.flip ? 1 : 0
  }`;
}
