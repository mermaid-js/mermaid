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
      expect(result.value.nodes[0].name).toBe('Root');
      expect(result.value.nodes[0].indent).toBe(undefined);
    });

    it('should parse a treeView with multiple words within a quoted node', () => {
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

    it('should parse bare (unquoted) labels', () => {
      const result = parse('treeView-beta\nindex.js');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes).toHaveLength(1);
      expect(result.value.nodes[0].name).toBe('index.js');
    });

    it('should parse bare labels with directory trailing slash', () => {
      const result = parse('treeView-beta\nsrc/\n    index.js');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes).toHaveLength(2);
      expect(result.value.nodes[0].name).toBe('src/');
      expect(result.value.nodes[1].name).toBe('index.js');
      expect(result.value.nodes[1].indent).toBe(4);
    });

    it('should parse bare labels with annotations', () => {
      const result = parse('treeView-beta\nindex.js :::highlight icon(javascript) ## entry point');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes).toHaveLength(1);
      const node = result.value.nodes[0];
      expect(node.name).toBe('index.js');
      expect(node.classAnnotation).toBe('highlight');
      expect(node.iconAnnotation).toBe('javascript');
      expect(node.descAnnotation).toBe('entry point');
    });

    it('should parse quoted labels with annotations', () => {
      const result = parse(
        'treeView-beta\n"my file.js" :::highlight icon(javascript) ## entry point'
      );
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes).toHaveLength(1);
      const node = result.value.nodes[0];
      expect(node.name).toBe('my file.js');
      expect(node.classAnnotation).toBe('highlight');
      expect(node.iconAnnotation).toBe('javascript');
      expect(node.descAnnotation).toBe('entry point');
    });

    it('should handle %% comments', () => {
      const result = parse('treeView-beta\n%% this is a comment\nindex.js');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes).toHaveLength(1);
      expect(result.value.nodes[0].name).toBe('index.js');
    });
  });

  describe('Structured terminals', () => {
    it('should strip quotes from QUOTED_NAME', () => {
      const result = parse('treeView-beta\n"my file.js"');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes[0].name).toBe('my file.js');
    });

    it('should strip single quotes from QUOTED_NAME', () => {
      const result = parse("treeView-beta\n'my folder/'");
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes[0].name).toBe('my folder/');
    });

    it('should extract class name from CLASS_ANNOTATION', () => {
      const result = parse('treeView-beta\nindex.js :::highlight');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes[0].classAnnotation).toBe('highlight');
    });

    it('should handle class names with hyphens', () => {
      const result = parse('treeView-beta\nfile.ts :::my-class');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes[0].classAnnotation).toBe('my-class');
    });

    it('should extract icon name from ICON_ANNOTATION', () => {
      const result = parse('treeView-beta\ndata.bin icon(database)');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes[0].iconAnnotation).toBe('database');
    });

    it('should handle empty icon()', () => {
      const result = parse('treeView-beta\nindex.js icon()');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes[0].iconAnnotation).toBe('');
    });

    it('should extract description from DESC_ANNOTATION', () => {
      const result = parse('treeView-beta\nindex.js ## entry point');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes[0].descAnnotation).toBe('entry point');
    });

    it('should handle all annotations in any order', () => {
      const result = parse('treeView-beta\napp.ts icon(none) :::highlight ## entry point');
      expectNoErrorsOrAlternatives(result);
      const node = result.value.nodes[0];
      expect(node.name).toBe('app.ts');
      expect(node.iconAnnotation).toBe('none');
      expect(node.classAnnotation).toBe('highlight');
      expect(node.descAnnotation).toBe('entry point');
    });

    it('should parse bare names with spaces before annotations', () => {
      const result = parse('treeView-beta\nMy Documents/ :::highlight');
      expectNoErrorsOrAlternatives(result);
      const node = result.value.nodes[0];
      expect(node.name).toBe('My Documents/');
      expect(node.classAnnotation).toBe('highlight');
    });

    it('should parse dotfiles', () => {
      const result = parse('treeView-beta\n.gitignore');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes[0].name).toBe('.gitignore');
    });

    it('should parse filenames with hyphens', () => {
      const result = parse('treeView-beta\ndocker-compose.yml');
      expectNoErrorsOrAlternatives(result);
      expect(result.value.nodes[0].name).toBe('docker-compose.yml');
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
