import { version } from '../../../package.json';
import MermaidExample from './mermaid-markdown-all';
import { defineConfig, MarkdownOptions } from 'vitepress';

const allMarkdownTransformers: MarkdownOptions = {
  // the shiki theme to highlight code blocks
  theme: 'github-dark',
  config: async (md) => {
    await MermaidExample(md);
  },
};

export default defineConfig({
  lang: 'en-US',
  title: 'Mermaid',
  description: 'Create diagrams and visualizations using text and code.',
  base: '/',
  markdown: allMarkdownTransformers,
  head: [['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]],
  themeConfig: {
    nav: nav(),
    editLink: {
      pattern: 'https://github.com/mermaid-js/mermaid/edit/develop/packages/mermaid/src/docs/:path',
      text: 'Edit this page on GitHub',
    },
    sidebar: {
      '/': sidebarAll(),
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/mermaid-js/mermaid' },
      { icon: 'slack', link: 'https://mermaid-talk.slack.com' },
    ],
  },
});

function nav() {
  return [
    { text: 'Docs', link: '/intro/', activeMatch: '/intro/' },
    {
      text: 'Tutorials',
      link: '/config/Tutorials',
      activeMatch: '/config/',
    },
    { text: 'Integrations', link: '/ecosystem/integrations', activeMatch: '/ecosystem/' },
    {
      text: version,
      items: [
        {
          text: 'Changelog',
          link: 'https://github.com/mermaid-js/mermaid/blob/develop/CHANGELOG.md',
        },
        {
          text: 'Contributing',
          link: 'https://github.com/mermaid-js/mermaid/blob/develop/CONTRIBUTING.md',
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
    ...sidebarEcosystem(),
    ...sidebarConfig(),
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
        { text: 'Mindmaps 🔥', link: '/syntax/mindmap' },
        { text: 'Timeline 🔥', link: '/syntax/timeline' },
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
        { text: 'FAQ', link: '/config/faq' },
      ],
    },
  ];
}

function sidebarEcosystem() {
  return [
    {
      text: '📚 Ecosystem',
      collapsible: true,
      items: [
        { text: 'Showcases', link: '/ecosystem/showcases' },
        { text: 'Use-Cases and Integrations', link: '/ecosystem/integrations' },
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
        {
          text: 'Development and Contribution',
          link: '/community/development',
        },
        { text: 'Adding Diagrams', link: '/community/newDiagram' },
        { text: 'Security', link: '/community/security' },
      ],
    },
  ];
}
