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
const idRedirectMap: Record<string, string> = {
  // ID of the old documentation page: Path of the new documentation page
  '8.6.0_docs': '',
  accessibility: 'config/theming',
  breakingchanges: '',
  c4c: 'syntax/c4',
  classdiagram: 'syntax/classDiagram',
  configuration: 'config/configuration',
  demos: 'ecosystem/integrations',
  development: 'community/development',
  directives: 'config/directives',
  entityrelationshipdiagram: 'syntax/entityRelationshipDiagram',
  examples: 'syntax/examples',
  faq: 'misc/faq',
  flowchart: 'syntax/flowchart',
  gantt: 'syntax/gantt',
  gitgraph: 'syntax/gitgraph',
  integrations: 'ecosystem/integrations',
  'language-highlight': '',
  markdown: '',
  mermaidapi: 'config/usage',
  mermaidcli: 'config/mermaidCLI',
  mindmap: 'syntax/mindmap',
  'more-pages': '',
  'n00b-advanced': 'config/advanced',
  'n00b-gettingstarted': 'intro/getting-started',
  'n00b-overview': 'intro/getting-started',
  'n00b-syntaxreference': 'intro/syntax-reference',
  newdiagram: 'community/newDiagram',
  pie: 'syntax/pie',
  plugins: '',
  quickstart: 'intro/getting-started',
  requirementdiagram: 'syntax/requirementDiagram',
  security: 'community/security',
  sequencediagram: 'syntax/sequenceDiagram',
  setup: 'config/setup/README',
  statediagram: 'syntax/stateDiagram',
  themes: 'config/theming',
  theming: 'config/theming',
  tutorials: 'config/Tutorials',
  upgrading: '',
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
const urlRedirectMap: Record<string, string> = {
  // Old URL: New URL
  '/misc/faq.html': 'configure/faq.html',
  '/syntax/c4c.html': 'syntax/c4.html',
  '/ecosystem/integrations.html': 'ecosystem/integrations-community.html',
  '/ecosystem/showcases.html': 'ecosystem/integrations-create',
  '/config/n00b-advanced.html': 'config/advanced',
  '/intro/n00b-gettingStarted.html': 'intro/getting-started',
  '/intro/n00b-syntaxReference.html': 'intro/syntax-reference',
  '/community/n00b-overview.html': 'intro/getting-started',
};

/**
 *
 * @param link - The old documentation URL.
 * @returns The new documentation path.
 */
export const getRedirect = (link: string): string | undefined => {
  const url = new URL(link);
  // Redirects for deprecated vitepress URLs
  if (url.pathname in urlRedirectMap) {
    return `${urlRedirectMap[url.pathname]}${url.hash}`;
  }

  // Redirects for old docs URLs
  const { path, id } = getBaseFile(url);
  if (path in idRedirectMap) {
    return `${idRedirectMap[path]}.html${id ? `#${id}` : ''}`;
  }
};
