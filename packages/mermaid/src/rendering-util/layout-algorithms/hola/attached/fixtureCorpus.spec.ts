/**
 * Corpus check: the drawing must not show two edges as one line, and must not run
 * an edge through a node it does not touch.
 *
 * `layoutCore.spec.ts` works on hand-built graphs, which is right for the placement
 * rules but too tidy to catch either of these — a fan of eight children on one
 * node, or a core edge crossing a third node's box, only show up in a real diagram.
 * So the assertions here are the properties themselves, over every fixture in the
 * corpus.
 *
 * They are deliberately different strengths, because the two halves of the drawing
 * guarantee different things:
 *
 *   - **tree connectors** are built by construction — one port per node side across
 *     all trees, fans nested into combs, a greedy pass that gives up a comb level
 *     rather than share a line — so zero overlap is a guarantee and is asserted as
 *     one;
 *   - **core routes** come from HOLA's orthogonal router. Avoiding node boxes is a
 *     hard constraint there, so that and orthogonality are asserted strictly. Two
 *     routes running along each other is a *penalty* in its search, not a
 *     prohibition, because on a crowded core every alternative can be worse — so it
 *     is asserted with the one allowance the mechanism implies, plus a recorded
 *     expectation for the corpus's non-planar graphs.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { addDiagrams } from '../../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../../logger.js';
import type { Edge, LayoutData } from '../../../types.js';
import { applyFixtureContentSizesStrict, loadSizesFixture } from '../../ddlt/fixtureSizes.js';
import { layoutTestsDir } from '../../ddlt/paths.js';
import { parseMmdFileToLayoutData } from '../../ddlt/parseToLayoutData.js';
import { applyFixtureEdgeLabelSizes } from '../../ddlt/backends.js';
import { countBentEdges } from './coreCandidates.js';
import { runGridAttachedLayoutCore } from './layoutCore.js';
import type { GridAttachedResult } from './layoutCore.js';
import { runGridAttachedSubgraphsLayoutCore } from '../index.js';

const FIXTURE_DIR = join(layoutTestsDir(), 'hola');
const EPSILON = 0.5;

/**
 * Core routes that are still drawn along each other, and why the router could not
 * do better. A route pair here is one the search reached with every alternative
 * scoring worse, not one it overlooked.
 *
 * `K3,3` is one of the two Kuratowski graphs: it cannot be drawn without crossings
 * at all, so its corridors are contested everywhere and the collinear penalty has
 * nothing cheaper to buy. Any pair *not* listed here is a regression.
 */
const KNOWN_CORE_OVERLAPS: Record<string, string[]> = {
  'GRAPH - Bipartite Graph k3,3': ['L_A1_B1_0 ~ L_A2_B3_0'],
};

/**
 * Core edges whose two nodes share neither a row nor a column, so however the edge
 * is routed the reader follows a corner.
 *
 * Zero wherever grid-like can reach a fully aligned drawing of the core, which
 * `coreCandidates` gives it several chances to do. The rest are cores where no
 * setting aligns everything — a complete graph on four nodes has six edges and only
 * four nodes to align them across, and `project-sox2`'s core is large and dense.
 * These are a ratchet: any core that gets *worse* fails, and one that improves
 * fails too, so the number has to be updated deliberately.
 */
/**
 * Labels that still sit on a crossing, and why moving them cannot help.
 *
 * A label may only be moved along its own route, so if every position on that route
 * contained a crossing there would be nowhere left to go. Nothing in the corpus is
 * in that position any more — gathering each core node's pendants into one tree
 * removed the crossings that used to trap one — so this is empty and any entry
 * appearing in it is a regression.
 */
const KNOWN_LABELS_ON_CROSSINGS: Record<string, number> = {};

/**
 * Tree connectors still drawn along each other, and why no choice here can separate
 * them.
 *
 * A turn can be moved and a port can be spread, but only before the route is known:
 * ports are assigned first, then routes derived from them. So when two runs collide
 * and *neither* is a turn, nothing downstream can help. That is this pair — one
 * connector reaches a child exactly in line with its parent, so its route is a single
 * straight run with no bend to shift, and the other's colliding run is a terminal leg
 * sitting on the line its port fixed.
 *
 * Separating them would need what HOLA's own router does for the core: route once,
 * re-plan the ports against the routes, then route again. The tree connectors have no
 * such second pass. Any pair not listed here is a regression.
 */
const KNOWN_TREE_CONNECTOR_OVERLAPS: Record<string, string[]> = {
  '___ Hola paper main example algorithm': ['L_BetaF_BetaF3_0 ~ L_BetaG_BetaG1_0'],
};

/**
 * Pairs of *core* edges that still share an attachment point, and why.
 *
 * Core ports come from HOLA's router, which routes once to discover each end's
 * side, plans ports along those sides, then re-routes with both locked — and keeps
 * the second pass only if it did not fail more edges than the first. On a core this
 * cramped the locked pass cannot route everything, so the unplanned ports survive.
 * Reassigning them would mean changing how the core is drawn, which this layout is
 * not allowed to do.
 *
 * Both fixtures are complete or complete-bipartite graphs on small node counts —
 * every node adjacent to almost every other, with no room to spread. Any pair not
 * listed here is a regression.
 */
const KNOWN_SHARED_CORE_PORTS: Record<string, string[]> = {
  'GRAPH - Bipartite Graph k3,3': ['L_A1_B3_0 and L_A2_B3_0 share a port on B3'],
  'GRAPH - complete_graph_k4': [
    'L_A_D_0 and L_B_D_0 share a port on D',
    'L_B_C_0 and L_B_D_0 share a port on B',
  ],
  // A five-cycle whose every node also carries a tree: C2's side is spoken for by
  // two core edges before any tree asks for room, and the locked port pass cannot
  // route the second one elsewhere. No container is involved — the sibling branch
  // records the same pair.
  'GRAPH - hola 5 nodes loop + trees': ['L_C2_C3_0 and L_C2_C4_0 share a port on C2'],
};

/** Tree connectors own their ports, so none may share one with a core edge. */
const KNOWN_SHARED_TREE_PORTS: Record<string, number> = {};

const UNALIGNED_CORE_EDGES: Record<string, number> = {
  '___ Hola paper main example algorithm': 6,
  'GRAPH - Bipartite Graph k3,3': 2,
  'GRAPH - complete_graph_k4': 8,
  domus1: 4,
  'life-choices': 1,
  'multiple-edges': 1,
  'project-sox2': 12,
  // Cores that are dense for their size: `a3 --> a1 & a2 & a3 & a4` makes one node
  // adjacent to every other, and `right-angles-not-curves` closes two cycles through
  // the same pair.
  'right-angles-not-curves': 1,
  'subgraph-labels-2': 3,
  'subgraph-labels-3': 2,
  // An edge naming a subgraph is now part of the topology, so these cores carry one
  // more real edge than they did, and it is one grid-like cannot align.
  architecture: 1,
  'nested-sg-outgoing-5': 1,
  // A five-cycle with a tree on every node: grid-like can align a five-cycle's edges
  // no better than a pentagon.
  'GRAPH - hola 5 nodes loop + trees': 6,
  'GRAPH - fuse 3 columns - scrumbling subgraphs': 8,
};

/**
 * Fixtures that can be laid out DOM-free, with the file holding their captured
 * sizes.
 *
 * Most are named `<fixture>.sizes.json`; one predates the convention and is just
 * `<fixture>.json`. Accepting both is what brings HOLA's own main example — the
 * largest graph in the corpus, and the one most likely to show a tangle — under
 * these assertions instead of quietly skipping it.
 */
function fixtures(): { name: string; sizes: string }[] {
  const files = readdirSync(FIXTURE_DIR);
  return files
    .filter((file) => file.endsWith('.mmd'))
    .map((file) => file.replace(/\.mmd$/, ''))
    .flatMap((name) => {
      for (const sizes of [`${name}.sizes.json`, `${name}.json`]) {
        if (files.includes(sizes)) {
          return [{ name, sizes }];
        }
      }
      return [];
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

interface Run {
  edgeId: string;
  vertical: boolean;
  /** Coordinate the run sits on. */
  at: number;
  from: number;
  to: number;
}

/** Axis-aligned runs of a route, with zero-length and diagonal pieces dropped. */
function runsOf(edge: Edge): Run[] {
  const runs: Run[] = [];
  const points = edge.points ?? [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const horizontal = Math.abs(a.y - b.y) < 1e-6;
    const vertical = Math.abs(a.x - b.x) < 1e-6;
    if (horizontal === vertical) {
      continue;
    }
    const [from, to] = vertical ? [a.y, b.y] : [a.x, b.x];
    if (Math.abs(to - from) < EPSILON) {
      continue;
    }
    runs.push({
      edgeId: edge.id,
      vertical,
      at: vertical ? a.x : a.y,
      from: Math.min(from, to),
      to: Math.max(from, to),
    });
  }
  return runs;
}

function sharedLength(a: Run, b: Run): number {
  if (a.vertical !== b.vertical || Math.abs(a.at - b.at) > EPSILON) {
    return 0;
  }
  return Math.min(a.to, b.to) - Math.max(a.from, b.from);
}

/** Pairs of edges drawn along each other, as `id ~ id`, deduplicated. */
function overlappingPairs(edges: Edge[], allow?: (a: Edge, b: Edge) => boolean): string[] {
  const byId = new Map(edges.map((edge) => [edge.id, edge]));
  const runs = edges.flatMap((edge) => runsOf(edge));
  const pairs = new Set<string>();

  for (let i = 0; i < runs.length; i++) {
    for (let j = i + 1; j < runs.length; j++) {
      if (runs[i].edgeId === runs[j].edgeId || sharedLength(runs[i], runs[j]) <= EPSILON) {
        continue;
      }
      const first = byId.get(runs[i].edgeId)!;
      const second = byId.get(runs[j].edgeId)!;
      if (allow?.(first, second)) {
        continue;
      }
      const [low, high] = [first.id, second.id].sort();
      pairs.add(`${low} ~ ${high}`);
    }
  }

  return [...pairs].sort();
}

function isOrthogonal(edge: Edge): boolean {
  const points = edge.points ?? [];
  for (let i = 1; i < points.length; i++) {
    if (
      Math.abs(points[i].x - points[i - 1].x) > 1e-6 &&
      Math.abs(points[i].y - points[i - 1].y) > 1e-6
    ) {
      return false;
    }
  }
  return true;
}

function cardinalRun(
  from: { x: number; y: number } | undefined,
  to: { x: number; y: number } | undefined
): 'N' | 'E' | 'S' | 'W' | 'none' {
  if (!from || !to) {
    return 'none';
  }
  if (Math.abs(to.x - from.x) > Math.abs(to.y - from.y)) {
    return to.x > from.x ? 'E' : 'W';
  }
  return to.y > from.y ? 'S' : to.y < from.y ? 'N' : 'none';
}

/** The label placer always chooses a point on one of the edge's straight runs. */
function pointLiesOnRoute(x: number, y: number, points: { x: number; y: number }[]): boolean {
  for (let index = 1; index < points.length; index++) {
    const start = points[index - 1];
    const end = points[index];
    const horizontal = Math.abs(start.y - end.y) < 1e-6;
    const vertical = Math.abs(start.x - end.x) < 1e-6;
    if (
      (horizontal &&
        Math.abs(y - start.y) < 1e-6 &&
        x >= Math.min(start.x, end.x) - 1e-6 &&
        x <= Math.max(start.x, end.x) + 1e-6) ||
      (vertical &&
        Math.abs(x - start.x) < 1e-6 &&
        y >= Math.min(start.y, end.y) - 1e-6 &&
        y <= Math.max(start.y, end.y) + 1e-6)
    ) {
      return true;
    }
  }
  return false;
}

interface Rect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Does any run of the route pass through the interior of the rectangle? */
function entersRect(edge: Edge, rect: Rect): boolean {
  const points = edge.points ?? [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const horizontal = Math.abs(a.y - b.y) < EPSILON;
    const vertical = Math.abs(a.x - b.x) < EPSILON;
    if (
      (horizontal &&
        a.y > rect.minY + EPSILON &&
        a.y < rect.maxY - EPSILON &&
        Math.max(Math.min(a.x, b.x), rect.minX) <
          Math.min(Math.max(a.x, b.x), rect.maxX) - EPSILON) ||
      (vertical &&
        a.x > rect.minX + EPSILON &&
        a.x < rect.maxX - EPSILON &&
        Math.max(Math.min(a.y, b.y), rect.minY) < Math.min(Math.max(a.y, b.y), rect.maxY) - EPSILON)
    ) {
      return true;
    }
  }
  return false;
}

interface LabelBox {
  edgeId: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Where each label was placed, as a box. Edges with no label are skipped. */
function labelBoxes(layout: LayoutData): LabelBox[] {
  const boxes: LabelBox[] = [];
  for (const edge of layout.edges) {
    if (!edge.label || !Number.isFinite(edge.x) || !Number.isFinite(edge.y)) {
      continue;
    }
    const width = edge.width ?? 0;
    const height = edge.height ?? 0;
    if (width <= 0 || height <= 0) {
      continue;
    }
    boxes.push({
      edgeId: edge.id,
      minX: edge.x! - width / 2,
      maxX: edge.x! + width / 2,
      minY: edge.y! - height / 2,
      maxY: edge.y! + height / 2,
    });
  }
  return boxes;
}

/** Points where two different edges properly cross. */
function crossingPoints(edges: Edge[]): { x: number; y: number }[] {
  const segs: { id: string; a: { x: number; y: number }; b: { x: number; y: number } }[] = [];
  for (const edge of edges) {
    const points = edge.points ?? [];
    for (let i = 1; i < points.length; i++) {
      segs.push({ id: edge.id, a: points[i - 1], b: points[i] });
    }
  }

  const hits: { x: number; y: number }[] = [];
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      if (segs[i].id === segs[j].id) {
        continue;
      }
      const p = segs[i];
      const q = segs[j];
      const r = { x: p.b.x - p.a.x, y: p.b.y - p.a.y };
      const t2 = { x: q.b.x - q.a.x, y: q.b.y - q.a.y };
      const den = r.x * t2.y - r.y * t2.x;
      if (Math.abs(den) < 1e-9) {
        continue;
      }
      const d = { x: q.a.x - p.a.x, y: q.a.y - p.a.y };
      const t = (d.x * t2.y - d.y * t2.x) / den;
      const u = (d.x * r.y - d.y * r.x) / den;
      if (t <= 1e-6 || t >= 1 - 1e-6 || u <= 1e-6 || u >= 1 - 1e-6) {
        continue;
      }
      hits.push({ x: p.a.x + t * r.x, y: p.a.y + t * r.y });
    }
  }
  return hits;
}

interface Laid {
  layout: LayoutData;
  result: GridAttachedResult;
  coreIds: Set<string>;
  coreEdges: Edge[];
  treeEdges: Edge[];
}

/**
 * One layout per fixture, shared by every assertion about it.
 *
 * The assertions only read, and the corpus now includes HOLA's 170-node main
 * example — laying it out once per assertion would mean routing its 76 core edges
 * through A\* eight times over.
 */
const cache = new Map<string, Promise<Laid>>();

function lay(name: string, sizesFile: string): Promise<Laid> {
  const hit = cache.get(name);
  if (hit) {
    return hit;
  }
  const pending = layOnce(name, sizesFile);
  cache.set(name, pending);
  return pending;
}

async function layOnce(name: string, sizesFile: string): Promise<Laid> {
  const layout = await parseMmdFileToLayoutData(join(FIXTURE_DIR, `${name}.mmd`), {
    stampFlowchartRendererFields: true,
  });
  const sizes = loadSizesFixture(join(FIXTURE_DIR, sizesFile));
  applyFixtureContentSizesStrict(layout, sizes);
  applyFixtureEdgeLabelSizes(layout, sizes);

  const result = runGridAttachedLayoutCore(layout);
  const coreIds = new Set(result.components.flatMap((component) => component.coreNodeIds));
  // A core edge joins two core nodes; everything else is a tree connector. Both
  // kinds are orthogonal polylines now, so the topology is what tells them apart.
  const drawn = layout.edges.filter((edge) => edge.start !== edge.end);
  return {
    layout,
    result,
    coreIds,
    coreEdges: drawn.filter((edge) => coreIds.has(edge.start!) && coreIds.has(edge.end!)),
    treeEdges: drawn.filter((edge) => !(coreIds.has(edge.start!) && coreIds.has(edge.end!))),
  };
}

describe('grid-attached over the hola-faithful fixture corpus', () => {
  beforeAll(() => {
    setLogLevel('fatal');
    addDiagrams();
  });

  const all = fixtures();

  it('finds fixtures to run', () => {
    expect(all.length).toBeGreaterThan(5);
  });

  for (const { name, sizes } of all) {
    if (name === 'deploy-pipeline') {
      it('compacts the lone entry edge into the deployment subgraph', async () => {
        const layout = await parseMmdFileToLayoutData(join(FIXTURE_DIR, `${name}.mmd`), {
          stampFlowchartRendererFields: true,
        });
        const measured = loadSizesFixture(join(FIXTURE_DIR, sizes));
        applyFixtureContentSizesStrict(layout, measured);
        applyFixtureEdgeLabelSizes(layout, measured);
        runGridAttachedSubgraphsLayoutCore(layout);
        const entry = layout.edges.find((edge) => edge.start === 'D' && edge.end === 'F');
        const [start, ...tail] = entry?.points ?? [];
        const end = tail.at(-1);

        expect(start).toBeDefined();
        expect(end).toBeDefined();
        const buildDockerImage = layout.nodes.find((node) => node.id === 'F');
        expect(buildDockerImage).toBeDefined();
        // The router may choose the top or the left face, but the shortened
        // bridge must still reach F's clipped boundary rather than stop at the
        // subgraph frame.
        const dx = Math.abs(end!.x - buildDockerImage!.x!);
        const dy = Math.abs(end!.y - buildDockerImage!.y!);
        const halfWidth = buildDockerImage!.width! / 2;
        const halfHeight = buildDockerImage!.height! / 2;
        expect(dx).toBeLessThanOrEqual(halfWidth + 1e-6);
        expect(dy).toBeLessThanOrEqual(halfHeight + 1e-6);
        expect(Math.min(Math.abs(dx - halfWidth), Math.abs(dy - halfHeight))).toBeLessThan(1e-6);
        // The bridge is rebuilt from node-boundary ports, so paint must retain
        // those ports rather than treating it as a centre-to-centre core edge.
        expect(entry?.hasIntersectionPoints).toBe(true);
        // The group is a compact unit; only the otherwise-empty D--F bridge
        // should shrink, leaving enough room for its “Yes” label.
        expect(Math.abs(end!.y - start.y)).toBeLessThanOrEqual(64);

        const rejected = layout.edges.find((edge) => edge.start === 'D' && edge.end === 'E');
        expect(rejected).toBeDefined();
        expect(rejected?.x).toBeDefined();
        expect(rejected?.y).toBeDefined();
        // Compaction translates D--E with D. Its "No" label must be recomputed
        // against that translated route, rather than left at the old position.
        expect(pointLiesOnRoute(rejected!.x!, rejected!.y!, rejected!.points ?? [])).toBe(true);
      });
    }

    if (name === 'life-choices') {
      it('does not turn wide labels into excessive vertical core spacing', async () => {
        const layout = await parseMmdFileToLayoutData(join(FIXTURE_DIR, `${name}.mmd`), {
          stampFlowchartRendererFields: true,
        });
        const measured = loadSizesFixture(join(FIXTURE_DIR, sizes));
        applyFixtureContentSizesStrict(layout, measured);
        applyFixtureEdgeLabelSizes(layout, measured);
        runGridAttachedSubgraphsLayoutCore(layout);
        const ys = layout.nodes.map((node) => node.y ?? 0);
        const height = Math.max(...ys) - Math.min(...ys);

        // The longest label needs a wide grid column, but that must not also
        // make every row 317px tall.
        expect(height).toBeLessThan(1200);

        const nodes = new Map(layout.nodes.map((node) => [node.id, node]));
        const spareTime = nodes.get('n6');
        const happyLife = nodes.get('ne');
        expect(spareTime).toBeDefined();
        expect(happyLife).toBeDefined();
        // Compaction may remove empty space, never the rank gap between a node
        // and its successor on the same vertical lane.
        const gap =
          (happyLife!.y ?? 0) -
          (happyLife!.height ?? 0) / 2 -
          ((spareTime!.y ?? 0) + (spareTime!.height ?? 0) / 2);
        expect(gap).toBeGreaterThanOrEqual(50);

        // When several branches converge on the same sink, an outer branch must
        // use the outside lane instead of cutting through another branch's final
        // approach. Here `n5 → ne` comes from the right of `nh → ne`.
        const routes = new Map(layout.edges.map((edge) => [edge.id, edge]));
        const betterWork = routes.get('L_nh_ne_0');
        const lowerBranch = routes.get('L_n5_ne_0');
        expect(betterWork).toBeDefined();
        expect(lowerBranch).toBeDefined();
        expect(crossingPoints([betterWork!, lowerBranch!])).toEqual([]);
      });
    }

    if (name === 'nested-sg-outgoing-5') {
      it('reserves a clear runway for the labelled edge entering container_Beta', async () => {
        const { layout, result } = await lay(name, sizes);
        const edge = layout.edges.find((item) => item.id === 'L_process_B_container_Beta_0');
        const nodes = new Map(layout.nodes.map((node) => [node.id, node]));
        expect(edge).toBeDefined();
        expect(edge?.x).toBeDefined();
        expect(edge?.y).toBeDefined();

        const label = {
          minX: edge!.x! - (edge!.width ?? 0) / 2,
          maxX: edge!.x! + (edge!.width ?? 0) / 2,
          minY: edge!.y! - (edge!.height ?? 0) / 2,
          maxY: edge!.y! + (edge!.height ?? 0) / 2,
        };
        for (const id of ['process_B', 'process_C']) {
          const node = nodes.get(id);
          expect(node).toBeDefined();
          const bounds = {
            minX: (node!.x ?? 0) - (node!.width ?? 0) / 2,
            maxX: (node!.x ?? 0) + (node!.width ?? 0) / 2,
          };
          const horizontalGap = Math.max(bounds.minX - label.maxX, label.minX - bounds.maxX);
          expect(horizontalGap, `via_AWSBatch crowds ${id}`).toBeGreaterThanOrEqual(
            result.options.labelClearance - EPSILON
          );
        }
      });
    }

    if (name === 'ortho1') {
      it('keeps sibling routes from B in their own corridors', async () => {
        const layout = await parseMmdFileToLayoutData(join(FIXTURE_DIR, `${name}.mmd`), {
          stampFlowchartRendererFields: true,
        });
        const measured = loadSizesFixture(join(FIXTURE_DIR, sizes));
        applyFixtureContentSizesStrict(layout, measured);
        applyFixtureEdgeLabelSizes(layout, measured);
        runGridAttachedSubgraphsLayoutCore(layout);
        const toD = layout.edges.find((edge) => edge.id === 'L_B_D_0');
        const toF = layout.edges.find((edge) => edge.id === 'L_B_F_0');
        expect(toD).toBeDefined();
        expect(toF).toBeDefined();
        expect(crossingPoints([toD!, toF!])).toEqual([]);
      });
    }

    if (name === 'GRAPH - hola 4 nodes loop + trees - Long Labels') {
      it('uses the top and bottom exits for C3_1’s horizontal two-child split', async () => {
        const { layout } = await lay(name, sizes);
        const nodes = new Map(layout.nodes.map((node) => [node.id, node]));
        const parent = nodes.get('C3_1')!;
        const routes = ['L_C3_1_C3_11_0', 'L_C3_1_C3_12_0'].map(
          (id) => layout.edges.find((edge) => edge.id === id)!.points!
        );

        // The parent-to-C3_1 edge takes the main west/east axis. Its two children
        // therefore leave C3_1 from the top and bottom, each with one turn into
        // the left side of the wide child box rather than a two-turn comb.
        expect(routes.every((route) => route.length === 3)).toBe(true);
        expect(routes.map((route) => route[0].y).sort((a, b) => a - b)).toEqual([
          parent.y! - parent.height! / 2,
          parent.y! + parent.height! / 2,
        ]);
        expect(routes.every((route) => route[0].x === parent.x)).toBe(true);
      });
    }

    if (name === 'Extreme-Subgraphs-WindRose') {
      it('keeps the near-aligned SE → C route straight', async () => {
        const layout = await parseMmdFileToLayoutData(join(FIXTURE_DIR, `${name}.mmd`), {
          stampFlowchartRendererFields: true,
        });
        const measured = loadSizesFixture(join(FIXTURE_DIR, sizes));
        applyFixtureContentSizesStrict(layout, measured);
        applyFixtureEdgeLabelSizes(layout, measured);
        runGridAttachedSubgraphsLayoutCore(layout);

        const route = layout.edges.find((edge) => edge.id === 'L_SE_C_0')?.points;
        expect(route).toHaveLength(2);
        expect(route![0].x).toBeCloseTo(route![1].x, 6);
      });
    }

    if (name === 'project-sox2') {
      it('keeps D’s two lower branches out of each other’s corridors', async () => {
        const { layout } = await lay(name, sizes);
        const toIsolation = layout.edges.find((edge) => edge.id === 'L_D_I_0');
        const toMarkers = layout.edges.find((edge) => edge.id === 'L_D_L_0');
        expect(toIsolation).toBeDefined();
        expect(toMarkers).toBeDefined();
        expect(crossingPoints([toIsolation!, toMarkers!])).toEqual([]);
      });
    }

    if (name === 'right-angles-not-curves') {
      it('keeps the parallel N11 → N22 bundle on matching sides', async () => {
        const layout = await parseMmdFileToLayoutData(join(FIXTURE_DIR, `${name}.mmd`), {
          stampFlowchartRendererFields: true,
        });
        const measured = loadSizesFixture(join(FIXTURE_DIR, sizes));
        applyFixtureContentSizesStrict(layout, measured);
        applyFixtureEdgeLabelSizes(layout, measured);
        runGridAttachedSubgraphsLayoutCore(layout);

        const bundle = layout.edges.filter((edge) => edge.start === 'N11' && edge.end === 'N22');
        expect(bundle).toHaveLength(5);
        const departure = new Set(
          bundle.map((edge) => cardinalRun(edge.points?.[0], edge.points?.[1]))
        );
        const arrival = new Set(
          bundle.map((edge) => {
            const points = edge.points ?? [];
            return cardinalRun(points.at(-2), points.at(-1));
          })
        );
        expect(departure).toHaveLength(1);
        expect(arrival).toHaveLength(1);
        // A parallel bundle needs one shared corridor with separate lanes; it
        // may have one orthogonal detour, but not a chain of sibling-specific
        // turns.
        expect(bundle.every((edge) => (edge.points?.length ?? 0) <= 4)).toBe(true);
      });
    }

    if (name === 'subgraph-variation') {
      it('leaves a real terminal run before an arrow enters P1.5', async () => {
        const layout = await parseMmdFileToLayoutData(join(FIXTURE_DIR, `${name}.mmd`), {
          stampFlowchartRendererFields: true,
        });
        const measured = loadSizesFixture(join(FIXTURE_DIR, sizes));
        applyFixtureContentSizesStrict(layout, measured);
        applyFixtureEdgeLabelSizes(layout, measured);
        runGridAttachedSubgraphsLayoutCore(layout);

        const entry = layout.edges.find((edge) => edge.id === 'L_P1_P1.5_0');
        expect(entry?.points).toBeDefined();
        const route = entry!.points!;
        const end = route.at(-1)!;
        const beforeEnd = route.at(-2)!;
        expect(
          Math.max(Math.abs(end.x - beforeEnd.x), Math.abs(end.y - beforeEnd.y))
        ).toBeGreaterThanOrEqual(20);
      });
    }

    if (name === 'subgraph-labels') {
      it('keeps labels on parallel tree connectors in separate tracks', async () => {
        const layout = await parseMmdFileToLayoutData(join(FIXTURE_DIR, `${name}.mmd`), {
          stampFlowchartRendererFields: true,
        });
        const measured = loadSizesFixture(join(FIXTURE_DIR, sizes));
        applyFixtureContentSizesStrict(layout, measured);
        applyFixtureEdgeLabelSizes(layout, measured);
        runGridAttachedSubgraphsLayoutCore(layout);

        const labels = layout.edges
          .filter((edge) => edge.start === 'a1' && edge.end === 'a2')
          .map((edge) => ({
            id: edge.id,
            minY: edge.y! - (edge.height ?? 0) / 2,
            maxY: edge.y! + (edge.height ?? 0) / 2,
          }));

        expect(labels).toHaveLength(2);
        expect(
          labels.every((label) => Number.isFinite(label.minY) && Number.isFinite(label.maxY))
        ).toBe(true);
        expect(
          Math.min(labels[0].maxY, labels[1].maxY) - Math.max(labels[0].minY, labels[1].minY)
        ).toBeLessThanOrEqual(EPSILON);
      });
    }

    if (name === 'subgraph-labels-2') {
      it('keeps the two parallel a1 → a2 labels on separate runs', async () => {
        const layout = await parseMmdFileToLayoutData(join(FIXTURE_DIR, `${name}.mmd`), {
          stampFlowchartRendererFields: true,
        });
        const measured = loadSizesFixture(join(FIXTURE_DIR, sizes));
        applyFixtureContentSizesStrict(layout, measured);
        applyFixtureEdgeLabelSizes(layout, measured);
        runGridAttachedSubgraphsLayoutCore(layout);
        const labels = labelBoxes(layout).filter((label) => label.edgeId.startsWith('L_a1_a2_'));
        expect(labels).toHaveLength(2);

        const [first, second] = labels;
        const overlapX = Math.min(first.maxX, second.maxX) - Math.max(first.minX, second.minX);
        const overlapY = Math.min(first.maxY, second.maxY) - Math.max(first.minY, second.minY);
        expect(overlapX > EPSILON && overlapY > EPSILON, 'parallel edge labels overlap').toBe(
          false
        );

        const edges = new Map(
          layout.edges
            .filter((edge) => edge.id.startsWith('L_a1_a2_'))
            .map((edge) => [edge.id, edge])
        );
        for (const label of labels) {
          const foreign = [...edges.values()].find((edge) => edge.id !== label.edgeId);
          expect(foreign, `foreign route for ${label.edgeId}`).toBeDefined();
          expect(
            entersRect(foreign!, label),
            `${foreign!.id} passes through the label for ${label.edgeId}`
          ).toBe(false);
        }
      });
    }

    if (name === 'subgraph-labels-3') {
      it('keeps labelled subgraph ranks compact and the a3 → a1 entry roundable', async () => {
        const layout = await parseMmdFileToLayoutData(join(FIXTURE_DIR, `${name}.mmd`), {
          stampFlowchartRendererFields: true,
        });
        const measured = loadSizesFixture(join(FIXTURE_DIR, sizes));
        applyFixtureContentSizesStrict(layout, measured);
        applyFixtureEdgeLabelSizes(layout, measured);
        runGridAttachedSubgraphsLayoutCore(layout);

        const nodes = ['a1', 'a2', 'a3', 'a4']
          .map((id) => layout.nodes.find((node) => node.id === id))
          .filter((node): node is NonNullable<typeof node> => node !== undefined);
        expect(nodes).toHaveLength(4);
        const verticalSpan =
          Math.max(...nodes.map((node) => node.y ?? 0)) -
          Math.min(...nodes.map((node) => node.y ?? 0));
        expect(verticalSpan).toBeLessThan(500);

        const entry = layout.edges.find((edge) => edge.id === 'L_a3_a1_0');
        expect(entry?.points).toBeDefined();
        const [start, firstTurn] = entry!.points!;
        expect(
          Math.max(Math.abs(firstTurn.x - start.x), Math.abs(firstTurn.y - start.y))
        ).toBeGreaterThanOrEqual(24);
      });
    }

    if (name === 'GRAPH - hola 7 nodes double loop + trees') {
      it('keeps F root trunks parallel and attaches them to the child boundary', async () => {
        const { layout } = await lay(name, sizes);
        const children = new Map(layout.nodes.map((node) => [node.id, node]));
        const fan = layout.edges
          .filter((edge) => edge.start === 'F' && /^F[1-4]$/.test(edge.end ?? ''))
          .sort((a, b) => a.id.localeCompare(b.id));

        expect(fan).toHaveLength(4);
        const root = children.get('F');
        expect(root).toBeDefined();
        const trunks: number[] = [];
        for (const edge of fan) {
          const points = edge.points ?? [];
          const child = children.get(edge.end!);
          expect(points, edge.id).toHaveLength(3);
          expect(child, edge.id).toBeDefined();
          const [start, bend, end] = points;
          // One long vertical trunk, then a horizontal run into the child.
          expect(bend.x).toBeCloseTo(start.x, 6);
          expect(Math.abs(bend.y - start.y)).toBeGreaterThan(0.5);
          expect(end.y).toBeCloseTo(bend.y, 6);
          expect(Math.abs(end.x - (child!.x ?? 0))).toBeCloseTo((child!.width ?? 0) / 2, 6);
          expect(end.y).toBeCloseTo(child!.y ?? 0, 6);
          trunks.push(start.x);
        }
        const pitch = trunks[1] - trunks[0];
        expect(pitch).toBeGreaterThan(0.5);
        for (let index = 2; index < trunks.length; index++) {
          expect(trunks[index] - trunks[index - 1]).toBeCloseTo(pitch, 6);
        }
        // Do not merely offset a cluster around F's centre: a redirected fan owns
        // the free side, so use that whole usable face at a constant pitch.
        const halfWidth = (root!.width ?? 0) / 2;
        expect(trunks[0]).toBeCloseTo((root!.x ?? 0) - halfWidth + 8, 6);
        expect(trunks.at(-1)).toBeCloseTo((root!.x ?? 0) + halfWidth - 8, 6);
      });

      it('uses one diagonal escape when D has core edges on all four sides', async () => {
        const { layout } = await lay(name, sizes);
        const roots = layout.edges.filter(
          (edge) => edge.start === 'D' && /^D[1-5]$/.test(edge.end ?? '')
        );
        const diagonal = roots.filter((edge) => {
          const [start, next] = edge.points ?? [];
          return start && next && start.x !== next.x && start.y !== next.y;
        });

        // D's right-side core connector occupies the only tree port that cannot
        // be spread away. One root connector may therefore leave through a free
        // corner, diagonally, rather than overlap D--C.
        expect(diagonal.map((edge) => edge.id)).toHaveLength(1);
      });
    }

    it(`draws no two tree connectors along each other in ${name}`, async () => {
      const { treeEdges } = await lay(name, sizes);
      expect(overlappingPairs(treeEdges)).toEqual(KNOWN_TREE_CONNECTOR_OVERLAPS[name] ?? []);
    });

    it(`routes every core edge orthogonally in ${name}`, async () => {
      const { coreEdges } = await lay(name, sizes);
      expect(coreEdges.filter((edge) => !isOrthogonal(edge)).map((edge) => edge.id)).toEqual([]);
    });

    it(`runs no core edge through a node it does not touch in ${name}`, async () => {
      const { layout, coreEdges } = await lay(name, sizes);
      const boxes = layout.nodes
        // A subgraph frame deliberately contains its members' edges; only leaf
        // node boxes are obstacles a core route must avoid.
        .filter((node) => node.isGroup !== true)
        .map((node) => ({
          id: node.id,
          rect: {
            minX: (node.x ?? 0) - (node.width ?? 0) / 2,
            maxX: (node.x ?? 0) + (node.width ?? 0) / 2,
            minY: (node.y ?? 0) - (node.height ?? 0) / 2,
            maxY: (node.y ?? 0) + (node.height ?? 0) / 2,
          },
        }));

      const offenders: string[] = [];
      for (const edge of coreEdges) {
        for (const box of boxes) {
          if (box.id === edge.start || box.id === edge.end) {
            continue;
          }
          if (entersRect(edge, box.rect)) {
            offenders.push(`${edge.id} through ${box.id}`);
          }
        }
      }
      expect(offenders).toEqual([]);
    });

    it(`gives every edge touching one node its own attachment point in ${name}`, async () => {
      const { layout, treeEdges } = await lay(name, sizes);
      const isTreeConnector = new Set(treeEdges.map((edge) => edge.id));

      // Every end of every edge, grouped by the node it lands on. Two ends at the
      // same point are drawn on top of each other, and near a node that is exactly
      // where a reader is trying to tell them apart.
      const ends = new Map<string, { edgeId: string; x: number; y: number }[]>();
      for (const edge of layout.edges) {
        const points = edge.points ?? [];
        if (points.length < 2) {
          continue;
        }
        for (const [nodeId, point] of [
          [edge.start, points[0]],
          [edge.end, points[points.length - 1]],
        ] as const) {
          if (!nodeId) {
            continue;
          }
          const list = ends.get(nodeId);
          if (list) {
            list.push({ edgeId: edge.id, x: point.x, y: point.y });
          } else {
            ends.set(nodeId, [{ edgeId: edge.id, x: point.x, y: point.y }]);
          }
        }
      }

      // Split by who owns the collision. A tree connector's port is this layout's to
      // choose, so sharing one is a bug; two core ports come from HOLA's router on a
      // core this layout may not redraw.
      const withTree = new Set<string>();
      const coreOnly = new Set<string>();
      for (const [nodeId, list] of ends) {
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            if (list[i].edgeId === list[j].edgeId) {
              continue;
            }
            if (
              Math.abs(list[i].x - list[j].x) >= EPSILON ||
              Math.abs(list[i].y - list[j].y) >= EPSILON
            ) {
              continue;
            }
            const message = `${list[i].edgeId} and ${list[j].edgeId} share a port on ${nodeId}`;
            const involvesTree =
              isTreeConnector.has(list[i].edgeId) || isTreeConnector.has(list[j].edgeId);
            (involvesTree ? withTree : coreOnly).add(message);
          }
        }
      }

      expect([...withTree].length, [...withTree].sort().join(', ')).toBe(
        KNOWN_SHARED_TREE_PORTS[name] ?? 0
      );
      expect([...coreOnly].sort()).toEqual(KNOWN_SHARED_CORE_PORTS[name] ?? []);
    });

    it(`keeps every edge label off every node box in ${name}`, async () => {
      const { layout } = await lay(name, sizes);
      // Subgraph frames are excluded. A frame is not a box the drawing has to keep
      // clear of — it is drawn *around* content, and an edge between two nodes in
      // the same subgraph has nowhere else to put its label than inside their frame.
      const boxes = layout.nodes
        .filter((node) => node.isGroup !== true)
        .map((node) => ({
          id: node.id,
          minX: (node.x ?? 0) - (node.width ?? 0) / 2,
          maxX: (node.x ?? 0) + (node.width ?? 0) / 2,
          minY: (node.y ?? 0) - (node.height ?? 0) / 2,
          maxY: (node.y ?? 0) + (node.height ?? 0) / 2,
        }));

      const offenders: string[] = [];
      for (const label of labelBoxes(layout)) {
        for (const box of boxes) {
          if (
            Math.min(label.maxX, box.maxX) - Math.max(label.minX, box.minX) > EPSILON &&
            Math.min(label.maxY, box.maxY) - Math.max(label.minY, box.minY) > EPSILON
          ) {
            offenders.push(`${label.edgeId} over ${box.id}`);
          }
        }
      }
      expect(offenders.sort()).toEqual([]);
    });

    it(`keeps every edge label off the point where two edges cross in ${name}`, async () => {
      const { layout } = await lay(name, sizes);
      const crossings = crossingPoints(layout.edges);

      // A label containing a crossing belongs, as far as a reader can tell, to
      // either edge. That is the ambiguity the placement pass exists to remove.
      const offenders: string[] = [];
      for (const label of labelBoxes(layout)) {
        for (const crossing of crossings) {
          if (
            crossing.x > label.minX &&
            crossing.x < label.maxX &&
            crossing.y > label.minY &&
            crossing.y < label.maxY
          ) {
            offenders.push(
              `${label.edgeId} contains the crossing at ` +
                `(${crossing.x.toFixed(0)}, ${crossing.y.toFixed(0)})`
            );
          }
        }
      }
      expect(offenders).toHaveLength(KNOWN_LABELS_ON_CROSSINGS[name] ?? 0);
    });

    it(`leaves no core edge unaligned that grid-like could align in ${name}`, async () => {
      const { layout, coreIds } = await lay(name, sizes);
      const core = {
        ...layout,
        nodes: layout.nodes.filter((node) => coreIds.has(node.id)),
        edges: layout.edges.filter((edge) => coreIds.has(edge.start!) && coreIds.has(edge.end!)),
      } as LayoutData;
      expect(countBentEdges(core)).toBe(UNALIGNED_CORE_EDGES[name] ?? 0);
    });

    it(`draws no two core edges along each other in ${name}`, async () => {
      const { coreEdges } = await lay(name, sizes);
      // Two routes that meet at a node converge on its boundary, so a shared stub
      // there is the drawing being correct rather than two edges merging.
      const meetAtANode = (a: Edge, b: Edge): boolean =>
        a.start === b.start || a.start === b.end || a.end === b.start || a.end === b.end;
      expect(overlappingPairs(coreEdges, meetAtANode)).toEqual(KNOWN_CORE_OVERLAPS[name] ?? []);
    });
  }
});
