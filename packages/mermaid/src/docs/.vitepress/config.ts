import type { MarkdownOptions } from 'vitepress';
import { defineConfig } from 'vitepress';
import packageJson from '../../../package.json' with { type: 'json' };
import { addCanonicalUrls } from './canonical-urls.js';
import { getHeaderLogo, getHeaderLogoLink, withConditionalHomeNav } from './headerDomainRules.js';
import MermaidExample from './mermaid-markdown-all.js';

const allMarkdownTransformers: MarkdownOptions = {
  // the shiki theme to highlight code blocks
  theme: {
    light: 'github-light',
    dark: 'github-dark',
  },

  config: (md) => {
    MermaidExample(md);
  },
};

export default defineConfig({
  lang: 'en-US',
  title: 'Mermaid',
  description: 'Create diagrams and visualizations using text and code.',
  base: '/',
  markdown: allMarkdownTransformers,
  ignoreDeadLinks: [
    // ignore all localhost links
    /^https?:\/\/localhost/,
  ],
  transformPageData: addCanonicalUrls,
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    ['meta', { property: 'og:title', content: 'Mermaid' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Create diagrams and visualizations using text and code.',
      },
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://mermaid.js.org' }],
    [
      'meta',
      { property: 'og:image', content: 'https://mermaid.js.org/mermaid-logo-horizontal.svg' },
    ],
    [
      'script',
      {
        defer: 'true',
        'data-domain': 'mermaid.js.org',
        // All tracked stats are public and available at https://p.mermaid.live/mermaid.js.org
        src: 'https://p.mermaid.live/js/script.tagged-events.outbound-links.js',
      },
    ],
  ],
  themeConfig: {
    logo: getHeaderLogo(docsHostname()),
    logoLink: getHeaderLogoLink(docsHostname()),
    nav: nav(),
    editLink: {
      pattern: ({ filePath, frontmatter }) => {
        if (typeof frontmatter.editLink === 'string') {
          return frontmatter.editLink;
        }
        return `https://github.com/mermaid-js/mermaid/edit/develop/packages/mermaid/src/docs/${filePath}`;
      },
      text: 'Edit this page on GitHub',
    },
    sidebar: {
      '/': sidebarAll(),
    },
    outline: {
      level: 'deep',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/mermaid-js/mermaid' },
      {
        icon: 'discord',
        link: 'https://discord.gg/sKeNQX4Wtj',
      },
      {
        icon: {
          svg: '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 490.16 490.16"><defs><mask id="Mask"><rect x="0" y="0" width="490.16" height="490.16" fill="white" /><path fill="black" d="M407.48,111.18A165.2,165.2,0,0,0,245.08,220,165.2,165.2,0,0,0,82.68,111.18a165.5,165.5,0,0,0,72.06,143.64,88.81,88.81,0,0,1,38.53,73.45v50.86H296.9V328.27a88.8,88.8,0,0,1,38.52-73.45,165.41,165.41,0,0,0,72.06-143.64Z"/><path fill="black" d="M160.63,328.27a56.09,56.09,0,0,0-24.27-46.49,198.74,198.74,0,0,1-28.54-23.66A196.87,196.87,0,0,1,82.53,227V379.13h78.1Z"/><path fill="black" d="M329.53,328.27a56.09,56.09,0,0,1,24.27-46.49,198.74,198.74,0,0,0,28.54-23.66A196.87,196.87,0,0,0,407.63,227V379.13h-78.1Z"/></mask><style>.cls-1{fill:#76767B;}.cls-1:hover{fill:#FF3570}</style></defs><rect class="cls-1" width="490.16" height="490.16" rx="84.61" mask="url(#Mask)" /></svg>',
        },
        link: 'https://mermaid.ai/',
      },
    ],
  },
});

/**
 * Get the deployment hostname from DOCS_HOSTNAME env var.
 * Defaults to 'mermaid.js.org' if not set.
 */
function docsHostname(): string {
  return (
    ((globalThis as any).process?.env?.DOCS_HOSTNAME as string | undefined) ?? 'mermaid.js.org'
  );
}

// Top (across the page) menu
function nav() {
  const baseNav = [
    { text: 'Docs', link: '/intro/', activeMatch: '/intro/' },
    {
      text: 'Tutorials',
      link: '/ecosystem/tutorials',
      activeMatch: '/ecosystem/tutorials',
    },
    {
      text: 'Integrations',
      link: '/ecosystem/integrations-community',
      activeMatch: '/ecosystem/integrations-community',
    },
    {
      text: 'Contributing',
      link: '/community/intro',
      activeMatch: '/community/',
    },
    {
      text: 'Latest News',
      link: '/news/announcements',
      activeMatch: '/announcements',
    },
    {
      text: packageJson.version,
      items: [
        {
          text: 'Changelog',
          link: 'https://github.com/mermaid-js/mermaid/releases',
        },
      ],
    },
    {
      text: '💻 Open Editor',
      link: 'https://mermaid.live/edit',
      target: '_blank',
      rel: 'external',
    },
  ];

  return withConditionalHomeNav(baseNav, docsHostname());
}

function sidebarAll() {
  return [
    {
      text: '📔 Introduction',
      collapsed: false,
      items: [
        { text: 'About Mermaid', link: '/intro/' },
        { text: 'Getting Started', link: '/intro/getting-started' },
        { text: 'Syntax and Configuration', link: '/intro/syntax-reference' },
      ],
    },
    ...sidebarSyntax(),
    ...sidebarEcosystem(),
    ...sidebarConfig(),
    ...sidebarCommunity(),
    ...sidebarNews(),
  ];
}

function sidebarSyntax() {
  return [
    {
      text: '📊 Diagram Syntax',
      collapsed: false,
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
        { text: 'Quadrant Chart', link: '/syntax/quadrantChart' },
        { text: 'Requirement Diagram', link: '/syntax/requirementDiagram' },
        { text: 'GitGraph (Git) Diagram', link: '/syntax/gitgraph' },
        { text: 'C4 Diagram 🦺⚠️', link: '/syntax/c4' },
        { text: 'Mindmaps', link: '/syntax/mindmap' },
        { text: 'Timeline', link: '/syntax/timeline' },
        { text: 'ZenUML', link: '/syntax/zenuml' },
        { text: 'Sankey 🔥', link: '/syntax/sankey' },
        { text: 'XY Chart 🔥', link: '/syntax/xyChart' },
        { text: 'Block Diagram 🔥', link: '/syntax/block' },
        { text: 'Packet 🔥', link: '/syntax/packet' },
        { text: 'Kanban 🔥', link: '/syntax/kanban' },
        { text: 'Architecture 🔥', link: '/syntax/architecture' },
        { text: 'Radar 🔥', link: '/syntax/radar' },
        { text: 'Treemap 🔥', link: '/syntax/treemap' },
        { text: 'Venn 🔥', link: '/syntax/venn' },
        { text: 'Other Examples', link: '/syntax/examples' },
      ],
    },
  ];
}

function sidebarConfig() {
  return [
    {
      text: '⚙️ Deployment and Configuration',
      collapsed: false,
      items: [
        { text: 'Configuration', link: '/config/configuration' },
        { text: 'API-Usage', link: '/config/usage' },
        { text: 'Mermaid API Configuration', link: '/config/setup/README' },
        { text: 'Mermaid Configuration Options', link: '/config/schema-docs/config' },
        { text: 'Registering icons', link: '/config/icons' },
        { text: 'Directives', link: '/config/directives' },
        { text: 'Theming', link: '/config/theming' },
        { text: 'Math', link: '/config/math' },
        { text: 'Accessibility', link: '/config/accessibility' },
        { text: 'Mermaid CLI', link: '/config/mermaidCLI' },
        { text: 'FAQ', link: '/config/faq' },
        { text: 'Layouts', link: '/config/layouts' },
      ],
    },
  ];
}

function sidebarEcosystem() {
  return [
    {
      text: '📚 Ecosystem',
      collapsed: false,
      items: [
        { text: 'Mermaid Chart', link: '/ecosystem/mermaid-chart' },
        { text: 'Tutorials', link: '/ecosystem/tutorials' },
        { text: 'Integrations - Community', link: '/ecosystem/integrations-community' },
        { text: 'Integrations - Create', link: '/ecosystem/integrations-create' },
      ],
    },
  ];
}

function sidebarCommunity() {
  return [
    {
      text: '🙌 Contributing',
      collapsed: false,
      items: [
        { text: 'Getting Started', link: '/community/intro' },
        { text: 'Contributing to Mermaid', link: '/community/contributing' },
        { text: 'Adding Diagrams', link: '/community/new-diagram' },
        { text: 'Questions and Suggestions', link: '/community/questions-and-suggestions' },
        { text: 'Security', link: '/community/security' },
      ],
    },
  ];
}

function sidebarNews() {
  return [
    {
      text: '📰 Latest News',
      collapsed: false,
      items: [
        { text: 'Announcements', link: '/news/announcements' },
        { text: 'Blog', link: '/news/blog' },
      ],
    },
  ];
}

/**
 * Return a string that puts together the pagePage, a '#', then the given id
 * @returns  the fully formed path
 */
function pathToId(pagePath: string, id = ''): string {
  return pagePath + '#' + id;
}
