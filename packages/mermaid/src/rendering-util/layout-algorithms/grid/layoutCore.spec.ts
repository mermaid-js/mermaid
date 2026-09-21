import { describe, expect, it } from 'vitest';
import type { LayoutData, Node } from '../../types.js';
import { runGridLayoutCore } from './layoutCore.js';

function leaf(
  id: string,
  width: number,
  height: number,
  metadata?: Record<string, unknown>,
  parentId?: string
): Node {
  return {
    id,
    parentId,
    isGroup: false,
    shape: 'rect',
    width,
    height,
    metadata,
  } as Node;
}

function group(
  id: string,
  label: string,
  parentId?: string,
  metadata?: Record<string, unknown>
): Node {
  return {
    id,
    parentId,
    label,
    labelBBox: { width: 60, height: 20 },
    isGroup: true,
    shape: 'rect',
    metadata,
  } as Node;
}

function layout(nodes: Node[], grid: Record<string, unknown> = {}): LayoutData {
  return {
    nodes,
    edges: [],
    config: {
      grid,
    } as LayoutData['config'],
  };
}

function geometrySnapshot(nodes: Node[]) {
  return nodes.map((node) => ({
    id: node.id,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    groupTitleRect: node.groupTitleRect,
  }));
}

describe('grid layout core', () => {
  it('sizes stacked cells and applies horizontal/vertical alignment', () => {
    const data = layout(
      [
        leaf('stack-left', 40, 20, {
          row: 1,
          column: 1,
          horizontalAlign: 'left',
          verticalAlign: 'bottom',
        }),
        leaf('stack-right', 20, 20, {
          row: 1,
          column: 1,
          horizontalAlign: 'right',
          verticalAlign: 'bottom',
        }),
        leaf('peer', 100, 100, { row: 1, column: 2 }),
      ],
      { cellGap: 10 }
    );

    runGridLayoutCore(data);
    const byId = new Map(data.nodes.map((node) => [node.id, node]));

    expect(byId.get('stack-left')).toMatchObject({ x: 20, y: 60 });
    expect(byId.get('stack-right')).toMatchObject({ x: 30, y: 90 });
    expect(byId.get('peer')).toMatchObject({ x: 140, y: 50 });
  });

  it('sizes nested groups bottom-up and keeps coordinates direction-independent', () => {
    const build = (direction: string) =>
      layout(
        [
          group('outer', 'Outer'),
          group('middle', 'Middle', 'outer', { row: 1, column: 1 }),
          leaf('inner', 60, 30, { row: 1, column: 1 }, 'middle'),
          leaf('sibling', 80, 40, { row: 1, column: 2 }, 'outer'),
          leaf('root-leaf', 50, 20, { row: 1, column: 2 }),
        ],
        {}
      ) as LayoutData & { direction?: string };

    const tb = build('TB');
    tb.direction = 'TB';
    runGridLayoutCore(tb);

    const lr = build('LR');
    lr.direction = 'LR';
    runGridLayoutCore(lr);

    const byId = new Map(tb.nodes.map((node) => [node.id, node]));
    const outer = byId.get('outer')!;
    const middle = byId.get('middle')!;
    const inner = byId.get('inner')!;

    expect(outer.groupTitleRect).toBeDefined();
    expect(middle.groupTitleRect).toBeDefined();

    const outerLeft = (outer.x ?? 0) - (outer.width ?? 0) / 2;
    const outerRight = (outer.x ?? 0) + (outer.width ?? 0) / 2;
    const outerTop = (outer.y ?? 0) - (outer.height ?? 0) / 2;
    const outerBottom = (outer.y ?? 0) + (outer.height ?? 0) / 2;
    const middleLeft = (middle.x ?? 0) - (middle.width ?? 0) / 2;
    const middleRight = (middle.x ?? 0) + (middle.width ?? 0) / 2;
    const middleTop = (middle.y ?? 0) - (middle.height ?? 0) / 2;
    const middleBottom = (middle.y ?? 0) + (middle.height ?? 0) / 2;

    expect(middleLeft).toBeGreaterThanOrEqual(outerLeft);
    expect(middleRight).toBeLessThanOrEqual(outerRight);
    expect(middleTop).toBeGreaterThanOrEqual(outerTop);
    expect(middleBottom).toBeLessThanOrEqual(outerBottom);
    expect(inner.x ?? 0).toBeGreaterThan(middleLeft);
    expect(inner.x ?? 0).toBeLessThan(middleRight);
    expect(inner.y ?? 0).toBeGreaterThan(middleTop);
    expect(inner.y ?? 0).toBeLessThan(middleBottom);

    const tbCoords = tb.nodes.map((node) => [
      node.id,
      node.x,
      node.y,
      node.width,
      node.height,
      node.groupTitleRect,
    ]);
    const lrCoords = lr.nodes.map((node) => [
      node.id,
      node.x,
      node.y,
      node.width,
      node.height,
      node.groupTitleRect,
    ]);
    expect(lrCoords).toEqual(tbCoords);
  });

  it.each([
    {
      name: 'invalid coordinates',
      code: 'GRID_INVALID_COORDINATE',
      build: () =>
        layout([
          group('g', 'Group'),
          leaf('member', 60, 30, { row: 1, column: 1 }, 'g'),
          leaf('bad', 40, 20, { row: 0, column: 1 }),
        ]),
    },
    {
      name: 'stack alignment conflicts',
      code: 'GRID_CELL_ALIGNMENT_CONFLICT',
      build: () =>
        layout([
          leaf('stack-top', 40, 20, { row: 1, column: 1, verticalAlign: 'top' }),
          leaf('stack-bottom', 40, 20, { row: 1, column: 1, verticalAlign: 'bottom' }),
          leaf('peer', 80, 80, { row: 1, column: 2 }),
        ]),
    },
  ])('reports $name before mutating any geometry', ({ build, code }) => {
    const data = build();
    const before = geometrySnapshot(data.nodes);

    let thrown: unknown;
    try {
      runGridLayoutCore(data);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ code });
    expect(geometrySnapshot(data.nodes)).toEqual(before);
  });

  it('lays out 15,000 nested groups without recursion overflow', () => {
    const depth = 15_000;
    const nodes: Node[] = [group('g0', 'Group 0')];
    for (let index = 1; index < depth; index++) {
      nodes.push(
        group(`g${index}`, `Group ${index}`, `g${index - 1}`, {
          row: 1,
          column: 1,
        })
      );
    }
    nodes.push(
      leaf(
        'terminal',
        60,
        30,
        {
          row: 1,
          column: 1,
        },
        `g${depth - 1}`
      )
    );

    const data = layout(nodes);
    const result = runGridLayoutCore(data);
    const terminal = data.nodes.find((node) => node.id === 'terminal');
    const rootGroup = data.nodes.find((node) => node.id === 'g0');
    const deepestGroup = data.nodes.find((node) => node.id === `g${depth - 1}`);

    expect(result.forest.postOrderGroups).toHaveLength(depth);
    expect(rootGroup).toBeDefined();
    expect(deepestGroup).toBeDefined();
    expect(terminal).toBeDefined();
    expect(Number.isFinite(rootGroup?.x)).toBe(true);
    expect(Number.isFinite(rootGroup?.y)).toBe(true);
    expect(Number.isFinite(rootGroup?.width)).toBe(true);
    expect(Number.isFinite(rootGroup?.height)).toBe(true);
    expect(Number.isFinite(deepestGroup?.x)).toBe(true);
    expect(Number.isFinite(deepestGroup?.y)).toBe(true);
    expect(Number.isFinite(terminal?.x)).toBe(true);
    expect(Number.isFinite(terminal?.y)).toBe(true);
  });
});
