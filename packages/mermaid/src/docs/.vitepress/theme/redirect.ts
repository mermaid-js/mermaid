interface Redirect {
  path: string;
  id?: string;
}

/**
 * Extracts the base slug from the old URL.
 * @param link - The old URL.
 */
const getBaseFile = (url: URL): Redirect => {
  const [path, params, ...rest] = url.hash
    .toLowerCase()
    .replace('.md', '')
    .replace(/^#\/?/g, '')
    .replace(/^\.\//g, '')
    .split('?');

  // Find id in params
  const id = params
    ?.split('&')
    .find((param) => param.startsWith('id='))
    ?.split('=')[1];

  return { path, id };
};

/**
 * Used to redirect old (pre-vitepress) documentation pages to corresponding new pages.
 * The key is the old documentation ID, and the value is the new documentation path.
 * No key should be added here as it already has all the old documentation IDs.
 * If you are changing a documentation page, you should update the corresponding value here, and add an entry in the urlRedirectMap below.
 */
export const idRedirectMap: Record<string, string> = {
  // ID of the old documentation page: Path of the new documentation page
  '8.6.0_docs': 'intro/index',
  accessibility: 'config/accessibility',
  breakingchanges: 'intro/index',
  c4c: 'syntax/c4',
  classdiagram: 'syntax/classDiagram',
  configuration: 'config/configuration',
  demos: 'ecosystem/integrations-community',
  development: 'community/contributing',
  directives: 'config/directives',
  entityrelationshipdiagram: 'syntax/entityRelationshipDiagram',
  examples: 'syntax/all-examples',
  faq: 'config/faq',
  flowchart: 'syntax/flowchart',
  gantt: 'syntax/gantt',
  gitgraph: 'syntax/gitgraph',
  integrations: 'ecosystem/integrations-community',
  'language-highlight': 'intro/index',
  markdown: 'intro/index',
  mermaidapi: 'config/usage',
  mermaidcli: 'config/mermaidCLI',
  mindmap: 'syntax/mindmap',
  'more-pages': 'intro/index',
  'n00b-advanced': 'config/configuration',
  'n00b-gettingstarted': 'intro/getting-started',
  'n00b-overview': 'intro/getting-started',
  'n00b-syntaxreference': 'intro/syntax-reference',
  newdiagram: 'community/new-diagram',
  pie: 'syntax/pie',
  plugins: 'intro/index',
  quickstart: 'intro/getting-started',
  requirementdiagram: 'syntax/requirementDiagram',
  security: 'community/security',
  sequencediagram: 'syntax/sequenceDiagram',
  setup: 'config/setup/README',
  statediagram: 'syntax/stateDiagram',
  themes: 'config/theming',
  theming: 'config/theming',
  tutorials: 'ecosystem/tutorials',
  upgrading: 'intro/index',
  usage: 'config/usage',
  'user-journey': 'syntax/userJourney',
};

/**
 * Used to redirect pages that have been moved in the vitepress site.
 * No keys should be deleted from here.
 * If you are changing a documentation page, you should update the corresponding value here,
 * and update the entry in the idRedirectMap above if it was present
 * (No need to add new keys in idRedirectMap).
 */
export const urlRedirectMap: Record<string, string> = {
  // Old URL: New URL
  '/misc/faq.html': 'config/faq.html',
  '/syntax/c4c.html': 'syntax/c4.html',
  '/ecosystem/integrations.html': 'ecosystem/integrations-community.html',
  '/ecosystem/showcases.html': 'ecosystem/integrations-create.html',
  '/config/n00b-advanced.html': 'config/configuration.html',
  '/intro/n00b-gettingStarted.html': 'intro/getting-started.html',
  '/intro/n00b-syntaxReference.html': 'intro/syntax-reference.html',
  '/community/n00b-overview.html': 'intro/getting-started.html',
  '/community/newDiagram.html': 'community/new-diagram.html',
  '/community/development.html': 'community/contributing.html#initial-setup',
  '/community/docker-development.html': 'community/contributing.html#initial-setup',
  '/community/code.html': 'community/contributing.html#contributing-code',
  '/community/documentation.html': 'community/contributing.html#contributing-documentation',
  '/syntax/examples.html': 'syntax/all-examples.html',
  '/intro/examples.html': 'syntax/all-examples.html',
};

/**
 *
 * @param link - The old documentation URL.
 * @param base - The site's base path, e.g. `/open-source/`.
 * @returns The new documentation path, relative to the base.
 */
export const getRedirect = (url: URL, base = '/'): string | undefined => {
  const pathname = url.pathname.startsWith(base)
    ? `/${url.pathname.slice(base.length)}`
    : url.pathname;

  // Redirects for deprecated vitepress URLs
  if (pathname in urlRedirectMap) {
    return `${urlRedirectMap[pathname]}${url.hash}`;
  }

  // Redirects for old docs URLs
  const { path, id } = getBaseFile(url);
  if (path in idRedirectMap) {
    return `${idRedirectMap[path]}.html${id ? `#${id}` : ''}`;
  }
};

// cspell:ignore mermaidapi, breakingchanges, classdiagram, entityrelationshipdiagram, mermaidapi, mermaidcli, gettingstarted, syntaxreference, newdiagram, requirementdiagram, sequencediagram
