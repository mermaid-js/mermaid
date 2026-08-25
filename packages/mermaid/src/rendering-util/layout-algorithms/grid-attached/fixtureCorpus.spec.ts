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
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../logger.js';
import type { Edge, LayoutData } from '../../types.js';
import { applyFixtureContentSizesStrict, loadSizesFixture } from '../ddlt/fixtureSizes.js';
import { layoutTestsDir } from '../ddlt/paths.js';
import { parseMmdFileToLayoutData } from '../ddlt/parseToLayoutData.js';
import { applyFixtureEdgeLabelSizes } from '../ddlt/backends.js';
import { countBentEdges } from './coreCandidates.js';
import { runGridAttachedLayoutCore } from './layoutCore.js';
import type { GridAttachedResult } from './layoutCore.js';

const FIXTURE_DIR = join(layoutTestsDir(), 'hola-faithful');
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
};

const UNALIGNED_CORE_EDGES: Record<string, number> = {
  '___ Hola paper main example algorithm': 6,
  'GRAPH - Bipartite Graph k3,3': 2,
  'GRAPH - complete_graph_k4': 8,
  domus1: 4,
  'life-choices': 1,
  'multiple-edges': 1,
  'project-sox2': 12,
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
    const lowX = Math.min(a.x, b.x);
    const highX = Math.max(a.x, b.x);
    const lowY = Math.min(a.y, b.y);
    const highY = Math.max(a.y, b.y);
    if (
      Math.min(highX, rect.maxX) - Math.max(lowX, rect.minX) > EPSILON &&
      Math.min(highY, rect.maxY) - Math.max(lowY, rect.minY) > EPSILON
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
      const boxes = layout.nodes.map((node) => ({
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

      expect([...withTree].sort()).toEqual([]);
      expect([...coreOnly].sort()).toEqual(KNOWN_SHARED_CORE_PORTS[name] ?? []);
    });

    it(`keeps every edge label off every node box in ${name}`, async () => {
      const { layout } = await lay(name, sizes);
      const boxes = layout.nodes.map((node) => ({
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
      expect(offenders).toEqual([]);
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
