import { db, clear } from './gitGraphAst.js';

describe('gitGraph links', () => {
  beforeEach(() => {
    clear();
  });

  describe('setLink', () => {
    it('should store a basic link', () => {
      db.setLink('commit1', 'https://example.com');
      expect(db.getLinks().has('commit1')).toBe(true);
      expect(db.getLink('commit1')?.link).toBe('https://example.com');
    });

    it('should default target to _self', () => {
      db.setLink('commit1', 'https://example.com');
      expect(db.getLink('commit1')?.target).toBe('_self');
    });

    it('should store tooltip when provided', () => {
      db.setLink('commit1', 'https://example.com', 'My tooltip');
      expect(db.getLink('commit1')?.tooltip).toBe('My tooltip');
    });

    it('should store target when provided', () => {
      db.setLink('commit1', 'https://example.com', undefined, '_blank');
      expect(db.getLink('commit1')?.target).toBe('_blank');
    });

    it('should store all options together', () => {
      db.setLink('commit1', 'https://example.com', 'Tooltip', '_blank');
      const link = db.getLink('commit1');
      expect(link?.link).toBe('https://example.com');
      expect(link?.tooltip).toBe('Tooltip');
      expect(link?.target).toBe('_blank');
    });

    it('should overwrite existing link for same id', () => {
      db.setLink('commit1', 'https://old.com');
      db.setLink('commit1', 'https://new.com');
      expect(db.getLink('commit1')?.link).toBe('https://new.com');
    });

    it('should handle special characters in commit id', () => {
      db.setLink('v1.0.0-beta', 'https://example.com');
      expect(db.getLink('v1.0.0-beta')?.link).toBe('https://example.com');
    });
  });

  describe('getLinks', () => {
    it('should return empty map when no links', () => {
      expect(db.getLinks().size).toBe(0);
    });

    it('should return all stored links', () => {
      db.setLink('c1', 'https://example.com/1');
      db.setLink('c2', 'https://example.com/2');
      const links = db.getLinks();
      expect(links.size).toBe(2);
      expect(links.has('c1')).toBe(true);
      expect(links.has('c2')).toBe(true);
    });

    it('should return a copy (not original map)', () => {
      db.setLink('c1', 'https://example.com');
      const links1 = db.getLinks();
      const links2 = db.getLinks();
      expect(links1).not.toBe(links2);
    });
  });

  describe('getLink', () => {
    it('should return undefined for non-existent id', () => {
      expect(db.getLink('nonexistent')).toBeUndefined();
    });

    it('should return link data for existing id', () => {
      db.setLink('c1', 'https://example.com');
      const link = db.getLink('c1');
      expect(link).toBeDefined();
      expect(link?.id).toBe('c1');
    });
  });

  describe('clear', () => {
    it('should clear all links', () => {
      db.setLink('c1', 'https://example.com');
      db.setLink('c2', 'https://example.com');
      clear();
      expect(db.getLinks().size).toBe(0);
    });
  });
});
