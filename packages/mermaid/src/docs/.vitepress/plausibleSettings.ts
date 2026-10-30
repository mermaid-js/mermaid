import { getDocsHostname } from './siteUrl.js';

type Env = Record<string, string | undefined>;

export interface PlausibleSettings {
  domain: string;
  endpoint: string;
}

const DEFAULT_ENDPOINT = 'https://p.mermaid.live/api/event';

/**
 * Where the docs report analytics: the Plausible site is the docs hostname (`mermaid.js.org`,
 * or `mermaid.ai` for `DOCS_SITE_URL=https://mermaid.ai/open-source/`), sent to
 * `DOCS_PLAUSIBLE_ENDPOINT` (default: the self-hosted Plausible at p.mermaid.live).
 */
export const getPlausibleSettings = (env: Env = process.env): PlausibleSettings => ({
  domain: getDocsHostname(env),
  endpoint: env.DOCS_PLAUSIBLE_ENDPOINT?.length ? env.DOCS_PLAUSIBLE_ENDPOINT : DEFAULT_ENDPOINT,
});
