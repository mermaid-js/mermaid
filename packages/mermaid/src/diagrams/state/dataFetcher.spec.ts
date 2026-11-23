import { beforeEach, describe, expect, it } from 'vitest';
// @ts-expect-error No types available for JISON
import stateDiagram, { parser } from './parser/stateDiagram.jison';
import { StateDB } from './stateDb.js';

describe('state diagram containment', () => {
  let stateDb: StateDB;

  beforeEach(() => {
    stateDb = new StateDB(2);
    parser.yy = stateDb;
    stateDiagram.parser.yy = stateDb;
    stateDiagram.parser.yy.clear();
  });

  const parse = (diagram: string) => {
    parser.parse(diagram);
    return stateDb.getData();
  };

  const parentOf = (diagram: string) =>
    new Map(parse(diagram).nodes.map((node) => [node.id, node.parentId]));

  /** The layout hangs on a state that contains itself, so walk every chain to its top. */
  const containsItself = (parents: Map<string, string | undefined>) =>
    [...parents.keys()].some((start) => {
      const seen = new Set<string>();
      for (let id = parents.get(start); id !== undefined; id = parents.get(id)) {
        if (id === start) {
          return true;
        }
        if (seen.has(id)) {
          return false;
        }
        seen.add(id);
      }
      return false;
    });

  it('keeps a composite out of itself when a transition inside it names it', () => {
    const parents = parentOf(`stateDiagram-v2
      state Boot {
        Running
        Boot --> Running
      }`);

    expect(parents.get('Boot')).toBeUndefined();
    expect(parents.get('Running')).toBe('Boot');
  });

  it('does the same when the transition runs the other way', () => {
    const parents = parentOf(`stateDiagram-v2
      state Boot {
        Running
        Running --> Boot
      }`);

    expect(parents.get('Boot')).toBeUndefined();
    expect(parents.get('Running')).toBe('Boot');
  });

  it('keeps an outer composite out of the composite nested in it', () => {
    const parents = parentOf(`stateDiagram-v2
      state Outer {
        state Inner {
          deep
          Outer --> Inner
        }
      }`);

    expect(parents.get('Outer')).toBeUndefined();
    expect(parents.get('Inner')).toBe('Outer');
    expect(parents.get('deep')).toBe('Inner');
    expect(containsItself(parents)).toBe(false);
  });

  it('still draws the transition to the composite that contains it', () => {
    const { edges } = parse(`stateDiagram-v2
      state Boot {
        Running
        Boot --> Running
      }`);

    expect(edges.map((edge) => [edge.start, edge.end])).toEqual([['Boot', 'Running']]);
  });

  it('leaves a transition between two sibling composites alone', () => {
    const parents = parentOf(`stateDiagram-v2
      state A {
        a
      }
      state B {
        b
      }
      a --> b`);

    expect(parents.get('a')).toBe('A');
    expect(parents.get('b')).toBe('B');
    expect(containsItself(parents)).toBe(false);
  });

  it('leaves the ordinary nesting alone', () => {
    const parents = parentOf(`stateDiagram-v2
      state A {
        state B {
          c --> d
        }
      }`);

    expect(parents.get('B')).toBe('A');
    expect(parents.get('c')).toBe('B');
    expect(parents.get('d')).toBe('B');
  });
});
