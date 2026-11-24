import type { PageData } from 'vitepress';

/**
 * The generated one-page-per-property config schema docs. Each repeats a row of its
 * section's overview page (e.g. `config-defs-pie-diagram-config`), so they are kept out of
 * search results and the sitemap.
 */
const schemaPropertyPage = /^config\/schema-docs\/[^/]*-properties-/;

/** Whether a page, given as its source (`.md`) or output (`.html`) path, should not be indexed. */
export const isNoindexPage = (path: string): boolean => schemaPropertyPage.test(path);

/** VitePress transformPageData hook: marks pages that should not be indexed. */
export const addNoindex = (pageData: PageData): void => {
  if (isNoindexPage(pageData.relativePath)) {
    pageData.frontmatter.head = [
      ...(pageData.frontmatter.head ?? []),
      ['meta', { name: 'robots', content: 'noindex' }],
    ];
  }
};
