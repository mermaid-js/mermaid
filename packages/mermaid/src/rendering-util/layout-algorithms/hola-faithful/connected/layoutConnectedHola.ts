/**
 * The connected-component pipeline (guide §8, `LayoutConnectedHola`).
 *
 * Stage order is normative and is exactly the order below. Every stage shares
 * one constraint system, so the alignments and separations an early stage adds
 * are still binding when a later stage optimises.
 */

import type { Axis, Bounds, Cardinal, HolaGraph, HolaNode, Point, Side } from '../model.js';
import { nodeBounds, pointBounds, rectsOverlap, unionBounds } from '../model.js';
import type { HolaOptions } from '../options.js';
import type { DiagnosticCollector } from '../diagnostics.js';
import { ConstraintSystem } from '../constraints/solver.js';
import type { Constraint } from '../constraints/types.js';
import { alignment, separation } from '../constraints/types.js';
import type { ConstraintOrigin } from '../constraints/types.js';
import { StressModel } from '../stress/stressModel.js';
import { gradientProjectStress } from '../stress/gradientProjection.js';
import { removeOverlapsWithConstraints } from '../stress/overlapRemoval.js';
import type { OverlapRect } from '../stress/overlapRemoval.js';
import { decompose } from '../decomposition/peelCoreAndTrees.js';
import type { DecomposedTree } from '../decomposition/peelCoreAndTrees.js';
import { configureCoreNodes } from '../orthogonalization/nodeConfiguration.js';
import { configureCoreChains } from '../orthogonalization/chainConfiguration.js';
import { routeCoreEdges } from '../routing/coreRouting.js';
import { layoutTree, transformTreeLayout } from '../trees/symmetricTreeLayout.js';
import { planariseCore, PlanarisationError } from '../planarization/planarise.js';
import { layoutForGrowth, placeTrees, ROTATION_FOR_GROWTH } from '../placement/placeTrees.js';
import type { PlaceableTree, TreePlacement } from '../placement/placeTrees.js';
import { opportunisticallyAlign } from '../improvement/opportunisticAlignment.js';
import { rotateGrowth, rotateLandscapeIfNeeded } from '../improvement/rotation.js';
import { routeFinalEdges } from '../routing/finalRouting.js';
import type { FinalEdge, RoutedFinalEdge } from '../routing/finalRouting.js';
import type { CoreLayoutState } from '../state.js';
import type { DeferredEdge } from '../model.js';

export interface ConnectedLayoutInput {
  componentId: string;
  graph: HolaGraph;
  options: HolaOptions;
  diagnostics: DiagnosticCollector;
  /** Self-loops belonging to this component, routed at the end. */
  selfLoops: DeferredEdge[];
}

export interface ConnectedLayoutResult {
  componentId: string;
  /** Final positions of the real Mermaid nodes only. */
  nodes: Map<string, HolaNode>;
  edges: RoutedFinalEdge[];
  bounds: Bounds;
  /** Growth directions of the placed trees, for diagnostics and tests. */
  treeGrowths: Cardinal[];
}

export function layoutConnectedHola(input: ConnectedLayoutInput): ConnectedLayoutResult {
  const { componentId, graph, options, diagnostics } = input;

  const decomposition = decompose(graph);

  if (decomposition.pureTree) {
    return finaliseComponent(
      input,
      layoutPureTree(input, decomposition.pureTree.graph, decomposition.pureTree.rootId),
      []
    );
  }

  // ---- Step 2a: initial core stress layout, then overlap removal ---------
  const state = createCoreState(componentId, decomposition.core, options, diagnostics);
  seedPositions(state.entities, options);

  const coreIds = [...state.core.nodes.keys()];
  const allPairs = StressModel.allPairs(coreIds, state.core.adjacency, options.baseEdgeLength);

  gradientProjectStress(state.entities, allPairs, state.system, {
    maxIterations: options.stressMaxIterations,
    tolerance: options.stressTolerance,
  });

  enforceNoOverlaps(state, 'overlap-removal');

  // ---- Step 2b: node configuration, stress recovery, chain configuration --
  const configured = configureCoreNodes(
    state.entities,
    state.core.adjacency,
    state.system,
    options,
    diagnostics,
    componentId
  );
  state.fixedDirections = configured.fixedDirections;

  gradientProjectStress(state.entities, allPairs, state.system, {
    maxIterations: options.stressMaxIterations,
    tolerance: options.stressTolerance,
  });

  configureCoreChains(state);

  // ---- Step 2c: orthogonal core routing before planarisation -------------
  routeCoreEdges(state);

  // ---- Step 3a: lay every attached tree out on its own -------------------
  const placeable: PlaceableTree[] = decomposition.trees.map((tree) => ({
    id: tree.id,
    coreNodeId: tree.coreNodeId,
    rootCopyId: tree.rootCopyId,
    layout: layoutTree(tree.graph, tree.rootCopyId, {
      rankGap: options.treeRankGap,
      siblingGap: options.treeSiblingGap,
      growthAxis: 'vertical',
    }),
    layoutForHorizontalGrowth: layoutTree(tree.graph, tree.rootCopyId, {
      rankGap: options.treeRankGap,
      siblingGap: options.treeSiblingGap,
      growthAxis: 'horizontal',
    }),
  }));

  // ---- Step 3b/3c: planarise, then place trees ---------------------------
  let placements: TreePlacement[] = [];
  try {
    const planar = planariseCore(
      state.core.nodes,
      [...state.core.edges.values()].filter((e) => e.route.length >= 2)
    );
    if (placeable.length > 0) {
      placements = placeTrees(state, planar, placeable, allPairs).placements;
    }
  } catch (error) {
    diagnostics.report({
      code:
        error instanceof PlanarisationError
          ? 'HOLA_PLANARISATION_NON_ORTHOGONAL_INPUT'
          : 'HOLA_DCEL_INVALID',
      stage: 'planarisation',
      componentId,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  // ---- Step 3d: stress recovery with everything in place -----------------
  gradientProjectStress(state.entities, allPairs, state.system, {
    maxIterations: options.stressMaxIterations,
    tolerance: options.stressTolerance,
  });
  // Placeholders joined the drawing after the first overlap pass, and stress
  // has moved core nodes since; re-establish non-overlap as constraints.
  enforceNoOverlaps(state, 'post-placement-overlap-removal');
  retractSlidTrees(state, placements);

  // ---- Step 4a/4b: opportunistic alignment then neighbour stress ---------
  opportunisticallyAlign(
    state.entities,
    state.system,
    options.baseEdgeLength * options.alignmentToleranceFraction
  );

  const neighbours = StressModel.neighboursOnly(
    coreIds,
    state.core.adjacency,
    options.baseEdgeLength
  );
  gradientProjectStress(state.entities, neighbours, state.system, {
    maxIterations: options.neighbourStressMaxIterations,
    tolerance: options.stressTolerance,
  });
  enforceNoOverlaps(state, 'neighbour-stress-overlap-removal');

  // ---- Step 4c: orientation ----------------------------------------------
  const growths = placements.map((p) => p.growthDirection);
  const rotation = rotateLandscapeIfNeeded({
    entities: state.entities,
    polylines: [...state.core.edges.values()].map((e) => e.route),
    treeGrowths: growths,
    regionIds: new Set(placements.map((p) => p.placeholderId)),
    system: state.system,
  });
  if (rotation.rotated) {
    gradientProjectStress(state.entities, neighbours, state.system, {
      maxIterations: options.neighbourStressMaxIterations,
      tolerance: options.stressTolerance,
    });
  }

  // A deliberate chain bend is a point the final route *must* pass through, so
  // it has to be clear of every node body (invariant 18 needs "no route crosses
  // a foreign node interior" to stay satisfiable). Freeing a bend projects, and
  // projecting can nudge nodes, so the two settle together.
  for (let pass = 0; pass < 2; pass++) {
    separateBendsFromNodes(state);
    enforceNoOverlaps(state, 'pre-routing-overlap-removal');
  }
  relaxUntilOverlapFree(state);

  // ---- Step 4d: restore real tree nodes, then final routing --------------
  const finalGrowths: Cardinal[] = growths.map((g) =>
    rotation.rotated && rotation.direction ? rotateGrowth(g, rotation.direction) : g
  );

  const sources = new Map(
    decomposition.trees.map((tree, index) => [tree.id, { tree, placeable: placeable[index] }])
  );
  const restored = restoreTrees(state, sources, placements, finalGrowths);
  return finaliseComponent(input, restored, finalGrowths);
}

/** Parent side, child side — for a tree grown in each cardinal direction. */
const RANK_SIDES: Record<Cardinal, [Side, Side]> = {
  S: ['bottom', 'top'],
  N: ['top', 'bottom'],
  E: ['right', 'left'],
  W: ['left', 'right'],
};

interface TreeSource {
  tree: DecomposedTree;
  /** Both SOUTH-growing drawings from Step 3a, so restore can match the axis. */
  placeable: PlaceableTree;
}

// ---------------------------------------------------------------------------

interface RestoredComponent {
  nodes: Map<string, HolaNode>;
  /**
   * Tree connectors, handed to the final router with their rank-facing sides
   * locked. Baking the route here instead would skip obstacle avoidance: a core
   * node can sit beside the corridor between a root and its first rank.
   */
  treeEdges: FinalEdge[];
  /** Mandatory waypoints per topological edge, refreshed from the bends. */
  waypointsByEdge: Map<string, Point[]>;
  graph: HolaGraph;
}

function restoreTrees(
  state: CoreLayoutState,
  sources: Map<string, TreeSource>,
  placements: TreePlacement[],
  finalGrowths: Cardinal[]
): RestoredComponent {
  const nodes = new Map<string, HolaNode>();
  for (const node of state.core.nodes.values()) {
    const entity = state.entities.get(node.id);
    nodes.set(node.id, { ...node, x: entity?.x ?? node.x, y: entity?.y ?? node.y });
  }

  const treeEdges: FinalEdge[] = [];

  placements.forEach((placement, index) => {
    const source = sources.get(placement.treeId);
    if (!source) {
      return;
    }
    const tree = source.tree;
    const root = nodes.get(placement.coreNodeId);
    if (!root) {
      return;
    }
    // Re-transform from the original SOUTH-growing layout onto the *final*
    // root position, using the growth direction after any global rotation.
    // The placeholder is hinged rather than welded to its root, so if overlap
    // resolution slid it further out the tree travels with it.
    const growth = finalGrowths[index] ?? placement.growthDirection;
    const rotated = rotateOffset(
      { x: placement.offsetX, y: placement.offsetY },
      placement.rotation,
      ROTATION_FOR_GROWTH[growth]
    );
    const placeholder = state.entities.get(placement.placeholderId);
    const slide = placeholder
      ? { x: placeholder.x - (root.x + rotated.x), y: placeholder.y - (root.y + rotated.y) }
      : { x: 0, y: 0 };

    const transformed = transformTreeLayout(
      layoutForGrowth(source.placeable, growth),
      ROTATION_FOR_GROWTH[growth],
      placement.flip,
      { x: root.x + slide.x, y: root.y + slide.y }
    );

    for (const node of transformed.nodes.values()) {
      if (node.id === tree.rootCopyId) {
        continue;
      }
      const source = tree.graph.nodes.get(node.id);
      nodes.set(node.id, {
        id: node.id,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        inputOrder: source?.inputOrder ?? 0,
        original: source?.original,
      });
    }

    // Rank-facing sides for this tree's final growth direction: the parent
    // leaves through the side facing the child's rank, the child enters through
    // the side facing the parent's.
    const [parentSide, childSide] = RANK_SIDES[growth];

    for (const edge of transformed.edges) {
      const sourceId = edge.source === tree.rootCopyId ? tree.coreNodeId : edge.source;
      const targetId = edge.target === tree.rootCopyId ? tree.coreNodeId : edge.target;
      const originals = originalEdgeIdsBetween(tree, edge.source, edge.target);
      originals.forEach((originalEdgeId, index) => {
        treeEdges.push({
          originalEdgeId,
          source: sourceId,
          target: targetId,
          mandatoryWaypoints: [],
          parallelIndex: index,
          parallelCount: originals.length,
          lockedSourceSide: parentSide,
          lockedTargetSide: childSide,
        });
      });
    }

    // The placeholder has done its job.
    state.entities.delete(placement.placeholderId);
  });

  // Refresh chain waypoints from the bend entities' final positions.
  const waypointsByEdge = new Map<string, Point[]>();
  for (const edge of state.core.edges.values()) {
    if (edge.mandatoryWaypoints.length === 0) {
      continue;
    }
    const points = [...edge.mandatoryWaypoints]
      .sort((a, b) => a.order - b.order)
      .map((w) => {
        const entity = state.entities.get(w.id);
        return entity ? { x: entity.x, y: entity.y } : { x: w.x, y: w.y };
      });
    waypointsByEdge.set(edge.id, points);
  }

  return { nodes, treeEdges, waypointsByEdge, graph: state.core };
}

/**
 * The natural placeholder offset was recorded before the component was rotated;
 * bring it into the current frame by applying the same quarter turn.
 */
function rotateOffset(offset: Point, from: number, to: number): Point {
  const quarters = ((((to - from) / 90) % 4) + 4) % 4;
  let p = offset;
  for (let i = 0; i < quarters; i++) {
    p = { x: p.y, y: -p.x };
  }
  return p;
}

function originalEdgeIdsBetween(tree: DecomposedTree, a: string, b: string): string[] {
  for (const edge of tree.graph.edges.values()) {
    if ((edge.source === a && edge.target === b) || (edge.source === b && edge.target === a)) {
      return edge.originalEdgeIds;
    }
  }
  return [];
}

function layoutPureTree(
  input: ConnectedLayoutInput,
  graph: HolaGraph,
  rootId: string
): RestoredComponent {
  const layout = layoutTree(graph, rootId, {
    rankGap: input.options.treeRankGap,
    siblingGap: input.options.treeSiblingGap,
  });

  const nodes = new Map<string, HolaNode>();
  for (const node of layout.nodes.values()) {
    const source = graph.nodes.get(node.id)!;
    nodes.set(node.id, { ...source, x: node.x, y: node.y });
  }

  const treeEdges: FinalEdge[] = [];
  const [parentSide, childSide] = RANK_SIDES.S;
  for (const edge of layout.edges) {
    const originals = originalIdsInGraph(graph, edge.source, edge.target);
    originals.forEach((originalEdgeId, index) => {
      treeEdges.push({
        originalEdgeId,
        source: edge.source,
        target: edge.target,
        mandatoryWaypoints: [],
        parallelIndex: index,
        parallelCount: originals.length,
        lockedSourceSide: parentSide,
        lockedTargetSide: childSide,
      });
    });
  }

  return { nodes, treeEdges, waypointsByEdge: new Map(), graph };
}

function originalIdsInGraph(graph: HolaGraph, a: string, b: string): string[] {
  for (const edge of graph.edges.values()) {
    if ((edge.source === a && edge.target === b) || (edge.source === b && edge.target === a)) {
      return edge.originalEdgeIds;
    }
  }
  return [];
}

/**
 * Restore parallel edges and self-loops, route everything that tree layout did
 * not already route, and report the component's bounds.
 */
function finaliseComponent(
  input: ConnectedLayoutInput,
  restored: RestoredComponent,
  treeGrowths: Cardinal[]
): ConnectedLayoutResult {
  const finalEdges: FinalEdge[] = [...restored.treeEdges];
  const alreadyRouted = new Set(finalEdges.map((e) => e.originalEdgeId));

  for (const edge of restored.graph.edges.values()) {
    const originals = edge.originalEdgeIds.filter((id) => !alreadyRouted.has(id));
    originals.forEach((originalEdgeId, index) => {
      finalEdges.push({
        originalEdgeId,
        source: edge.source,
        target: edge.target,
        mandatoryWaypoints: restored.waypointsByEdge.get(edge.id) ?? [],
        parallelIndex: index,
        parallelCount: originals.length,
      });
    });
  }

  input.selfLoops.forEach((loop, index) => {
    if (!restored.nodes.has(loop.source)) {
      return;
    }
    finalEdges.push({
      originalEdgeId: loop.originalEdgeId,
      source: loop.source,
      target: loop.target,
      mandatoryWaypoints: [],
      parallelIndex: index,
      parallelCount: input.selfLoops.length,
    });
  });

  const routed = routeFinalEdges(
    restored.nodes,
    finalEdges,
    input.options,
    input.diagnostics,
    input.componentId
  );

  const edges = routed.edges;
  const boundsList: Bounds[] = [...restored.nodes.values()].map((n) => nodeBounds(n));
  for (const edge of edges) {
    const b = pointBounds(edge.points);
    if (b) {
      boundsList.push(b);
    }
  }

  return {
    componentId: input.componentId,
    nodes: restored.nodes,
    edges,
    bounds: unionBounds(boundsList) ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    treeGrowths,
  };
}

// ---------------------------------------------------------------------------

/**
 * Constraint-based non-overlap for every sized entity, including committed
 * tree placeholders. Expressed as persistent separation constraints so a later
 * stage cannot undo it (guide §7.5).
 */
function enforceNoOverlaps(state: CoreLayoutState, stage: string): void {
  const rects = new Map<string, OverlapRect>();
  for (const node of state.entities.values()) {
    if (node.width > 0 && node.height > 0) {
      rects.set(node.id, {
        id: node.id,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
      });
    }
  }
  if (rects.size < 2) {
    return;
  }
  const outcome = removeOverlapsWithConstraints(
    rects,
    state.entities,
    state.system,
    state.options.nodeClearance,
    state.options.overlapMaxRounds
  );
  if (!outcome.resolved) {
    state.diagnostics.report({
      code: 'HOLA_CONSTRAINT_INFEASIBLE',
      stage,
      componentId: state.componentId,
      message: 'Overlap removal did not converge within the round limit.',
      detail: { rounds: outcome.rounds },
    });
  }
}

/**
 * Push any chain bend that has drifted inside a node body back out, along
 * whichever axis needs the smaller move, through the constraint system.
 */
function separateBendsFromNodes(state: CoreLayoutState): void {
  const clearance = state.options.routingClearance;
  const sized = [...state.entities.values()].filter((n) => n.width > 0 && n.height > 0);

  for (const bendId of state.bends.keys()) {
    const bend = state.entities.get(bendId);
    if (!bend) {
      continue;
    }
    for (const node of sized) {
      const halfWidth = node.width / 2 + clearance;
      const halfHeight = node.height / 2 + clearance;
      const dx = bend.x - node.x;
      const dy = bend.y - node.y;
      if (Math.abs(dx) >= halfWidth || Math.abs(dy) >= halfHeight) {
        continue;
      }

      const pushX = halfWidth - Math.abs(dx);
      const pushY = halfHeight - Math.abs(dy);
      const ordered: Constraint[][] =
        pushX <= pushY
          ? [
              [separationAwayOnX(node, bend, halfWidth)],
              [separationAwayOnY(node, bend, halfHeight)],
            ]
          : [
              [separationAwayOnY(node, bend, halfHeight)],
              [separationAwayOnX(node, bend, halfWidth)],
            ];

      for (const attempt of ordered) {
        if (state.system.tryAdd(state.entities, attempt)) {
          break;
        }
      }
    }
  }
}

function separationAwayOnX(node: HolaNode, bend: HolaNode, gap: number): Constraint {
  return bend.x >= node.x
    ? separation('x', node.id, bend.id, gap, 'chain-configuration')
    : separation('x', bend.id, node.id, gap, 'chain-configuration');
}

function separationAwayOnY(node: HolaNode, bend: HolaNode, gap: number): Constraint {
  return bend.y >= node.y
    ? separation('y', node.id, bend.id, gap, 'chain-configuration')
    : separation('y', bend.id, node.id, gap, 'chain-configuration');
}

/**
 * Last resort (guide §25).
 *
 * A node overlap makes a drawing invalid, so if the accumulated constraints
 * cannot be satisfied *and* keep nodes apart, something has to give. Families
 * are withdrawn in order of how much of HOLA's intent they carry, re-running
 * overlap removal after each step and stopping as soon as the drawing is clean:
 *
 *   1. opportunistic alignment — explicitly opportunistic (guide §18.1);
 *   2. face expansion — the space a tree asked for, but not its attachment;
 *   3. tree placement — the tree keeps its shape, loses its reserved corridor;
 *   4. overlap removal — separations generated against an *earlier* arrangement
 *      can contradict what the current one needs; regenerating is a real fix.
 *
 * Node and chain configuration are never withdrawn: they are the orthogonal
 * structure the algorithm exists to produce. If overlaps survive all four
 * steps, that is reported rather than papered over.
 */
const RELAXATION_ORDER: ConstraintOrigin[] = [
  'opportunistic-alignment',
  'face-expansion',
  'tree-placement',
  'overlap-removal',
];

/**
 * Pull every tree that ended up slid outwards back onto its natural rank
 * distance, wherever the core has since made room for it.
 *
 * A tree is attached by a hinge (`anchorConstraints`) so that a tight core stays
 * feasible, which means expansion and overlap removal are both free to push the
 * tree away from its root instead of opening the core up. Once all the trees are
 * in and the core has settled, most of those slides are no longer paying for
 * anything — they just draw a long empty connector between a core node and the
 * tree's first rank. Capping the distance from above turns the hinge into a weld
 * at exactly the natural offset; the cap is added through the constraint system
 * so it is *persistent*, and a later overlap pass cannot slide the tree out
 * again.
 *
 * Retraction is attempted per tree and kept only if the projection is feasible
 * and leaves the drawing overlap-free, so it can shorten a connector but never
 * break a placement. A tree that is genuinely wedged keeps its slide, and the
 * diagnostic from `placeOneTree` already recorded that.
 */
function retractSlidTrees(state: CoreLayoutState, placements: TreePlacement[]): void {
  for (const placement of placements) {
    const placeholder = state.entities.get(placement.placeholderId);
    const root = state.entities.get(placement.coreNodeId);
    if (!placeholder || !root) {
      continue;
    }

    const vertical = placement.growthDirection === 'S' || placement.growthDirection === 'N';
    const axis: Axis = vertical ? 'y' : 'x';
    const natural = vertical ? placement.offsetY : placement.offsetX;
    const actual = vertical ? placeholder.y - root.y : placeholder.x - root.x;
    const excess = Math.abs(actual) - Math.abs(natural);
    if (excess <= RETRACTION_EPSILON) {
      continue;
    }

    // Pin the along-growth distance at exactly the natural offset. Stated as an
    // equality rather than as an upper bound facing the hinge's lower bound: two
    // opposing separations on one pair are a cycle to the solver, an alignment is
    // the shape it models directly.
    const pin = alignment(
      axis,
      placement.coreNodeId,
      placement.placeholderId,
      'tree-placement',
      natural
    );

    // The constraints in force were derived *against the slid arrangement*:
    // non-overlap separations that say "the tree is out to the right of this
    // node", and the face expansion that made room for it there. Both are
    // re-derivable, and until they are withdrawn the pin is simply infeasible.
    // Withdraw as little as possible, in two rungs.
    const attempts: ConstraintOrigin[][] = [
      ['overlap-removal'],
      ['overlap-removal', 'face-expansion'],
    ];

    let retracted = false;
    for (const withdraw of attempts) {
      const snapshot = state.system.snapshot(state.entities);
      state.system.removeWhere((constraint) => withdraw.includes(constraint.origin));
      state.system.addAll([pin]);
      if (state.system.project(state.entities).feasible) {
        // With the tree pinned, the only way left to resolve the collision it was
        // sliding away from is to move core nodes — which is the whole point: the
        // room comes from the core spreading out, not from the branch stretching.
        enforceNoOverlaps(state, 'tree-retraction');
        if (!hasSizedOverlap(state)) {
          retracted = true;
          break;
        }
      }
      // `restore` also drops every constraint added since the snapshot, so a
      // rejected attempt leaves neither the pin nor its overlap constraints —
      // and puts the withdrawn ones back.
      state.system.restore(snapshot, state.entities);
    }

    if (!retracted && excess > REPORTABLE_SLIDE) {
      state.diagnostics.report({
        code: 'HOLA_TREE_SLID_FROM_ROOT',
        stage: 'tree-retraction',
        componentId: state.componentId,
        nodeIds: [placement.coreNodeId],
        message:
          `Tree ${placement.treeId} stays ${Math.round(excess)}px ` +
          'further out than its natural rank distance: the core cannot open up enough for it.',
      });
    }
  }
}

/** Below this the tree is at its natural distance and there is nothing to undo. */
const RETRACTION_EPSILON = 1;
/** Below this a residual slide is not visible and not worth a diagnostic. */
const REPORTABLE_SLIDE = 8;

function relaxUntilOverlapFree(state: CoreLayoutState): void {
  if (!hasSizedOverlap(state)) {
    return;
  }

  const withdrawn: ConstraintOrigin[] = [];
  for (const origin of RELAXATION_ORDER) {
    const removed = state.system.removeWhere((constraint) => constraint.origin === origin);
    if (removed === 0) {
      continue;
    }
    withdrawn.push(origin);
    enforceNoOverlaps(state, `relaxation-${origin}`);
    if (!hasSizedOverlap(state)) {
      break;
    }
  }

  if (withdrawn.length === 0) {
    return;
  }

  state.diagnostics.report({
    code: hasSizedOverlap(state) ? 'HOLA_CONSTRAINT_INFEASIBLE' : 'HOLA_TREE_PLACEMENT_FAILED',
    stage: 'relaxation',
    componentId: state.componentId,
    message: hasSizedOverlap(state)
      ? `Overlaps survived withdrawing ${withdrawn.join(', ')}; the structural constraints ` +
        'from node and chain configuration were kept.'
      : `Withdrew ${withdrawn.join(', ')} to keep the drawing overlap-free.`,
    detail: { withdrawn },
  });
}

function hasSizedOverlap(state: CoreLayoutState): boolean {
  const list = [...state.entities.values()].filter((n) => n.width > 0 && n.height > 0);
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (rectsOverlap(nodeBounds(list[i]), nodeBounds(list[j]))) {
        return true;
      }
    }
  }
  return false;
}

function createCoreState(
  componentId: string,
  core: HolaGraph,
  options: HolaOptions,
  diagnostics: DiagnosticCollector
): CoreLayoutState {
  const entities = new Map<string, HolaNode>();
  for (const node of core.nodes.values()) {
    entities.set(node.id, node);
  }
  return {
    componentId,
    core,
    entities,
    bends: new Map(),
    system: new ConstraintSystem(),
    options,
    diagnostics,
    fixedDirections: new Map(),
    placeholders: new Set(),
  };
}

/**
 * Guide §11.1: a stable, non-degenerate seed. Nodes are laid on a circle in
 * input order with a radius that gives the graph room for its ideal edge
 * lengths, so the stress optimiser starts from a spread configuration rather
 * than from coincident points.
 */
export function seedPositions(entities: Map<string, HolaNode>, options: HolaOptions): void {
  const nodes = [...entities.values()].sort((a, b) => a.inputOrder - b.inputOrder);
  if (nodes.length === 0) {
    return;
  }
  if (nodes.length === 1) {
    nodes[0].x = 0;
    nodes[0].y = 0;
    return;
  }
  const radius = (nodes.length * options.baseEdgeLength) / (2 * Math.PI);
  nodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length;
    node.x = radius * Math.cos(angle);
    node.y = radius * Math.sin(angle);
  });
}
