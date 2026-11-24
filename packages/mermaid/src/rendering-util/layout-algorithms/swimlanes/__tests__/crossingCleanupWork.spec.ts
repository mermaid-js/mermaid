import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Diagram } from '../../../../Diagram.js';
import { addDiagrams } from '../../../../diagram-api/diagram-orchestration.js';
import type { Edge, LayoutData } from '../../../types.js';
import { prepareLayoutForSwimlanes } from '../helpers.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';
import type * as Geometry from '../direction/geometry.js';
import type * as MaterializedGeometry from '../direction/materializedGeometry.js';
import type * as SharedTrackNudging from '../direction/sharedTrackNudging.js';

const COUNTED_PASSES = [
  'resolveRenderedOrthogonalCrossings',
  'shortcutRedundantOrthogonalJogs',
  'reassignCrossingExternalRailChannels',
  'nudgeSharedInteriorSubpaths',
  'swapDestinationTerminalTailsToReduceCrossings',
] as const;
type CountedPass = (typeof COUNTED_PASSES)[number];

/**
 * One run of a pass: the strict crossings between routes before and after it, the bends
 * after it, and the sum of every route point's x and y after it, which moves when any route
 * does.
 */
interface PassRun {
  pass: CountedPass;
  crossingsBefore: number;
  crossingsAfter: number;
  bendsAfter: number;
  coordinateSum: number;
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

/** Wraps a pass so that its geometry calls are counted and each run of it is recorded. */
const recorder = vi.hoisted(() => {
  const TOLERANCE = 1e-3;
  const visiblePoints = (geometry: typeof Geometry, edges: Edge[]) =>
    edges
      .filter((edge) => !edge.isLayoutOnly)
      .map((edge) => geometry.dedupeConsecutivePoints(edge.points ?? []));
  const crossings = (geometry: typeof Geometry, edges: Edge[]): number => {
    const routes = visiblePoints(geometry, edges).map((points) =>
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
  const record = (geometry: typeof Geometry, pass: CountedPass, edges: Edge[], before: number) => {
    const points = visiblePoints(geometry, edges);
    work.runs.push({
      pass,
      crossingsBefore: before,
      crossingsAfter: crossings(geometry, edges),
      bendsAfter: points.reduce(
        (sum, route) => sum + geometry.countOrthogonalBends(route, TOLERANCE),
        0
      ),
      coordinateSum:
        Math.round(points.flat().reduce((sum, point) => sum + point.x + point.y, 0) * 100) / 100,
    });
  };
  return {
    wrap:
      <E extends Edge, N>(
        geometry: typeof Geometry,
        pass: CountedPass,
        run: (edges: E[], nodeByIdMap: N) => void
      ) =>
      (edges: E[], nodeByIdMap: N): void => {
        const before = crossings(geometry, edges);
        work.pass = pass;
        try {
          run(edges, nodeByIdMap);
        } finally {
          work.pass = '';
        }
        record(geometry, pass, edges, before);
      },
  };
});

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
  return {
    ...materialized,
    resolveRenderedOrthogonalCrossings: recorder.wrap(
      geometry,
      'resolveRenderedOrthogonalCrossings',
      materialized.resolveRenderedOrthogonalCrossings
    ),
    shortcutRedundantOrthogonalJogs: recorder.wrap(
      geometry,
      'shortcutRedundantOrthogonalJogs',
      materialized.shortcutRedundantOrthogonalJogs
    ),
    reassignCrossingExternalRailChannels: recorder.wrap(
      geometry,
      'reassignCrossingExternalRailChannels',
      materialized.reassignCrossingExternalRailChannels
    ),
    swapDestinationTerminalTailsToReduceCrossings: recorder.wrap(
      geometry,
      'swapDestinationTerminalTailsToReduceCrossings',
      materialized.swapDestinationTerminalTailsToReduceCrossings
    ),
  };
});

vi.mock('../direction/sharedTrackNudging.js', async (importOriginal) => {
  const nudging = await importOriginal<typeof SharedTrackNudging>();
  const geometry = await vi.importActual<typeof Geometry>('../direction/geometry.js');
  return {
    ...nudging,
    nudgeSharedInteriorSubpaths: recorder.wrap(
      geometry,
      'nudgeSharedInteriorSubpaths',
      nudging.nudgeSharedInteriorSubpaths
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

interface Graph {
  name: string;
  direction: 'TB' | 'LR';
  source: string;
}

/** Nodes dealt round-robin into the lanes, and twice as many edges between random distinct nodes. */
function laneGraph(
  direction: Graph['direction'],
  lanes: number,
  nodes: number,
  seed: number
): Graph {
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
  return {
    name: `${direction}, ${lanes} lanes, ${nodes} nodes, seed ${seed}`,
    direction,
    source: `swimlane-beta ${direction}\n${laneBlocks.join('')}${edges.join('')}`,
  };
}

/** `edges` labelled edges between the same two nodes. */
function parallelGraph(direction: Graph['direction'], edges: number): Graph {
  return {
    name: `${direction}, ${edges} parallel edges`,
    direction,
    source: `swimlane-beta ${direction}\n${'  A -->|x| B\n'.repeat(edges)}`,
  };
}

/** Lays the graph out with every node 80 x 40, the hand-off `ddlt/backends.ts` uses. */
async function layOut(graph: Graph): Promise<void> {
  work.calls = new Map();
  work.runs = [];
  const diagram = await Diagram.fromText(graph.source);
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

beforeAll(() => {
  addDiagrams();
});

/** The two graphs compared: the larger has eight times the nodes and the edges. */
const SMALL_GRAPH = laneGraph('TB', 5, 5, 7);
const LARGE_GRAPH = laneGraph('TB', 5, 40, 7);

/**
 * How much more work each pass may do on the larger graph. For eight times the edges, work
 * linear in them grows about 8x, quadratic 64x and cubic 512x.
 * - The crossing cleanup scores a candidate route in time that does not grow with the edge
 *   count, so it must stay well under quadratic.
 * - The jog shortcut pass still checks a candidate against every route for a shared track, so
 *   it may be quadratic but must stay well under cubic.
 * - The rail-channel pass tries assignments within components whose size does not follow the
 *   graph's, and scores one by the routes it moves, so its work stays about level. It must not
 *   grow like the edge count, as it does when every assignment walks every pair of edges.
 * - The shared-track nudge tests a segment's candidates once per round against indexes, so it
 *   must stay near linear.
 * - The terminal tail swap tries every pair of edges into one node, but scores a pair from
 *   the routes it changes, so it must stay well under quadratic.
 */
const MAX_GROWTH: Record<CountedPass, number> = {
  resolveRenderedOrthogonalCrossings: 35,
  shortcutRedundantOrthogonalJogs: 140,
  reassignCrossingExternalRailChannels: 2.5,
  nudgeSharedInteriorSubpaths: 9,
  swapDestinationTerminalTailsToReduceCrossings: 30,
};

const SHORT_NAME: Record<CountedPass, string> = {
  resolveRenderedOrthogonalCrossings: 'cleanup',
  shortcutRedundantOrthogonalJogs: 'jogs',
  reassignCrossingExternalRailChannels: 'rails',
  nudgeSharedInteriorSubpaths: 'nudge',
  swapDestinationTerminalTailsToReduceCrossings: 'tails',
};

/**
 * Small graphs on which the counted passes change routes: the crossing cleanup takes single
 * and paired reroutes, the jog shortcut pass rejects shortcuts that would add crossings, the
 * rail-channel pass moves rails (once in a component of more than six) and the shared-track
 * nudge shifts segments. Each run lists the pass, the crossings before and after it, and the
 * bends and the coordinate sum after it, in the order the passes run.
 */
const PINNED: { graph: Graph; runs: [string, number, number, number, number][] }[] = [
  {
    graph: laneGraph('LR', 3, 6, 1),
    runs: [
      ['nudge', 19, 19, 24, 16422.67],
      ['tails', 19, 19, 25, 16624.67],
      ['cleanup', 19, 2, 26, 16644.67],
      ['rails', 2, 2, 26, 16644.67],
      ['jogs', 2, 2, 23, 15812.67],
      ['nudge', 3, 3, 22, 15608.67],
      ['cleanup', 3, 2, 21, 15180.67],
      ['rails', 2, 2, 21, 15180.67],
      ['jogs', 2, 2, 21, 15180.67],
    ],
  },
  {
    graph: laneGraph('LR', 5, 6, 1),
    runs: [
      ['nudge', 12, 12, 26, 23432.67],
      ['tails', 13, 13, 27, 23880.67],
      ['cleanup', 13, 3, 26, 22466],
      ['rails', 4, 4, 26, 22452],
      ['jogs', 4, 4, 26, 22452],
      ['nudge', 5, 5, 26, 22492],
      ['cleanup', 5, 2, 26, 22976.67],
      ['rails', 3, 3, 26, 22962.67],
      ['jogs', 3, 3, 26, 22962.67],
    ],
  },
  {
    graph: laneGraph('LR', 3, 6, 11),
    runs: [
      ['nudge', 11, 11, 22, 10447.33],
      ['tails', 11, 11, 24, 10971.33],
      ['cleanup', 11, 4, 21, 11466],
      ['rails', 4, 4, 21, 11466],
      ['jogs', 4, 4, 21, 11466],
      ['nudge', 5, 5, 21, 11406],
      ['cleanup', 5, 3, 21, 11146],
      ['rails', 3, 3, 21, 11146],
      ['jogs', 3, 3, 21, 11146],
    ],
  },
  {
    graph: laneGraph('TB', 3, 8, 6),
    runs: [
      ['nudge', 18, 18, 25, 17232.57],
      ['tails', 18, 17, 27, 18192.57],
      ['cleanup', 17, 4, 28, 18477.71],
      ['rails', 4, 4, 28, 18477.71],
      ['jogs', 4, 4, 26, 18380.57],
      ['nudge', 4, 4, 24, 17752.57],
      ['cleanup', 4, 4, 22, 16792.57],
      ['rails', 4, 4, 22, 16792.57],
      ['jogs', 4, 4, 22, 16792.57],
    ],
  },
  {
    graph: laneGraph('LR', 5, 8, 7),
    runs: [
      ['nudge', 13, 13, 36, 24928],
      ['tails', 13, 12, 40, 26490],
      ['cleanup', 12, 4, 38, 26104.67],
      ['rails', 4, 4, 38, 26104.67],
      ['jogs', 4, 4, 36, 25192.67],
      ['nudge', 5, 5, 33, 24032.67],
      ['cleanup', 5, 4, 31, 23632.67],
      ['rails', 5, 5, 31, 23660.67],
      ['jogs', 5, 4, 29, 21868.67],
    ],
  },
  {
    graph: laneGraph('LR', 5, 6, 12),
    runs: [
      ['nudge', 14, 14, 29, 19989.33],
      ['tails', 16, 16, 29, 20101.33],
      ['cleanup', 16, 7, 29, 21052],
      ['rails', 7, 7, 29, 21038],
      ['jogs', 7, 7, 29, 21038],
      ['nudge', 7, 7, 28, 20696],
      ['cleanup', 7, 4, 23, 18815.33],
      ['rails', 4, 4, 23, 18815.33],
      ['jogs', 4, 4, 23, 18815.33],
    ],
  },
  {
    graph: laneGraph('TB', 5, 10, 9),
    runs: [
      ['nudge', 25, 25, 50, 12130.67],
      ['tails', 25, 23, 50, 11934.67],
      ['cleanup', 23, 14, 46, 12212.67],
      ['rails', 14, 14, 46, 12212.67],
      ['jogs', 14, 14, 45, 12462.67],
      ['nudge', 15, 15, 43, 12114.67],
      ['cleanup', 15, 14, 43, 12586.67],
      ['rails', 14, 14, 43, 12586.67],
      ['jogs', 14, 14, 43, 12586.67],
    ],
  },
  {
    graph: laneGraph('LR', 5, 12, 1),
    runs: [
      ['nudge', 31, 31, 54, 59986],
      ['tails', 32, 32, 55, 60714],
      ['cleanup', 32, 20, 51, 59006],
      ['rails', 20, 19, 51, 59006],
      ['jogs', 19, 17, 48, 57970],
      ['nudge', 18, 18, 47, 57470],
      ['cleanup', 18, 17, 44, 55160],
      ['rails', 17, 17, 44, 55160],
      ['jogs', 17, 17, 44, 55160],
    ],
  },
  {
    graph: laneGraph('LR', 5, 12, 5),
    runs: [
      ['nudge', 38, 38, 64, 86192.67],
      ['tails', 40, 39, 64, 85569.33],
      ['cleanup', 39, 35, 56, 79382.67],
      ['rails', 35, 31, 56, 79382.67],
      ['jogs', 31, 31, 56, 79382.67],
      ['nudge', 32, 32, 53, 76740.67],
      ['cleanup', 32, 32, 52, 76324.67],
      ['rails', 32, 32, 52, 76328.67],
      ['jogs', 32, 32, 52, 76328.67],
    ],
  },
  {
    graph: laneGraph('TB', 5, 12, 7),
    runs: [
      ['nudge', 46, 46, 67, 17161.33],
      ['tails', 46, 46, 67, 17161.33],
      ['cleanup', 46, 24, 62, 15168.67],
      ['rails', 24, 24, 62, 15168.67],
      ['jogs', 24, 23, 61, 15180.67],
      ['nudge', 23, 23, 56, 14716],
      ['cleanup', 23, 23, 54, 14729.33],
      ['rails', 23, 21, 54, 14729.33],
      ['jogs', 21, 21, 54, 14729.33],
    ],
  },
  {
    graph: laneGraph('LR', 5, 6, 11),
    runs: [
      ['nudge', 23, 23, 30, 20794],
      ['tails', 23, 23, 31, 21436],
      ['cleanup', 23, 10, 27, 21106],
      ['rails', 10, 8, 27, 21106],
      ['jogs', 8, 8, 27, 21106],
      ['nudge', 10, 10, 27, 21060],
      ['cleanup', 10, 6, 25, 19865.33],
      ['rails', 6, 6, 25, 19865.33],
      ['jogs', 6, 6, 25, 19865.33],
    ],
  },
  {
    graph: parallelGraph('LR', 10),
    runs: [
      ['nudge', 13, 13, 31, 5320],
      ['tails', 11, 8, 24, 5212],
      ['cleanup', 8, 1, 22, 6876],
      ['rails', 1, 1, 22, 6876],
      ['jogs', 1, 1, 19, 6460],
      ['nudge', 2, 2, 19, 6462],
      ['cleanup', 2, 2, 19, 6462],
      ['rails', 2, 2, 19, 6462],
      ['jogs', 2, 2, 19, 6270],
    ],
  },
  {
    graph: parallelGraph('TB', 20),
    runs: [
      ['nudge', 115, 115, 64, 4640],
      ['tails', 119, 118, 64, 4735.79],
      ['cleanup', 118, 73, 59, 4862.18],
      ['rails', 73, 73, 59, 4862.18],
      ['jogs', 73, 68, 53, 4693.05],
      ['nudge', 63, 63, 51, 4636.39],
      ['cleanup', 63, 63, 51, 4636.39],
      ['rails', 60, 60, 51, 4650.39],
      ['jogs', 60, 59, 50, 4706.39],
    ],
  },
];

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
    expect(largeWork).toBeGreaterThan(0);
    expect(largeWork / smallWork).toBeLessThan(MAX_GROWTH[pass]);
  });
});

describe('swimlane post-routing passes: the routes they settle on', () => {
  it.each(PINNED)('$graph.name', async ({ graph, runs }) => {
    await layOut(graph);
    expect(
      work.runs.map((run) => [
        SHORT_NAME[run.pass],
        run.crossingsBefore,
        run.crossingsAfter,
        run.bendsAfter,
        run.coordinateSum,
      ])
    ).toEqual(runs);
  });
});
