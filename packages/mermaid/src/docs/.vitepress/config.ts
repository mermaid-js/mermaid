import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MarkdownOptions } from 'vitepress';
import { defineConfig } from 'vitepress';
import packageJson from '../../../package.json' with { type: 'json' };
import { betaSyntaxPages } from './betaDiagrams.js';
import { getHeaderLogo, getHeaderLogoLink, withConditionalHomeNav } from './headerDomainRules.js';
import { applyHomePageHeroCopy } from './homepageHeroCopy.js';
import MermaidExample from './mermaid-markdown-all.js';
import { addNoindex, isNoindexPage } from './noindexPages.js';
import { addPageMetadata } from './pageMetadata.js';
import { getDocsHostname, getSiteBase, getSiteUrl } from './siteUrl.js';

const siteUrl = getSiteUrl();

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
  base: getSiteBase(siteUrl),
  markdown: allMarkdownTransformers,
  sitemap: {
    hostname: siteUrl,
    transformItems: (items) => items.filter((item) => !isNoindexPage(item.url)),
  },
  buildEnd: ({ outDir }) => {
    writeFileSync(
      join(outDir, 'robots.txt'),
      `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`
    );
  },
  ignoreDeadLinks: [
    // ignore all localhost links
    /^https?:\/\/localhost/,
  ],
  transformPageData: (pageData, { siteConfig }) => {
    addPageMetadata(
      pageData,
      readFileSync(join(siteConfig.srcDir, pageData.relativePath), 'utf8'),
      siteConfig.site.description,
      siteUrl
    );
    applyHomePageHeroCopy(pageData, getDocsHostname());
    addNoindex(pageData);
  },
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: `${getSiteBase(siteUrl)}favicon.ico` }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: `${siteUrl}mermaid-logo-horizontal.png` }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
  ],
  themeConfig: {
    logo: getHeaderLogo(getDocsHostname()),
    logoLink: getHeaderLogoLink(getDocsHostname()),
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

  return withConditionalHomeNav(baseNav, getDocsHostname());
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
        { text: 'Examples', link: '/syntax/all-examples' },
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
        syntaxItem('Flowchart', 'flowchart'),
        syntaxItem('Swimlanes Diagram', 'swimlanes'),
        syntaxItem('Sequence Diagram', 'sequenceDiagram'),
        syntaxItem('Class Diagram', 'classDiagram'),
        syntaxItem('State Diagram', 'stateDiagram'),
        syntaxItem('Entity Relationship Diagram', 'entityRelationshipDiagram'),
        syntaxItem('User Journey', 'userJourney'),
        syntaxItem('Gantt', 'gantt'),
        syntaxItem('Pie Chart', 'pie'),
        syntaxItem('Quadrant Chart', 'quadrantChart'),
        syntaxItem('Requirement Diagram', 'requirementDiagram'),
        syntaxItem('Use Case Diagram', 'usecase'),
        syntaxItem('GitGraph (Git) Diagram', 'gitgraph'),
        syntaxItem('C4 Diagram', 'c4'),
        syntaxItem('Mindmaps', 'mindmap'),
        syntaxItem('Timeline', 'timeline'),
        syntaxItem('ZenUML', 'zenuml'),
        syntaxItem('Sankey', 'sankey'),
        syntaxItem('XY Chart', 'xyChart'),
        syntaxItem('Block Diagram', 'block'),
        syntaxItem('Packet', 'packet'),
        syntaxItem('Kanban', 'kanban'),
        syntaxItem('Architecture', 'architecture'),
        syntaxItem('Radar', 'radar'),
        syntaxItem('Event Modeling', 'eventmodeling'),
        syntaxItem('Treemap', 'treemap'),
        syntaxItem('Venn', 'venn'),
        syntaxItem('Ishikawa', 'ishikawa'),
        syntaxItem('Wardley', 'wardley'),
        syntaxItem('Cynefin', 'cynefin'),
        syntaxItem('TreeView', 'treeView'),
        // Agentflow is deliberately not listed while it is beta. The page at
        // `/syntax/agentflow` still builds and is reachable by URL; it is just
        // not announced in the nav until the syntax is declared stable.
      ],
    },
  ];
}

function syntaxItem(text: string, page: string) {
  return {
    text: betaSyntaxPages.has(page) ? `${text} <span class="VPBadge info">Beta</span>` : text,
    link: `/syntax/${page}`,
  };
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
        { text: 'Adding Layouts', link: '/community/layout-makers-guide' },
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
