import { describe, expect, it } from 'vitest';
import type { Node } from '../../types.js';
import { validateSameContainerRoute } from './routerConstraint.js';
import type { GridLayoutResult } from './types.js';
import { ROOT_CONTAINER_ID } from './types.js';

describe('grid router constraints', () => {
  it('rejects a terminal segment that passes through its destination node', () => {
    const source = {
      id: 'source',
      isGroup: false,
      shape: 'rect',
      x: 0,
      y: 0,
      width: 80,
      height: 40,
    } as Node;
    const target = {
      id: 'target',
      isGroup: false,
      shape: 'rect',
      x: 100,
      y: 0,
      width: 80,
      height: 40,
    } as Node;
    const result = {
      forest: {
        childrenByParent: new Map([[ROOT_CONTAINER_ID, [source, target]]]),
      },
    } as GridLayoutResult;

    expect(
      validateSameContainerRoute(
        [
          { x: 40, y: 0 },
          { x: 40, y: -40 },
          { x: 160, y: -40 },
          { x: 160, y: 0 },
          { x: 60, y: 0 },
        ],
        source,
        target,
        ROOT_CONTAINER_ID,
        result
      )
    ).toBe(false);
  });
});
