import { describe, expect, it, vi } from 'vitest';
import { log } from '../../../logger.js';
import type { LayoutData, Node } from '../../types.js';
import { readGridConfig, resolveGridPlacements, validateGridPlacementMap } from './placement.js';

function node(id: string, metadata?: Record<string, unknown>, placementId?: string): Node {
  return {
    id,
    placementId,
    isGroup: false,
    shape: 'rect',
    width: 100,
    height: 40,
    metadata,
  } as Node;
}

function config(overrides: Record<string, unknown> = {}): LayoutData['config'] {
  return {
    grid: overrides,
  } as LayoutData['config'];
}

describe('grid placement', () => {
  it('defaults the grid curve and corner radius and replaces invalid values', () => {
    const defaults = readGridConfig({
      nodes: [],
      edges: [],
      config: config(),
    } as LayoutData);
    expect(defaults).toMatchObject({ curve: 'rounded', edgeCornerRadius: 5 });

    const rounded = readGridConfig({
      nodes: [],
      edges: [],
      config: config({ curve: 'rounded', edgeCornerRadius: 12 }),
    } as LayoutData);
    expect(rounded).toMatchObject({ curve: 'rounded', edgeCornerRadius: 12 });

    const invalid = readGridConfig({
      nodes: [],
      edges: [],
      config: config({ curve: 'unknown', edgeCornerRadius: -1 }),
    } as LayoutData);
    expect(invalid).toMatchObject({ curve: 'rounded', edgeCornerRadius: 5 });
  });

  it('resolves full, partial, automatic, sparse, and precedence cases deterministically', () => {
    const items = [
      node('explicit-a', { row: 1, column: 1 }),
      node('explicit-b', { row: 100, column: 3 }),
      node('stack-top', { row: 2, column: 2, horizontalAlign: 'left', verticalAlign: 'bottom' }),
      node('stack-bottom', {
        row: 2,
        column: 2,
        horizontalAlign: 'right',
        verticalAlign: 'bottom',
      }),
      node('row-only', { row: 1 }),
      node('column-only', { column: 1 }),
      node('auto-a'),
      node('auto-b'),
      node('map-only'),
      node('metadata-wins', { column: 4, horizontalAlign: 'left' }),
    ];
    const sourceOrder = new Map(items.map((item, index) => [item.id, index]));
    const gridConfig = readGridConfig({
      nodes: [],
      edges: [],
      config: config({
        columns: 3,
        placements: {
          'map-only': { row: 3, column: 3 },
          'metadata-wins': { row: 4, column: 2, horizontalAlign: 'right' },
        },
      }),
    } as LayoutData);

    const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    debug.mockRestore();

    const { placements, cells } = resolveGridPlacements(items, sourceOrder, gridConfig);
    const byId = new Map(placements.map((placement) => [placement.item.id, placement]));

    expect(byId.get('explicit-a')).toMatchObject({ row: 1, column: 1 });
    expect(byId.get('explicit-b')).toMatchObject({ row: 100, column: 3 });
    expect(cells.get('2:2')?.items.map((item) => item.item.id)).toEqual([
      'stack-top',
      'stack-bottom',
    ]);
    expect(byId.get('row-only')).toMatchObject({ row: 1, column: 2 });
    expect(byId.get('column-only')).toMatchObject({ row: 2, column: 1 });
    expect(byId.get('auto-a')).toMatchObject({ row: 1, column: 3 });
    expect(byId.get('auto-b')).toMatchObject({ row: 2, column: 3 });
    expect(byId.get('map-only')).toMatchObject({ row: 3, column: 3 });
    expect(byId.get('metadata-wins')).toMatchObject({
      row: 4,
      column: 4,
      horizontalAlign: 'left',
    });
  });

  it('throws for invalid coordinates and conflicting stack alignment', () => {
    const items = [node('bad', { row: 0 })];
    const sourceOrder = new Map([['bad', 0]]);
    const gridConfig = readGridConfig({
      nodes: [],
      edges: [],
      config: config(),
    } as LayoutData);
    expect(() => resolveGridPlacements(items, sourceOrder, gridConfig)).toThrow(
      /GRID_INVALID_COORDINATE/
    );

    const conflictItems = [
      node('one', { row: 1, column: 1, verticalAlign: 'top' }),
      node('two', { row: 1, column: 1, verticalAlign: 'bottom' }),
    ];
    const conflictOrder = new Map(conflictItems.map((item, index) => [item.id, index]));
    expect(() => resolveGridPlacements(conflictItems, conflictOrder, gridConfig)).toThrow(
      /GRID_CELL_ALIGNMENT_CONFLICT/
    );
  });

  it('ignores and warns about unknown placement ids', () => {
    const placementConfig = readGridConfig({
      nodes: [],
      edges: [],
      config: config({
        placements: {
          unknown: { row: 1, column: 1 },
        },
      }),
    } as LayoutData);

    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    expect(() => validateGridPlacementMap([node('known')], placementConfig)).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      '[grid]',
      'Ignoring grid placement for unknown target "unknown"'
    );
    warn.mockRestore();
  });

  it('resolves authored placement ids while preserving internal id precedence', () => {
    const items = [
      node('entity-CUSTOMER-0', undefined, 'CUSTOMER'),
      node('entity-ORDER-1', undefined, 'ORDER'),
    ];
    const sourceOrder = new Map(items.map((item, index) => [item.id, index]));
    const gridConfig = readGridConfig({
      nodes: [],
      edges: [],
      config: config({
        placements: {
          CUSTOMER: { row: 1, column: 1 },
          ORDER: { row: 1, column: 2 },
          'entity-ORDER-1': { row: 2, column: 2 },
        },
      }),
    } as LayoutData);

    const warn = vi.spyOn(log, 'warn').mockImplementation(() => undefined);
    expect(() => validateGridPlacementMap(items, gridConfig)).not.toThrow();
    expect(warn).not.toHaveBeenCalled();
    const { placements } = resolveGridPlacements(items, sourceOrder, gridConfig);
    const byId = new Map(placements.map((placement) => [placement.item.id, placement]));

    expect(byId.get('entity-CUSTOMER-0')).toMatchObject({ row: 1, column: 1 });
    expect(byId.get('entity-ORDER-1')).toMatchObject({ row: 2, column: 2 });
    expect(warn).toHaveBeenCalledWith(
      '[grid]',
      'Ignoring grid placement for authored target "ORDER" because internal target "entity-ORDER-1" is also configured'
    );
    warn.mockRestore();
  });

  it('rejects explicit null coordinates instead of treating them as omitted', () => {
    const items = [node('bad', { row: null, column: 1 })];
    const sourceOrder = new Map([['bad', 0]]);
    const gridConfig = readGridConfig({
      nodes: [],
      edges: [],
      config: config({
        placements: {
          bad: { row: 2, column: 2 },
        },
      }),
    } as LayoutData);

    expect(() => resolveGridPlacements(items, sourceOrder, gridConfig)).toThrow(
      /GRID_INVALID_COORDINATE/
    );
  });
});
