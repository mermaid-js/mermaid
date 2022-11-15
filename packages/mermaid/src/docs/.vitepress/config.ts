import { version } from '../../../package.json';
import MermaidExample from './mermaid-markdown-all';
import { MermaidMarkdown } from 'vitepress-plugin-mermaid';
import { defineConfig, MarkdownOptions } from 'vitepress';

const allMarkdownTransformers: MarkdownOptions = {
  config: async (md) => {
    await MermaidExample(md);
    MermaidMarkdown(md);
  },
};

export default defineConfig({
  lang: 'en-US',
  title: 'Mermaid',
  description: 'Create diagrams and visualizations using text and code.',
  base: '/mermaid/',
  markdown: allMarkdownTransformers,
  head: [['link', { rel: 'icon', type: 'image/x-icon', href: '/mermaid/favicon.ico' }]],
  themeConfig: {
    nav: nav(),
    editLink: {
      pattern: 'https://github.com/mermaid-js/mermaid/edit/develop/packages/mermaid/src/docs/:path',
      text: 'Edit this page on GitHub',
    },

    sidebar: {
      '/': sidebarAll(),
    },
  },
});

// Top (across the page) menu
function nav() {
  return [
    { text: 'Intro', link: '/intro/', activeMatch: '/intro/' },
    {
      text: 'Configuration',
      link: '/config/configuration',
      activeMatch: '/config/',
    },
    { text: 'Syntax', link: '/syntax/classDiagram', activeMatch: '/syntax/' },
    { text: 'Misc', link: '/misc/integrations', activeMatch: '/misc/' },
    {
      text: 'Community',
      link: '/community/n00b-overview',
      activeMatch: '/community/',
    },
    {
      text: version,
      items: [
        {
          text: 'Changelog',
          link: 'https://github.com/mermaid-js/mermaid/blob/develop/CHANGELOG.md',
        },
        {
          text: 'Contributing',
          link: '/community/development',
        },
      ],
    },
    {
      text: '💻 Live Editor',
      link: 'https://mermaid.live',
    },
  ];
}

function sidebarAll() {
  return [
    {
      text: '📔 Introduction',
      collapsible: true,
      items: [
        { text: 'About Mermaid', link: '/intro/' },
        { text: 'Deployment', link: '/intro/n00b-gettingStarted' },
        {
          text: 'Syntax and Configuration',
          link: '/intro/n00b-syntaxReference',
        },
      ],
    },
    ...sidebarSyntax(),
    ...sidebarConfig(),
    ...sidebarMisc(),
    ...sidebarCommunity(),
  ];
}

function sidebarSyntax() {
  return [
    {
      text: '📊 Diagram Syntax',
      collapsible: true,
      items: [
        { text: 'Flowchart', link: '/syntax/flowchart' },
        { text: 'Sequence Diagram', link: '/syntax/sequenceDiagram' },
        { text: 'Class Diagram', link: '/syntax/classDiagram' },
        { text: 'State Diagram', link: '/syntax/stateDiagram' },
        {
          text: 'Entity Relationship Diagram',
          link: '/syntax/entityRelationshipDiagram',
        },
        { text: 'User Journey', link: '/syntax/userJourney' },
        { text: 'Gantt', link: '/syntax/gantt' },
        { text: 'Pie Chart', link: '/syntax/pie' },
        { text: 'Requirement Diagram', link: '/syntax/requirementDiagram' },
        { text: 'Gitgraph (Git) Diagram 🔥', link: '/syntax/gitgraph' },
        { text: 'C4C Diagram (Context) Diagram 🦺⚠️', link: '/syntax/c4c' },
        { text: 'Other Examples', link: '/syntax/examples' },
      ],
    },
  ];
}

function sidebarConfig() {
  return [
    {
      text: '⚙️ Deployment and Configuration',
      collapsible: true,
      items: [
        { text: 'Configuration', link: '/config/configuration' },
        { text: 'Tutorials', link: '/config/Tutorials' },
        { text: 'API-Usage', link: '/config/usage' },
        { text: 'Mermaid API Configuration', link: '/config/setup/README' },
        { text: 'Directives', link: '/config/directives' },
        { text: 'Theming', link: '/config/theming' },
        { text: 'Accessibility', link: '/config/accessibility' },
        { text: 'Mermaid CLI', link: '/config/mermaidCLI' },
        { text: 'Advanced usage', link: '/config/n00b-advanced' },
      ],
    },
  ];
}

function sidebarMisc() {
  return [
    {
      text: '📚 Misc',
      collapsible: true,
      items: [
        { text: 'Use-Cases and Integrations', link: '/misc/integrations' },
        { text: 'FAQ', link: '/misc/faq' },
      ],
    },
  ];
}

function sidebarCommunity() {
  return [
    {
      text: '🙌 Contributions and Community',
      collapsible: true,
      items: [
        { text: 'Overview for Beginners', link: '/community/n00b-overview' },
        ...sidebarCommunityDevelopContribute(),
        { text: 'Adding Diagrams', link: '/community/newDiagram' },
        { text: 'Security', link: '/community/security' },
      ],
    },
  ];
}

// Development and Contributing
function sidebarCommunityDevelopContribute() {
  const PAGE_PATH = '/community/development';
  return [
    {
      text: 'Contributing to Mermaid',
      link: PAGE_PATH + '#contributing-to-mermaid',
      collapsible: true,
      items: [
        {
          text: 'Technical Requirements and Setup',
          link: pathToId(PAGE_PATH, 'technical-requirements-and-setup'),
        },
        {
          text: 'Contributing Code',
          link: pathToId(PAGE_PATH, 'contributing-code'),
          collapsible: true,
          items: [
            {
              text: '1. Checkout a git branch',
              link: pathToId(PAGE_PATH, '_1-checkout-a-git-branch'),
            },
            { text: '2. Write Tests', link: pathToId(PAGE_PATH, '_2-write-tests') },
            {
              text: '3. Update Documentation',
              link: pathToId(PAGE_PATH, '_3-update-documentation'),
            },
            {
              text: '4. Submit your pull request',
              link: pathToId(PAGE_PATH, '_4-submit-your-pull-request'),
            },
          ],
        },
        {
          text: 'Contributing Documentation',
          link: pathToId(PAGE_PATH, 'contributing-documentation'),
        },
        {
          text: 'Questions or Suggestions?',
          link: pathToId(PAGE_PATH, 'questions-or-suggestions'),
        },
        {
          text: 'Last Words',
          link: pathToId(PAGE_PATH, 'last-words'),
        },
      ],
    },
  ];
}

/**
 * Return a string that puts together the pagePage, a '#', then the given id
 * @param  pagePath
 * @param  id
 * @returns  the fully formed path
 */
function pathToId(pagePath: string, id = ''): string {
  return pagePath + '#' + id;
}
