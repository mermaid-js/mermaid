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

  id2[awesome title 2]
`;
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
});
