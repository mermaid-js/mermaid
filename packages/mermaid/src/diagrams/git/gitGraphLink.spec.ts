import { db } from './gitGraphAst.js';
import { parser } from './gitGraphParser.js';

describe('gitGraph parser - click statements', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('basic click syntax', () => {
    it('should parse click with url', async () => {
      await parser.parse(`        gitGraph
          commit id: "c1"
          click "c1" "https://example.com"
      `);
      expect(db.getLink('c1')).toBeDefined();
      expect(db.getLink('c1')?.link).toBe('https://example.com');
    });

    it('should parse click with tooltip', async () => {
      await parser.parse(`        gitGraph
          commit id: "c1"
          click "c1" "https://example.com" "Tooltip text"
      `);
      expect(db.getLink('c1')?.tooltip).toBe('Tooltip text');
    });

    it('should parse click with target _blank', async () => {
      await parser.parse(`        gitGraph
          commit id: "c1"
          click "c1" "https://example.com" _blank
      `);
      expect(db.getLink('c1')?.target).toBe('_blank');
    });

    it('should parse click with target _self', async () => {
      await parser.parse(`        gitGraph
          commit id: "c1"
          click "c1" "https://example.com" _self
      `);
      expect(db.getLink('c1')?.target).toBe('_self');
    });

    it('should parse click with target _parent', async () => {
      await parser.parse(`        gitGraph
          commit id: "c1"
          click "c1" "https://example.com" _parent
      `);
      expect(db.getLink('c1')?.target).toBe('_parent');
    });

    it('should parse click with target _top', async () => {
      await parser.parse(`        gitGraph
          commit id: "c1"
          click "c1" "https://example.com" _top
      `);
      expect(db.getLink('c1')?.target).toBe('_top');
    });

    it('should parse click with tooltip and target', async () => {
      await parser.parse(`        gitGraph
          commit id: "c1"
          click "c1" "https://example.com" "Tooltip" _blank
      `);
      const link = db.getLink('c1');
      expect(link?.tooltip).toBe('Tooltip');
      expect(link?.target).toBe('_blank');
    });
  });

  describe('multiple clicks', () => {
    it('should parse multiple click statements', async () => {
      await parser.parse(`        gitGraph
          commit id: "c1"
          commit id: "c2"
          commit id: "c3"
          click "c1" "https://example.com/1"
          click "c2" "https://example.com/2"
          click "c3" "https://example.com/3"
      `);
      expect(db.getLinks().size).toBe(3);
    });

    it('should allow click to overwrite previous click', async () => {
      await parser.parse(`        gitGraph
          commit id: "c1"
          click "c1" "https://old.com"
          click "c1" "https://new.com"
      `);
      expect(db.getLink('c1')?.link).toBe('https://new.com');
    });
  });

  describe('edge cases', () => {
    it('should handle URLs with special characters', async () => {
      await parser.parse(`        gitGraph
          commit id: "c1"
          click "c1" "https://example.com/path?query=value&other=123"
      `);
      expect(db.getLink('c1')?.link).toBe('https://example.com/path?query=value&other=123');
    });

    it('should handle commit IDs with special characters', async () => {
      await parser.parse(`        gitGraph
          commit id: "v1.0.0-beta.1"
          click "v1.0.0-beta.1" "https://example.com"
      `);
      expect(db.getLink('v1.0.0-beta.1')).toBeDefined();
    });

    it('should work with branches', async () => {
      await parser.parse(`        gitGraph
          commit id: "init"
          branch feature
          commit id: "feat"
          click "feat" "https://example.com"
          checkout main
          merge feature
      `);
      expect(db.getLink('feat')).toBeDefined();
    });

    it('should work with merge commits', async () => {
      await parser.parse(`        gitGraph
          commit id: "init"
          branch feature
          commit id: "feat"
          checkout main
          merge feature id: "merge"
          click "merge" "https://example.com"
      `);
      expect(db.getLink('merge')).toBeDefined();
    });
  });
});
