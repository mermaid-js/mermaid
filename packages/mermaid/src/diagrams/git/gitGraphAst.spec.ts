import { db, clear } from './gitGraphAst.js';
import type { GitGraphLink } from './gitGraphTypes.js';

describe('gitGraphAst', () => {
  beforeEach(() => {
    clear();
  });

  it('should store and retrieve links', () => {
    const link: GitGraphLink = {
      id: 'c1',
      link: 'https://example.com',
      tooltip: 'Example Tooltip',
      target: '_blank',
    };

    db.setLink(link.id, link.link, link.tooltip, link.target);

    const links = db.getLinks();
    expect(links.size).toBe(1);
    expect(links.get('c1')).toEqual(link);

    const retrievedLink = db.getLink('c1');
    expect(retrievedLink).toEqual(link);
  });

  it('should handle default target', () => {
    db.setLink('c2', 'https://example.com/2');

    const link = db.getLink('c2');
    expect(link).toBeDefined();
    expect(link?.target).toBe('_self');
  });

  it('should clear links on clear()', () => {
    db.setLink('c1', 'https://example.com');

    clear();

    const links = db.getLinks();
    expect(links.size).toBe(0);
  });

  it('getLinks should return a defensive copy', () => {
    db.setLink('c1', 'https://example.com');

    const links1 = db.getLinks();
    links1.set('c2', { id: 'c2', link: 'foo', target: '_self' });

    const links2 = db.getLinks();
    expect(links2.has('c2')).toBe(false);
  });
});
