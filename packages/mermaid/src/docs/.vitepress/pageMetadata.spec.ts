import type { PageData } from 'vitepress';
import { describe, expect, it } from 'vitest';
import { addPageMetadata, getPageDescription } from './pageMetadata.js';

describe('getPageDescription', () => {
  it('uses the first paragraph, skipping frontmatter, headings, code and notes', () => {
    const markdown = `---
title: Pie
---

# Pie chart diagrams

> Note: this is a notice, not the description.

\`\`\`mermaid-example
pie
\`\`\`

::: tip
Neither is this.
:::

A pie chart is a circular statistical graphic, which is divided into slices to illustrate numerical proportion.

Second paragraph.
`;
    expect(getPageDescription(markdown)).toBe(
      'A pie chart is a circular statistical graphic, which is divided into slices to illustrate numerical proportion.'
    );
  });

  it('uses an opening blockquote, without its attribution', () => {
    const markdown = `# Pie chart diagrams

> A pie chart (or a circle chart) is a circular statistical graphic, which is divided into slices.
> -Wikipedia

Mermaid can render Pie Chart diagrams.
`;
    expect(getPageDescription(markdown)).toBe(
      'A pie chart (or a circle chart) is a circular statistical graphic, which is divided into slices.'
    );
  });

  it('skips notices and strips quotes around the text', () => {
    const markdown = `> Mindmap: This is an experimental diagram for now. The syntax and properties can change.

"A mind map is a diagram used to visually organize information into a hierarchy." [(Wikipedia)](https://en.wikipedia.org/wiki/Mind_map)
`;
    expect(getPageDescription(markdown)).toBe(
      'A mind map is a diagram used to visually organize information into a hierarchy.'
    );
  });

  it('strips inline markdown and joins wrapped lines', () => {
    const markdown = `Mermaid can render **Sankey** diagrams, see [the docs](./sankey.md) and
\`sankey\` with _emphasis_ and <span>html</span>.`;
    expect(getPageDescription(markdown)).toBe(
      'Mermaid can render Sankey diagrams, see the docs and sankey with emphasis and html.'
    );
  });

  it('skips paragraphs that are too short to describe the page', () => {
    expect(
      getPageDescription(
        'Hello.\n\nThis paragraph is long enough to describe what the page is about.'
      )
    ).toBe('This paragraph is long enough to describe what the page is about.');
  });

  it('truncates long paragraphs at a word boundary', () => {
    const description = getPageDescription(`${'word '.repeat(60)}end.`)!;
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toMatch(/word…$/);
  });

  it('returns undefined when there is no prose', () => {
    expect(getPageDescription('# Title\n\n```mermaid\npie\n```\n')).toBeUndefined();
  });
});

describe('addPageMetadata', () => {
  const siteDescription = 'Create diagrams and visualizations using text and code.';
  const siteUrl = 'https://mermaid.js.org/';
  const page = (overrides: Partial<PageData>): PageData => ({
    title: 'Pie chart diagrams',
    titleTemplate: undefined,
    description: '',
    frontmatter: {},
    headers: [],
    relativePath: 'syntax/pie.md',
    filePath: 'syntax/pie.md',
    ...overrides,
  });

  it('adds a description and per-page Open Graph tags', () => {
    const pageData = page({});
    addPageMetadata(
      pageData,
      'A pie chart is a circular statistical graphic, divided into slices.',
      siteDescription,
      siteUrl
    );

    expect(pageData.description).toBe(
      'A pie chart is a circular statistical graphic, divided into slices.',
      siteDescription,
      siteUrl
    );
    expect(pageData.frontmatter.head).toEqual([
      ['meta', { property: 'og:title', content: 'Pie chart diagrams | Mermaid' }],
      [
        'meta',
        {
          property: 'og:description',
          content: 'A pie chart is a circular statistical graphic, divided into slices.',
        },
      ],
      ['meta', { property: 'og:url', content: 'https://mermaid.js.org/syntax/pie.html' }],
    ]);
  });

  it('keeps a description set in frontmatter', () => {
    const pageData = page({ description: 'From frontmatter.' });
    addPageMetadata(
      pageData,
      'A pie chart is a circular statistical graphic, divided into slices.',
      siteDescription,
      siteUrl
    );

    expect(pageData.description).toBe('From frontmatter.');
  });

  it('falls back to the site description when the page has no prose', () => {
    const pageData = page({});
    addPageMetadata(pageData, '# Title', siteDescription, siteUrl);

    expect(pageData.description).toBe('');
    expect(pageData.frontmatter.head).toContainEqual([
      'meta',
      { property: 'og:description', content: siteDescription },
    ]);
  });

  it('uses the site name as the title of the home page', () => {
    const pageData = page({ title: 'Mermaid', relativePath: 'index.md' });
    addPageMetadata(pageData, '', siteDescription, siteUrl);

    expect(pageData.frontmatter.head).toContainEqual([
      'meta',
      { property: 'og:title', content: 'Mermaid' },
    ]);
    expect(pageData.frontmatter.head).toContainEqual([
      'meta',
      { property: 'og:url', content: 'https://mermaid.js.org/' },
    ]);
  });
});
