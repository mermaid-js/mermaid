import { isMermaidJsOrgHostname } from './headerDomainRules.js';

import { log } from '../../logger.js';

const LOG_PREFIX = '[MMD_DOCS_HERO]';

/**
 * Build-time override of the homepage hero copy based on DOCS_HOSTNAME.
 *
 * Note: index.md frontmatter is static, so this is applied via VitePress transformPageData.
 */
export function applyHomePageHeroCopy(pageData: any, hostname: string): void {
  if (!pageData || pageData.relativePath !== 'index.md') {
    return;
  }

  if (isMermaidJsOrgHostname(hostname)) {
    return;
  }

  // Ensure objects exist
  pageData.frontmatter = pageData.frontmatter ?? {};
  pageData.frontmatter.hero = pageData.frontmatter.hero ?? {};

  const hero = pageData.frontmatter.hero as Record<string, unknown>;
  const before = { text: hero.text, tagline: hero.tagline };

  // Placeholder copy for mermaid.ai builds (can be refined later)
  hero.name = 'Mermaid';
  hero.text = 'Starts Here';
  hero.tagline =
    'The home of Mermaid - the open-source diagramming library and, the collaborative platform built on top of it. Docs, live editor, integrations, and team features — all in one place.';

  log.info(LOG_PREFIX, { hostname, before, after: { text: hero.text, tagline: hero.tagline } });
}
