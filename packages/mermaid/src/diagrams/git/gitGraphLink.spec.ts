import { db } from './gitGraphAst.js';
import { parser } from './gitGraphParser.js';

describe('gitGraph parser - click statements', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('basic click syntax', () => {
    it('should parse click with url', async () => {
      await parser.parse(`
        gitGraph
          commit id: "c1"
          click "c1" "https://example.com"
      `);
      const link = db.getLink('c1');
      expect(link).toBeDefined();
      expect(link!.link).toBe('https://example.com');
    });

    it('should parse click with tooltip', async () => {
      await parser.parse(`
        gitGraph
          commit id: "c1"
          click "c1" "https://example.com" "Tooltip text"
      `);
      const link = db.getLink('c1');
      expect(link).toBeDefined();
      expect(link!.tooltip).toBe('Tooltip text');
    });

    it.each(['_blank', '_self', '_parent', '_top'])(
      'should parse click with target %s',
      async (target) => {
        await parser.parse(`
        gitGraph
          commit id: "c1"
          click "c1" "https://example.com" ${target}
      `);
        const link = db.getLink('c1');
        expect(link).toBeDefined();
        expect(link!.target).toBe(target);
      }
    );

    it('should parse click with tooltip and target', async () => {
      await parser.parse(`
        gitGraph
          commit id: "c1"
          click "c1" "https://example.com" "Tooltip" _blank
      `);
      const link = db.getLink('c1');
      expect(link).toBeDefined();
      expect(link!.tooltip).toBe('Tooltip');
      expect(link!.target).toBe('_blank');
    });
  });

  describe('multiple clicks', () => {
    it('should parse multiple click statements', async () => {
      await parser.parse(`
        gitGraph
          commit id: "c1"
          commit id: "c2"
          commit id: "c3"
          click "c1" "https://example.com/1"
          click "c2" "https://example.com/2"
          click "c3" "https://example.com/3"
      `);
      expect(db.getLinks().size).toBe(3);
      expect(db.getLink('c1')!.link).toBe('https://example.com/1');
      expect(db.getLink('c2')!.link).toBe('https://example.com/2');
      expect(db.getLink('c3')!.link).toBe('https://example.com/3');
    });

    it('should allow click to overwrite previous click', async () => {
      await parser.parse(`
        gitGraph
          commit id: "c1"
          click "c1" "https://old.com"
          click "c1" "https://new.com"
      `);
      const link = db.getLink('c1');
      expect(link).toBeDefined();
      expect(link!.link).toBe('https://new.com');
    });
  });

  describe('edge cases', () => {
    it('should handle URLs with special characters', async () => {
      await parser.parse(`
        gitGraph
          commit id: "c1"
          click "c1" "https://example.com/path?query=value&other=123"
      `);
      const link = db.getLink('c1');
      expect(link).toBeDefined();
      expect(link!.link).toBe('https://example.com/path?query=value&other=123');
    });

    it('should handle commit IDs with special characters', async () => {
      await parser.parse(`
        gitGraph
          commit id: "v1.0.0-beta.1"
          click "v1.0.0-beta.1" "https://example.com"
      `);
      const link = db.getLink('v1.0.0-beta.1');
      expect(link).toBeDefined();
      expect(link!.link).toBe('https://example.com');
    });

    it('should work with branches', async () => {
      await parser.parse(`
        gitGraph
          commit id: "init"
          branch feature
          commit id: "feat"
          click "feat" "https://example.com"
          checkout main
          merge feature
      `);
      const link = db.getLink('feat');
      expect(link).toBeDefined();
      expect(link!.link).toBe('https://example.com');
    });

    it('should work with merge commits', async () => {
      await parser.parse(`
        gitGraph
          commit id: "init"
          branch feature
          commit id: "feat"
          checkout main
          merge feature id: "merge"
          click "merge" "https://example.com"
      `);
      const link = db.getLink('merge');
      expect(link).toBeDefined();
      expect(link!.link).toBe('https://example.com');
    });
  });
});
