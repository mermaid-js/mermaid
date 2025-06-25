import type { CanonicalUrlConfig } from './canonical-urls.js';

/**
 * Canonical URL configuration for Mermaid documentation
 *
 * This file contains the configuration for generating canonical URLs
 * for the Mermaid documentation site.
 */
export const canonicalConfig: CanonicalUrlConfig = {
  // Base URL for the Mermaid documentation site
  baseUrl: 'https://docs.mermaidchart.com',

  // Disable automatic generation - only use specificCanonicalUrls
  autoGenerate: false,

  // Patterns for pages to exclude from automatic canonical URL generation
  excludePatterns: [
    // Exclude the main index page (handled by VitePress home layout)
    'index.md',

    // Exclude any draft or temporary files
    'draft-*.md',
    '**/draft-*.md',
    'temp-*.md',
    '**/temp-*.md',
    '*.draft.md',
    '**/*.draft.md',

    // Exclude any test files
    '*.test.md',
    '**/*.test.md',
    '*.spec.md',
    '**/*.spec.md',

    // You can add more patterns here as needed
    // Examples:
    // '**/internal/**',  // Exclude internal documentation
    // '**/archive/**',   // Exclude archived content
  ],

  // URL transformation rules
  transformations: {
    // Remove index.md from URLs (e.g., /intro/index.md -> /intro/)
    //removeIndex: true,

    // Remove .md extension from URLs (e.g., /syntax/flowchart.md -> /syntax/flowchart)
    removeMarkdownExtension: true,

    // Custom path transformations
    customTransforms: [
      // Example: Redirect old paths to new paths
      // { pattern: /^old-syntax\//, replacement: 'syntax/' },
      // Example: Handle special cases
      // { pattern: /^config\/setup\/README$/, replacement: 'config/setup/' },
      // Add your custom transformations here
    ],
  },
};

/**
 * Pages that should have specific canonical URLs
 *
 * Since autoGenerate is set to false, ONLY pages listed here will get canonical URLs.
 *
 * Usage: Add entries to this object where the key is the relative path
 * of the markdown file and the value is the desired canonical URL.
 *
 * Examples:
 * - 'intro/index.md': 'https://docs.mermaidchart.com/intro/index.html'
 * - 'syntax/flowchart.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/flowchart.html'
 * - 'config/configuration.md': 'https://docs.mermaidchart.com/mermaid-oss/config/configuration.html'
 */
export const specificCanonicalUrls: Record<string, string> = {
  // Add your specific canonical URLs here
  // Example:
  // 'syntax/flowchart.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/flowchart.html',

  // Intro section
  'intro/index.md': 'https://docs.mermaidchart.com/intro/index.html',
  'intro/getting-started.md':
    'https://docs.mermaidchart.com/mermaid-oss/intro/getting-started.html',
  'intro/syntax-reference.md':
    'https://docs.mermaidchart.com/mermaid-oss/intro/syntax-reference.html',

  // Syntax section
  'syntax/flowchart.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/flowchart.html',
  'syntax/sequenceDiagram.md':
    'https://docs.mermaidchart.com/mermaid-oss/syntax/sequenceDiagram.html',
  'syntax/classDiagram.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/classDiagram.html',
  'syntax/stateDiagram.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/stateDiagram.html',
  'syntax/entityRelationshipDiagram.md':
    'https://docs.mermaidchart.com/mermaid-oss/syntax/entityRelationshipDiagram.html',
  'syntax/userJourney.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/userJourney.html',
  'syntax/gantt.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/gantt.html',
  'syntax/pie.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/pie.html',
  'syntax/quadrantChart.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/quadrantChart.html',
  'syntax/requirementDiagram.md':
    'https://docs.mermaidchart.com/mermaid-oss/syntax/requirementDiagram.html',
  'syntax/mindmap.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/mindmap.html',
  'syntax/timeline.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/timeline.html',
  'syntax/gitgraph.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/gitgraph.html',
  'syntax/c4.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/c4.html',
  'syntax/sankey.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/sankey.html',
  'syntax/xyChart.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/xyChart.html',
  'syntax/block.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/block.html',
  'syntax/packet.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/packet.html',
  'syntax/kanban.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/kanban.html',
  'syntax/architecture.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/architecture.html',
  'syntax/radar.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/radar.html',
  'syntax/examples.md': 'https://docs.mermaidchart.com/mermaid-oss/syntax/examples.html',

  // Config section
  'config/configuration.md': 'https://docs.mermaidchart.com/mermaid-oss/config/configuration.html',
  'config/usage.md': 'https://docs.mermaidchart.com/mermaid-oss/config/usage.html',
  'config/icons.md': 'https://docs.mermaidchart.com/mermaid-oss/config/icons.html',
  'config/directives.md': 'https://docs.mermaidchart.com/mermaid-oss/config/directives.html',
  'config/theming.md': 'https://docs.mermaidchart.com/mermaid-oss/config/theming.html',
  'config/math.md': 'https://docs.mermaidchart.com/mermaid-oss/config/math.html',
  'config/accessibility.md': 'https://docs.mermaidchart.com/mermaid-oss/config/accessibility.html',
  'config/mermaidCLI.md': 'https://docs.mermaidchart.com/mermaid-oss/config/mermaidCLI.html',
  'config/faq.md': 'https://docs.mermaidchart.com/mermaid-oss/config/faq.html',

  // Ecosystem section
  'ecosystem/mermaid-chart.md':
    'https://docs.mermaidchart.com/mermaid-oss/ecosystem/mermaid-chart.html',
  'ecosystem/tutorials.md': 'https://docs.mermaidchart.com/mermaid-oss/ecosystem/tutorials.html',
  'ecosystem/integrations-community.md':
    'https://docs.mermaidchart.com/mermaid-oss/ecosystem/integrations-community.html',
  'ecosystem/integrations-create.md':
    'https://docs.mermaidchart.com/mermaid-oss/ecosystem/integrations-create.html',

  // Community section
  'community/intro.md': 'https://docs.mermaidchart.com/mermaid-oss/community/intro.html',
  'community/contributing.md':
    'https://docs.mermaidchart.com/mermaid-oss/community/contributing.html',
  'community/new-diagram.md':
    'https://docs.mermaidchart.com/mermaid-oss/community/new-diagram.html',
  'community/questions-and-suggestions.md':
    'https://docs.mermaidchart.com/mermaid-oss/community/questions-and-suggestions.html',
  'community/security.md': 'https://docs.mermaidchart.com/mermaid-oss/community/security.html',
};

/**
 * Helper function to get canonical URL for a specific page
 * This can be used in frontmatter or for manual overrides
 */
export function getCanonicalUrl(relativePath: string): string | undefined {
  return specificCanonicalUrls[relativePath];
}
