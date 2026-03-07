import type { CanonicalUrlConfig } from './canonical-urls.js';

/**
 * Canonical URL configuration for Mermaid documentation
 *
 * This file contains the configuration for generating canonical URLs
 * for the Mermaid documentation site.
 */
export const canonicalConfig: CanonicalUrlConfig = {
  // Base URL for the Mermaid documentation site
  baseUrl: 'https://mermaid.ai/open-source',

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
      // Transform homepage index.html to /
      // Note: transforms run *before* we ensure the path starts with '/'
      { pattern: /^index\.html$/, replacement: '' },
    ],
  },
};

export function getCanonicalUrl(relativePath: string): string | undefined {
  return `https://mermaid.ai/open-source/${relativePath}`;
}
