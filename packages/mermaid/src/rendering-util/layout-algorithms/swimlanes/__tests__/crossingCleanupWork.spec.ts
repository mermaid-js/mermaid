import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Diagram } from '../../../../Diagram.js';
import { addDiagrams } from '../../../../diagram-api/diagram-orchestration.js';
import type { LayoutData } from '../../../types.js';
import { prepareLayoutForSwimlanes } from '../helpers.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';
import type * as Geometry from '../direction/geometry.js';
import type * as MaterializedGeometry from '../direction/materializedGeometry.js';

const COUNTED_PASSES = [
  'resolveRenderedOrthogonalCrossings',
  'shortcutRedundantOrthogonalJogs',
] as const;
type CountedPass = (typeof COUNTED_PASSES)[number];

/** One run of a pass: the strict crossings between routes before and after it, and the bends after it. */
interface PassRun {
  pass: CountedPass;
  crossingsBefore: number;
  crossingsAfter: number;
  bendsAfter: number;
}

/**
 * The work of a post-routing pass as the number of geometry calls made while it runs:
 * segments derived, points deduplicated and segment pairs tested for a crossing. Counting
 * calls instead of timing them keeps the test exact on a loaded machine.
 */
const work = vi.hoisted(() => ({
  pass: '',
  calls: new Map<string, number>(),
  runs: new Array<PassRun>(),
}));

vi.mock('../direction/geometry.js', async (importOriginal) => {
  const geometry = await importOriginal<typeof Geometry>();
  const count = (): void => {
    if (work.pass) {
      work.calls.set(work.pass, (work.calls.get(work.pass) ?? 0) + 1);
    }
  };
  return {
    ...geometry,
    dedupeConsecutivePoints: (...args: Parameters<typeof geometry.dedupeConsecutivePoints>) => {
      count();
      return geometry.dedupeConsecutivePoints(...args);
    },
    orthogonalSegmentsForPoints: (
      ...args: Parameters<typeof geometry.orthogonalSegmentsForPoints>
    ) => {
      count();
      return geometry.orthogonalSegmentsForPoints(...args);
    },
    orthogonalSegmentsStrictlyCross: (
      ...args: Parameters<typeof geometry.orthogonalSegmentsStrictlyCross>
    ) => {
      count();
      return geometry.orthogonalSegmentsStrictlyCross(...args);
    },
  };
});

vi.mock('../direction/materializedGeometry.js', async (importOriginal) => {
  const materialized = await importOriginal<typeof MaterializedGeometry>();
  const geometry = await vi.importActual<typeof Geometry>('../direction/geometry.js');
  type Pass = typeof materialized.resolveRenderedOrthogonalCrossings;
  type Routes = Parameters<Pass>[0];
  const TOLERANCE = 1e-3;

  const visiblePoints = (edges: Routes) =>
    edges
      .filter((edge) => !('isLayoutOnly' in edge && edge.isLayoutOnly))
      .map((edge) => geometry.dedupeConsecutivePoints(edge.points ?? []));
  const crossings = (edges: Routes): number => {
    const routes = visiblePoints(edges).map((points) =>
      geometry.orthogonalSegmentsForPoints(points)
    );
    let count = 0;
    routes.forEach((route, i) => {
      for (const other of routes.slice(i + 1)) {
        for (const one of route) {
          count += other.filter((two) =>
            geometry.orthogonalSegmentsStrictlyCross(one.a, one.b, two.a, two.b, TOLERANCE)
          ).length;
        }
      }
    });
    return count;
  };
  const bends = (edges: Routes): number =>
    visiblePoints(edges).reduce(
      (sum, points) => sum + geometry.countOrthogonalBends(points, TOLERANCE),
      0
    );

  const counted =
    (pass: CountedPass, run: Pass): Pass =>
    (edges, nodeByIdMap) => {
      const crossingsBefore = crossings(edges);
      work.pass = pass;
      try {
        run(edges, nodeByIdMap);
      } finally {
        work.pass = '';
      }
      work.runs.push({
        pass,
        crossingsBefore,
        crossingsAfter: crossings(edges),
        bendsAfter: bends(edges),
      });
    };
  return {
    ...materialized,
    resolveRenderedOrthogonalCrossings: counted(
      'resolveRenderedOrthogonalCrossings',
      materialized.resolveRenderedOrthogonalCrossings
    ),
    shortcutRedundantOrthogonalJogs: counted(
      'shortcutRedundantOrthogonalJogs',
      materialized.shortcutRedundantOrthogonalJogs
    ),
  };
});

/** Integers below a bound from a 32-bit linear congruential generator, the same for the same seed. */
function seededRandom(seed: number): (below: number) => number {
  let state = seed;
  return (below) => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return Math.floor((state / 2 ** 32) * below);
  };
}

interface LaneGraph {
  direction: 'TB' | 'LR';
  lanes: number;
  nodes: number;
  seed: number;
}

/** Nodes dealt round-robin into the lanes, and twice as many edges between random distinct nodes. */
function laneGraphSource({ direction, lanes, nodes, seed }: LaneGraph): string {
  const random = seededRandom(seed);
  const laneBlocks = Array.from({ length: lanes }, (_, lane) => {
    const members = Array.from({ length: nodes }, (_, n) => n).filter((n) => n % lanes === lane);
    return `  subgraph L${lane}\n${members.map((n) => `    n${n}\n`).join('')}  end\n`;
  });
  const edges = Array.from({ length: 2 * nodes }, () => {
    const from = random(nodes);
    const to = (from + 1 + random(nodes - 1)) % nodes;
    return `  n${from} --> n${to}\n`;
  });
  return `swimlane-beta ${direction}\n${laneBlocks.join('')}${edges.join('')}`;
}

/** Lays the graph out with every node 80 x 40, the hand-off `ddlt/backends.ts` uses. */
async function layOut(graph: LaneGraph): Promise<void> {
  work.calls = new Map();
  work.runs = [];
  const diagram = await Diagram.fromText(laneGraphSource(graph));
  const layout = (diagram.db as { getData: () => LayoutData }).getData();
  (layout as LayoutData & { direction?: string }).direction = graph.direction;
  layout.config = { flowchart: { nodeSpacing: 40, rankSpacing: 100 } } as LayoutData['config'];
  for (const node of layout.nodes) {
    if (!node.isGroup) {
      node.width = 80;
      node.height = 40;
    }
  }
  prepareLayoutForSwimlanes(layout);
  runSwimlaneLayoutCore(layout);
}

/** The two graphs compared: the larger has eight times the nodes and the edges. */
const SMALL_GRAPH: LaneGraph = { direction: 'TB', lanes: 5, nodes: 5, seed: 7 };
const LARGE_GRAPH: LaneGraph = { ...SMALL_GRAPH, nodes: 40 };

/**
 * How much more work each pass may do on the larger graph. For eight times the edges, work
 * linear in them grows about 8x, quadratic 64x and cubic 512x. The crossing cleanup scores a
 * candidate route in time that does not grow with the edge count, so it must stay well under
 * quadratic. The jog shortcut pass still checks a candidate against every route for a shared
 * track, so it may be quadratic but must stay well under cubic.
 */
const MAX_GROWTH: Record<CountedPass, number> = {
  resolveRenderedOrthogonalCrossings: 35,
  shortcutRedundantOrthogonalJogs: 140,
};

const SHORT_NAME: Record<CountedPass, string> = {
  resolveRenderedOrthogonalCrossings: 'cleanup',
  shortcutRedundantOrthogonalJogs: 'jogs',
};

/**
 * Small graphs on which the crossing cleanup takes both single and paired reroutes, and the
 * jog shortcut pass weighs shortcuts on crossed edges, rejecting some for adding crossings.
 * Each run is `[pass, crossings before, crossings after, bends after]`, in the order the
 * passes run.
 */
const PINNED: (LaneGraph & { runs: [string, number, number, number][] })[] = [
  {
    direction: 'LR',
    lanes: 3,
    nodes: 6,
    seed: 1,
    runs: [
      ['cleanup', 19, 2, 26],
      ['jogs', 2, 2, 23],
      ['cleanup', 3, 2, 21],
      ['jogs', 2, 2, 21],
    ],
  },
  {
    direction: 'LR',
    lanes: 5,
    nodes: 6,
    seed: 1,
    runs: [
      ['cleanup', 13, 3, 26],
      ['jogs', 4, 4, 26],
      ['cleanup', 5, 2, 26],
      ['jogs', 3, 3, 26],
    ],
  },
  {
    direction: 'LR',
    lanes: 3,
    nodes: 6,
    seed: 11,
    runs: [
      ['cleanup', 11, 4, 21],
      ['jogs', 4, 4, 21],
      ['cleanup', 5, 3, 21],
      ['jogs', 3, 3, 21],
    ],
  },
  {
    direction: 'TB',
    lanes: 3,
    nodes: 8,
    seed: 6,
    runs: [
      ['cleanup', 17, 4, 28],
      ['jogs', 4, 4, 26],
      ['cleanup', 4, 4, 22],
      ['jogs', 4, 4, 22],
    ],
  },
  {
    direction: 'LR',
    lanes: 5,
    nodes: 8,
    seed: 7,
    runs: [
      ['cleanup', 12, 4, 38],
      ['jogs', 4, 4, 36],
      ['cleanup', 5, 4, 31],
      ['jogs', 5, 4, 29],
    ],
  },
  {
    direction: 'LR',
    lanes: 5,
    nodes: 6,
    seed: 12,
    runs: [
      ['cleanup', 16, 7, 29],
      ['jogs', 7, 7, 29],
      ['cleanup', 7, 4, 23],
      ['jogs', 4, 4, 23],
    ],
  },
  {
    direction: 'TB',
    lanes: 5,
    nodes: 10,
    seed: 9,
    runs: [
      ['cleanup', 23, 14, 46],
      ['jogs', 14, 14, 45],
      ['cleanup', 15, 14, 43],
      ['jogs', 14, 14, 43],
    ],
  },
];

beforeAll(() => {
  addDiagrams();
});

describe('swimlane post-routing passes: work for eight times the edges', () => {
  const small = new Map<string, number>();
  const large = new Map<string, number>();

  beforeAll(async () => {
    await layOut(SMALL_GRAPH);
    work.calls.forEach((calls, pass) => small.set(pass, calls));
    await layOut(LARGE_GRAPH);
    work.calls.forEach((calls, pass) => large.set(pass, calls));
  }, 600_000);

  it.each(COUNTED_PASSES)('%s grows less than its bound', (pass) => {
    const smallWork = small.get(pass) ?? 0;
    const largeWork = large.get(pass) ?? 0;
    // Both graphs must give the pass something to do, or the ratio proves nothing.
    expect(smallWork).toBeGreaterThan(0);
    expect(largeWork).toBeGreaterThan(smallWork);
    expect(largeWork / smallWork).toBeLessThan(MAX_GROWTH[pass]);
  });
});

describe('swimlane post-routing passes: the crossings and bends they settle on', () => {
  it.each(PINNED)(
    '$direction, $lanes lanes, $nodes nodes, seed $seed',
    async ({ runs, ...graph }) => {
      await layOut(graph);
      expect(
        work.runs.map((run) => [
          SHORT_NAME[run.pass],
          run.crossingsBefore,
          run.crossingsAfter,
          run.bendsAfter,
        ])
      ).toEqual(runs);
    }
  );
});
