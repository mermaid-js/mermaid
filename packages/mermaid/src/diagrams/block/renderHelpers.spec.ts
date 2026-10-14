import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BlockDB } from './blockDB.js';
import type { Block } from './blockTypes.js';

const removeSpy = vi.fn();

// A DOM node in an environment that hangs its own enumerable properties off
// elements, as React does with `__reactFiber$…`. Walking it is what turned a
// render into a thrown error in #7907.
const domNodeWithOwnProps: Record<string, unknown> = {
  getBBox: () => ({ width: 120, height: 40 }),
};
domNodeWithOwnProps.__reactFiber$abc = domNodeWithOwnProps;

vi.mock('../../rendering-util/rendering-elements/nodes.js', () => ({
  insertNode: vi.fn(() =>
    Promise.resolve({
      node: () => domNodeWithOwnProps,
      remove: removeSpy,
    })
  ),
  positionNode: vi.fn(),
}));

const { calculateBlockSizes } = await import('./renderHelpers.js');

describe('calculateBlockSizes', () => {
  beforeEach(() => {
    removeSpy.mockClear();
  });

  const makeDb = (block: Block): BlockDB =>
    ({
      getBlock: () => block,
      setBlock: () => undefined,
      getDiagramId: () => 'test-diagram',
    }) as unknown as BlockDB;

  it('records only the measurements on the block', async () => {
    const block: Block = { id: 'b1', type: 'square', children: [] };

    await calculateBlockSizes({} as any, [block], makeDb(block));

    expect(block.size).toEqual({ width: 120, height: 40, x: 0, y: 0 });
  });

  // Regression for #7907: the sized element was stored on `block.size`, so the block
  // tree held a reference to a node that had already been removed from the document
  // and anything walking the tree reached straight into the DOM.
  it('does not keep a reference to the measured element', async () => {
    const block: Block = { id: 'b1', type: 'square', children: [] };

    await calculateBlockSizes({} as any, [block], makeDb(block));

    expect(removeSpy).toHaveBeenCalled();
    expect(block.size).not.toHaveProperty('node');
    expect(() => JSON.stringify(block)).not.toThrow();
  });
});
