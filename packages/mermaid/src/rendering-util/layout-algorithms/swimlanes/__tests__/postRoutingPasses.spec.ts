import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Diagram } from '../../../../Diagram.js';
import { addDiagrams } from '../../../../diagram-api/diagram-orchestration.js';
import type { Edge, LayoutData } from '../../../types.js';
import { prepareLayoutForSwimlanes } from '../helpers.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';
import type * as MaterializedGeometry from '../direction/materializedGeometry.js';
import type * as SharedTrackNudging from '../direction/sharedTrackNudging.js';

/**
 * The rail-channel, terminal tail swap and shared-track nudge passes must choose what they
 * chose before they read the round's routes from indexes. Wherever the layout runs one, its
 * previous version (`previousPostRoutingPasses.ts`) runs first on a copy of the same routes,
 * and both must leave every route with the same points.
 */
const comparison = vi.hoisted(() => ({
  mismatches: new Array<string>(),
  changedRuns: new Map<string, number>(),
}));

const differential = vi.hoisted(() => ({
  wrap:
    <E extends Edge, N>(
      pass: string,
      current: (edges: E[], nodeByIdMap: N) => void,
      previous: (edges: E[], nodeByIdMap: N) => void
    ) =>
    (edges: E[], nodeByIdMap: N): void => {
      const before = JSON.stringify(edges.map((edge) => edge.points));
      const copies = edges.map((edge) => ({
        ...edge,
        points: edge.points?.map((point) => ({ ...point })),
      }));
      previous(copies, nodeByIdMap);
      current(edges, nodeByIdMap);
      const after = JSON.stringify(edges.map((edge) => edge.points));
      if (after !== JSON.stringify(copies.map((edge) => edge.points))) {
        comparison.mismatches.push(pass);
      }
      if (after !== before) {
        comparison.changedRuns.set(pass, (comparison.changedRuns.get(pass) ?? 0) + 1);
      }
    },
}));

vi.mock('../direction/materializedGeometry.js', async (importOriginal) => {
  const current = await importOriginal<typeof MaterializedGeometry>();
  const previous = await import('./previousPostRoutingPasses.js');
  return {
    ...current,
    reassignCrossingExternalRailChannels: differential.wrap(
      'reassignCrossingExternalRailChannels',
      current.reassignCrossingExternalRailChannels,
      previous.reassignCrossingExternalRailChannels
    ),
    swapDestinationTerminalTailsToReduceCrossings: differential.wrap(
      'swapDestinationTerminalTailsToReduceCrossings',
      current.swapDestinationTerminalTailsToReduceCrossings,
      previous.swapDestinationTerminalTailsToReduceCrossings
    ),
  };
});

vi.mock('../direction/sharedTrackNudging.js', async (importOriginal) => {
  const current = await importOriginal<typeof SharedTrackNudging>();
  const previous = await import('./previousPostRoutingPasses.js');
  return {
    ...current,
    nudgeSharedInteriorSubpaths: differential.wrap(
      'nudgeSharedInteriorSubpaths',
      current.nudgeSharedInteriorSubpaths,
      previous.nudgeSharedInteriorSubpaths
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

const DIRECTIONS = ['TB', 'LR', 'BT', 'RL'] as const;

interface Graph {
  name: string;
  direction: (typeof DIRECTIONS)[number];
  source: string;
}

/** Nodes dealt round-robin into lanes, and twice as many edges, some labelled, between them. */
function randomGraph(seed: number): Graph {
  const random = seededRandom(seed);
  const direction = DIRECTIONS[seed % DIRECTIONS.length];
  const lanes = 2 + random(4);
  const nodes = 6 + random(9);
  const laneBlocks = Array.from({ length: lanes }, (_, lane) => {
    const members = Array.from({ length: nodes }, (_, n) => n).filter((n) => n % lanes === lane);
    return `  subgraph L${lane}\n${members.map((n) => `    n${n}\n`).join('')}  end\n`;
  });
  const edges = Array.from({ length: 2 * nodes }, (_, index) => {
    const from = random(nodes);
    const to = (from + 1 + random(nodes - 1)) % nodes;
    return `  n${from} -->${index % 4 === 0 ? `|e${index}|` : ''} n${to}\n`;
  });
  return {
    name: `seed ${seed}: ${direction}, ${lanes} lanes, ${nodes} nodes`,
    direction,
    source: `swimlane-beta ${direction}\n${laneBlocks.join('')}${edges.join('')}`,
  };
}

function parallelGraph(direction: Graph['direction'], edges: number): Graph {
  return {
    name: `${direction}, ${edges} parallel edges`,
    direction,
    source: `swimlane-beta ${direction}\n${'  A -->|x| B\n'.repeat(edges)}`,
  };
}

/** Random graphs, enough that each pass changes routes in several of them. */
const RANDOM_GRAPHS = 48;

/**
 * Each graph runs the previous, slower passes beside the current ones. A graph takes under a
 * second alone and up to 7 s in the coverage run, which is over the 5 s default.
 */
const GRAPH_TIMEOUT_MS = 30_000;

const GRAPHS: Graph[] = [
  ...Array.from({ length: RANDOM_GRAPHS }, (_, i) => randomGraph(i + 1)),
  parallelGraph('LR', 10),
  parallelGraph('TB', 20),
  parallelGraph('LR', 40),
];

/** Lays the graph out with every node 80 x 40, the hand-off `ddlt/backends.ts` uses. */
async function layOut(graph: Graph): Promise<void> {
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

describe('swimlane post-routing passes: the same choices as their previous versions', () => {
  beforeAll(() => {
    addDiagrams();
  });

  it.each(GRAPHS)(
    '$name',
    async (graph) => {
      comparison.mismatches = [];
      await layOut(graph);
      expect(comparison.mismatches).toEqual([]);
    },
    GRAPH_TIMEOUT_MS
  );

  it('changes routes in several of the graphs, so the agreement is not only on no change', () => {
    expect(Object.fromEntries(comparison.changedRuns)).toEqual({
      reassignCrossingExternalRailChannels: expect.any(Number),
      swapDestinationTerminalTailsToReduceCrossings: expect.any(Number),
      nudgeSharedInteriorSubpaths: expect.any(Number),
    });
    for (const runs of comparison.changedRuns.values()) {
      expect(runs).toBeGreaterThan(2);
    }
  });
});
