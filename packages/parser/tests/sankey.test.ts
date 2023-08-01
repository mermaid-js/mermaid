import { describe, expect, it } from 'vitest';
import { Sankey } from '../src/language/index.js';
import { createSankeyTestServices } from './test-utils.js';

describe('sankey', () => {
  const { parse } = createSankeyTestServices();

  it('should handle simple sankey', () => {
    const context = `sankey-beta
    sourceNode, targetNode, 10`;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(Sankey);
    expect(value.links[0].source).toBe('sourceNode');
    expect(value.links[0].target).toBe('targetNode');
    expect(value.links[0].value).toBe(10);
  });

  it('should handle sankey with double quotes', () => {
    const context = `sankey-beta
    "source node, with comma", "target node, with comma", 10.00
    `;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(Sankey);
    expect(value.links[0].source).toBe('source node, with comma');
    expect(value.links[0].target).toBe('target node, with comma');
    expect(value.links[0].value).toBe(10.0);
  });

  it('should handle sankey with more than one link', () => {
    const context = `sankey-beta
    source node 1, target node 1, 10
    source node 2, target node 2, 50`;
    const result = parse(context);
    expect(result.parserErrors).toHaveLength(0);
    expect(result.lexerErrors).toHaveLength(0);

    const value = result.value;
    expect(value.$type).toBe(Sankey);
    expect(value.links[0].source).toBe('source node 1');
    expect(value.links[0].target).toBe('target node 1');
    expect(value.links[0].value).toBe(10);

    expect(value.links[1].source).toBe('source node 2');
    expect(value.links[1].target).toBe('target node 2');
    expect(value.links[1].value).toBe(50);
  });

  describe('title and accessibilities', () => {
    it('should handle title definition', () => {
      const context = `sankey-beta title awesome title
      source, target, 10`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Sankey);
      expect(value.links[0].source).toBe('source');
      expect(value.links[0].target).toBe('target');
      expect(value.links[0].value).toBe(10);
    });

    it('should handle accTitle definition', () => {
      const context = `sankey-beta accTitle: awesome accTitle
      source, target, 10`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Sankey);
      expect(value.links[0].source).toBe('source');
      expect(value.links[0].target).toBe('target');
      expect(value.links[0].value).toBe(10);
    });

    it('should handle single line accDescr definition', () => {
      const context = `sankey-beta accDescr: awesome accDescr
      source, target, 10`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Sankey);
      expect(value.links[0].source).toBe('source');
      expect(value.links[0].target).toBe('target');
      expect(value.links[0].value).toBe(10);
    });

    it('should handle multi line accDescr definition', () => {
      const context = `sankey-beta accDescr {
        awesome accDescr
      }
      source, target, 10`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Sankey);
      expect(value.links[0].source).toBe('source');
      expect(value.links[0].target).toBe('target');
      expect(value.links[0].value).toBe(10);
    });

    it('should handle title and accessibilities definition', () => {
      const context = `sankey-beta title awesome title
      accTitle: awesome accTitle
      accDescr: awesome accDescr
      source, target, 10`;
      const result = parse(context);
      expect(result.parserErrors).toHaveLength(0);
      expect(result.lexerErrors).toHaveLength(0);

      const value = result.value;
      expect(value.$type).toBe(Sankey);
      expect(value.links[0].source).toBe('source');
      expect(value.links[0].target).toBe('target');
      expect(value.links[0].value).toBe(10);
    });
  });
});
