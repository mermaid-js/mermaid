import { describe, expect, it } from 'vitest';
import { createMindmapTestServices } from './test-utils.js';
import { Mindmap } from '../src/language/index.js';

describe('mindmap', () => {
  const { parse } = createMindmapTestServices();

  it('should handle regular mindmap', () => {
    const context = `mindmap
id1[awesome title]
  :::urgent large
::icon(fa fa-book)

  id2[awesome title 2]`;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(Mindmap);

    expect(value.root.id).toBe('id1');
    expect(value.root.title).toBe('awesome title');
    expect(value.root.class).toBe('urgent large');
    expect(value.root.icon).toBe('fa fa-book');

    expect(value.root.children[0].id).toBe('id2');
    expect(value.root.children[0].title).toBe('awesome title 2');
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
