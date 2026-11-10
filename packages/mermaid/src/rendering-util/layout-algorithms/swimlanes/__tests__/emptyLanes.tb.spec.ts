import { beforeAll, describe, it, expect } from 'vitest';
import { Diagram } from '../../../../Diagram.js';
import { addDiagrams } from '../../../../diagram-api/diagram-orchestration.js';
import type { LayoutData } from '../../../types.js';
import { prepareLayoutForSwimlanes } from '../helpers.js';
import { runSwimlaneLayoutCore } from '../layoutCore.js';

const NODE_WIDTH = 80;
const NODE_HEIGHT = 40;
// An empty lane's column: two 36px title bands at least, or its title run plus padding.
const EMPTY_LANE_MIN_WIDTH = 72;
const LANE_PADDING = 20;
const CHAR_WIDTH_PER_FONT_SIZE = 0.55;
const DEFAULT_FONT_SIZE = 16;
const TITLE_CHAR_WIDTH = DEFAULT_FONT_SIZE * CHAR_WIDTH_PER_FONT_SIZE;
// With nothing in any lane, a lane is two 36px header margins tall and its title strip is 21px.
const EMPTY_ROW_HEIGHT = 72;
const TITLE_BAND_HEIGHT = 21;
const EPS = 1e-6;

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

interface Span {
  id: string;
  left: number;
  right: number;
  height: number;
}

function laneSpans(layout: LayoutData): Span[] {
  return layout.nodes
    .filter((node) => node.isGroup)
    .map((node) => ({
      id: node.id,
      left: (node.x ?? 0) - (node.width ?? 0) / 2,
      right: (node.x ?? 0) + (node.width ?? 0) / 2,
      height: node.height ?? 0,
    }))
    .sort((a, b) => a.left - b.left);
}

function node(layout: LayoutData, id: string) {
  const found = layout.nodes.find((n) => n.id === id);
  if (!found) {
    throw new Error(`no node ${id}`);
  }
  return found;
}

/** Lanes stand left to right in `order`, each touching the next, none of them flat. */
function expectColumns(layout: LayoutData, order: string[]): Span[] {
  const spans = laneSpans(layout);
  expect(spans.map((span) => span.id)).toEqual(order);
  for (const [index, span] of spans.entries()) {
    expect(span.height).toBeGreaterThan(0);
    if (index > 0) {
      expect(span.left).toBeCloseTo(spans[index - 1].right, 6);
    }
  }
  return spans;
}

function expectEmptyColumnWidth(span: Span, title: string): void {
  const width = span.right - span.left;
  expect(width).toBeGreaterThanOrEqual(EMPTY_LANE_MIN_WIDTH - EPS);
  expect(width).toBeGreaterThanOrEqual(title.length * TITLE_CHAR_WIDTH + 2 * LANE_PADDING - EPS);
}

const lanes = (direction: string, middle: string, withEmpty = true) =>
  [
    `swimlane-beta ${direction}`,
    '  subgraph L1[Sales]',
    '    A[Receive order] --> B[Check stock]',
    '  end',
    ...(withEmpty ? [middle] : []),
    '  subgraph L3[Warehouse]',
    '    C[Pick] --> D[Ship]',
    '  end',
    '  B --> C',
  ].join('\n');

const EMPTY_LEGAL = '  subgraph L2[Legal]\n  end';

describe('Swimlanes: a lane with no nodes gets its own column in TB and BT', () => {
  beforeAll(() => {
    addDiagrams();
  });

  it('an empty lane between two populated lanes sits between them, and the next lane moves right', async () => {
    const layout = await layoutFromSource(lanes('TB', EMPTY_LEGAL));
    const control = await layoutFromSource(lanes('TB', EMPTY_LEGAL, false));
    const [, legal] = expectColumns(layout, ['L1', 'L2', 'L3']);
    expectEmptyColumnWidth(legal, 'Legal');

    const shift = legal.right - legal.left;
    for (const id of ['C', 'D']) {
      expect(node(layout, id).x).toBeCloseTo((node(control, id).x ?? 0) + shift, 6);
    }
    for (const id of ['A', 'B']) {
      expect(node(layout, id).x).toBeCloseTo(node(control, id).x ?? 0, 6);
    }
  });

  it('an empty first lane stands left of the first populated lane', async () => {
    const source = [
      'swimlane-beta TB',
      '  subgraph L1[Legal]',
      '  end',
      '  subgraph L2[Sales]',
      '    A[Receive order] --> B[Check stock]',
      '  end',
      '  subgraph L3[Warehouse]',
      '    C[Pick] --> D[Ship]',
      '  end',
      '  B --> C',
    ].join('\n');
    const [legal] = expectColumns(await layoutFromSource(source), ['L1', 'L2', 'L3']);
    expectEmptyColumnWidth(legal, 'Legal');
  });

  it('an empty last lane stands right of the last populated lane', async () => {
    const source = [
      'swimlane-beta TB',
      '  subgraph L1[Sales]',
      '    A[Receive order] --> B[Check stock]',
      '  end',
      '  subgraph L2[Warehouse]',
      '    C[Pick] --> D[Ship]',
      '  end',
      '  subgraph L3[Legal]',
      '  end',
      '  B --> C',
    ].join('\n');
    const spans = expectColumns(await layoutFromSource(source), ['L1', 'L2', 'L3']);
    expectEmptyColumnWidth(spans[2], 'Legal');
  });

  it('when no lane has nodes, the lanes stand side by side in declared order', async () => {
    const source = [
      'swimlane-beta TB',
      '  subgraph L1[Sales]',
      '  end',
      '  subgraph L2[Legal]',
      '  end',
      '  subgraph L3[Warehouse]',
      '  end',
    ].join('\n');
    const spans = expectColumns(await layoutFromSource(source), ['L1', 'L2', 'L3']);
    spans.forEach((span, index) =>
      expectEmptyColumnWidth(span, ['Sales', 'Legal', 'Warehouse'][index])
    );
  });

  it('BT places an empty lane between its neighbours too', async () => {
    const [, legal] = expectColumns(await layoutFromSource(lanes('BT', EMPTY_LEGAL)), [
      'L1',
      'L2',
      'L3',
    ]);
    expectEmptyColumnWidth(legal, 'Legal');
  });

  it('a longer title widens the empty column', async () => {
    const title = 'Legal and compliance review board';
    const layout = await layoutFromSource(lanes('TB', `  subgraph L2[${title}]\n  end`));
    const [, legal] = expectColumns(layout, ['L1', 'L2', 'L3']);
    expectEmptyColumnWidth(legal, title);
  });

  it('without an empty lane, TB lanes are laid out as before: touching, in declared order', async () => {
    const layout = await layoutFromSource(lanes('TB', EMPTY_LEGAL, false));
    expectColumns(layout, ['L1', 'L3']);
  });

  it('LR opens no column: the populated lanes keep the place they have without the empty lane', async () => {
    const layout = await layoutFromSource(lanes('LR', EMPTY_LEGAL));
    const control = await layoutFromSource(lanes('LR', EMPTY_LEGAL, false));
    for (const id of ['L1', 'L3', 'A', 'B', 'C', 'D']) {
      expect(node(layout, id)).toMatchObject({
        x: node(control, id).x,
        y: node(control, id).y,
        width: node(control, id).width,
        height: node(control, id).height,
      });
    }
  });

  it('an empty lane shares the height of its neighbours, and the next lane takes its title strip along', async () => {
    const layout = await layoutFromSource(lanes('TB', EMPTY_LEGAL));
    const [sales, legal, warehouse] = ['L1', 'L2', 'L3'].map((id) => node(layout, id));
    expect(legal.y).toBe(sales.y);
    expect(legal.height).toBe(sales.height);
    for (const lane of [legal, warehouse]) {
      const left = (lane.x ?? 0) - (lane.width ?? 0) / 2;
      expect(lane.groupTitleRect?.left).toBeCloseTo(left, 6);
      expect(lane.groupTitleRect?.right).toBeCloseTo(left + (lane.width ?? 0), 6);
    }
  });

  it('when no lane has nodes, each lane is one header row tall with its title strip on top', async () => {
    const source = [
      'swimlane-beta TB',
      '  subgraph L1[Sales]',
      '  end',
      '  subgraph L2[Legal]',
      '  end',
    ].join('\n');
    const layout = await layoutFromSource(source);
    for (const id of ['L1', 'L2']) {
      const lane = node(layout, id);
      expect(lane.height).toBe(EMPTY_ROW_HEIGHT);
      expect(lane.y).toBe(EMPTY_ROW_HEIGHT / 2);
      expect(lane.groupTitleRect).toEqual({
        left: (lane.x ?? 0) - (lane.width ?? 0) / 2,
        right: (lane.x ?? 0) + (lane.width ?? 0) / 2,
        top: 0,
        bottom: TITLE_BAND_HEIGHT,
      });
    }
  });

  it('an empty column is exactly as wide as the title estimate plus padding, scaled by the font size', async () => {
    const title = 'Legal and compliance review board';
    const width = async (fontSize?: number) => {
      const layout = await layoutFromSource(
        lanes('TB', `  subgraph L2[${title}]\n  end`),
        fontSize
      );
      return node(layout, 'L2').width;
    };
    const charWidth = (fontSize: number) => fontSize * CHAR_WIDTH_PER_FONT_SIZE;
    expect(await width()).toBeCloseTo(title.length * TITLE_CHAR_WIDTH + 2 * LANE_PADDING, 6);
    expect(await width(2 * DEFAULT_FONT_SIZE)).toBeCloseTo(
      title.length * charWidth(2 * DEFAULT_FONT_SIZE) + 2 * LANE_PADDING,
      6
    );
  });
});
