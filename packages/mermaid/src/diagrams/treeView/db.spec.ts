import { describe, expect, it, beforeEach } from 'vitest';
import db from './db.js';

describe('treeView db', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('clear', () => {
    it('should reset state to initial root', () => {
      db.addNode(0, 'file.ts', 'file');
      db.clear();
      const root = db.getRoot();
      expect(root.children).toHaveLength(0);
      expect(root.name).toBe('/');
      expect(root.level).toBe(-1);
    });
  });

  describe('getRoot', () => {
    it('should return a root node at level -1', () => {
      const root = db.getRoot();
      expect(root.level).toBe(-1);
      expect(root.nodeType).toBe('directory');
      expect(root.children).toHaveLength(0);
    });
  });

  describe('getCount', () => {
    it('should start at 1', () => {
      expect(db.getCount()).toBe(1);
    });

    it('should increment with each added node', () => {
      db.addNode(0, 'file1.ts', 'file');
      expect(db.getCount()).toBe(2);
      db.addNode(0, 'file2.ts', 'file');
      expect(db.getCount()).toBe(3);
    });
  });

  describe('addNode', () => {
    it('should add a child to root at level 0', () => {
      db.addNode(0, 'index.ts', 'file');
      const root = db.getRoot();
      expect(root.children).toHaveLength(1);
      expect(root.children[0].name).toBe('index.ts');
      expect(root.children[0].nodeType).toBe('file');
      expect(root.children[0].level).toBe(0);
    });

    it('should add nested children using increasing levels', () => {
      db.addNode(0, 'src', 'directory');
      db.addNode(4, 'index.ts', 'file');
      const root = db.getRoot();
      expect(root.children).toHaveLength(1);
      expect(root.children[0].name).toBe('src');
      expect(root.children[0].children).toHaveLength(1);
      expect(root.children[0].children[0].name).toBe('index.ts');
    });

    it('should pop stack when level decreases', () => {
      db.addNode(0, 'src', 'directory');
      db.addNode(4, 'index.ts', 'file');
      db.addNode(0, 'README.md', 'file');
      const root = db.getRoot();
      expect(root.children).toHaveLength(2);
      expect(root.children[0].name).toBe('src');
      expect(root.children[1].name).toBe('README.md');
    });

    it('should add siblings at the same level', () => {
      db.addNode(0, 'file1.ts', 'file');
      db.addNode(0, 'file2.ts', 'file');
      db.addNode(0, 'file3.ts', 'file');
      const root = db.getRoot();
      expect(root.children).toHaveLength(3);
    });

    it('should store cssClass', () => {
      db.addNode(0, 'app.ts', 'file', 'highlight');
      const root = db.getRoot();
      expect(root.children[0].cssClass).toBe('highlight');
    });

    it('should store iconId', () => {
      db.addNode(0, 'data.bin', 'file', undefined, 'database');
      const root = db.getRoot();
      expect(root.children[0].iconId).toBe('database');
    });

    it('should store description', () => {
      db.addNode(0, 'index.ts', 'file', undefined, undefined, 'entry point');
      const root = db.getRoot();
      expect(root.children[0].description).toBe('entry point');
    });

    it('should store all optional fields together', () => {
      db.addNode(0, 'App.tsx', 'file', 'highlight', 'react', 'main component');
      const root = db.getRoot();
      const node = root.children[0];
      expect(node.name).toBe('App.tsx');
      expect(node.cssClass).toBe('highlight');
      expect(node.iconId).toBe('react');
      expect(node.description).toBe('main component');
    });

    it('should build a deep tree', () => {
      db.addNode(0, 'src', 'directory');
      db.addNode(4, 'components', 'directory');
      db.addNode(8, 'Button.tsx', 'file');
      db.addNode(8, 'Header.tsx', 'file');
      db.addNode(4, 'utils', 'directory');
      db.addNode(8, 'helpers.ts', 'file');
      const root = db.getRoot();
      expect(root.children[0].children[0].children).toHaveLength(2);
      expect(root.children[0].children[1].name).toBe('utils');
      expect(root.children[0].children[1].children[0].name).toBe('helpers.ts');
    });

    it('should assign unique incrementing ids', () => {
      db.addNode(0, 'a', 'file');
      db.addNode(0, 'b', 'file');
      db.addNode(0, 'c', 'file');
      const root = db.getRoot();
      const ids = root.children.map((n) => n.id);
      expect(ids).toEqual([1, 2, 3]);
    });
  });

  describe('getConfig', () => {
    it('should return a config object with required fields', () => {
      const config = db.getConfig();
      expect(config).toBeDefined();
      expect(typeof config.paddingX).toBe('number');
      expect(typeof config.paddingY).toBe('number');
      expect(typeof config.rowIndent).toBe('number');
      expect(typeof config.lineThickness).toBe('number');
    });
  });

  describe('accessibility', () => {
    it('should set and get accTitle', () => {
      db.setAccTitle('My Tree');
      expect(db.getAccTitle()).toBe('My Tree');
    });

    it('should set and get accDescription', () => {
      db.setAccDescription('A file tree');
      expect(db.getAccDescription()).toBe('A file tree');
    });

    it('should set and get diagram title', () => {
      db.setDiagramTitle('File Structure');
      expect(db.getDiagramTitle()).toBe('File Structure');
    });
  });
});
