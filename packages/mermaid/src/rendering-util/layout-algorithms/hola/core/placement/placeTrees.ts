/**
 * HOLA Step 3c: tree placement (guide §17).
 *
 * Trees are placed largest-first into the faces around their root. Nothing
 * about a tree's interior is inserted during the search: a candidate is
 * represented by a *placeholder* rectangle (invariant 16), so evaluating a
 * placement costs one projection rather than a graph rewrite, and a rejected
 * candidate leaves no trace.
 *
 * For a candidate that does not fit, face expansion is attempted as a
 * constraint problem — separation constraints that push the obstructing face
 * boundary outwards, projected through the same global solver, with every
 * earlier constraint still active — and both expansion orders are tried
 * (guide §17.4).
 *
 * Selection is lexicographic and *not* a weighted score (guide §17.6):
 * cardinal beats ordinal, then external beats internal, then lower stress
 * increase, then a deterministic tie-break.
 */

import type { Bounds, Cardinal, Direction, HolaNode, Ordinal, Point } from '../model.js';
import {
  ALL_DIRECTIONS,
  DIRECTION_VECTOR,
  boundsHeight,
  boundsWidth,
  nodeBounds,
  normaliseAngle,
  pointBounds,
  rectsOverlap,
  unionBounds,
} from '../model.js';
import type { Constraint } from '../constraints/types.js';
import { alignment, separation } from '../constraints/types.js';
import { placeholderId } from '../ids.js';
import type { CoreLayoutState } from '../state.js';
import { makeEntity } from '../state.js';
import type { PlanarisedCore } from '../planarization/planarise.js';
import type { Face } from '../planarization/dcel.js';
import type { Quarter, TreeLayout } from '../trees/symmetricTreeLayout.js';
import { transformTreeLayout, treePerimeter } from '../trees/symmetricTreeLayout.js';
import type { StressModel } from '../stress/stressModel.js';

export interface PlaceableTree {
  id: string;
  /** Core node the tree hangs from. */
  coreNodeId: string;
  /** Id of the copied root inside the layouts. */
  rootCopyId: string;
  /**
   * Two drawings of the same tree, both growing SOUTH, differing only in which
   * node dimension feeds rank spacing and which feeds sibling spacing. A
   * candidate uses the one whose axis matches its growth direction, so the
   * spacing is still right after the quarter turn (see `TreeLayoutOptions`).
   */
  layout: TreeLayout;
  layoutForHorizontalGrowth: TreeLayout;
}

/** The drawing to use for a given growth direction. */
export function layoutForGrowth(tree: PlaceableTree, growth: Cardinal): TreeLayout {
  return growth === 'E' || growth === 'W' ? tree.layoutForHorizontalGrowth : tree.layout;
}

export interface TreePlacement {
  treeId: string;
  coreNodeId: string;
  faceIndex: number;
  isExternalFace: boolean;
  placementDirection: Direction;
  growthDirection: Cardinal;
  flip: boolean;
  rotation: Quarter;
  placeholderId: string;
  /** Transformed tree, anchored so the copied root sits on the core node. */
  transformed: TreeLayout;
  /** Placeholder centre relative to the root at the natural attachment. */
  offsetX: number;
  offsetY: number;
  /**
   * Where the copied root sits relative to the core node. Zero for a cardinal
   * placement, which grows straight out of the node; non-zero for an ordinal one,
   * which sits in the quadrant beside it.
   */
  anchorShiftX: number;
  anchorShiftY: number;
  stressIncrease: number;
}

export interface PlacementResult {
  placements: TreePlacement[];
  unplaced: string[];
}

/** SOUTH-growing trees rotate by this much to grow in a given direction. */
export const ROTATION_FOR_GROWTH: Record<Cardinal, Quarter> = {
  S: 0,
  E: 90,
  N: 180,
  W: 270,
};

interface Candidate {
  face: Face;
  placementDirection: Direction;
  growthDirection: Cardinal;
  flip: boolean;
}

interface EvaluatedCandidate extends Candidate {
  offsetX: number;
  offsetY: number;
  /**
   * Constraint batches in the order they were applied during evaluation. The
   * second expansion axis depends on where the first one left things, so a
   * commit replays the same staged sequence rather than adding everything at
   * once — the committed layout is then exactly the evaluated one.
   */
  batches: Constraint[][];
  stressIncrease: number;
  /** `stressIncrease` plus what sliding the tree away from its root costs. */
  cost: number;
  transformed: TreeLayout;
  placeholder: { id: string; x: number; y: number; width: number; height: number };
  /** Where the copied root sits relative to the core node; non-zero for a corner placement. */
  anchorShift: Point;
  /** False when the tree had to be slid outwards to fit; see `anchorConstraints`. */
  rigidAnchor: boolean;
}

const CLEARANCE_EPSILON = 1e-6;

export function placeTrees(
  state: CoreLayoutState,
  planar: PlanarisedCore,
  trees: PlaceableTree[],
  model: StressModel
): PlacementResult {
  // Guide §17.1: descending bounding-box perimeter, stable on id.
  const ordered = [...trees].sort((a, b) => {
    const pa = treePerimeter(a.layout);
    const pb = treePerimeter(b.layout);
    if (Math.abs(pa - pb) > CLEARANCE_EPSILON) {
      return pb - pa;
    }
    return a.id < b.id ? -1 : 1;
  });

  const placements: TreePlacement[] = [];
  const unplaced: string[] = [];

  for (const tree of ordered) {
    const chosen = placeOneTree(state, planar, tree, model);
    if (!chosen) {
      unplaced.push(tree.id);
      state.diagnostics.report({
        code: 'HOLA_TREE_PLACEMENT_FAILED',
        stage: 'tree-placement',
        componentId: state.componentId,
        nodeIds: [tree.coreNodeId],
        message:
          `No feasible face placement for tree ${tree.id}; attached with the default ` +
          'SOUTH growth so the drawing stays complete.',
      });
      const fallback = defaultPlacement(state, tree);
      if (fallback) {
        placements.push(fallback);
      }
      continue;
    }
    placements.push(chosen);
  }

  return { placements, unplaced };
}

/**
 * Guide §25: a stage that cannot complete faithfully returns the best valid
 * partial result with a diagnostic. An unplaced tree still has to be drawn, so
 * it is attached with HOLA's provisional SOUTH growth and no expansion.
 */
function defaultPlacement(state: CoreLayoutState, tree: PlaceableTree): TreePlacement | null {
  const root = state.entities.get(tree.coreNodeId);
  if (!root) {
    return null;
  }
  return {
    treeId: tree.id,
    coreNodeId: tree.coreNodeId,
    faceIndex: -1,
    isExternalFace: false,
    placementDirection: 'S',
    growthDirection: 'S',
    flip: false,
    rotation: 0,
    placeholderId: placeholderId(tree.id),
    transformed: transformTreeLayout(tree.layout, 0, false, { x: root.x, y: root.y }),
    offsetX: 0,
    offsetY: 0,
    anchorShiftX: 0,
    anchorShiftY: 0,
    stressIncrease: Number.POSITIVE_INFINITY,
  };
}

function placeOneTree(
  state: CoreLayoutState,
  planar: PlanarisedCore,
  tree: PlaceableTree,
  model: StressModel
): TreePlacement | null {
  const coreNode = state.entities.get(tree.coreNodeId);
  if (!coreNode) {
    return null;
  }

  const candidates = enumerateCandidates(state, planar, tree);
  const evaluated: EvaluatedCandidate[] = [];

  for (const candidate of candidates) {
    const outcome = evaluateCandidate(state, planar, tree, candidate, model);
    if (outcome) {
      evaluated.push(outcome);
    }
  }

  if (evaluated.length === 0) {
    return null;
  }

  evaluated.sort((a, b) => compareCandidates(a, b, state));
  const winner = preferRigid(evaluated, state);

  // Commit: replay the evaluated batches in order so the committed geometry is
  // exactly the geometry that was scored.
  const id = placeholderId(tree.id);
  state.entities.set(
    id,
    makeEntity(
      id,
      winner.placeholder.x,
      winner.placeholder.y,
      winner.placeholder.width,
      winner.placeholder.height
    )
  );
  let committed = true;
  for (const batch of winner.batches) {
    if (!state.system.tryAdd(state.entities, batch)) {
      committed = false;
      break;
    }
  }
  if (!committed) {
    state.entities.delete(id);
    return null;
  }
  state.placeholders.add(id);
  reservePlaceholderSpace(state, id, tree.coreNodeId);

  // Re-anchor the transformed tree to wherever the projection left the root.
  const finalRoot = state.entities.get(tree.coreNodeId)!;
  const transformed = transformTreeLayout(
    layoutForGrowth(tree, winner.growthDirection),
    ROTATION_FOR_GROWTH[winner.growthDirection],
    winner.flip,
    { x: finalRoot.x + winner.anchorShift.x, y: finalRoot.y + winner.anchorShift.y }
  );

  return {
    treeId: tree.id,
    coreNodeId: tree.coreNodeId,
    faceIndex: winner.face.index,
    isExternalFace: winner.face.isExternal,
    placementDirection: winner.placementDirection,
    growthDirection: winner.growthDirection,
    flip: winner.flip,
    rotation: ROTATION_FOR_GROWTH[winner.growthDirection],
    placeholderId: id,
    transformed,
    offsetX: winner.offsetX,
    offsetY: winner.offsetY,
    anchorShiftX: winner.anchorShift.x,
    anchorShiftY: winner.anchorShift.y,
    stressIncrease: winner.stressIncrease,
  };
}

/**
 * A rigid attachment that is only marginally more expensive than the best slid
 * one wins.
 *
 * `cost` already prices a slide as the stress term it would contribute, but that
 * term is small when the natural rank distance is large: a 25px slide off a 213px
 * attachment scores 0.014, so a rigid placement costing 0.02 more in core stress
 * loses — and the drawing gets a 25px dead stub for nothing. The band expresses
 * the judgement the stress units cannot: a tree at its natural distance is worth
 * a little core stress. Anything beyond the band is a real trade and `cost`
 * decides it.
 */
function preferRigid(evaluated: EvaluatedCandidate[], state: CoreLayoutState): EvaluatedCandidate {
  const winner = evaluated[0];
  if (winner.rigidAnchor) {
    return winner;
  }
  const band = Math.max(RIGID_PREFERENCE_BAND, RIGID_PREFERENCE_FRACTION * winner.cost);
  for (const candidate of evaluated) {
    // Same class only: a rigid placement must not smuggle a tree onto a worse
    // face or an ordinal direction past guide §17.6's first two priorities.
    if (
      candidate.rigidAnchor &&
      candidate.cost <= winner.cost + band &&
      compareClass(candidate, winner, state) === 0
    ) {
      return candidate;
    }
  }
  return winner;
}

const RIGID_PREFERENCE_BAND = 0.5;
const RIGID_PREFERENCE_FRACTION = 0.1;

/** The part of §17.6's order that outranks cost: cardinal, then external face. */
function compareClass(
  a: EvaluatedCandidate,
  b: EvaluatedCandidate,
  state: CoreLayoutState
): number {
  if (state.options.favourCardinalPlacement) {
    const aCardinal = isCardinal(a.placementDirection) ? 0 : 1;
    const bCardinal = isCardinal(b.placementDirection) ? 0 : 1;
    if (aCardinal !== bCardinal) {
      return aCardinal - bCardinal;
    }
  }
  if (state.options.favourExternalFace) {
    const aExternal = a.face.isExternal ? 0 : 1;
    const bExternal = b.face.isExternal ? 0 : 1;
    if (aExternal !== bExternal) {
      return aExternal - bExternal;
    }
  }
  return 0;
}

/**
 * Guide §17.6, as priorities rather than multipliers: a lower-stress internal
 * cardinal placement must not beat an external cardinal one.
 */
function compareCandidates(
  a: EvaluatedCandidate,
  b: EvaluatedCandidate,
  state: CoreLayoutState
): number {
  const byClass = compareClass(a, b, state);
  if (byClass !== 0) {
    return byClass;
  }
  if (Math.abs(a.cost - b.cost) > CLEARANCE_EPSILON) {
    return a.cost - b.cost;
  }
  return describe(a).localeCompare(describe(b));
}

function describe(candidate: EvaluatedCandidate): string {
  return `${candidate.face.index}:${candidate.placementDirection}:${candidate.growthDirection}:${
    candidate.flip ? 1 : 0
  }`;
}

function isCardinal(direction: Direction): direction is Cardinal {
  return direction.length === 1;
}

// ---------------------------------------------------------------------------
// Candidate enumeration (guide §17.2)
// ---------------------------------------------------------------------------

export function enumerateCandidates(
  state: CoreLayoutState,
  planar: PlanarisedCore,
  tree: PlaceableTree
): Candidate[] {
  const faceIndices = planar.dcel.facesAtVertex.get(tree.coreNodeId) ?? [];
  const candidates: Candidate[] = [];

  for (const faceIndex of faceIndices) {
    const face = planar.dcel.faces[faceIndex];
    const wedge = faceWedgeAt(planar, face, tree.coreNodeId);
    for (const direction of ALL_DIRECTIONS) {
      if (!wedge(direction)) {
        continue;
      }
      const growths = isCardinal(direction) ? [direction] : ordinalComponents(direction as Ordinal);
      for (const growth of growths) {
        candidates.push({
          face,
          placementDirection: direction,
          growthDirection: growth,
          flip: false,
        });
        candidates.push({
          face,
          placementDirection: direction,
          growthDirection: growth,
          flip: true,
        });
      }
    }
  }

  void state;
  return candidates;
}

export function ordinalComponents(direction: Ordinal): Cardinal[] {
  switch (direction) {
    case 'NE':
      return ['N', 'E'];
    case 'NW':
      return ['N', 'W'];
    case 'SE':
      return ['S', 'E'];
    case 'SW':
      return ['S', 'W'];
  }
}

/**
 * The angular sector a face occupies at a vertex. Consecutive half-edges of the
 * face at `vertexId` bound a sector containing no other incident edge; a
 * placement direction is valid when it points into that sector.
 */
export function faceWedgeAt(
  planar: PlanarisedCore,
  face: Face,
  vertexId: string
): (direction: Direction) => boolean {
  const halfEdges = planar.dcel.halfEdges;
  const vertices = planar.dcel.vertices;
  const origin = vertices.get(vertexId);
  if (!origin) {
    return () => false;
  }

  const arcs: { from: number; to: number }[] = [];
  for (let i = 0; i < face.halfEdges.length; i++) {
    const current = halfEdges.get(face.halfEdges[i])!;
    if (current.origin !== vertexId) {
      continue;
    }
    const previous = halfEdges.get(
      face.halfEdges[(i - 1 + face.halfEdges.length) % face.halfEdges.length]
    )!;
    const back = halfEdges.get(previous.twin)!;
    const fromAngle = angleOf(vertices, back);
    const toAngle = angleOf(vertices, current);
    arcs.push({ from: fromAngle, to: toAngle });
  }

  if (arcs.length === 0) {
    return () => false;
  }

  return (direction: Direction): boolean => {
    const v = DIRECTION_VECTOR[direction];
    const angle = normaliseAngle(Math.atan2(v.y, v.x));
    return arcs.some(({ from, to }) => inArc(angle, from, to));
  };
}

function angleOf(
  vertices: Map<string, { x: number; y: number }>,
  half: { origin: string; destination: string }
): number {
  const from = vertices.get(half.origin)!;
  const to = vertices.get(half.destination)!;
  return normaliseAngle(Math.atan2(to.y - from.y, to.x - from.x));
}

/** Is `angle` inside the arc running from `from` to `to` in increasing angle? */
function inArc(angle: number, from: number, to: number): boolean {
  const span = normaliseAngle(to - from);
  const offset = normaliseAngle(angle - from);
  if (span < 1e-9) {
    // Degree-1 vertex: the face wraps the whole circle.
    return true;
  }
  return offset > 1e-9 && offset < span - 1e-9;
}

// ---------------------------------------------------------------------------
// Candidate evaluation, expansion plans and backtracking (guide §17.4, §17.5)
// ---------------------------------------------------------------------------

type ExpansionOrder = 'x-then-y' | 'y-then-x';

/**
 * One expansion plan: the axis order of guide §17.4, plus how much of the face
 * boundary it constrains.
 *
 * `needed` only separates the placeholder from blocks that are not already clear
 * of it on the other axis, and stops as soon as the placeholder fits. That is
 * the plan that opens the core up locally.
 *
 * `boundary` constrains the whole face boundary on both axes. It is the older,
 * blunter operation: it always makes room, but it makes it by driving the
 * placeholder into a corner outside everything. Kept only as the last rung of
 * the ladder, so a tight core still gets a drawing (guide §25).
 */
interface ExpansionPlan {
  order: ExpansionOrder;
  scope: 'needed' | 'boundary';
}

const EXPANSION_PLANS: ExpansionPlan[] = [
  { order: 'x-then-y', scope: 'needed' },
  { order: 'y-then-x', scope: 'needed' },
  { order: 'x-then-y', scope: 'boundary' },
  { order: 'y-then-x', scope: 'boundary' },
];

function evaluateCandidate(
  state: CoreLayoutState,
  planar: PlanarisedCore,
  tree: PlaceableTree,
  candidate: Candidate,
  model: StressModel
): EvaluatedCandidate | null {
  const coreNode = state.entities.get(tree.coreNodeId)!;
  const source = layoutForGrowth(tree, candidate.growthDirection);
  const rotation = ROTATION_FOR_GROWTH[candidate.growthDirection];

  const draw = (shift: Point): { transformed: TreeLayout; occupied: Bounds } | undefined => {
    const transformed = transformTreeLayout(source, rotation, candidate.flip, {
      x: coreNode.x + shift.x,
      y: coreNode.y + shift.y,
    });
    const occupied = occupiedBounds(transformed, tree.rootCopyId);
    return occupied ? { transformed, occupied } : undefined;
  };

  let drawn = draw(ZERO_SHIFT);
  if (!drawn) {
    return null;
  }

  // An ordinal placement is a *corner* placement, and that has to be geometry, not
  // just a label: without this the tree is centred on its root's row or column
  // exactly as the cardinal candidate is, and the two are the same drawing scored
  // twice (guide §17.2 — a direction points into a face's wedge, and an ordinal
  // wedge is the quadrant between two neighbours). Offsetting the tree clear of the
  // core node along the ordinal's *other* component puts it in that quadrant, which
  // is the only place it fits when all four sides of its root are taken.
  let anchorShift = ZERO_SHIFT;
  if (!isCardinal(candidate.placementDirection)) {
    const other = ordinalComponents(candidate.placementDirection).find(
      (component) => component !== candidate.growthDirection
    );
    if (other) {
      anchorShift = clearanceShift(other, coreNode, drawn.occupied, state.options.nodeClearance);
      drawn = draw(anchorShift) ?? drawn;
    }
  }

  const { transformed, occupied } = drawn;
  const placeholder = {
    id: placeholderId(tree.id),
    x: (occupied.minX + occupied.maxX) / 2,
    y: (occupied.minY + occupied.maxY) / 2,
    width: boundsWidth(occupied),
    height: boundsHeight(occupied),
  };

  const offsetX = placeholder.x - coreNode.x;
  const offsetY = placeholder.y - coreNode.y;

  let best: EvaluatedCandidate | null = null;

  // Two ways to attach and two expansion orders, all in competition. The rigid
  // anchor is what forces the *core* to open up; the hinge lets the tree slide
  // outwards instead. Sliding is nearly free in core stress — the placeholder is
  // not a core node — so it would win every time on stress alone, which is how a
  // tree ends up far out to the right with a long empty connector. `cost` prices
  // the slide as the stress term the root-to-tree pair would contribute, so the
  // comparison is between two real costs (guide §17.5: the tree takes part in the
  // stress evaluation, in transformed coordinates).
  for (const rigid of [true, false]) {
    const anchor = anchorConstraints(
      candidate.growthDirection,
      tree.coreNodeId,
      placeholder.id,
      offsetX,
      offsetY,
      rigid
    );
    for (const plan of EXPANSION_PLANS) {
      const trial = tryExpansionPlan(
        state,
        planar,
        tree,
        candidate,
        placeholder,
        anchor,
        plan,
        model
      );
      if (trial && (best === null || trial.cost < best.cost)) {
        best = {
          ...candidate,
          ...trial,
          transformed,
          placeholder,
          offsetX,
          offsetY,
          anchorShift,
          rigidAnchor: rigid,
        };
      }
    }
  }

  return best;
}

/**
 * What sliding a tree away from its root costs, in the same units as stress.
 *
 * The core stress model has no term for the placeholder, so a plan that shoves
 * the tree outwards scores almost nothing while a plan that spreads the core
 * scores the whole displacement of every core node it moved. Adding back the
 * term the root-to-tree pair would have contributed — `w · (d − D)²` with
 * `D` the natural attachment distance and `w = 1/D²`, exactly the convention of
 * guide §7.4 — makes the two comparable.
 */
const ZERO_SHIFT: Point = { x: 0, y: 0 };

/**
 * How far to move a tree so its footprint clears the core node in one direction.
 * Zero when it already does.
 */
export function clearanceShift(
  direction: Cardinal,
  core: HolaNode,
  occupied: Bounds,
  clearance: number
): Point {
  switch (direction) {
    case 'N': {
      const overlap = occupied.maxY - (core.y - core.height / 2 - clearance);
      return overlap > 0 ? { x: 0, y: -overlap } : ZERO_SHIFT;
    }
    case 'S': {
      const overlap = core.y + core.height / 2 + clearance - occupied.minY;
      return overlap > 0 ? { x: 0, y: overlap } : ZERO_SHIFT;
    }
    case 'W': {
      const overlap = occupied.maxX - (core.x - core.width / 2 - clearance);
      return overlap > 0 ? { x: -overlap, y: 0 } : ZERO_SHIFT;
    }
    case 'E': {
      const overlap = core.x + core.width / 2 + clearance - occupied.minX;
      return overlap > 0 ? { x: overlap, y: 0 } : ZERO_SHIFT;
    }
  }
}

function slideCost(naturalDistance: number, actualDistance: number): number {
  const ideal = Math.max(Math.abs(naturalDistance), 1);
  const excess = Math.abs(actualDistance) - ideal;
  if (excess <= 0) {
    return 0;
  }
  return (excess * excess) / (ideal * ideal);
}

/**
 * The placeholder's attachment to its core node (guide §17.3, "root anchor").
 *
 * Across the growth axis the tree is always *aligned* with its root, so the
 * first rank is centred on it. Along the growth axis:
 *
 * - `rigid` — aligned too, at exactly the natural rank distance. The tree
 *   cannot be pushed away from its root, so face expansion has to move the
 *   *core* instead, which is what makes room without a long dead connector.
 * - otherwise — a separation, i.e. "at least the natural distance". This is the
 *   fallback for a core so tight that nothing rigid is feasible; the tree then
 *   travels with its placeholder (see `restoreTrees`).
 */
function anchorConstraints(
  growth: Cardinal,
  root: string,
  placeholder: string,
  offsetX: number,
  offsetY: number,
  rigid: boolean
): Constraint[] {
  const vertical = growth === 'S' || growth === 'N';
  const acrossAxis = vertical ? 'x' : 'y';
  const alongAxis = vertical ? 'y' : 'x';
  const acrossOffset = vertical ? offsetX : offsetY;
  const alongOffset = vertical ? offsetY : offsetX;

  const across = alignment(acrossAxis, root, placeholder, 'tree-placement', acrossOffset);
  if (rigid) {
    return [across, alignment(alongAxis, root, placeholder, 'tree-placement', alongOffset)];
  }
  // `alongOffset` is positive growing S/E and negative growing N/W; the
  // separation is stated so that its gap is the positive natural distance.
  const along =
    alongOffset >= 0
      ? separation(alongAxis, root, placeholder, alongOffset, 'tree-placement')
      : separation(alongAxis, placeholder, root, -alongOffset, 'tree-placement');
  return [across, along];
}

function tryExpansionPlan(
  state: CoreLayoutState,
  planar: PlanarisedCore,
  tree: PlaceableTree,
  candidate: Candidate,
  placeholder: { id: string; x: number; y: number; width: number; height: number },
  anchor: Constraint[],
  plan: ExpansionPlan,
  model: StressModel
): { batches: Constraint[][]; stressIncrease: number; cost: number } | null {
  const { system, entities } = state;

  const snapshot = system.snapshot(entities);
  const stressBefore = model.value(entities);
  const hadPlaceholder = entities.has(placeholder.id);

  entities.set(
    placeholder.id,
    makeEntity(placeholder.id, placeholder.x, placeholder.y, placeholder.width, placeholder.height)
  );

  const batches: Constraint[][] = [];
  let ok = system.isFeasible(entities, anchor);
  if (ok) {
    system.addAll(anchor);
    batches.push(anchor);
    ok = system.project(entities).feasible;
  }

  if (ok) {
    const axes = plan.order === 'x-then-y' ? (['x', 'y'] as const) : (['y', 'x'] as const);
    for (const axis of axes) {
      // Guide §17.4 lists "horizontal then vertical" and "vertical then
      // horizontal" as two *plans*, not as one pass that always does both:
      // expanding on the second axis as well, when the first already made room,
      // over-constrains the placeholder into a corner far outside the core.
      if (plan.scope === 'needed' && !placeholderOverlaps(state, placeholder.id, tree.coreNodeId)) {
        break;
      }
      const expansion = expansionConstraintsFor(
        state,
        planar,
        tree,
        candidate.face,
        placeholder.id,
        axis,
        plan.scope
      );
      if (expansion.length === 0) {
        continue;
      }
      // Add what the solver can take. A single boundary node that cannot move
      // must not sink the whole plan — the rest of the face can still open up,
      // and `placeholderOverlaps` below is the arbiter of whether that was
      // enough.
      const accepted: Constraint[] = [];
      for (const constraint of expansion) {
        if (system.isFeasible(entities, [constraint])) {
          system.addAll([constraint]);
          accepted.push(constraint);
        }
      }
      if (accepted.length === 0) {
        continue;
      }
      batches.push(accepted);
      if (!system.project(entities).feasible) {
        ok = false;
        break;
      }
    }
  }

  const stillOverlapping = ok && placeholderOverlaps(state, placeholder.id, tree.coreNodeId);
  const stressAfter = ok && !stillOverlapping ? model.value(entities) : Number.POSITIVE_INFINITY;

  // How far the projection actually pushed the tree away from its root, along
  // the growth axis, measured before the snapshot is restored.
  const vertical = candidate.growthDirection === 'S' || candidate.growthDirection === 'N';
  const naturalAlong = vertical
    ? placeholder.y - (entities.get(tree.coreNodeId)?.y ?? placeholder.y)
    : placeholder.x - (entities.get(tree.coreNodeId)?.x ?? placeholder.x);
  const projectedPlaceholder = entities.get(placeholder.id);
  const projectedRoot = entities.get(tree.coreNodeId);
  const actualAlong =
    projectedPlaceholder && projectedRoot
      ? vertical
        ? projectedPlaceholder.y - projectedRoot.y
        : projectedPlaceholder.x - projectedRoot.x
      : naturalAlong;

  // Backtrack unconditionally: evaluation must not leave a trace.
  system.restore(snapshot, entities);
  if (!hadPlaceholder) {
    entities.delete(placeholder.id);
  }

  if (!ok || stillOverlapping || !isFinite(stressAfter)) {
    return null;
  }
  const stressIncrease = Math.max(0, stressAfter - stressBefore);
  return {
    batches,
    stressIncrease,
    cost: stressIncrease + slideCost(naturalAlong, actualAlong),
  };
}

/**
 * Face expansion along one axis (guide §17.4).
 *
 * This is HOLA's answer to "the core is too small for the tree". The space is
 * not reserved by a global pre-pass and not created by translating the tree: the
 * *face boundary* is pushed outwards by separation constraints, and because
 * every earlier alignment is still active, the core grows while keeping the
 * shape node and chain configuration gave it. Room is therefore only spent
 * where a tree actually needs it.
 *
 * The constraints are generated for the whole boundary, not just for nodes that
 * already overlap — that is what makes them *create* room rather than merely
 * react to a collision. Which side each boundary node is pushed to comes from
 * the side it is already on, so the planar embedding is preserved.
 *
 * Committed placeholders of earlier (larger) trees are treated as boundary too,
 * so two trees hanging off the same small core open up space against each other
 * instead of colliding.
 */
export function expansionConstraintsFor(
  state: CoreLayoutState,
  planar: PlanarisedCore,
  tree: PlaceableTree,
  face: Face,
  placeholderEntityId: string,
  axis: 'x' | 'y',
  scope: 'needed' | 'boundary' = 'needed'
): Constraint[] {
  const placeholder = state.entities.get(placeholderEntityId);
  if (!placeholder) {
    return [];
  }

  const obstructing = obstructingEntities(state, planar, tree, face, placeholderEntityId);
  const constraints: Constraint[] = [];

  for (const other of obstructing) {
    const gap =
      axis === 'x'
        ? (placeholder.width + other.width) / 2 + state.options.nodeClearance
        : (placeholder.height + other.height) / 2 + state.options.nodeClearance;

    // Two rectangles are clear of each other as soon as they are separated on
    // *one* axis. If the other axis already does that job, a constraint on this
    // one buys nothing and costs a great deal: asking the placeholder to clear
    // every core node horizontally pushes it past the whole width of the core.
    const gapOnOtherAxis =
      axis === 'x'
        ? (placeholder.height + other.height) / 2 + state.options.nodeClearance
        : (placeholder.width + other.width) / 2 + state.options.nodeClearance;
    const distanceOnOtherAxis =
      axis === 'x' ? Math.abs(other.y - placeholder.y) : Math.abs(other.x - placeholder.x);
    if (scope === 'needed' && distanceOnOtherAxis >= gapOnOtherAxis - CLEARANCE_EPSILON) {
      continue;
    }

    const otherIsAfter = axis === 'x' ? other.x >= placeholder.x : other.y >= placeholder.y;

    constraints.push(
      otherIsAfter
        ? separation(axis, placeholderEntityId, other.id, gap, 'face-expansion')
        : separation(axis, other.id, placeholderEntityId, gap, 'face-expansion')
    );
  }

  // Push the nodes that are actually in the way first: on a tight face the
  // solver has less work to undo, and the resulting stress increase — which is
  // what ranks this candidate — stays comparable between the two orders.
  const placeholderRect = nodeBounds(placeholder);
  return constraints.sort((a, b) => {
    const aOverlap = overlapsPlaceholder(state, a, placeholderEntityId, placeholderRect);
    const bOverlap = overlapsPlaceholder(state, b, placeholderEntityId, placeholderRect);
    if (aOverlap !== bOverlap) {
      return aOverlap ? -1 : 1;
    }
    return 0;
  });
}

/**
 * The blocks a placement has to make room against: the real nodes on this
 * face's boundary, plus every placeholder already committed. Dummy bend and
 * crossing nodes carry no area, so they cannot obstruct.
 */
function obstructingEntities(
  state: CoreLayoutState,
  planar: PlanarisedCore,
  tree: PlaceableTree,
  face: Face,
  placeholderEntityId: string
): HolaNode[] {
  const wanted = new Set<string>();

  for (const vertexId of face.boundary) {
    const planarNode = planar.nodes.get(vertexId);
    if (planarNode && planarNode.kind !== 'core') {
      continue;
    }
    wanted.add(vertexId);
  }

  // The external face's boundary is the outline of the whole core, so a tree
  // placed there must also clear anything the outline does not mention.
  if (face.isExternal) {
    for (const entity of state.entities.values()) {
      if (entity.width > 0 && entity.height > 0) {
        wanted.add(entity.id);
      }
    }
  }

  // Already-committed sibling placeholders.
  for (const entity of state.entities.values()) {
    if (
      entity.id !== placeholderEntityId &&
      entity.width > 0 &&
      entity.height > 0 &&
      state.placeholders.has(entity.id)
    ) {
      wanted.add(entity.id);
    }
  }

  wanted.delete(placeholderEntityId);
  wanted.delete(tree.coreNodeId);

  const result: HolaNode[] = [];
  for (const id of [...wanted].sort()) {
    const entity = state.entities.get(id);
    if (entity && entity.width > 0 && entity.height > 0) {
      result.push(entity);
    }
  }
  return result;
}

function overlapsPlaceholder(
  state: CoreLayoutState,
  constraint: Constraint,
  placeholderEntityId: string,
  placeholderRect: ReturnType<typeof nodeBounds>
): boolean {
  if (constraint.kind !== 'separation') {
    return false;
  }
  const otherId =
    constraint.leftOrAbove === placeholderEntityId
      ? constraint.rightOrBelow
      : constraint.leftOrAbove;
  const other = state.entities.get(otherId);
  return other ? rectsOverlap(placeholderRect, nodeBounds(other)) : false;
}

/**
 * Guide §17.3: a committed placeholder carries *occupied-space constraints*.
 * Without them the space a tree needs is only checked once, and the stress
 * recovery that HOLA runs afterwards is free to walk a core node straight into
 * it. Each nearby entity gets one separation constraint, on whichever axis
 * currently has the most room, so the reservation is as weak as it can be while
 * still holding.
 */
function reservePlaceholderSpace(
  state: CoreLayoutState,
  placeholderEntityId: string,
  anchorId: string
): void {
  const placeholder = state.entities.get(placeholderEntityId);
  if (!placeholder) {
    return;
  }
  const reach = state.options.baseEdgeLength * 2;

  for (const other of state.entities.values()) {
    if (other.id === placeholderEntityId || other.id === anchorId) {
      continue;
    }
    if (other.width <= 0 || other.height <= 0) {
      continue;
    }
    const dx = other.x - placeholder.x;
    const dy = other.y - placeholder.y;
    const needX = (placeholder.width + other.width) / 2 + state.options.nodeClearance;
    const needY = (placeholder.height + other.height) / 2 + state.options.nodeClearance;
    if (Math.abs(dx) > needX + reach && Math.abs(dy) > needY + reach) {
      continue;
    }

    const axis: 'x' | 'y' = Math.abs(dx) - needX >= Math.abs(dy) - needY ? 'x' : 'y';
    const gap = axis === 'x' ? needX : needY;
    const otherIsAfter = axis === 'x' ? dx >= 0 : dy >= 0;
    const constraint = otherIsAfter
      ? separation(axis, placeholderEntityId, other.id, gap, 'tree-placement')
      : separation(axis, other.id, placeholderEntityId, gap, 'tree-placement');

    state.system.tryAdd(state.entities, [constraint]);
  }
}

/**
 * The space a placed tree actually occupies, excluding the copied root — the
 * copy *is* the core node, so counting it would make every candidate collide
 * with its own anchor.
 */
function occupiedBounds(layout: TreeLayout, rootCopyId: string): Bounds | undefined {
  const parts: Bounds[] = [];
  for (const node of layout.nodes.values()) {
    if (node.id === rootCopyId) {
      continue;
    }
    parts.push({
      minX: node.x - node.width / 2,
      minY: node.y - node.height / 2,
      maxX: node.x + node.width / 2,
      maxY: node.y + node.height / 2,
    });
  }
  for (const edge of layout.edges) {
    const b = pointBounds(edge.route);
    if (b) {
      parts.push(b);
    }
  }
  return unionBounds(parts);
}

function placeholderOverlaps(
  state: CoreLayoutState,
  placeholderEntityId: string,
  anchorId: string
): boolean {
  const placeholder = state.entities.get(placeholderEntityId);
  if (!placeholder) {
    return false;
  }
  const rect = nodeBounds(placeholder);
  for (const other of state.entities.values()) {
    if (other.id === placeholderEntityId || other.id === anchorId) {
      continue;
    }
    if (other.width <= 0 || other.height <= 0) {
      continue;
    }
    if (rectsOverlap(rect, nodeBounds(other))) {
      return true;
    }
  }
  return false;
}

/** Placeholder rectangle for a committed placement, for tests and diagnostics. */
export function placeholderRectOf(
  state: CoreLayoutState,
  placement: TreePlacement
): HolaNode | undefined {
  return state.entities.get(placement.placeholderId);
}

export function placementAnchorPoint(placement: TreePlacement): Point {
  return placement.transformed.rootPosition;
}
