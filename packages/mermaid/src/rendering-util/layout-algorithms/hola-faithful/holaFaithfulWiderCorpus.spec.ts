/**
 * The faithful HOLA layout run over the *whole* layout-test corpus, not only the
 * fixtures captured for it.
 *
 * `layout-tests/hola-faithful/` holds nine subgraph-free fixtures. The 25 under
 * `layout-tests/hola/` are richer — several have multiple trees hanging off one
 * core, which is exactly what tree placement, rank alignment and slide retraction
 * are for — so they are run through this layout too, and held to the structural
 * invariants of guide §23. Their captured sizes come from the legacy `hola`
 * pipeline, which is fine: sizes are a property of the text, not of the layout.
 */

import { describe, expect, it, beforeAll } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { setLogLevel } from '../../../logger.js';
import { discoverLayoutTestFixtures, parseMmdFileToLayoutData } from '../ddlt/index.js';
import { applyFixtureEdgeLabelSizes } from '../ddlt/backends.js';
import { applyFixtureContentSizesStrict } from '../ddlt/fixtureSizes.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { runHolaFaithfulLayoutCore } from './layoutCore.js';

const STRUCTURAL = new Set<string>([
  'node-overlap',
  'edge-endpoint-detached-from-node',
  'edge-endpoint-inside-node',
  'edge-through-node',
  'edge-missing-points',
]);

/** Two arrows leaving one node closer than this read as one arrow. */
const MIN_DEPARTURE_GAP = 8;

describe('faithful HOLA — wider fixture corpus', () => {
  beforeAll(() => {
    setLogLevel('fatal');
    addDiagrams();
  });

  const fixtures = discoverLayoutTestFixtures().filter(
    (fx) => fx.profile === 'flowchart-hola' || fx.profile === 'flowchart-hola-faithful'
  );

  it('finds both fixture folders', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(30);
  });

  /**
   * `4 nodes loop + trees` hangs a tree off each node of a four-cycle, so two
   * trees end up on each side of the core — the case cross-tree rank alignment
   * exists for. Node names carry their depth (`C4_11` is rank 2 of C4's tree), so
   * the ranks can be read straight off the drawing.
   */
  it('gives trees on the same side of the core one line per rank', async () => {
    const fx = fixtures.find((f) => f.id.endsWith('4 nodes loop + trees'));
    expect(fx, 'the multi-tree fixture is present').toBeDefined();

    const data = await parseMmdFileToLayoutData(fx!.mmdPath, {
      stampFlowchartRendererFields: true,
    });
    applyFixtureContentSizesStrict(data, fx!.sizes);
    applyFixtureEdgeLabelSizes(data, fx!.sizes);
    runHolaFaithfulLayoutCore(data);

    const byId = new Map(data.nodes.map((node) => [node.id, node]));

    // A tree is a connected component of what was peeled off, so a core node with
    // two unconnected children carries *two* trees: `C2_1`'s subtree and `C2_2`'s
    // are separate, and each is placed on its own. Name a tree by its first-rank
    // node, and read a node's rank off the length of its suffix.
    const members = new Map<string, { id: string; rank: number }[]>();
    for (const node of data.nodes) {
      const match = /^(C\d)_(\d+)$/.exec(node.id);
      if (!match) {
        continue;
      }
      const treeId = `${match[1]}_${match[2][0]}`;
      members.set(treeId, [...(members.get(treeId) ?? []), { id: node.id, rank: match[2].length }]);
    }

    // Which way each tree grew, read from where its first rank landed relative to
    // its root rather than assumed: the choice belongs to tree placement.
    const grown = [...members.keys()].map((treeId) => {
      const rootNode = byId.get(treeId.slice(0, 2))!;
      const first = byId.get(treeId)!;
      const dx = (first.x ?? 0) - (rootNode.x ?? 0);
      const dy = (first.y ?? 0) - (rootNode.y ?? 0);
      const axis: 'x' | 'y' = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      return { treeId, axis, sign: Math.sign(axis === 'x' ? dx : dy) };
    });

    const sides = new Map<string, typeof grown>();
    for (const entry of grown) {
      const key = `${entry.axis}${entry.sign}`;
      sides.set(key, [...(sides.get(key) ?? []), entry]);
    }
    const shared = [...sides.values()].filter((group) => group.length > 1);
    expect(shared.length, 'at least one side carries two trees').toBeGreaterThan(0);

    for (const group of shared) {
      const axis = group[0].axis;
      const byRank = new Map<number, { id: string; coordinate: number }[]>();
      for (const entry of group) {
        for (const member of members.get(entry.treeId) ?? []) {
          const node = byId.get(member.id)!;
          const coordinate = (axis === 'x' ? node.x : node.y) ?? 0;
          byRank.set(member.rank, [
            ...(byRank.get(member.rank) ?? []),
            { id: member.id, coordinate },
          ]);
        }
      }

      const names = group.map((entry) => entry.treeId).join('+');
      for (const [rank, entries] of byRank) {
        const spread =
          Math.max(...entries.map((m) => m.coordinate)) -
          Math.min(...entries.map((m) => m.coordinate));
        expect(
          spread,
          `rank ${rank} of ${names} spans ${spread.toFixed(1)}px on ${axis}: ` +
            entries.map((m) => `${m.id}@${m.coordinate.toFixed(0)}`).join(' ')
        ).toBeLessThan(0.5);
      }
    }
  }, 60_000);

  /**
   * Each of `C1`…`C4` carries its trees on one side, and every one of those trees
   * begins with a single node — so the connector from the core node to its first
   * rank has no reason to bend. It used to: a few pixels of drift left over from
   * an overlap pass that did not converge turned each one into a Z with two bends
   * and a 12px lateral step, the "two small curves where a straight line would do"
   * shape.
   */
  it('connects a core node to a first rank with one straight segment', async () => {
    const fx = fixtures.find((f) => f.id.endsWith('4 nodes loop + trees'))!;
    const data = await parseMmdFileToLayoutData(fx.mmdPath, {
      stampFlowchartRendererFields: true,
    });
    applyFixtureContentSizesStrict(data, fx.sizes);
    applyFixtureEdgeLabelSizes(data, fx.sizes);
    runHolaFaithfulLayoutCore(data);

    // Core node → first rank, so not the four edges of the cycle itself.
    const connectors = data.edges.filter(
      (edge) => /^C\d$/.test(edge.start ?? '') && /^C\d_\d$/.test(edge.end ?? '')
    );
    expect(connectors.length, 'the fixture hangs a tree off every core node').toBe(7);

    const bent: string[] = [];
    for (const edge of connectors) {
      const points = edge.points ?? [];
      if (points.length !== 2) {
        bent.push(
          `${edge.start}->${edge.end} has ${points.length} points: ` +
            points.map((p) => `(${p.x.toFixed(0)},${p.y.toFixed(0)})`).join('')
        );
      }
    }
    expect(bent).toEqual([]);
  }, 60_000);

  /**
   * A branching tree node used to fire every arrow from one point on its side, the
   * routes separating only a clearance step later. Each connector now leaves from
   * its own point, and the drawing stays orthogonal.
   */
  it('spreads the connectors leaving one tree node', async () => {
    const fx = fixtures.find((f) => f.id.endsWith('4 nodes loop + trees'))!;
    const data = await parseMmdFileToLayoutData(fx.mmdPath, {
      stampFlowchartRendererFields: true,
    });
    applyFixtureContentSizesStrict(data, fx.sizes);
    applyFixtureEdgeLabelSizes(data, fx.sizes);
    runHolaFaithfulLayoutCore(data);

    const departures = new Map<string, { edge: string; point: { x: number; y: number } }[]>();
    for (const edge of data.edges) {
      const start = edge.start ?? '';
      const point = (edge.points ?? [])[0];
      if (!point) {
        continue;
      }
      departures.set(start, [...(departures.get(start) ?? []), { edge: edge.id, point }]);
    }

    const fans = [...departures.entries()].filter(([, list]) => list.length > 1);
    expect(fans.length, 'the fixture has branching nodes').toBeGreaterThan(4);

    const shared: string[] = [];
    for (const [node, list] of fans) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const gap = Math.hypot(
            list[i].point.x - list[j].point.x,
            list[i].point.y - list[j].point.y
          );
          if (gap < MIN_DEPARTURE_GAP) {
            shared.push(
              `${node}: ${list[i].edge} and ${list[j].edge} depart ${gap.toFixed(1)}px apart`
            );
          }
        }
      }
    }
    expect(shared).toEqual([]);

    // Still orthogonal, and no bend spent on the spreading.
    for (const edge of data.edges) {
      const points = edge.points ?? [];
      for (let i = 1; i < points.length; i++) {
        const dx = Math.abs(points[i].x - points[i - 1].x);
        const dy = Math.abs(points[i].y - points[i - 1].y);
        expect(dx < 1e-3 || dy < 1e-3, `${edge.id} has a diagonal segment`).toBe(true);
      }
    }
  }, 60_000);

  /**
   * In `hola paper graph 5` node `E` joins two cycles and has a core neighbour on
   * every side, so its tree has nothing but the *corners* to sit in. While ordinal
   * placement was geometrically identical to its cardinal component the tree could
   * only be centred on `E`'s own row or column, both of which are blocked, so it was
   * shoved past the whole core: `D` ended up 358px clear of `E`, joined by a
   * connector that crawled back across the drawing. A real corner placement puts it
   * in the empty quadrant beside `E` instead.
   */
  it('places a tree in the corner when every side of its root is taken', async () => {
    const fx = fixtures.find((f) => f.profile === 'flowchart-hola' && f.id.includes('graph 5'))!;
    const data = await parseMmdFileToLayoutData(fx.mmdPath, {
      stampFlowchartRendererFields: true,
    });
    applyFixtureContentSizesStrict(data, fx.sizes);
    applyFixtureEdgeLabelSizes(data, fx.sizes);
    runHolaFaithfulLayoutCore(data);

    const byId = new Map(data.nodes.map((node) => [node.id, node]));
    const root = byId.get('E')!;
    const first = byId.get('D')!;

    const gapX =
      Math.abs((root.x ?? 0) - (first.x ?? 0)) - ((root.width ?? 0) + (first.width ?? 0)) / 2;
    const gapY =
      Math.abs((root.y ?? 0) - (first.y ?? 0)) - ((root.height ?? 0) + (first.height ?? 0)) / 2;
    const gap = Math.max(gapX, gapY);
    expect(gap, `D sits ${gap.toFixed(0)}px clear of E`).toBeLessThan(160);

    // And the connector between them is a short orthogonal path, not a detour.
    const connector = data.edges.find(
      (edge) => (edge.start === 'D' && edge.end === 'E') || (edge.start === 'E' && edge.end === 'D')
    )!;
    expect(connector.points!.length).toBeLessThanOrEqual(4);
  }, 60_000);

  for (const fx of fixtures) {
    it(`${fx.id} raises no structural issue`, async () => {
      const data = await parseMmdFileToLayoutData(fx.mmdPath, {
        stampFlowchartRendererFields: true,
      });
      applyFixtureContentSizesStrict(data, fx.sizes);
      applyFixtureEdgeLabelSizes(data, fx.sizes);
      runHolaFaithfulLayoutCore(data);

      const types = [
        ...new Set(
          validateLayout(data)
            .issues.map((issue) => issue.type)
            .filter((type) => STRUCTURAL.has(type))
        ),
      ].sort();
      expect(types).toEqual([]);
    }, 60_000);
  }
});
