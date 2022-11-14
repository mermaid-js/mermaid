export const getBaseFile = (link: string): string => {
  const url = new URL(link);
  if (
    (url.hostname !== 'mermaid-js.github.io' && url.hostname !== 'localhost') ||
    url.pathname !== '/mermaid/'
  ) {
    throw new Error('Not mermaidjs url');
  }
  const hash = url.hash
    .toLowerCase()
    .replace('.md', '')
    .replace(/^#\/?/g, '')
    .replace(/^\.\//g, '')
    .split('?')[0];
  return hash;
};

const redirectMap: Record<string, string> = {
  '8.6.0_docs': '',
  accessibility: 'config/theming',
  breakingchanges: '',
  c4c: 'syntax/c4c',
  classdiagram: 'syntax/classDiagram',
  configuration: 'config/configuration',
  demos: 'misc/integrations',
  development: 'community/development',
  directives: 'config/directives',
  entityrelationshipdiagram: 'syntax/entityRelationshipDiagram',
  examples: 'syntax/examples',
  faq: 'misc/faq',
  flowchart: 'syntax/flowchart',
  gantt: 'syntax/gantt',
  gitgraph: 'syntax/gitgraph',
  integrations: 'misc/integrations',
  'language-highlight': '',
  markdown: '',
  mermaidapi: 'config/usage',
  mermaidcli: 'config/mermaidCLI',
  mindmap: 'syntax/mindmap',
  'more-pages': '',
  'n00b-advanced': 'config/n00b-advanced',
  'n00b-gettingstarted': 'intro/n00b-gettingStarted',
  'n00b-overview': 'community/n00b-overview',
  'n00b-syntaxreference': '',
  newdiagram: 'community/newDiagram',
  pie: 'syntax/pie',
  plugins: '',
  quickstart: 'intro/n00b-gettingStarted',
  requirementdiagram: 'syntax/requirementDiagram',
  security: 'community/security',
  sequencediagram: 'syntax/sequenceDiagram',
  setup: '',
  statediagram: 'syntax/stateDiagram',
  themes: 'config/theming',
  theming: 'config/theming',
  tutorials: 'config/Tutorials',
  upgrading: '',
  usage: 'config/usage',
  'user-journey': 'syntax/userJourney',
};

export const getRedirect = (link: string): string | undefined => {
  const base = getBaseFile(link);
  return redirectMap[base];
};
