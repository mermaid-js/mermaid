import { describe, expect, it } from 'vitest';
import { createMindmapTestServices } from './test-utils.js';
import { Mindmap } from '../src/language/index.js';

describe('mindmap', () => {
  const { parse } = createMindmapTestServices();

  it('should handle regular mindmap', () => {
    const context = `mindmap
id1[awesome 1]
  :::urgent large
::icon(fa fa-book)

  id2[awesome 2]`;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(Mindmap);

    expect(value.root.id).toBe('id1');
    expect(value.root.title).toBe('awesome 1');
    expect(value.root.class).toBe('urgent large');
    expect(value.root.icon).toBe('fa fa-book');

    expect(value.root.children[0].id).toBe('id2');
    expect(value.root.children[0].title).toBe('awesome 2');
  });

  it.todo('should handle a hierachial mindmap definition', () => {
    const context = `mindmap
root
  child1
  child2`;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(Mindmap);
    expect(value.root.title).toBe('root');
    expect(value.root.children[0].title).toBe('child1');
    expect(value.root.children[1].title).toBe('child2');
  });

  it.todo('shoudl handle newlines above the mindmap declarations', () => {
    const context = `

mindmap
root
  A


  B`;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(Mindmap);
    expect(value.root.title).toBe('root');

    expect(value.root.children).toHaveLength(2);
    expect(value.root.children[0].title).toBe('A');
    expect(value.root.children[1].title).toBe('B');
  });

  it('shoudl handle newlines above the mindmap declarations', () => {
    const context = `

mindmap
  root
    A`;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(Mindmap);
    expect(value.root.title).toBe('root');

    expect(value.root.children[0].title).toBe('A');
  });

  describe('hiearchy', () => {
    it('should handle simple root definition', () => {
      const context = `mindmap
      root`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);
      expect(value.root.title).toBe('root');
    });

    it.todo('should handle hierachial mindmap definition', () => {
      const context = `mindmap
      root
        child1
        child2`;

      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);
      expect(value.root.title).toBe('root');
      expect(value.root.children[0].title).toBe('child1');
      expect(value.root.children[1].title).toBe('child2');
    });

    it('should handle simple root with a shape and without an id', () => {
      const context = `mindmap
      (root)`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);
      expect(value.root.title).toBe('root');
    });

    it.todo('should handle deeper hierachial mindmap definition', () => {
      const context = `mindmap
      root
        child1
          leaf1
        child2`;

      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);
      expect(value.root.title).toBe('root');
      expect(value.root.children[0].title).toBe('child1');
      expect(value.root.children[0].children[0].title).toBe('leaf1');
      expect(value.root.children[1].title).toBe('child2');
    });

    it('should not allow multiple roots', () => {
      const context = `mindmap
      root
      fakeRoot`;

      const result = parse(context);
      expect(result.parserErrors).not.toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);
    });

    it.todo('should not allow actual root in wrong place', () => {
      const context = `mindmap
          root
        fakeRoot
      realRootWrongPlace`;

      const result = parse(context);
      expect(result.parserErrors).not.toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);
    });
  });

  describe('title and accessibilities', () => {
    it('should handle title definition', () => {
      const context = `mindmap title awesome title
      root`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);

      expect(value.title).toBe('awesome title');
      expect(value.root.title).toBe('root');
    });

    it('should handle accTitle definition', () => {
      const context = `mindmap accTitle: awesome accTitle
      root`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);

      expect(value.accTitle).toBe('awesome accTitle');
      expect(value.root.title).toBe('root');
    });

    it('should handle single line accDescr definition', () => {
      const context = `mindmap accDescr: awesome accDescr
      root`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);

      expect(value.accDescr).toBe('awesome accDescr');
      expect(value.root.title).toBe('root');
    });

    it('should handle multi line accDescr definition', () => {
      const context = `mindmap accDescr {
        awesome accDescr
      }
      root`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);

      expect(value.accDescr).toBe('awesome accDescr');
      expect(value.root.title).toBe('root');
    });

    it('should handle title and accessibilities definition', () => {
      const context = `mindmap title awesome title
      accTitle: awesome accTitle
      accDescr: awesome accDescr
      root`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);

      expect(value.title).toBe('awesome title');
      expect(value.accTitle).toBe('awesome accTitle');
      expect(value.accDescr).toBe('awesome accDescr');
      expect(value.root.title).toBe('root');
    });
  });

  describe('nodes', () => {
    it('should handle rectangle node definition', () => {
      const context = `mindmap
      root[the root]`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);

      expect(value.root.id).toBe('root');
      expect(value.root.title).toBe('the root');
      // expect(value.root.type).toBe('rectangle');
    });

    it('should handle rounded rectangle node definition', () => {
      const context = `mindmap
      root(the root)`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);

      expect(value.root.id).toBe('root');
      expect(value.root.title).toBe('the root');
      // expect(value.root.type).toBe('rounded-rectangle');
    });

    it('should handle circle node definition', () => {
      const context = `mindmap
      root((the root))`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);

      expect(value.root.id).toBe('root');
      expect(value.root.title).toBe('the root');
      // expect(value.root.type).toBe('circle');
    });

    it('should handle cloud node definition', () => {
      const context = `mindmap
      root)the root(`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);

      expect(value.root.id).toBe('root');
      expect(value.root.title).toBe('the root');
      // expect(value.root.type).toBe('cloud');
    });

    it('should handle bang node definition', () => {
      const context = `mindmap
      root)the root(`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);

      expect(value.root.id).toBe('root');
      expect(value.root.title).toBe('the root');
      // expect(value.root.type).toBe('bang');
    });

    it('should handle hexagon node definition', () => {
      const context = `mindmap
      root)the root(`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);

      expect(value.root.id).toBe('root');
      expect(value.root.title).toBe('the root');
      // expect(value.root.type).toBe('hexagon');
    });
  });

  describe('decorations', () => {
    it('should handle icons for the node', () => {
      const context = `mindmap
      root[the root]
      ::icon(bomb)`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);

      expect(value.root.id).toBe('root');
      expect(value.root.title).toBe('the root');
      // expect(value.root.type).toBe('rectangle');
      expect(value.root.icon).toEqual('bomb');
    });

    it('should handle classes for the node', () => {
      const context = `mindmap
      root[the root]
      :::m-4 p-8`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);

      expect(value.root.id).toBe('root');
      expect(value.root.title).toBe('the root');
      // expect(value.root.type).toBe('rectangle');
      expect(value.root.class).toEqual('m-4 p-8');
    });

    it.each([
      `mindmap
      root[the root]
      ::icon(bomb)
      :::m-4 p-8`,
      `mindmap
      root[the root]
      :::m-4 p-8
      ::icon(bomb)`,
    ])('should handle both classes and icons for the node', (context: string) => {
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Mindmap);

      expect(value.root.id).toBe('root');
      expect(value.root.title).toBe('the root');
      // expect(value.root.type).toBe('rectangle');
      expect(value.root.icon).toEqual('bomb');
      expect(value.root.class).toEqual('m-4 p-8');
    });
  });
});
