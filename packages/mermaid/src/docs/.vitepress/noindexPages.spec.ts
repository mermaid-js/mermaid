import type { PageData } from 'vitepress';
import { describe, expect, it } from 'vitest';
import { addNoindex, isNoindexPage } from './noindexPages.js';

describe('isNoindexPage', () => {
  it.each([
    'config/schema-docs/config-defs-pie-diagram-config-properties-textposition.md',
    'config/schema-docs/config-defs-pie-diagram-config-properties-textposition.html',
    'config/schema-docs/config-properties-theme.md',
  ])('matches the per-property schema page %s', (path) => {
    expect(isNoindexPage(path)).toBe(true);
  });

  it.each([
    'config/schema-docs/config.md',
    'config/schema-docs/config-defs-pie-diagram-config.html',
    'config/setup/mermaid/interfaces/MermaidConfig.md',
    'syntax/pie.md',
  ])('keeps %s indexable', (path) => {
    expect(isNoindexPage(path)).toBe(false);
  });
});

describe('addNoindex', () => {
  const page = (relativePath: string): PageData => ({
    title: '',
    titleTemplate: undefined,
    description: '',
    frontmatter: {},
    headers: [],
    relativePath,
    filePath: relativePath,
  });

  it('adds a robots noindex tag to per-property schema pages', () => {
    const pageData = page('config/schema-docs/config-properties-theme.md');
    addNoindex(pageData);
    expect(pageData.frontmatter.head).toEqual([['meta', { name: 'robots', content: 'noindex' }]]);
  });

  it('leaves other pages alone', () => {
    const pageData = page('config/schema-docs/config.md');
    addNoindex(pageData);
    expect(pageData.frontmatter.head).toBeUndefined();
  });
});
