import { beforeAll, describe, it, expect } from 'vitest';
import { Diagram } from '../../../../Diagram.js';
import { addDiagrams } from '../../../../diagram-api/diagram-orchestration.js';
import type { LayoutData } from '../../../types.js';
import { applyLrDirectionTransform } from '../direction/lrTransform.js';
import { prepareLayoutForSwimlanes } from '../helpers.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

const NODE_WIDTH = 80;
const NODE_HEIGHT = 40;
const LANE_TITLE_BAND = 36;
// An empty lane's band is two title bands tall at least, or its title run plus one title band.
const EMPTY_BAND_MIN_HEIGHT = 2 * LANE_TITLE_BAND;
// With nothing in any lane, a band is as wide as six title bands.
const ALL_EMPTY_BAND_WIDTH = 6 * LANE_TITLE_BAND;
const CHAR_WIDTH_PER_FONT_SIZE = 0.55;
const DEFAULT_FONT_SIZE = 16;
const TITLE_CHAR_WIDTH = DEFAULT_FONT_SIZE * CHAR_WIDTH_PER_FONT_SIZE;
// The height of a one-line title strip along the top, which RL draws.
const TITLE_BAND_HEIGHT = 21;
const EPS = 1e-6;

type LaneNode = LayoutData['nodes'][number] & {
  swimlaneContentTop?: number;
  groupTitleRect?: { left: number; right: number; top: number; bottom: number };
};

async function layoutFromSource(source: string, fontSize?: number): Promise<LayoutData> {
  const diagram = await Diagram.fromText(source);
  const layout = (diagram.db as { getData: () => LayoutData }).getData();
  (layout as LayoutData & { direction?: string }).direction = (
    diagram.db as { getDirection?: () => string }
  ).getDirection?.();
  layout.config = {
    flowchart: { nodeSpacing: 40, rankSpacing: 100 },
    ...(fontSize === undefined ? {} : { fontSize }),
  } as LayoutData['config'];
  for (const node of layout.nodes) {
    if (!node.isGroup) {
      node.width = NODE_WIDTH;
      node.height = NODE_HEIGHT;
    }
  }
  prepareLayoutForSwimlanes(layout);
  runSwimlaneLayoutCore(layout);
  return layout;
}

interface Band {
  id: string;
  top: number;
  bottom: number;
  left: number;
  right: number;
}

function laneBands(layout: LayoutData): Band[] {
  return layout.nodes
    .filter((node) => node.isGroup)
    .map((node) => ({
      id: node.id,
      top: (node.y ?? 0) - (node.height ?? 0) / 2,
      bottom: (node.y ?? 0) + (node.height ?? 0) / 2,
      left: (node.x ?? 0) - (node.width ?? 0) / 2,
      right: (node.x ?? 0) + (node.width ?? 0) / 2,
    }))
    .sort((a, b) => a.top - b.top);
}

function node(layout: LayoutData, id: string): LaneNode {
  const found = layout.nodes.find((n) => n.id === id);
  if (!found) {
    throw new Error(`no node ${id}`);
  }
  return found;
}

function band(layout: LayoutData, id: string): Band {
  const found = laneBands(layout).find((b) => b.id === id);
  if (!found) {
    throw new Error(`no lane ${id}`);
  }
  return found;
}

/** Lanes stand top to bottom in `order`, each touching the next, none flat, all as wide as the first. */
function expectBands(layout: LayoutData, order: string[]): Band[] {
  const bands = laneBands(layout);
  expect(bands.map((b) => b.id)).toEqual(order);
  for (const [index, b] of bands.entries()) {
    expect(b.bottom - b.top).toBeGreaterThan(0);
    expect(b.left).toBeCloseTo(bands[0].left, 6);
    expect(b.right).toBeCloseTo(bands[0].right, 6);
    if (index > 0) {
      expect(b.top).toBeCloseTo(bands[index - 1].bottom, 6);
    }
  }
  return bands;
}

const heightOf = (b: Band): number => b.bottom - b.top;
const titleRun = (title: string, fontSize = DEFAULT_FONT_SIZE): number =>
  title.length * fontSize * CHAR_WIDTH_PER_FONT_SIZE;

const lanes = (direction: string, empty: 'first' | 'middle' | 'last', withEmpty = true) => {
  const block = (lines: string[]) => (withEmpty ? lines : []);
  const sales = ['  subgraph L1[Sales]', '    A[Receive order] --> B[Check stock]', '  end'];
  const warehouse = ['  subgraph L3[Warehouse]', '    C[Pick] --> D[Ship]', '  end'];
  return [
    `swimlane-beta ${direction}`,
    ...(empty === 'first' ? block(['  subgraph L0[Legal]', '  end']) : []),
    ...sales,
    ...(empty === 'middle' ? block(['  subgraph L2[Legal]', '  end']) : []),
    ...warehouse,
    ...(empty === 'last' ? block(['  subgraph L4[Legal]', '  end']) : []),
    '  B --> C',
  ].join('\n');
};

const suite = (direction: string) =>
  `Swimlanes: a lane with no nodes gets its own band in ${direction}`;

describe.each(['LR', 'RL'])('%s', (direction) => {
  beforeAll(() => {
    addDiagrams();
  });

  describe(suite(direction), () => {
    it('an empty lane between two populated lanes sits between them, and the next lane moves down', async () => {
      const layout = await layoutFromSource(lanes(direction, 'middle'));
      const control = await layoutFromSource(lanes(direction, 'middle', false));
      const [, legal] = expectBands(layout, ['L1', 'L2', 'L3']);
      expect(heightOf(legal)).toBeGreaterThanOrEqual(EMPTY_BAND_MIN_HEIGHT - EPS);
      expect(heightOf(legal)).toBeGreaterThanOrEqual(titleRun('Legal') + LANE_TITLE_BAND - EPS);

      for (const id of ['C', 'D']) {
        expect(node(layout, id).y).toBeCloseTo((node(control, id).y ?? 0) + heightOf(legal), 6);
      }
      for (const id of ['A', 'B']) {
        expect(node(layout, id).y).toBeCloseTo(node(control, id).y ?? 0, 6);
      }
      expect(band(layout, 'L1')).toEqual(band(control, 'L1'));
      expect(band(layout, 'L3').top).toBeCloseTo(band(control, 'L3').top + heightOf(legal), 6);

      // The lane after the band takes its content line and its title strip along.
      const [shifted, unshifted] = [node(layout, 'L3'), node(control, 'L3')];
      expect(shifted.swimlaneContentTop).toBeCloseTo(
        (unshifted.swimlaneContentTop ?? 0) + heightOf(legal),
        6
      );
      for (const edge of ['top', 'bottom'] as const) {
        expect(shifted.groupTitleRect?.[edge]).toBeCloseTo(
          (unshifted.groupTitleRect?.[edge] ?? 0) + heightOf(legal),
          6
        );
      }
    });

    it('an empty first lane stands above the first populated lane', async () => {
      const layout = await layoutFromSource(lanes(direction, 'first'));
      const control = await layoutFromSource(lanes(direction, 'first', false));
      const [legal] = expectBands(layout, ['L0', 'L1', 'L3']);
      expect(legal.top).toBeCloseTo(band(control, 'L1').top, 6);
      expect(node(layout, 'A').y).toBeCloseTo((node(control, 'A').y ?? 0) + heightOf(legal), 6);
    });

    it('an empty last lane stands below the last populated lane', async () => {
      const layout = await layoutFromSource(lanes(direction, 'last'));
      const control = await layoutFromSource(lanes(direction, 'last', false));
      const bands = expectBands(layout, ['L1', 'L3', 'L4']);
      expect(bands[2].top).toBeCloseTo(band(control, 'L3').bottom, 6);
      for (const id of ['A', 'B', 'C', 'D']) {
        expect(node(layout, id).y).toBeCloseTo(node(control, id).y ?? 0, 6);
      }
    });

    it('two empty lanes in a row keep their declared order between the populated lanes', async () => {
      const source = [
        `swimlane-beta ${direction}`,
        '  subgraph L1[Sales]',
        '    A[Receive order] --> B[Check stock]',
        '  end',
        '  subgraph L2[Legal]',
        '  end',
        '  subgraph L3[Accounting]',
        '  end',
        '  subgraph L4[Warehouse]',
        '    C[Pick] --> D[Ship]',
        '  end',
        '  B --> C',
      ].join('\n');
      expectBands(await layoutFromSource(source), ['L1', 'L2', 'L3', 'L4']);
    });

    it('when no lane has nodes, the lanes are stacked from the top in declared order', async () => {
      const source = [
        `swimlane-beta ${direction}`,
        '  subgraph L1[Sales]',
        '  end',
        '  subgraph L2[Legal]',
        '  end',
        '  subgraph L3[Warehouse]',
        '  end',
      ].join('\n');
      const layout = await layoutFromSource(source);
      const bands = expectBands(layout, ['L1', 'L2', 'L3']);
      expect(bands[0].top).toBeCloseTo(0, 6);
      ['Sales', 'Legal', 'Warehouse'].forEach((title, index) => {
        expect(heightOf(bands[index])).toBeCloseTo(
          Math.max(EMPTY_BAND_MIN_HEIGHT, titleRun(title) + LANE_TITLE_BAND),
          6
        );
      });
      for (const b of bands) {
        expect(b.right - b.left).toBeCloseTo(ALL_EMPTY_BAND_WIDTH, 6);
      }
      expect(bands[0].left).toBeCloseTo(LANE_TITLE_BAND, 6);
      expect(node(layout, 'L1').groupTitleRect?.left).toBeCloseTo(LANE_TITLE_BAND, 6);
    });

    it('a long title makes the band as tall as the title estimate plus a title band, scaled by the font size', async () => {
      const title = 'Legal and compliance review for the regional offices';
      const source = lanes(direction, 'middle').replace('[Legal]', `[${title}]`);
      const height = async (fontSize?: number) =>
        heightOf(band(await layoutFromSource(source, fontSize), 'L2'));
      expect(await height()).toBeCloseTo(title.length * TITLE_CHAR_WIDTH + LANE_TITLE_BAND, 6);
      expect(await height(2 * DEFAULT_FONT_SIZE)).toBeCloseTo(
        titleRun(title, 2 * DEFAULT_FONT_SIZE) + LANE_TITLE_BAND,
        6
      );
    });

    it('an edge that crosses the empty band still runs from its source to its target', async () => {
      const layout = await layoutFromSource(lanes(direction, 'middle'));
      const legal = band(layout, 'L2');
      const points = layout.edges.find((e) => e.start === 'B' && e.end === 'C')?.points ?? [];
      const distanceToBox = (p: { x: number; y: number }, id: string) => {
        const n = node(layout, id);
        const dx = Math.max(Math.abs(p.x - (n.x ?? 0)) - (n.width ?? 0) / 2, 0);
        const dy = Math.max(Math.abs(p.y - (n.y ?? 0)) - (n.height ?? 0) / 2, 0);
        return Math.hypot(dx, dy);
      };
      expect(points.length).toBeGreaterThan(1);
      expect(distanceToBox(points[0], 'B')).toBeLessThan(2);
      expect(distanceToBox(points[points.length - 1], 'C')).toBeLessThan(2);
      expect(Math.min(...points.map((p) => p.y))).toBeLessThanOrEqual(legal.top);
      expect(Math.max(...points.map((p) => p.y))).toBeGreaterThanOrEqual(legal.bottom);
    });

    it('the title strip of an empty lane stands on its band, on the side the direction puts it', async () => {
      const layout = await layoutFromSource(lanes(direction, 'middle'));
      const legal = band(layout, 'L2');
      const lane = node(layout, 'L2');
      const strip = lane.groupTitleRect;
      expect(strip?.top).toBeCloseTo(legal.top, 6);
      expect(strip?.bottom).toBeCloseTo(legal.bottom, 6);
      expect((strip?.right ?? 0) - (strip?.left ?? 0)).toBeCloseTo(LANE_TITLE_BAND, 6);
      expect(direction === 'LR' ? strip?.left : strip?.right).toBeCloseTo(
        direction === 'LR' ? legal.left : legal.right,
        6
      );
      // RL draws its title along the top, so the band keeps room above its content line.
      expect((lane.swimlaneContentTop ?? 0) - legal.top).toBeGreaterThanOrEqual(TITLE_BAND_HEIGHT);
    });

    it('without an empty lane the lanes are laid out as before: touching, in declared order', async () => {
      const layout = await layoutFromSource(lanes(direction, 'middle', false));
      expectBands(layout, ['L1', 'L3']);
    });
  });
});

describe('applyLrDirectionTransform with an empty lane', () => {
  // Top-to-bottom coordinates, as the layout hands them over: a is at (0, 0) and b at (200, 100).
  const handOver = (emptyPadding: number, withEmpty = true, emptyTitle = 'Legal'): LayoutData =>
    ({
      nodes: [
        { id: 'L3', isGroup: true, label: 'Warehouse', padding: 20 },
        ...(withEmpty
          ? [{ id: 'L2', isGroup: true, label: emptyTitle, padding: emptyPadding }]
          : []),
        { id: 'L1', isGroup: true, label: 'Sales', padding: 20 },
        { id: 'a', parentId: 'L1', isGroup: false, x: 0, y: 0, width: 80, height: 40 },
        { id: 'b', parentId: 'L3', isGroup: false, x: 200, y: 100, width: 80, height: 40 },
      ],
      edges: [
        {
          id: 'e',
          start: 'a',
          end: 'b',
          points: [
            { x: 0, y: 0 },
            { x: 0, y: 50 },
            { x: 200, y: 50 },
            { x: 200, y: 100 },
          ],
        },
      ],
      config: {},
    }) as unknown as LayoutData;

  it('moves the nodes and the edge points below the new band down by its height', () => {
    const control = handOver(0, false);
    applyLrDirectionTransform(control, 'LR');
    const layout = handOver(0);
    applyLrDirectionTransform(layout, 'LR');
    const legal = band(layout, 'L2');
    const height = heightOf(legal);
    expect(node(layout, 'b').y).toBeCloseTo((node(control, 'b').y ?? 0) + height, 6);
    expect(node(layout, 'a').y).toBeCloseTo(node(control, 'a').y ?? 0, 6);
    expect(node(layout, 'b').swimlaneContentTop).toBeUndefined();
    const moved = layout.edges[0].points ?? [];
    const kept = control.edges[0].points ?? [];
    expect(moved.map((p) => p.x)).toEqual(kept.map((p) => p.x));
    expect(moved.map((p) => p.y)).toEqual(kept.map((p) => (p.y >= legal.top ? p.y + height : p.y)));
    expect(moved.some((p) => p.y !== kept[moved.indexOf(p)].y)).toBe(true);
  });

  it('makes the band as tall as twice its padding when that is more than its title needs', () => {
    const layout = handOver(60);
    applyLrDirectionTransform(layout, 'LR');
    expect(heightOf(band(layout, 'L2'))).toBeCloseTo(2 * 60, 6);
  });

  it('keeps a band of two title bands for a title shorter than that', () => {
    const layout = handOver(0, true, 'QA');
    applyLrDirectionTransform(layout, 'LR');
    expect(heightOf(band(layout, 'L2'))).toBeCloseTo(EMPTY_BAND_MIN_HEIGHT, 6);
  });

  it('reports no transform when there is no lane and no node', () => {
    expect(applyLrDirectionTransform({ nodes: [], edges: [], config: {} } as LayoutData)).toBe(
      false
    );
  });
});
