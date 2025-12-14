import { db } from './gitGraphAst.js';
import { describe, it, expect, beforeEach } from 'vitest';

describe('gitGraphAst', () => {
  beforeEach(() => {
    db.clear();
  });

  describe('Link Management', () => {
    it('should set and get a link', () => {
      db.setLink('commit1', 'https://example.com');
      const link = db.getLink('commit1');
      expect(link).toBeDefined();
      expect(link?.id).toBe('commit1');
      expect(link?.link).toBe('https://example.com/');
      expect(link?.target).toBe('_self'); // Default target
    });

    it('should set a link with tooltip and target', () => {
      db.setLink('commit2', 'https://example.com/2', 'Tooltip', '_blank');
      const link = db.getLink('commit2');
      expect(link?.tooltip).toBe('Tooltip');
      expect(link?.target).toBe('_blank');
    });

    it('should overwrite existing link', () => {
      db.setLink('commit1', 'https://example.com');
      db.setLink('commit1', 'https://updated.com');
      const link = db.getLink('commit1');
      expect(link?.link).toBe('https://updated.com/');
    });

    it('should get all links', () => {
      db.setLink('c1', 'l1');
      db.setLink('c2', 'l2');
      const links = db.getLinks();
      expect(links.size).toBe(2);
      expect(links.get('c1')?.link).toBe('l1');
    });

    it('should clear links', () => {
      db.setLink('c1', 'l1');
      db.clear();
      expect(db.getLinks().size).toBe(0);
    });
  });
});
