import { describe, expect, it } from 'vitest';
import { isAbsoluteUrl, resolveRelativeUrlsInElement } from './sandboxUrl.js';

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

describe('resolveRelativeUrlsInElement', () => {
  const baseUrl = 'https://example.com/docs/diagrams/';

  // Helper to create an SVG element from string
  function createSvgElement(svgString: string): Element {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    return doc.documentElement;
  }

  // Helper to get href from first anchor in element
  function getFirstHref(element: Element): string | null {
    const anchor = element.querySelector('a');
    return anchor?.getAttribute('href') ?? null;
  }

  // Helper to get xlink:href from first anchor in element
  function getFirstXlinkHref(element: Element): string | null {
    const anchor = element.querySelector('a');
    return anchor?.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ?? null;
  }

  it('should resolve relative paths (./) in href attributes', () => {
    const svg = createSvgElement('<svg><a href="./page.html">Link</a></svg>');
    resolveRelativeUrlsInElement(svg, baseUrl);
    expect(getFirstHref(svg)).toBe('https://example.com/docs/diagrams/page.html');
  });

  it('should resolve relative paths (./) in xlink:href attributes', () => {
    const svg = createSvgElement(
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="./page.html">Link</a></svg>'
    );
    resolveRelativeUrlsInElement(svg, baseUrl);
    expect(getFirstXlinkHref(svg)).toBe('https://example.com/docs/diagrams/page.html');
  });

  it('should resolve parent directory paths (../)', () => {
    const svg = createSvgElement('<svg><a href="../other.html">Link</a></svg>');
    resolveRelativeUrlsInElement(svg, baseUrl);
    expect(getFirstHref(svg)).toBe('https://example.com/docs/other.html');
  });

  it('should resolve absolute paths (/)', () => {
    const svg = createSvgElement('<svg><a href="/root.html">Link</a></svg>');
    resolveRelativeUrlsInElement(svg, baseUrl);
    expect(getFirstHref(svg)).toBe('https://example.com/root.html');
  });

  it('should resolve hash links against base URL', () => {
    const svg = createSvgElement('<svg><a href="#section">Link</a></svg>');
    const baseUrlWithFile = 'https://example.com/docs/index.html';
    resolveRelativeUrlsInElement(svg, baseUrlWithFile);
    expect(getFirstHref(svg)).toBe('https://example.com/docs/index.html#section');
  });

  it('should not modify absolute URLs with http://', () => {
    const svg = createSvgElement('<svg><a href="http://other.com/page">Link</a></svg>');
    resolveRelativeUrlsInElement(svg, baseUrl);
    expect(getFirstHref(svg)).toBe('http://other.com/page');
  });

  it('should not modify absolute URLs with https://', () => {
    const svg = createSvgElement('<svg><a href="https://other.com/page">Link</a></svg>');
    resolveRelativeUrlsInElement(svg, baseUrl);
    expect(getFirstHref(svg)).toBe('https://other.com/page');
  });

  it('should not modify protocol-relative URLs', () => {
    const svg = createSvgElement('<svg><a href="//cdn.example.com/resource">Link</a></svg>');
    resolveRelativeUrlsInElement(svg, baseUrl);
    expect(getFirstHref(svg)).toBe('//cdn.example.com/resource');
  });

  it('should not modify mailto: URLs', () => {
    const svg = createSvgElement('<svg><a href="mailto:user@example.com">Email</a></svg>');
    resolveRelativeUrlsInElement(svg, baseUrl);
    expect(getFirstHref(svg)).toBe('mailto:user@example.com');
  });

  it('should not modify javascript: URLs', () => {
    const svg = createSvgElement('<svg><a href="javascript:void(0)">Link</a></svg>');
    resolveRelativeUrlsInElement(svg, baseUrl);
    expect(getFirstHref(svg)).toBe('javascript:void(0)');
  });

  it('should handle both href and xlink:href in the same SVG', () => {
    const svg = createSvgElement(`<svg xmlns:xlink="http://www.w3.org/1999/xlink">
      <a href="./a.html">A</a>
      <a xlink:href="./b.html">B</a>
    </svg>`);
    resolveRelativeUrlsInElement(svg, baseUrl);

    const anchors = svg.querySelectorAll('a');
    expect(anchors[0].getAttribute('href')).toBe('https://example.com/docs/diagrams/a.html');
    expect(anchors[1].getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe(
      'https://example.com/docs/diagrams/b.html'
    );
  });

  it('should handle multiple links with mixed URLs', () => {
    const svg = createSvgElement(`<svg xmlns:xlink="http://www.w3.org/1999/xlink">
      <a href="./relative.html">Relative</a>
      <a href="https://absolute.com">Absolute</a>
      <a xlink:href="../parent.html">Parent</a>
      <a xlink:href="//protocol-relative.com">Protocol</a>
    </svg>`);
    resolveRelativeUrlsInElement(svg, baseUrl);

    const anchors = svg.querySelectorAll('a');
    expect(anchors[0].getAttribute('href')).toBe('https://example.com/docs/diagrams/relative.html');
    expect(anchors[1].getAttribute('href')).toBe('https://absolute.com');
    expect(anchors[2].getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe(
      'https://example.com/docs/parent.html'
    );
    expect(anchors[3].getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe(
      '//protocol-relative.com'
    );
  });

  it('should handle SVG with no links (no-op)', () => {
    const svg = createSvgElement('<svg><rect width="100" height="100"/></svg>');
    // Should not throw
    resolveRelativeUrlsInElement(svg, baseUrl);
    expect(svg.querySelector('rect')).not.toBeNull();
  });

  it('should resolve simple file names without ./', () => {
    const svg = createSvgElement('<svg><a href="page.html">Link</a></svg>');
    resolveRelativeUrlsInElement(svg, baseUrl);
    expect(getFirstHref(svg)).toBe('https://example.com/docs/diagrams/page.html');
  });

  it('should handle nested elements with links', () => {
    const svg = createSvgElement(`<svg>
      <g>
        <a href="./nested.html">
          <text>Nested Link</text>
        </a>
      </g>
    </svg>`);
    resolveRelativeUrlsInElement(svg, baseUrl);
    expect(getFirstHref(svg)).toBe('https://example.com/docs/diagrams/nested.html');
  });
});
