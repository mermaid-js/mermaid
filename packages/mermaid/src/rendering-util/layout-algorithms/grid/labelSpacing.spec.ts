import { describe, expect, it } from 'vitest';
import type { Edge, LayoutData, Node } from '../../types.js';
import { buildGridForest } from './groups.js';
import { buildGridLabelRequirements, deriveGridContainerLabelGaps } from './labelSpacing.js';
import type { GridCellStack, GridResolvedPlacement } from './types.js';
import { ROOT_CONTAINER_ID } from './types.js';

function node(id: string, width = 80, height = 40, parentId?: string): Node {
  return { id, width, height, parentId, isGroup: false } as Node;
}

function label(id: string, width: number, height: number): Node {
  return { id, width, height, isGroup: false, isEdgeLabel: true } as Node;
}

function placement(item: Node, row: number, column: number): GridResolvedPlacement {
  return {
    item,
    row,
    column,
    horizontalAlign: 'center',
    verticalAlign: 'center',
    sourceOrder: 0,
    explicitRow: true,
    explicitColumn: true,
    explicitCell: true,
  };
}

function cells(...values: GridResolvedPlacement[]): Map<string, GridCellStack> {
  return new Map(
    values.map((value) => [
      `${value.row}:${value.column}`,
      {
        row: value.row,
        column: value.column,
        items: [value],
        width: value.item.width ?? 0,
        height: value.item.height ?? 0,
        verticalAlign: 'center',
      },
    ])
  );
}

describe('grid label spacing', () => {
  it('indexes only measured labels whose endpoints share a direct container', () => {
    const a = node('a');
    const b = node('b');
    const helper = label('edge-label-ab', 90, 20);
    const edge = { id: 'ab', start: 'a', end: 'b', labelNodeId: helper.id } as Edge;
    const data = { nodes: [a, b, helper], edges: [edge] } as LayoutData;

    const requirements = buildGridLabelRequirements(data, buildGridForest(data.nodes));

    expect(requirements.byContainer.get(ROOT_CONTAINER_ID)).toHaveLength(1);
    expect(requirements.selfLoops.size).toBe(0);
  });

  it('uses the maximum label span for a canonical adjacent boundary', () => {
    const a = node('a');
    const b = node('b');
    const first = label('first', 60, 20);
    const second = label('second', 90, 20);
    const entries = [
      { edge: { id: 'ab', start: 'a', end: 'b' } as Edge, labelNode: first },
      { edge: { id: 'ba', start: 'b', end: 'a' } as Edge, labelNode: second },
    ];

    const gaps = deriveGridContainerLabelGaps(
      entries,
      cells(placement(a, 1, 1), placement(b, 1, 2)),
      new Map([[1, 40]]),
      new Map([
        [1, 80],
        [2, 80],
      ]),
      [1],
      [1, 2],
      50,
      50
    );

    expect(gaps.columnGapAfter).toEqual(new Map([[1, 116]]));
    expect(gaps.rowGapAfter.size).toBe(0);
  });

  it('skips non-adjacent endpoints and cross-axis track collisions', () => {
    const a = node('a');
    const b = node('b');
    const helper = label('label', 90, 120);
    const entries = [{ edge: { id: 'ab', start: 'a', end: 'b' } as Edge, labelNode: helper }];

    const gaps = deriveGridContainerLabelGaps(
      entries,
      cells(placement(a, 1, 1), placement(b, 1, 3)),
      new Map([
        [1, 40],
        [2, 40],
      ]),
      new Map([
        [1, 80],
        [2, 80],
        [3, 80],
      ]),
      [1, 2],
      [1, 2, 3],
      10,
      50
    );
    expect(gaps.columnGapAfter.size).toBe(0);

    const adjacent = deriveGridContainerLabelGaps(
      entries,
      cells(placement(a, 1, 1), placement(b, 1, 2)),
      new Map([
        [1, 40],
        [2, 40],
      ]),
      new Map([
        [1, 80],
        [2, 80],
      ]),
      [1, 2],
      [1, 2],
      10,
      50
    );
    expect(adjacent.columnGapAfter.size).toBe(0);
  });
});
