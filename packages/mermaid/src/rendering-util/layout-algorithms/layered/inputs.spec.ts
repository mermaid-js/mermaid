// Ported from mermaid-v13 `packages/core/src/layout/layered/inputs.spec.ts`.
import { describe, expect, it } from 'vitest';
import { EDGE_INPUTS, ledge, lnode, NODE_INPUTS } from './layered.js';

// The compound layout reuses a level's layout when `layoutInputs` is unchanged, so every field
// must be either an input (listed) or an output. A new field fails here until it is sorted.
describe('layered inputs', () => {
  it('lists every LNode field as an input or an output', () => {
    const outputs = ['x', 'y', 'rank'];
    expect(Object.keys(lnode(1, 1)).sort()).toEqual([...NODE_INPUTS, ...outputs].sort());
  });

  it('lists every LEdge field as an input or an output', () => {
    const outputs = ['reversed', 'points', 'labelX', 'labelY'];
    expect(Object.keys(ledge(0, 1)).sort()).toEqual([...EDGE_INPUTS, ...outputs].sort());
  });
});
