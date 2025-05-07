import { describe, expect, it } from 'vitest';
import { expectNoErrorsOrAlternatives } from './test-util.js';
import type { TreemapDoc, Section, Leaf } from '../src/language/generated/ast.js';
import type { LangiumParser } from 'langium';
import { createTreemapServices } from '../src/language/treemap/module.js';

describe('Treemap Parser', () => {
  const services = createTreemapServices().Treemap;
  const parser: LangiumParser = services.parser.LangiumParser;

  const parse = (input: string) => {
    return parser.parse<TreemapDoc>(input);
  };

  describe('Basic Parsing', () => {
    it('should parse empty treemap', () => {
      const result = parse('treemap');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe('TreemapDoc');
      expect(result.value.TreemapRows).toHaveLength(0);
    });

    it('should parse a section node', () => {
      const result = parse('treemap\n"Root"');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe('TreemapDoc');
      expect(result.value.TreemapRows).toHaveLength(1);
      if (result.value.TreemapRows[0].item) {
        expect(result.value.TreemapRows[0].item.$type).toBe('Section');
        const section = result.value.TreemapRows[0].item as Section;
        expect(section.name).toBe('Root');
      }
    });

    it('should parse a section with leaf nodes', () => {
      const result = parse(`treemap
"Root"
  "Child1" , 100
  "Child2" : 200
`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe('TreemapDoc');
      expect(result.value.TreemapRows).toHaveLength(3);

      if (result.value.TreemapRows[0].item) {
        expect(result.value.TreemapRows[0].item.$type).toBe('Section');
        const section = result.value.TreemapRows[0].item as Section;
        expect(section.name).toBe('Root');
      }

      if (result.value.TreemapRows[1].item) {
        expect(result.value.TreemapRows[1].item.$type).toBe('Leaf');
        const leaf = result.value.TreemapRows[1].item as Leaf;
        expect(leaf.name).toBe('Child1');
        expect(leaf.value).toBe(100);
      }

      if (result.value.TreemapRows[2].item) {
        expect(result.value.TreemapRows[2].item.$type).toBe('Leaf');
        const leaf = result.value.TreemapRows[2].item as Leaf;
        expect(leaf.name).toBe('Child2');
        expect(leaf.value).toBe(200);
      }
    });
  });

  describe('Data Types', () => {
    it('should correctly parse string values', () => {
      const result = parse('treemap\n"My Section"');
      expectNoErrorsOrAlternatives(result);
      if (result.value.TreemapRows[0].item) {
        expect(result.value.TreemapRows[0].item.$type).toBe('Section');
        const section = result.value.TreemapRows[0].item as Section;
        expect(section.name).toBe('My Section');
      }
    });

    it('should correctly parse number values', () => {
      const result = parse('treemap\n"Item" : 123.45');
      expectNoErrorsOrAlternatives(result);
      if (result.value.TreemapRows[0].item) {
        expect(result.value.TreemapRows[0].item.$type).toBe('Leaf');
        const leaf = result.value.TreemapRows[0].item as Leaf;
        expect(leaf.name).toBe('Item');
        expect(typeof leaf.value).toBe('number');
        expect(leaf.value).toBe(123.45);
      }
    });
  });

  describe('Validation', () => {
    it('should parse multiple root nodes', () => {
      const result = parse('treemap\n"Root1"\n"Root2"');
      expect(result.parserErrors).toHaveLength(0);

      // We're only checking that the multiple root nodes parse successfully
      // The validation errors would be reported by the validator during validation
      expect(result.value.$type).toBe('TreemapDoc');
      expect(result.value.TreemapRows).toHaveLength(2);
    });
  });
});
