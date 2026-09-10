import { describe, it, expect, vi, afterEach } from 'vitest';
import * as diagramAPI from '../../diagram-api/diagramAPI.js';
import type { BlockDB } from './blockDB.js';
import type { Block } from './blockTypes.js';
import { calculateBlockPosition, layout } from './layout.js';

describe('Layout', function () {
  it('should calculate position correctly', () => {
    expect(calculateBlockPosition(2, 0)).toEqual({ px: 0, py: 0 });
    expect(calculateBlockPosition(2, 1)).toEqual({ px: 1, py: 0 });
    expect(calculateBlockPosition(2, 2)).toEqual({ px: 0, py: 1 });
    expect(calculateBlockPosition(2, 3)).toEqual({ px: 1, py: 1 });
    expect(calculateBlockPosition(2, 4)).toEqual({ px: 0, py: 2 });
    expect(calculateBlockPosition(1, 3)).toEqual({ px: 0, py: 3 });
  });
});

describe('layout runtime config', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should read block.padding from config at call time, not at import time', () => {
    const makeRoot = (): Block => ({
      id: 'root',
      type: 'square',
      columns: 2,
      children: [
        { id: 'b1', type: 'square', children: [], size: { width: 100, height: 50, x: 0, y: 0 } },
        { id: 'b2', type: 'square', children: [], size: { width: 100, height: 50, x: 0, y: 0 } },
      ],
    });

    const makeDb = (root: Block): BlockDB =>
      ({ getBlock: (id: string) => (id === 'root' ? root : undefined) }) as unknown as BlockDB;

    vi.spyOn(diagramAPI, 'getConfig').mockReturnValue({ block: { padding: 4 } } as any);
    const result1 = layout(makeDb(makeRoot()));

    vi.spyOn(diagramAPI, 'getConfig').mockReturnValue({ block: { padding: 20 } } as any);
    const result2 = layout(makeDb(makeRoot()));

    // padding=4:  width = 2*(100+4)+4 = 212
    // padding=20: width = 2*(100+20)+20 = 260
    // If padding were cached at module load time both calls would return the same value.
    expect(result1).not.toEqual(result2);
    expect(result1!.width).toBeLessThan(result2!.width);
  });
});

describe('layout debug logging', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Regression for #7907: the block tree was serialized eagerly for a debug log on
  // every render. Anything in the tree that JSON cannot represent - a DOM node
  // carrying React's own enumerable fiber properties, in the reported case - turned
  // a render into a thrown TypeError/RangeError.
  it('does not serialize the block tree when laying out', () => {
    const circular: Record<string, unknown> = { id: 'not-serializable' };
    circular.self = circular;

    const root: Block = {
      id: 'root',
      type: 'square',
      columns: 1,
      children: [
        {
          id: 'b1',
          type: 'square',
          children: [],
          size: { width: 100, height: 50, x: 0, y: 0 },
          // Stands in for a value the model can pick up that JSON cannot walk.
          node: circular,
        } as unknown as Block,
      ],
    };

    const db = {
      getBlock: (id: string) => (id === 'root' ? root : undefined),
    } as unknown as BlockDB;

    vi.spyOn(diagramAPI, 'getConfig').mockReturnValue({ block: { padding: 8 } } as any);

    expect(() => layout(db)).not.toThrow();
  });
});
