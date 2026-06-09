import { describe, it, expect } from 'vitest';
import { ancestorGroupIds, commonPrefixLen } from './groups.js';
import type { Node } from '../../../types.js';

describe('domus/pipeline/groups - ', () => {
  it('commonPrefixLen returns shared prefix length', () => {
    expect(commonPrefixLen([], [])).toBe(0);
    expect(commonPrefixLen(['a'], [])).toBe(0);
    expect(commonPrefixLen(['a', 'b'], ['a', 'c'])).toBe(1);
    expect(commonPrefixLen(['a', 'b'], ['a', 'b'])).toBe(2);
  });

  it('ancestorGroupIds returns outermost->innermost group chain', () => {
    const nodesById = new Map<string, Node>([
      ['G1', { id: 'G1', isGroup: true }],
      ['G2', { id: 'G2', isGroup: true, parentId: 'G1' }],
      ['A', { id: 'A', isGroup: false, parentId: 'G2' }],
    ]);
    expect(ancestorGroupIds(nodesById.get('A')!, nodesById)).toEqual(['G1', 'G2']);
    expect(ancestorGroupIds(nodesById.get('G2')!, nodesById)).toEqual(['G1']);
  });
});
