import { describe, expect, it } from 'vitest';
import { expectNoErrorsOrAlternatives } from './test-util.js';
import type { TreeView } from '../src/language/generated/ast.js';
import type { LangiumParser } from 'langium';
import { createTreeViewServices } from '../src/language/treeView/module.js';

describe('TreeView Parser', () => {
  const services = createTreeViewServices().TreeView;
  const parser: LangiumParser = services.parser.LangiumParser;

  const parse = (input: string) => {
    return parser.parse<TreeView>(input);
  };

  describe('Basic Parsing', () => {
    it('should parse empty treeView', () => {
      const result = parse('treeView-beta');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe('TreeView');
      expect(result.value.nodes).toHaveLength(0);
    });

    it('should parse a treeView with only a root node', () => {
      const result = parse('treeView-beta\n"Root"');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe('TreeView');
      expect(result.value.nodes).toHaveLength(1);
      expect(result.value.nodes[0].name).toBe('Root');
      expect(result.value.nodes[0].indent).toBe(undefined);
    });

    it('should parse a treeView with multiple words within a node', () => {
      const result = parse('treeView-beta\n"Multi Word Root"');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe('TreeView');
      expect(result.value.nodes).toHaveLength(1);
      expect(result.value.nodes[0].name).toBe('Multi Word Root');
      expect(result.value.nodes[0].indent).toBe(undefined);
    });

    it('should parse a treeView with child nodes', () => {
      const result = parse(`treeView-beta\n"Root"\n    "Child1"\n    "Child2"\n        "Child3"`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe('TreeView');
      expect(result.value.nodes).toHaveLength(4);

      expect(result.value.nodes[0].name).toBe('Root');
      expect(result.value.nodes[0].indent).toBe(undefined);

      expect(result.value.nodes[1].name).toBe('Child1');
      expect(result.value.nodes[1].indent).toBe(4);

      expect(result.value.nodes[2].name).toBe('Child2');
      expect(result.value.nodes[2].indent).toBe(4);

      expect(result.value.nodes[3].name).toBe('Child3');
      expect(result.value.nodes[3].indent).toBe(8);
    });
  });

  describe('Title and Accessibilities', () => {
    it('should parse a treeView with title', () => {
      const result = parse('treeView-beta\ntitle My TreeView Diagram\n"Root"\n  "Child"');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe('TreeView');
      expect(result.value.title).toBe('My TreeView Diagram');
      expect(result.value.nodes).toHaveLength(2);
    });

    it('should parse a treeView with accTitle', () => {
      const result = parse('treeView-beta\naccTitle: Accessible Title\n"Root"\n  "Child"');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe('TreeView');
      expect(result.value.accTitle).toBe('Accessible Title');
      expect(result.value.nodes).toHaveLength(2);
    });

    it('should parse a treeView with accDescr', () => {
      const result = parse(
        'treeView-beta\naccDescr: This is an accessible description\n"Root"\n  "Child"'
      );
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe('TreeView');
      expect(result.value.accDescr).toBe('This is an accessible description');
      expect(result.value.nodes).toHaveLength(2);
    });

    it('should parse a treeView with multiple accessibility attributes', () => {
      const result = parse(`treeView-beta
title My TreeView Diagram
accTitle: Accessible Title
accDescr: This is an accessible description
"Root"
  "Child"`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe('TreeView');
      expect(result.value.title).toBe('My TreeView Diagram');
      expect(result.value.accTitle).toBe('Accessible Title');
      expect(result.value.accDescr).toBe('This is an accessible description');
      expect(result.value.nodes).toHaveLength(2);
    });
  });
});
