export const OPEN_SOURCE_HOME_PATH = '/';

export const HOME_NAV_ITEM = {
  text: 'Home',
  link: OPEN_SOURCE_HOME_PATH,
  activeMatch: '/open-source/',
};

/** Default logo for mermaid.js.org */
const MERMAID_JS_ORG_LOGO = '/favicon.svg';

/** Logo for other domains (e.g., mermaid.ai) */
const MERMAID_CHART_LOGO = 'https://static.mermaidchart.dev/assets/mermaid-icon.svg';

export function isMermaidJsOrgHostname(hostname: string): boolean {
  return hostname === 'mermaid.js.org';
}

/**
 * Return the appropriate header logo based on hostname.
 */
export function getHeaderLogo(hostname: string): string {
  return isMermaidJsOrgHostname(hostname) ? MERMAID_JS_ORG_LOGO : MERMAID_CHART_LOGO;
}

/**
 * Return the URL the header logo should link to.
 * On mermaid.js.org: links to '/' (site root)
 * On other domains: links to 'https://mermaid.ai'
 */
export function getHeaderLogoLink(hostname: string): string | { link: string; target: string } {
  return isMermaidJsOrgHostname(hostname) ? '/' : { link: 'https://mermaid.ai', target: '_self' }; //'https://mermaid.ai';
}

function isHomeNavItem(item: unknown): boolean {
  if (!item || typeof item !== 'object') {
    return false;
  }
  const maybe = item as Record<string, unknown>;
  return maybe.text === HOME_NAV_ITEM.text && maybe.link === HOME_NAV_ITEM.link;
}

/**
 * Return a nav array with the "Home" item inserted/removed based on hostname.
 */
export function withConditionalHomeNav(nav: unknown, hostname: string) {
  const items = Array.isArray(nav) ? nav : [];
  const hasHome = items.some(isHomeNavItem);

  if (isMermaidJsOrgHostname(hostname)) {
    return hasHome ? items.filter((item) => !isHomeNavItem(item)) : items;
  }

  return hasHome ? items : [HOME_NAV_ITEM, ...items];
}
