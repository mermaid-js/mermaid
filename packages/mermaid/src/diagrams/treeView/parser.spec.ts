import { describe, expect, it, beforeEach } from 'vitest';
import { parser } from './parser.js';
import db from './db.js';

/**
 * Integration tests for the treeView parser pipeline.
 *
 * Tests the full flow: Langium grammar → value converter → populate() → db.
 * Previously these tested parseNodeContent() directly; now parsing is handled
 * by the Langium grammar with structured terminals.
 */

/** Helper: parse input and return the root's first child node from db */
async function parseAndGetNode(line: string, index = 0) {
  db.clear();
  await parser.parse(`treeView-beta\n${line}`);
  const root = db.getRoot();
  return root.children[index];
}

describe('treeView parser integration', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('bare labels', () => {
    it('should parse a simple filename', async () => {
      const node = await parseAndGetNode('index.js');
      expect(node.name).toBe('index.js');
      expect(node.nodeType).toBe('file');
    });

    it('should detect directory from trailing slash', async () => {
      const node = await parseAndGetNode('src/');
      expect(node.name).toBe('src');
      expect(node.nodeType).toBe('directory');
      expect(node.iconId).toBe('folder');
    });

    it('should parse dotfiles', async () => {
      const node = await parseAndGetNode('.gitignore');
      expect(node.name).toBe('.gitignore');
      expect(node.nodeType).toBe('file');
      expect(node.iconId).toBe('git');
    });

    it('should parse filenames with hyphens', async () => {
      const node = await parseAndGetNode('docker-compose.yml');
      expect(node.name).toBe('docker-compose.yml');
      expect(node.iconId).toBe('docker');
    });
  });

  describe('quoted labels', () => {
    it('should strip double quotes', async () => {
      const node = await parseAndGetNode('"my file.js"');
      expect(node.name).toBe('my file.js');
      expect(node.nodeType).toBe('file');
    });

    it('should strip single quotes', async () => {
      const node = await parseAndGetNode("'my folder/'");
      expect(node.name).toBe('my folder');
      expect(node.nodeType).toBe('directory');
    });

    it('should handle empty quoted string', async () => {
      const node = await parseAndGetNode('""');
      expect(node.name).toBe('');
    });
  });

  describe(':::class annotation', () => {
    it('should extract class from bare label', async () => {
      const node = await parseAndGetNode('index.js :::highlight');
      expect(node.name).toBe('index.js');
      expect(node.cssClass).toBe('highlight');
    });

    it('should extract class from quoted label', async () => {
      const node = await parseAndGetNode('"my file.js" :::important');
      expect(node.name).toBe('my file.js');
      expect(node.cssClass).toBe('important');
    });

    it('should handle class with hyphens', async () => {
      const node = await parseAndGetNode('file.ts :::my-class');
      expect(node.cssClass).toBe('my-class');
    });
  });

  describe('icon() annotation', () => {
    it('should extract icon override', async () => {
      const node = await parseAndGetNode('data.bin icon(database)');
      expect(node.name).toBe('data.bin');
      expect(node.iconId).toBe('database');
    });

    it('should override auto-detected icon', async () => {
      const node = await parseAndGetNode('config.json icon(config)');
      expect(node.name).toBe('config.json');
      expect(node.iconId).toBe('config');
    });
  });

  describe('## description', () => {
    it('should extract description from bare label', async () => {
      const node = await parseAndGetNode('index.js ## entry point');
      expect(node.name).toBe('index.js');
      expect(node.description).toBe('entry point');
    });

    it('should extract description from quoted label', async () => {
      const node = await parseAndGetNode('"my file.js" ## the main file');
      expect(node.name).toBe('my file.js');
      expect(node.description).toBe('the main file');
    });

    it('should handle description with no text after ##', async () => {
      const node = await parseAndGetNode('file.txt ##');
      expect(node.name).toBe('file.txt');
      expect(node.description).toBeUndefined();
    });
  });

  describe('combined annotations', () => {
    it('should handle all annotations together', async () => {
      const node = await parseAndGetNode('App.tsx :::highlight icon(react) ## main component');
      expect(node.name).toBe('App.tsx');
      expect(node.cssClass).toBe('highlight');
      expect(node.iconId).toBe('react');
      expect(node.description).toBe('main component');
    });

    it('should handle quoted label with all annotations', async () => {
      const node = await parseAndGetNode('"my app.tsx" :::highlight icon(react) ## main component');
      expect(node.name).toBe('my app.tsx');
      expect(node.cssClass).toBe('highlight');
      expect(node.iconId).toBe('react');
      expect(node.description).toBe('main component');
    });

    it('should handle directory with class', async () => {
      const node = await parseAndGetNode('src/ :::highlight');
      expect(node.name).toBe('src');
      expect(node.nodeType).toBe('directory');
      expect(node.cssClass).toBe('highlight');
      expect(node.iconId).toBe('folder');
    });
  });

  describe('bare labels with spaces', () => {
    it('should handle folder names with spaces', async () => {
      const node = await parseAndGetNode('My Documents/');
      expect(node.name).toBe('My Documents');
      expect(node.nodeType).toBe('directory');
      expect(node.iconId).toBe('folder');
    });

    it('should handle folder names with spaces and annotations', async () => {
      const node = await parseAndGetNode('My Documents/ :::highlight');
      expect(node.name).toBe('My Documents');
      expect(node.nodeType).toBe('directory');
      expect(node.cssClass).toBe('highlight');
    });

    it('should handle file names with spaces', async () => {
      const node = await parseAndGetNode('my file.ts ## some description');
      expect(node.name).toBe('my file.ts');
      expect(node.nodeType).toBe('file');
      expect(node.iconId).toBe('typescript');
      expect(node.description).toBe('some description');
    });
  });

  describe('icon auto-detection', () => {
    it('should auto-detect TypeScript icon', async () => {
      const node = await parseAndGetNode('utils.ts');
      expect(node.iconId).toBe('typescript');
    });

    it('should auto-detect Python icon', async () => {
      const node = await parseAndGetNode('main.py');
      expect(node.iconId).toBe('python');
    });

    it('should auto-detect Markdown icon', async () => {
      const node = await parseAndGetNode('README.md');
      expect(node.iconId).toBe('markdown');
    });

    it('should fall back to generic file icon', async () => {
      const node = await parseAndGetNode('unknown.xyz');
      expect(node.iconId).toBe('file');
    });

    it('should use folder icon for directories', async () => {
      const node = await parseAndGetNode('components/');
      expect(node.iconId).toBe('folder');
    });
  });

  describe('icon suppression', () => {
    it('should set iconId to none for icon(none)', async () => {
      const node = await parseAndGetNode('index.js icon(none)');
      expect(node.name).toBe('index.js');
      expect(node.iconId).toBe('none');
    });

    it('should set iconId to none for empty icon()', async () => {
      const node = await parseAndGetNode('index.js icon()');
      expect(node.name).toBe('index.js');
      expect(node.iconId).toBe('none');
    });

    it('should suppress icon on a directory', async () => {
      const node = await parseAndGetNode('src/ icon(none)');
      expect(node.name).toBe('src');
      expect(node.nodeType).toBe('directory');
      expect(node.iconId).toBe('none');
    });

    it('should combine icon(none) with other annotations', async () => {
      const node = await parseAndGetNode('app.ts icon(none) :::highlight ## entry point');
      expect(node.name).toBe('app.ts');
      expect(node.iconId).toBe('none');
      expect(node.cssClass).toBe('highlight');
      expect(node.description).toBe('entry point');
    });
  });
});
