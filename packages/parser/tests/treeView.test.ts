import type { LangiumParser } from 'langium';
import { describe, expect, it } from 'vitest';
import type { TreeView } from '../src/language/generated/ast.js';
import { createTreeViewServices } from '../src/language/treeView/module.js';
import { expectNoErrorsOrAlternatives } from './test-util.js';

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

    it('should parse a treeView with a quoted root node', () => {
      const result = parse('treeView-beta\n"Root"');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe('TreeView');
      expect(result.value.nodes).toHaveLength(1);
      expect(result.value.nodes[0].nodeContent).toBe('"Root"');
      expect(result.value.nodes[0].indent).toBe(undefined);
    });

    it('should parse a treeView with multiple words within a quoted node', () => {
      const result = parse('treeView-beta\n"Multi Word Root"');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe('TreeView');
      expect(result.value.nodes).toHaveLength(1);
      expect(result.value.nodes[0].nodeContent).toBe('"Multi Word Root"');
      expect(result.value.nodes[0].indent).toBe(undefined);
    });

    it('should parse a treeView with child nodes', () => {
      const result = parse(`treeView-beta\n"Root"\n    "Child1"\n    "Child2"\n        "Child3"`);
      expectNoErrorsOrAlternatives(result);
      expect(result.value.$type).toBe('TreeView');
      expect(result.value.nodes).toHaveLength(4);

      expect(result.value.nodes[0].nodeContent).toBe('"Root"');
      expect(result.value.nodes[0].indent).toBe(undefined);

      expect(result.value.nodes[1].nodeContent).toBe('"Child1"');
      expect(result.value.nodes[1].indent).toBe(4);

      expect(result.value.nodes[2].nodeContent).toBe('"Child2"');
      expect(result.value.nodes[2].indent).toBe(4);

      expect(result.value.nodes[3].nodeContent).toBe('"Child3"');
      expect(result.value.nodes[3].indent).toBe(8);
    });

    it('should parse bare (unquoted) labels', () => {
      const result = parse('treeView-beta\nindex.js');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes).toHaveLength(1);
      expect(result.value.nodes[0].nodeContent).toBe('index.js');
    });

    it('should parse bare labels with directory trailing slash', () => {
      const result = parse('treeView-beta\nsrc/\n    index.js');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes).toHaveLength(2);
      expect(result.value.nodes[0].nodeContent).toBe('src/');
      expect(result.value.nodes[1].nodeContent).toBe('index.js');
      expect(result.value.nodes[1].indent).toBe(4);
    });

    it('should parse bare labels with annotations', () => {
      const result = parse('treeView-beta\nindex.js :::highlight icon(javascript) ## entry point');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes).toHaveLength(1);
      expect(result.value.nodes[0].nodeContent).toBe(
        'index.js :::highlight icon(javascript) ## entry point'
      );
    });

    it('should parse quoted labels with annotations', () => {
      const result = parse(
        'treeView-beta\n"my file.js" :::highlight icon(javascript) ## entry point'
      );
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes).toHaveLength(1);
      expect(result.value.nodes[0].nodeContent).toBe(
        '"my file.js" :::highlight icon(javascript) ## entry point'
      );
    });

    it('should handle %% comments', () => {
      const result = parse('treeView-beta\n%% this is a comment\nindex.js');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes).toHaveLength(1);
      expect(result.value.nodes[0].nodeContent).toBe('index.js');
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
