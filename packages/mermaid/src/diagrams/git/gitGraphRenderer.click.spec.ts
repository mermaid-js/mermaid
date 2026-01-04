import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { select } from 'd3';
import { setConfig } from '../../config.js';
import { draw } from './gitGraphRenderer.js';
import { db, clear } from './gitGraphAst.js';
import { parser } from './gitGraphParser.js';

describe('GitGraph Click Events', () => {
  let container: HTMLDivElement;
  const mockDB = {
    ...db,
    getLinks: vi.fn(),
    getCommits: vi.fn(() => new Map()),
    getBranchesAsObjArray: vi.fn(() => []),
    getDirection: vi.fn(() => 'LR'),
    getDiagramTitle: vi.fn(() => ''),
  };

  beforeEach(() => {
    // Create a container in the DOM
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Reset mermaid config
    setConfig({ securityLevel: 'strict' });

    // Clear gitGraph state
    clear();

    // Mock SVG getBBox method (not implemented in jsdom)
    // @ts-ignore - jsdom doesn't implement getBBox
    Element.prototype.getBBox = vi.fn(() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 50,
    }));
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('SVG anchor element creation', () => {
    it('should create SVG <a> elements for commits with links', async () => {
      const diagram = `
        gitGraph
          commit id: "c1"
          click "c1" "https://github.com"
      `;

      await parser.parse(diagram);

      const svg = select(container).append('svg').attr('id', 'gitGraph-test');
      const diagObj = { db, type: 'gitGraph' };

      // @ts-ignore - partial diagram object for testing
      await draw(diagram, 'gitGraph-test', '1.0', diagObj);

      // Check that an <a> element was created
      const anchor = svg.select('a');
      expect(anchor.empty()).toBe(false);
      expect(anchor.attr('href')).toBe('https://github.com/');
      expect(anchor.attr('rel')).toBe('noopener');
    });

    it('should set target attribute based on link configuration', async () => {
      const diagram = `
        gitGraph
          commit id: "c1"
          click "c1" "https://github.com" _blank
      `;

      await parser.parse(diagram);

      const svg = select(container).append('svg').attr('id', 'gitGraph-test');
      const diagObj = { db, type: 'gitGraph' };

      // @ts-ignore - partial diagram object for testing
      await draw(diagram, 'gitGraph-test', '1.0', diagObj);

      const anchor = svg.select('a');
      expect(anchor.attr('target')).toBe('_blank');
    });

    it('should add tooltip as <title> element inside anchor', async () => {
      const diagram = `
        gitGraph
          commit id: "c1"
          click "c1" "https://github.com" "GitHub Homepage"
      `;

      await parser.parse(diagram);

      const svg = select(container).append('svg').attr('id', 'gitGraph-test');
      const diagObj = { db, type: 'gitGraph' };

      // @ts-ignore - partial diagram object for testing
      await draw(diagram, 'gitGraph-test', '1.0', diagObj);

      const title = svg.select('a title');
      expect(title.empty()).toBe(false);
      expect(title.text()).toBe('GitHub Homepage');
    });
  });

  describe('Multiple link types', () => {
    it('should handle commit links', async () => {
      const diagram = `
        gitGraph
          commit id: "abc123"
          click "abc123" "https://github.com/commit/abc123"
      `;

      await parser.parse(diagram);
      expect(db.getLink('abc123')?.type).toBe('commit');
    });

    it('should handle branch links', async () => {
      const diagram = `
        gitGraph
          branch develop
          click branch "develop" "https://github.com/tree/develop"
      `;

      await parser.parse(diagram);
      expect(db.getLink('develop')?.type).toBe('branch');
    });

    it('should handle tag links', async () => {
      const diagram = `
        gitGraph
          commit id: "c1" tag: "v1.0"
          click tag "v1.0" "https://github.com/releases/v1.0"
      `;

      await parser.parse(diagram);
      expect(db.getLink('v1.0')?.type).toBe('tag');
    });

    it('should handle multiple links of different types', async () => {
      const diagram = `
        gitGraph
          commit id: "c1" tag: "v1.0"
          branch develop
          click "c1" "https://github.com/commit/c1"
          click branch "develop" "https://github.com/tree/develop"
          click tag "v1.0" "https://github.com/releases/v1.0"
      `;

      await parser.parse(diagram);

      const links = db.getLinks();
      expect(links.size).toBe(3);
      expect(db.getLink('c1')?.type).toBe('commit');
      expect(db.getLink('develop')?.type).toBe('branch');
      expect(db.getLink('v1.0')?.type).toBe('tag');
    });
  });

  describe('URL sanitization', () => {
    it('should sanitize dangerous javascript: URLs', async () => {
      const diagram = `
        gitGraph
          commit id: "c1"
          click "c1" "javascript:alert('xss')"
      `;

      await parser.parse(diagram);

      const svg = select(container).append('svg').attr('id', 'gitGraph-test');
      const diagObj = { db, type: 'gitGraph' };

      // @ts-ignore - partial diagram object for testing
      await draw(diagram, 'gitGraph-test', '1.0', diagObj);

      // sanitizeUrl should block javascript: URLs
      const anchor = svg.select('a');
      expect(anchor.attr('href')).not.toContain('javascript:');
    });

    it('should allow valid https URLs', async () => {
      const diagram = `
        gitGraph
          commit id: "c1"
          click "c1" "https://github.com/user/repo"
      `;

      await parser.parse(diagram);

      const svg = select(container).append('svg').attr('id', 'gitGraph-test');
      const diagObj = { db, type: 'gitGraph' };

      // @ts-ignore - partial diagram object for testing
      await draw(diagram, 'gitGraph-test', '1.0', diagObj);

      const anchor = svg.select('a');
      expect(anchor.attr('href')).toBe('https://github.com/user/repo');
    });

    it('should allow valid http URLs', async () => {
      const diagram = `
        gitGraph
          commit id: "c1"
          click "c1" "http://example.com"
      `;

      await parser.parse(diagram);

      const svg = select(container).append('svg').attr('id', 'gitGraph-test');
      const diagObj = { db, type: 'gitGraph' };

      // @ts-ignore - partial diagram object for testing
      await draw(diagram, 'gitGraph-test', '1.0', diagObj);

      const anchor = svg.select('a');
      expect(anchor.attr('href')).toBe('http://example.com/');
    });
  });

  describe('Tooltip sanitization', () => {
    it('should sanitize HTML in tooltips', async () => {
      const diagram = `
        gitGraph
          commit id: "c1"
          click "c1" "https://github.com" "<script>alert('xss')</script>"
      `;

      await parser.parse(diagram);

      const svg = select(container).append('svg').attr('id', 'gitGraph-test');
      const diagObj = { db, type: 'gitGraph' };

      // @ts-ignore - partial diagram object for testing
      await draw(diagram, 'gitGraph-test', '1.0', diagObj);

      const title = svg.select('a title');
      expect(title.text()).not.toContain('<script>');
    });

    it('should preserve safe text in tooltips', async () => {
      const diagram = `
        gitGraph
          commit id: "c1"
          click "c1" "https://github.com" "Safe tooltip text"
      `;

      await parser.parse(diagram);

      const svg = select(container).append('svg').attr('id', 'gitGraph-test');
      const diagObj = { db, type: 'gitGraph' };

      // @ts-ignore - partial diagram object for testing
      await draw(diagram, 'gitGraph-test', '1.0', diagObj);

      const title = svg.select('a title');
      expect(title.text()).toBe('Safe tooltip text');
    });
  });

  describe('Special characters in IDs', () => {
    it('should handle commit IDs with special characters', async () => {
      const diagram = `
        gitGraph
          commit id: "v1.0.0-beta.1"
          click "v1.0.0-beta.1" "https://github.com"
      `;

      await parser.parse(diagram);
      expect(db.getLink('v1.0.0-beta.1')).toBeDefined();
    });

    it('should handle branch names with hyphens', async () => {
      const diagram = `
        gitGraph
          branch feature-login
          click branch "feature-login" "https://github.com"
      `;

      await parser.parse(diagram);
      expect(db.getLink('feature-login')).toBeDefined();
    });
  });

  describe('Link defaults', () => {
    it('should default target to _self when not specified', async () => {
      const diagram = `
        gitGraph
          commit id: "c1"
          click "c1" "https://github.com"
      `;

      await parser.parse(diagram);
      expect(db.getLink('c1')?.target).toBe('_self');
    });

    it('should default type to commit when not specified', async () => {
      const diagram = `
        gitGraph
          commit id: "c1"
          click "c1" "https://github.com"
      `;

      await parser.parse(diagram);
      expect(db.getLink('c1')?.type).toBe('commit');
    });
  });

  describe('Link overwriting', () => {
    it('should allow overwriting existing links', () => {
      db.setLink('c1', 'https://old-url.com');
      db.setLink('c1', 'https://new-url.com');

      expect(db.getLink('c1')?.link).toBe('https://new-url.com');
    });
  });
});
