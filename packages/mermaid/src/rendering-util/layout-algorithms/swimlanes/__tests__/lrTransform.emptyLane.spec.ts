import { describe, it, expect } from 'vitest';
import type { LayoutData } from '../../../types.js';
import { applyLrDirectionTransform } from '../direction/lrTransform.js';

// TB collapses a lane with no members to nothing; LR leaves it as the layout left it, so a
// lane an author declared and left empty takes no band of its own in either direction.
describe('LR: a lane with no members', () => {
  it('is left as the layout left it', () => {
    const empty = { id: 'empty', isGroup: true, x: 5, y: 6, width: 0, height: 0 };
    const layout = {
      nodes: [
        { id: 'lane', isGroup: true },
        empty,
        { id: 'a', parentId: 'lane', isGroup: false, x: 0, y: 0, width: 80, height: 40 },
      ],
      edges: [],
    } as unknown as LayoutData;

    applyLrDirectionTransform(layout, 'LR');

    expect(empty).toMatchObject({ x: 5, y: 6, width: 0, height: 0 });
  });
});
