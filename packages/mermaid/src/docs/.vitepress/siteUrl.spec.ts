import { describe, expect, it } from 'vitest';
import { getDocsHostname, getPageUrl, getSiteBase, getSiteUrl } from './siteUrl.js';

describe('getSiteUrl', () => {
  it('defaults to mermaid.js.org', () => {
    expect(getSiteUrl({})).toBe('https://mermaid.js.org/');
  });

  it('treats an empty DOCS_SITE_URL as unset', () => {
    expect(getSiteUrl({ DOCS_SITE_URL: '' })).toBe('https://mermaid.js.org/');
  });

  it('reads DOCS_SITE_URL and adds a trailing slash', () => {
    expect(getSiteUrl({ DOCS_SITE_URL: 'https://mermaid.ai/open-source' })).toBe(
      'https://mermaid.ai/open-source/'
    );
  });

  it('rejects a value that is not an absolute URL', () => {
    expect(() => getSiteUrl({ DOCS_SITE_URL: 'mermaid.ai/open-source' })).toThrow(/DOCS_SITE_URL/);
  });
});

describe('getSiteBase', () => {
  it.each([
    ['https://mermaid.js.org/', '/'],
    ['https://mermaid.ai/open-source/', '/open-source/'],
  ])('uses the path of %s', (siteUrl, base) => {
    expect(getSiteBase(siteUrl)).toBe(base);
  });
});

describe('getDocsHostname', () => {
  it('uses the host of the site URL', () => {
    expect(getDocsHostname({ DOCS_SITE_URL: 'https://mermaid.ai/open-source/' })).toBe(
      'mermaid.ai'
    );
    expect(getDocsHostname({})).toBe('mermaid.js.org');
  });

  it('prefers DOCS_HOSTNAME when set', () => {
    expect(getDocsHostname({ DOCS_HOSTNAME: 'mermaid.ai' })).toBe('mermaid.ai');
  });

  it('ignores an empty DOCS_HOSTNAME', () => {
    expect(getDocsHostname({ DOCS_HOSTNAME: '' })).toBe('mermaid.js.org');
  });
});

describe('getPageUrl', () => {
  it.each([
    ['index.md', 'https://mermaid.js.org/'],
    ['intro/index.md', 'https://mermaid.js.org/intro/'],
    ['syntax/pie.md', 'https://mermaid.js.org/syntax/pie.html'],
  ])('maps %s to %s', (relativePath, url) => {
    expect(getPageUrl(relativePath, 'https://mermaid.js.org/')).toBe(url);
  });

  it('keeps the base path of the site URL', () => {
    expect(getPageUrl('syntax/pie.md', 'https://mermaid.ai/open-source/')).toBe(
      'https://mermaid.ai/open-source/syntax/pie.html'
    );
  });
});
