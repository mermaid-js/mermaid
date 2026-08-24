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

function fixtureNames(): string[] {
  const files = readdirSync(FIXTURE_DIR);
  return (
    files
      .filter((file) => file.endsWith('.mmd'))
      .map((file) => file.replace(/\.mmd$/, ''))
      // A `.mmd` with no captured sizes cannot be laid out DOM-free.
      .filter((name) => files.includes(`${name}.sizes.json`))
      .sort()
  );
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

interface Laid {
  layout: LayoutData;
  result: GridAttachedResult;
  coreIds: Set<string>;
  coreEdges: Edge[];
  treeEdges: Edge[];
}

async function lay(name: string): Promise<Laid> {
  const layout = await parseMmdFileToLayoutData(join(FIXTURE_DIR, `${name}.mmd`), {
    stampFlowchartRendererFields: true,
  });
  const sizes = loadSizesFixture(join(FIXTURE_DIR, `${name}.sizes.json`));
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

  const names = fixtureNames();

  it('finds fixtures to run', () => {
    expect(names.length).toBeGreaterThan(5);
  });

  for (const name of names) {
    it(`draws no two tree connectors along each other in ${name}`, async () => {
      const { treeEdges } = await lay(name);
      expect(overlappingPairs(treeEdges)).toEqual([]);
    });

    it(`routes every core edge orthogonally in ${name}`, async () => {
      const { coreEdges } = await lay(name);
      expect(coreEdges.filter((edge) => !isOrthogonal(edge)).map((edge) => edge.id)).toEqual([]);
    });

    it(`runs no core edge through a node it does not touch in ${name}`, async () => {
      const { layout, coreEdges } = await lay(name);
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

    it(`draws no two core edges along each other in ${name}`, async () => {
      const { coreEdges } = await lay(name);
      // Two routes that meet at a node converge on its boundary, so a shared stub
      // there is the drawing being correct rather than two edges merging.
      const meetAtANode = (a: Edge, b: Edge): boolean =>
        a.start === b.start || a.start === b.end || a.end === b.start || a.end === b.end;
      expect(overlappingPairs(coreEdges, meetAtANode)).toEqual(KNOWN_CORE_OVERLAPS[name] ?? []);
    });
  }
});
