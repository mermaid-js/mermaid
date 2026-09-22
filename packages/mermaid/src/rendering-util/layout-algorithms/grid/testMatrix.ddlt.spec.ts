import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import type { Edge, LayoutData, Node } from '../../types.js';
import { validateLayout } from '../layout-utils/validateLayout.js';
import { applyFixtureContentSizesStrict, loadFreshSizesFixture } from '../ddlt/fixtureSizes.js';
import { parseMmdFileToLayoutData } from '../ddlt/parseToLayoutData.js';
import { prepareGridLayout } from './edgeLabels.js';
import { runGridLayoutCore } from './layoutCore.js';
import {
  createGridRoutingInstrumentation,
  type GridRoutingInstrumentation,
} from './routerInstrumentation.js';
import type { GridItemLayoutMeta, GridLayoutResult } from './types.js';
import { normalizePolyline } from '../layout-utils/geometry.js';

const FIXTURES_DIR = resolve(process.cwd(), 'e2e/platform/dev-diagrams/layout-tests/grid');

const H_ALIGN_FACTOR = {
  left: 0,
  center: 0.5,
  right: 1,
} as const;

const V_ALIGN_FACTOR = {
  top: 0,
  center: 0.5,
  bottom: 1,
} as const;

beforeAll(() => {
  addDiagrams();
});

async function loadGridFixtureWithResult(
  name: string,
  metrics?: GridRoutingInstrumentation
): Promise<{
  layout: LayoutData;
  result: GridLayoutResult;
}> {
  const mmdPath = resolve(FIXTURES_DIR, `${name}.mmd`);
  const sizesPath = resolve(FIXTURES_DIR, `${name}.sizes.json`);
  const sizes = loadFreshSizesFixture(sizesPath, mmdPath, `grid/${name}`);
  const layout = await parseMmdFileToLayoutData(mmdPath, {
    stampFlowchartRendererFields: true,
  });
  prepareGridLayout(layout);
  applyFixtureContentSizesStrict(layout, sizes);
  const result = metrics ? runGridLayoutCore(layout, metrics) : runGridLayoutCore(layout);
  return { layout, result };
}

function nodeById(layout: LayoutData, id: string): Node {
  const node = layout.nodes.find((item) => item.id === id);
  if (!node) {
    throw new Error(`Missing node "${id}"`);
  }
  return node;
}

function itemMeta(result: GridLayoutResult, id: string): GridItemLayoutMeta {
  const meta = result.itemMeta.get(id);
  if (!meta) {
    throw new Error(`Missing item meta for "${id}"`);
  }
  return meta;
}

function left(node: Node): number {
  return (node.x ?? 0) - (node.width ?? 0) / 2;
}

function right(node: Node): number {
  return (node.x ?? 0) + (node.width ?? 0) / 2;
}

function top(node: Node): number {
  return (node.y ?? 0) - (node.height ?? 0) / 2;
}

function bottom(node: Node): number {
  return (node.y ?? 0) + (node.height ?? 0) / 2;
}

function expectNodeAligned(
  node: Node,
  meta: GridItemLayoutMeta,
  horizontal: keyof typeof H_ALIGN_FACTOR,
  vertical: keyof typeof V_ALIGN_FACTOR
): void {
  expect(left(node)).toBeCloseTo(
    meta.cellLeft + (meta.cellWidth - (node.width ?? 0)) * H_ALIGN_FACTOR[horizontal],
    6
  );
  expect(top(node)).toBeCloseTo(
    meta.cellTop + (meta.cellHeight - (node.height ?? 0)) * V_ALIGN_FACTOR[vertical],
    6
  );
}

function stackTopFor(
  nodes: Node[],
  meta: GridItemLayoutMeta,
  vertical: keyof typeof V_ALIGN_FACTOR,
  gap: number
) {
  const stackHeight =
    nodes.reduce((total, node) => total + (node.height ?? 0), 0) +
    gap * Math.max(0, nodes.length - 1);
  return meta.cellTop + (meta.cellHeight - stackHeight) * V_ALIGN_FACTOR[vertical];
}

function sortByY(ids: string[], layout: LayoutData): string[] {
  return [...ids].sort((a, b) => (nodeById(layout, a).y ?? 0) - (nodeById(layout, b).y ?? 0));
}

function primaryTrackCoordinate(edge: Edge): number {
  const segments = normalizePolyline(edge.points ?? []).segments;
  const primary = [...segments].sort((a, b) => {
    const aLength = Math.abs(a.a.x - a.b.x) + Math.abs(a.a.y - a.b.y);
    const bLength = Math.abs(b.a.x - b.b.x) + Math.abs(b.a.y - b.b.y);
    return bLength - aLength;
  })[0];
  if (!primary) {
    throw new Error(`Missing segments for edge "${edge.id}"`);
  }
  return primary.orientation === 'H' ? primary.a.y : primary.a.x;
}

async function characterizeFixture(name: string) {
  const { layout } = await loadGridFixtureWithResult(name);
  const validation = validateLayout(layout);
  const bends = layout.edges.reduce(
    (total, edge) => total + normalizePolyline(edge.points ?? []).bends,
    0
  );
  const routeSignature = createHash('sha256')
    .update(
      JSON.stringify(
        layout.edges.map((edge) => ({
          id: edge.id,
          points: normalizePolyline(edge.points ?? []).points,
        }))
      )
    )
    .digest('hex');

  return {
    id: `grid/${name}`,
    valid: validation.ok,
    score: validation.score,
    bends,
    crossings: validation.breakdown.crossings,
    routeSignature,
  };
}

describe('grid DDLT matrix fixtures', () => {
  it.fails('routes through empty aligned cell space without a global-corridor detour', async () => {
    const { layout } = await loadGridFixtureWithResult('routing-cell-aware-empty-cell');
    const routed = layout.edges.find((edge) => edge.start === 'v1' && edge.end === 'v2');
    const normalized = normalizePolyline(routed?.points ?? []);

    expect(validateLayout(layout)).toMatchObject({ ok: true, issues: [] });
    expect(normalized.segments).toHaveLength(1);
    expect(normalized.segments[0]?.orientation).toBe('H');
  });

  it('records representative route characteristics', async () => {
    const characterization = [];
    for (const fixture of [
      'placement-matrix-tb',
      'stack-default',
      'routing-group-member',
      'routing-loops-parallel-lr',
      'routing-cell-aware-empty-cell',
    ]) {
      characterization.push(await characterizeFixture(fixture));
    }

    expect(characterization).toMatchInlineSnapshot(`
      [
        {
          "bends": 0,
          "crossings": 0,
          "id": "grid/placement-matrix-tb",
          "routeSignature": "a82ae0a776a8bbf760a5d0ce5433df84d98a1e8f114870b9878aa1f2aecc78da",
          "score": 1000,
          "valid": true,
        },
        {
          "bends": 0,
          "crossings": 0,
          "id": "grid/stack-default",
          "routeSignature": "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
          "score": 1000,
          "valid": true,
        },
        {
          "bends": 14,
          "crossings": 0,
          "id": "grid/routing-group-member",
          "routeSignature": "547db42f090327b2959d83ff3a1751dbda816ea0ae2e0c1e075199aefc91cbd4",
          "score": 485,
          "valid": true,
        },
        {
          "bends": 6,
          "crossings": 0,
          "id": "grid/routing-loops-parallel-lr",
          "routeSignature": "e095678042ae372f2c85800cb37d2f29a9e9a303b457b5547d64f8d521066049",
          "score": 985,
          "valid": true,
        },
        {
          "bends": 6,
          "crossings": 0,
          "id": "grid/routing-cell-aware-empty-cell",
          "routeSignature": "0ec7e387d9677c50d7e98c31b57be0fd4cd45cddd2d28cf02cdcf2f7310a76a0",
          "score": 965,
          "valid": true,
        },
      ]
    `);
  });

  it('covers partial/autoplacement, sparse tracks, disconnected nodes, and TB/LR parity', async () => {
    const tb = await loadGridFixtureWithResult('placement-matrix-tb');
    const lr = await loadGridFixtureWithResult('placement-matrix-lr');

    const tbCoords = tb.layout.nodes.map((node) => [
      node.id,
      node.x,
      node.y,
      node.width,
      node.height,
    ]);
    const lrCoords = lr.layout.nodes.map((node) => [
      node.id,
      node.x,
      node.y,
      node.width,
      node.height,
    ]);
    expect(lrCoords).toEqual(tbCoords);

    const a = nodeById(tb.layout, 'A');
    const b = nodeById(tb.layout, 'B');
    const c = nodeById(tb.layout, 'C');
    const d = nodeById(tb.layout, 'D');
    const e = nodeById(tb.layout, 'E');
    const f = nodeById(tb.layout, 'F');
    const g = nodeById(tb.layout, 'G');

    expect(b.y).toBeCloseTo(a.y ?? 0, 6);
    expect(b.x ?? 0).toBeGreaterThan(a.x ?? 0);
    expect(c.y).toBeCloseTo(a.y ?? 0, 6);
    expect(c.x ?? 0).toBeGreaterThan(b.x ?? 0);
    expect(d.y ?? 0).toBeGreaterThan(a.y ?? 0);
    expect(e.y).toBeCloseTo(d.y ?? 0, 6);
    expect(e.x ?? 0).toBeGreaterThan(d.x ?? 0);
    expect(g.y).toBeCloseTo(d.y ?? 0, 6);
    expect(g.x ?? 0).toBeGreaterThan(e.x ?? 0);
    expect(f.y ?? 0).toBeGreaterThan(d.y ?? 0);

    const dMeta = itemMeta(tb.result, 'D');
    const cMeta = itemMeta(tb.result, 'C');
    const fMeta = itemMeta(tb.result, 'F');
    expect(fMeta.cellTop - (dMeta.cellTop + dMeta.cellHeight)).toBeCloseTo(32, 6);
    expect(fMeta.cellLeft - (cMeta.cellLeft + cMeta.cellWidth)).toBeCloseTo(36, 6);
    expect(validateLayout(tb.layout)).toMatchObject({ ok: true, issues: [] });
  });

  it('covers the full singleton alignment matrix', async () => {
    const { layout, result } = await loadGridFixtureWithResult('singleton-alignments');

    for (const [id, horizontal, vertical] of [
      ['LT', 'left', 'top'],
      ['CT', 'center', 'top'],
      ['RT', 'right', 'top'],
      ['LC', 'left', 'center'],
      ['CC', 'center', 'center'],
      ['RC', 'right', 'center'],
      ['LB', 'left', 'bottom'],
      ['CB', 'center', 'bottom'],
      ['RB', 'right', 'bottom'],
    ] as const) {
      expectNodeAligned(nodeById(layout, id), itemMeta(result, id), horizontal, vertical);
    }
  });

  it('covers default cellGap stacks, source order, mixed widths, and top/center/bottom stack alignment', async () => {
    const { layout, result } = await loadGridFixtureWithResult('stack-default');
    expect(validateLayout(layout)).toMatchObject({ ok: true, issues: [] });

    const topIds = ['TopLeft', 'TopRight'] as const;
    const centerIds = ['CenterLeft', 'CenterRight'] as const;
    const bottomIds = ['BottomLeft', 'BottomCenter', 'BottomRight'] as const;

    expect(sortByY([...topIds], layout)).toEqual([...topIds]);
    expect(sortByY([...centerIds], layout)).toEqual([...centerIds]);
    expect(sortByY([...bottomIds], layout)).toEqual([...bottomIds]);

    const topMeta = itemMeta(result, 'TopLeft');
    const centerMeta = itemMeta(result, 'CenterLeft');
    const bottomMeta = itemMeta(result, 'BottomLeft');

    const topNodes = topIds.map((id) => nodeById(layout, id));
    const centerNodes = centerIds.map((id) => nodeById(layout, id));
    const bottomNodes = bottomIds.map((id) => nodeById(layout, id));

    expect(top(topNodes[0])).toBeCloseTo(stackTopFor(topNodes, topMeta, 'top', 20), 6);
    expect(top(centerNodes[0])).toBeCloseTo(stackTopFor(centerNodes, centerMeta, 'center', 20), 6);
    expect(top(bottomNodes[0])).toBeCloseTo(stackTopFor(bottomNodes, bottomMeta, 'bottom', 20), 6);

    expect(top(topNodes[1]) - bottom(topNodes[0])).toBeCloseTo(20, 6);
    expect(top(centerNodes[1]) - bottom(centerNodes[0])).toBeCloseTo(20, 6);
    expect(top(bottomNodes[1]) - bottom(bottomNodes[0])).toBeCloseTo(20, 6);
    expect(top(bottomNodes[2]) - bottom(bottomNodes[1])).toBeCloseTo(20, 6);

    expect(left(topNodes[0])).toBeCloseTo(topMeta.cellLeft, 6);
    expect(right(topNodes[1])).toBeCloseTo(topMeta.cellLeft + topMeta.cellWidth, 6);
    expect(left(centerNodes[0])).toBeCloseTo(centerMeta.cellLeft, 6);
    expect(right(centerNodes[1])).toBeCloseTo(centerMeta.cellLeft + centerMeta.cellWidth, 6);
    expect(left(bottomNodes[0])).toBeCloseTo(bottomMeta.cellLeft, 6);
    expect(left(bottomNodes[1])).toBeCloseTo(
      bottomMeta.cellLeft + (bottomMeta.cellWidth - (bottomNodes[1].width ?? 0)) / 2,
      6
    );
    expect(right(bottomNodes[2])).toBeCloseTo(bottomMeta.cellLeft + bottomMeta.cellWidth, 6);
  });

  it('covers zero and custom cellGap, including nested groups as stack members', async () => {
    const zero = await loadGridFixtureWithResult('stack-gap-zero');
    const custom = await loadGridFixtureWithResult('group-stack');

    const zeroA = nodeById(zero.layout, 'A');
    const zeroB = nodeById(zero.layout, 'B');
    expect(top(zeroB) - bottom(zeroA)).toBeCloseTo(0, 6);

    const groupNode = nodeById(custom.layout, 'G');
    const customItems = ['A', 'G', 'B'].map((id) => nodeById(custom.layout, id));
    const ordered = [...customItems].sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
    expect(groupNode.isGroup).toBe(true);
    expect(validateLayout(custom.layout)).toMatchObject({ ok: true, issues: [] });
    expect(top(ordered[1]) - bottom(ordered[0])).toBeCloseTo(12, 6);
    expect(top(ordered[2]) - bottom(ordered[1])).toBeCloseTo(12, 6);
    const inner = nodeById(custom.layout, 'G1');
    expect(left(inner)).toBeGreaterThan(left(groupNode));
    expect(right(inner)).toBeLessThan(right(groupNode));
    expect(top(inner)).toBeGreaterThan(top(groupNode));
    expect(bottom(inner)).toBeLessThan(bottom(groupNode));
  });

  it('covers group/member, outside/member, and long HTML labels', async () => {
    const groupMember = await loadGridFixtureWithResult('routing-group-member');
    const outsideMember = await loadGridFixtureWithResult('routing-outside-member');

    expect(validateLayout(groupMember.layout)).toMatchObject({ ok: true, issues: [] });
    expect(validateLayout(outsideMember.layout)).toMatchObject({ ok: true, issues: [] });

    const labelledEdge = groupMember.layout.edges.find(
      (edge) => edge.start === 'M' && edge.end === 'O'
    );
    const labelNode = groupMember.layout.nodes.find(
      (node) => node.id === labelledEdge?.labelNodeId
    );
    expect(labelledEdge?.labelNodeId).toBeDefined();
    expect(labelNode?.x).toEqual(expect.any(Number));
    expect(labelNode?.y).toEqual(expect.any(Number));
  });

  it('covers self-loops, parallel/reverse edges, non-rect shapes, disconnected nodes, and LR routing', async () => {
    const { layout } = await loadGridFixtureWithResult('routing-loops-parallel-lr');
    expect(validateLayout(layout)).toMatchObject({ ok: true, issues: [] });

    const loopPoints = layout.edges
      .filter((edge) => edge.start === 'Loop' && edge.end === 'Loop')
      .map((edge) => JSON.stringify(edge.points));
    expect(new Set(loopPoints).size).toBe(3);

    const trackCoords = layout.edges
      .filter(
        (edge) =>
          (edge.start === 'Source' && edge.end === 'Target') ||
          (edge.start === 'Target' && edge.end === 'Source')
      )
      .map((edge) => primaryTrackCoordinate(edge))
      .sort((a, b) => a - b);
    for (let index = 1; index < trackCoords.length; index++) {
      expect(trackCoords[index] - trackCoords[index - 1]).toBeGreaterThanOrEqual(8);
    }

    const source = nodeById(layout, 'Source');
    const target = nodeById(layout, 'Target');
    expect(source.width).toBeGreaterThan(nodeById(layout, 'Loop').width ?? 0);
    expect(target.width).toBeGreaterThan(nodeById(layout, 'Loop').width ?? 0);
    expect(layout.edges.some((edge) => edge.start === 'Lone' || edge.end === 'Lone')).toBe(false);
  });
});
