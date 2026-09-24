import { describe, expect, it } from 'vitest';
import type { Node } from '../../types.js';
import { buildGridForest, isAncestorGroup } from './groups.js';

function group(id: string, parentId?: string): Node {
  return {
    id,
    parentId,
    isGroup: true,
    shape: 'rect',
    width: 100,
    height: 80,
  } as Node;
}

function leaf(id: string, parentId?: string): Node {
  return {
    id,
    parentId,
    isGroup: false,
    shape: 'rect',
    width: 60,
    height: 40,
  } as Node;
}

describe('grid groups', () => {
  it('builds a stable post-order forest and ancestor checks', () => {
    const nodes = [
      group('outer'),
      leaf('a', 'outer'),
      group('inner', 'outer'),
      leaf('b', 'inner'),
      leaf('root'),
    ];

    const forest = buildGridForest(nodes);
    expect(forest.rootChildren.map((node) => node.id)).toEqual(['outer', 'root']);
    expect(forest.postOrderGroups.map((node) => node.id)).toEqual(['inner', 'outer']);
    expect(isAncestorGroup('outer', forest.nodeById.get('b'), forest.nodeById)).toBe(true);
    expect(isAncestorGroup('inner', forest.nodeById.get('a'), forest.nodeById)).toBe(false);
  });

  it('rejects missing parents and cycles', () => {
    expect(() => buildGridForest([leaf('orphan', 'missing')])).toThrow(/GRID_INVALID_CONTAINMENT/);

    expect(() => buildGridForest([group('a', 'b'), group('b', 'a')])).toThrow(
      /GRID_INVALID_CONTAINMENT/
    );
  });

  it('rejects the reserved synthetic root id', () => {
    expect(() => buildGridForest([group('__grid_root__')])).toThrow(
      /Node id "__grid_root__" is reserved/
    );
  });

  it('supports 15,000 levels of valid nesting without overflowing the call stack', () => {
    const depth = 15_000;
    const nodes: Node[] = [group('g0')];
    for (let index = 1; index < depth; index++) {
      nodes.push(group(`g${index}`, `g${index - 1}`));
    }
    nodes.push(leaf('terminal', `g${depth - 1}`));

    const forest = buildGridForest(nodes);

    expect(forest.rootChildren.map((node) => node.id)).toEqual(['g0']);
    expect(forest.postOrderGroups).toHaveLength(depth);
    expect(forest.postOrderGroups[0].id).toBe(`g${depth - 1}`);
    expect(forest.postOrderGroups[forest.postOrderGroups.length - 1].id).toBe('g0');
    expect(isAncestorGroup('g0', forest.nodeById.get('terminal'), forest.nodeById)).toBe(true);
  });
});
