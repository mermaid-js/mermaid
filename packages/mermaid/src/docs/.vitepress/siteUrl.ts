type Env = Record<string, string | undefined>;

const DEFAULT_SITE_URL = 'https://mermaid.js.org/';

/**
 * The public URL the docs are deployed at, including any base path, e.g.
 * `DOCS_SITE_URL=https://mermaid.ai/open-source/`. Used for the VitePress `base`,
 * the sitemap, robots.txt and absolute links such as `og:url`.
 */
export const getSiteUrl = (env: Env = process.env): string => {
  const value = env.DOCS_SITE_URL?.length ? env.DOCS_SITE_URL : DEFAULT_SITE_URL;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`DOCS_SITE_URL must be an absolute URL, got "${value}"`);
  }
  return url.href.endsWith('/') ? url.href : `${url.href}/`;
};

export const getSiteBase = (siteUrl: string): string => new URL(siteUrl).pathname;

/** The deployment hostname: `DOCS_HOSTNAME` if set, otherwise the host of the site URL. */
export const getDocsHostname = (env: Env = process.env): string =>
  env.DOCS_HOSTNAME?.length ? env.DOCS_HOSTNAME : new URL(getSiteUrl(env)).hostname;

/** The URL a page is served at, in the form VitePress uses for the sitemap. */
export const getPageUrl = (relativePath: string, siteUrl: string): string =>
  siteUrl + relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '.html');
