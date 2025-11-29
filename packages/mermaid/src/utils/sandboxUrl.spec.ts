import { describe, expect, it } from 'vitest';
import { isAbsoluteUrl, resolveRelativeUrls } from './sandboxUrl.js';

describe('isAbsoluteUrl', () => {
  it('should return true for http:// URLs', () => {
    expect(isAbsoluteUrl('http://example.com')).toBe(true);
    expect(isAbsoluteUrl('http://example.com/page.html')).toBe(true);
  });

  it('should return true for https:// URLs', () => {
    expect(isAbsoluteUrl('https://example.com')).toBe(true);
    expect(isAbsoluteUrl('https://example.com/page.html')).toBe(true);
  });

  it('should return true for other protocol schemes', () => {
    expect(isAbsoluteUrl('mailto:user@example.com')).toBe(true);
    expect(isAbsoluteUrl('javascript:void(0)')).toBe(true);
    expect(isAbsoluteUrl('data:text/html,<h1>Hello</h1>')).toBe(true);
    expect(isAbsoluteUrl('ftp://example.com/file')).toBe(true);
  });

  it('should return true for protocol-relative URLs', () => {
    expect(isAbsoluteUrl('//example.com')).toBe(true);
    expect(isAbsoluteUrl('//cdn.example.com/resource.js')).toBe(true);
  });

  it('should return false for relative paths', () => {
    expect(isAbsoluteUrl('./page.html')).toBe(false);
    expect(isAbsoluteUrl('../other.html')).toBe(false);
    expect(isAbsoluteUrl('page.html')).toBe(false);
    expect(isAbsoluteUrl('folder/page.html')).toBe(false);
  });

  it('should return false for absolute paths (without protocol)', () => {
    expect(isAbsoluteUrl('/root.html')).toBe(false);
    expect(isAbsoluteUrl('/docs/guide.html')).toBe(false);
  });

  it('should return false for hash links', () => {
    expect(isAbsoluteUrl('#section')).toBe(false);
    expect(isAbsoluteUrl('#')).toBe(false);
  });
});

describe('resolveRelativeUrls', () => {
  const baseUrl = 'https://example.com/docs/diagrams/';

  it('should resolve relative paths (./) in href attributes', () => {
    const svg = '<svg><a href="./page.html">Link</a></svg>';
    const result = resolveRelativeUrls(svg, baseUrl);
    expect(result).toContain('href="https://example.com/docs/diagrams/page.html"');
  });

  it('should resolve relative paths (./) in xlink:href attributes', () => {
    const svg =
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="./page.html">Link</a></svg>';
    const result = resolveRelativeUrls(svg, baseUrl);
    expect(result).toContain('xlink:href="https://example.com/docs/diagrams/page.html"');
  });

  it('should resolve parent directory paths (../)', () => {
    const svg = '<svg><a href="../other.html">Link</a></svg>';
    const result = resolveRelativeUrls(svg, baseUrl);
    expect(result).toContain('href="https://example.com/docs/other.html"');
  });

  it('should resolve absolute paths (/)', () => {
    const svg = '<svg><a href="/root.html">Link</a></svg>';
    const result = resolveRelativeUrls(svg, baseUrl);
    expect(result).toContain('href="https://example.com/root.html"');
  });

  it('should resolve hash links against base URL', () => {
    const svg = '<svg><a href="#section">Link</a></svg>';
    const baseUrlWithFile = 'https://example.com/docs/index.html';
    const result = resolveRelativeUrls(svg, baseUrlWithFile);
    expect(result).toContain('href="https://example.com/docs/index.html#section"');
  });

  it('should not modify absolute URLs with http://', () => {
    const svg = '<svg><a href="http://other.com/page">Link</a></svg>';
    const result = resolveRelativeUrls(svg, baseUrl);
    expect(result).toContain('href="http://other.com/page"');
  });

  it('should not modify absolute URLs with https://', () => {
    const svg = '<svg><a href="https://other.com/page">Link</a></svg>';
    const result = resolveRelativeUrls(svg, baseUrl);
    expect(result).toContain('href="https://other.com/page"');
  });

  it('should not modify protocol-relative URLs', () => {
    const svg = '<svg><a href="//cdn.example.com/resource">Link</a></svg>';
    const result = resolveRelativeUrls(svg, baseUrl);
    expect(result).toContain('href="//cdn.example.com/resource"');
  });

  it('should not modify mailto: URLs', () => {
    const svg = '<svg><a href="mailto:user@example.com">Email</a></svg>';
    const result = resolveRelativeUrls(svg, baseUrl);
    expect(result).toContain('href="mailto:user@example.com"');
  });

  it('should not modify javascript: URLs', () => {
    const svg = '<svg><a href="javascript:void(0)">Link</a></svg>';
    const result = resolveRelativeUrls(svg, baseUrl);
    expect(result).toContain('href="javascript:void(0)"');
  });

  it('should handle both href and xlink:href in the same SVG', () => {
    const svg = `<svg xmlns:xlink="http://www.w3.org/1999/xlink">
      <a href="./a.html">A</a>
      <a xlink:href="./b.html">B</a>
    </svg>`;
    const result = resolveRelativeUrls(svg, baseUrl);
    expect(result).toContain('href="https://example.com/docs/diagrams/a.html"');
    expect(result).toContain('xlink:href="https://example.com/docs/diagrams/b.html"');
  });

  it('should handle multiple links with mixed URLs', () => {
    const svg = `<svg xmlns:xlink="http://www.w3.org/1999/xlink">
      <a href="./relative.html">Relative</a>
      <a href="https://absolute.com">Absolute</a>
      <a xlink:href="../parent.html">Parent</a>
      <a xlink:href="//protocol-relative.com">Protocol</a>
    </svg>`;
    const result = resolveRelativeUrls(svg, baseUrl);

    expect(result).toContain('href="https://example.com/docs/diagrams/relative.html"');
    expect(result).toContain('href="https://absolute.com"');
    expect(result).toContain('xlink:href="https://example.com/docs/parent.html"');
    expect(result).toContain('href="//protocol-relative.com"');
  });

  it('should return original content if SVG parsing fails', () => {
    const invalidSvg = '<not valid xml <<>>';
    const result = resolveRelativeUrls(invalidSvg, baseUrl);
    expect(result).toBe(invalidSvg);
  });

  it('should handle empty SVG', () => {
    const svg = '<svg></svg>';
    const result = resolveRelativeUrls(svg, baseUrl);
    // XMLSerializer may output self-closing tag <svg/> or <svg></svg>
    expect(result).toMatch(/<svg.*?\/?>|<svg.*?><\/svg>/);
  });

  it('should handle SVG with no links', () => {
    const svg = '<svg><rect width="100" height="100"/></svg>';
    const result = resolveRelativeUrls(svg, baseUrl);
    expect(result).toContain('<rect');
  });

  it('should resolve simple file names without ./', () => {
    const svg = '<svg><a href="page.html">Link</a></svg>';
    const result = resolveRelativeUrls(svg, baseUrl);
    expect(result).toContain('href="https://example.com/docs/diagrams/page.html"');
  });
});
