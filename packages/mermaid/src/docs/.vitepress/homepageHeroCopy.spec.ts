import { describe, expect, it } from 'vitest';

import { applyHomePageHeroCopy } from './homepageHeroCopy.ts';

describe('homepageHeroCopy', () => {
  it('does nothing for non-homepage pages', () => {
    const pageData: any = {
      relativePath: 'intro/index.md',
      frontmatter: {
        hero: {
          text: 'Diagramming and charting tool',
          tagline:
            'JavaScript based diagramming and charting tool that renders Markdown-inspired text definitions to create and modify diagrams dynamically.',
        },
      },
    };

    applyHomePageHeroCopy(pageData, 'mermaid.ai');
    expect(pageData.frontmatter.hero.text).toBe('Diagramming and charting tool');
  });

  it('keeps hero copy unchanged on mermaid.js.org', () => {
    const pageData: any = {
      relativePath: 'index.md',
      frontmatter: {
        hero: {
          text: 'Diagramming and charting tool',
          tagline:
            'JavaScript based diagramming and charting tool that renders Markdown-inspired text definitions to create and modify diagrams dynamically.',
        },
      },
    };

    applyHomePageHeroCopy(pageData, 'mermaid.js.org');
    expect(pageData.frontmatter.hero.text).toBe('Diagramming and charting tool');
    expect(pageData.frontmatter.hero.tagline).toMatch(/^JavaScript based diagramming/);
  });

  it('overrides hero copy on mermaid.ai', () => {
    const pageData: any = {
      relativePath: 'index.md',
      frontmatter: {
        hero: {
          text: 'Diagramming and charting tool',
          tagline:
            'JavaScript based diagramming and charting tool that renders Markdown-inspired text definitions to create and modify diagrams dynamically.',
        },
      },
    };

    applyHomePageHeroCopy(pageData, 'mermaid.ai');
    expect(pageData.frontmatter.hero.text).not.toBe('Diagramming and charting tool');
    expect(pageData.frontmatter.hero.tagline).not.toMatch(/^JavaScript based diagramming/);
  });
});
