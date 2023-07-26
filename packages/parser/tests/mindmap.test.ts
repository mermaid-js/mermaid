import { describe, expect, it } from 'vitest';
import { createMindmapTestServices } from './test-utils.js';
import { Mindmap } from '../src/language/index.js';

describe('mindmap', () => {
  const { parse } = createMindmapTestServices();

  it.todo('should handle regular mindmap', () => {
    const context = `mindmap
id[awesome title]
  :::urgent large
::icon(fa fa-book)

  id1[f]
`;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.root.id).toBe('id');
    expect(value.root.title).toBe('awesome title');
    expect(value.root.class).toBe('urgent large');
    expect(value.root.icon).toBe('fa fa-book');
    expect(value.$type).toBe(Mindmap);
  });
});
