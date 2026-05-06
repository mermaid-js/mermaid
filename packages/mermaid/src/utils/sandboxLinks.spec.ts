import { describe, expect, it } from 'vitest';

import { resolveRelativeLinksInElement } from './sandboxLinks.js';

describe('resolveRelativeLinksInElement', () => {
  const baseUrl = 'https://example.com/docs/index.html';

  const createSvgElement = (svg: string): Element => {
    const parser = new DOMParser();
    return parser.parseFromString(svg, 'image/svg+xml').documentElement;
  };

  it('resolves relative href links on anchors', () => {
    const svg = createSvgElement('<svg><a href="./page.html">Link</a></svg>');

    resolveRelativeLinksInElement(svg, baseUrl);

    expect(svg.querySelector('a')?.getAttribute('href')).toBe('https://example.com/docs/page.html');
  });

  it('resolves relative xlink:href links on anchors', () => {
    const svg = createSvgElement(
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="../page.html">Link</a></svg>'
    );

    resolveRelativeLinksInElement(svg, baseUrl);

    expect(svg.querySelector('a')?.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe(
      'https://example.com/page.html'
    );
  });

  it('resolves hash links against the configured base URL', () => {
    const svg = createSvgElement('<svg><a href="#section">Link</a></svg>');

    resolveRelativeLinksInElement(svg, baseUrl);

    expect(svg.querySelector('a')?.getAttribute('href')).toBe(
      'https://example.com/docs/index.html#section'
    );
  });

  it('leaves absolute and protocol-relative URLs unchanged', () => {
    const svg = createSvgElement(`<svg xmlns:xlink="http://www.w3.org/1999/xlink">
      <a href="https://mermaid.js.org/">Absolute</a>
      <a xlink:href="//cdn.example.com/file.svg">Protocol relative</a>
    </svg>`);

    resolveRelativeLinksInElement(svg, baseUrl);

    const anchors = svg.querySelectorAll('a');
    expect(anchors[0].getAttribute('href')).toBe('https://mermaid.js.org/');
    expect(anchors[1].getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe(
      '//cdn.example.com/file.svg'
    );
  });

  it('does not rewrite non-anchor xlink references', () => {
    const svg = createSvgElement(
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="#icon" /></svg>'
    );

    resolveRelativeLinksInElement(svg, baseUrl);

    expect(svg.querySelector('use')?.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe(
      '#icon'
    );
  });

  it('leaves links unchanged when the base URL is invalid', () => {
    const svg = createSvgElement('<svg><a href="./page.html">Link</a></svg>');

    resolveRelativeLinksInElement(svg, 'not-a-valid-url');

    expect(svg.querySelector('a')?.getAttribute('href')).toBe('./page.html');
  });
});
