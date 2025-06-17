import type { PageData } from 'vitepress';
import { canonicalConfig, specificCanonicalUrls } from './canonical-config.js';

/**
 * Configuration for canonical URL generation
 */
export interface CanonicalUrlConfig {
  /** Base URL for the site (e.g., 'https://mermaid.js.org') */
  baseUrl: string;
  /** Whether to automatically generate canonical URLs for pages without explicit ones */
  autoGenerate: boolean;
  /** Pages to exclude from automatic canonical URL generation (glob patterns supported) */
  excludePatterns?: string[];
  /** Custom URL transformations */
  transformations?: {
    /** Remove index.md from URLs */
    removeIndex?: boolean;
    /** Remove .md extension from URLs */
    removeMarkdownExtension?: boolean;
    /** Custom path transformations */
    customTransforms?: {
      pattern: RegExp;
      replacement: string;
    }[];
  };
}

/**
 * Default configuration for canonical URLs
 */
const defaultConfig: CanonicalUrlConfig = {
  baseUrl: 'https://mermaid.js.org',
  autoGenerate: true,
  excludePatterns: [
    // Exclude the home page as it's handled separately
    'index.md',
    // Exclude any temporary or draft files
    '**/draft-*',
    '**/temp-*',
  ],
  transformations: {
    removeIndex: true,
    removeMarkdownExtension: true,
    customTransforms: [
      // Transform any special cases here
      // Example: { pattern: /^old-path\//, replacement: 'new-path/' }
    ],
  },
};

/**
 * Check if a path matches any of the exclude patterns
 */
function shouldExcludePath(relativePath: string, excludePatterns: string[] = []): boolean {
  return excludePatterns.some((pattern) => {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.')
      .replace(/\./g, '\\.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(relativePath);
  });
}

/**
 * Transform a relative path to a canonical URL path
 */
function transformPath(relativePath: string, config: CanonicalUrlConfig): string {
  let transformedPath = relativePath;

  // Apply built-in transformations
  if (config.transformations?.removeMarkdownExtension) {
    transformedPath = transformedPath.replace(/\.md$/, '');
  }

  if (config.transformations?.removeIndex) {
    transformedPath = transformedPath.replace(/\/index$/, '/');
    if (transformedPath === 'index') {
      transformedPath = '';
    }
  }

  // Apply custom transformations
  if (config.transformations?.customTransforms) {
    for (const transform of config.transformations.customTransforms) {
      transformedPath = transformedPath.replace(transform.pattern, transform.replacement);
    }
  }

  // Ensure path starts with /
  if (transformedPath && !transformedPath.startsWith('/')) {
    transformedPath = '/' + transformedPath;
  }

  // Handle root path
  if (!transformedPath) {
    transformedPath = '/';
  }

  return transformedPath;
}

/**
 * Generate a canonical URL for a page
 */
function generateCanonicalUrl(relativePath: string, config: CanonicalUrlConfig): string {
  const transformedPath = transformPath(relativePath, config);
  return config.baseUrl + transformedPath;
}

/**
 * VitePress transformPageData hook to add canonical URLs
 */
export function addCanonicalUrls(pageData: PageData): void {
  const config = canonicalConfig;

  // Check for specific canonical URLs first
  const specificUrl = specificCanonicalUrls[pageData.relativePath];
  if (specificUrl) {
    addCanonicalToHead(pageData, specificUrl);
    return;
  }

  // Skip if canonical URL is already explicitly set in frontmatter
  if (pageData.frontmatter.canonical) {
    // If it's already a full URL, use as-is
    if (pageData.frontmatter.canonical.startsWith('http')) {
      addCanonicalToHead(pageData, pageData.frontmatter.canonical);
      return;
    }
    // If it's a relative path, convert to absolute URL
    const canonicalUrl = config.baseUrl + pageData.frontmatter.canonical;
    addCanonicalToHead(pageData, canonicalUrl);
    return;
  }

  // Skip if canonicalPath is set in frontmatter
  if (pageData.frontmatter.canonicalPath) {
    const canonicalUrl = config.baseUrl + pageData.frontmatter.canonicalPath;
    addCanonicalToHead(pageData, canonicalUrl);
    return;
  }

  // Skip if auto-generation is disabled
  if (!config.autoGenerate) {
    return;
  }

  // Skip if path should be excluded
  if (shouldExcludePath(pageData.relativePath, config.excludePatterns)) {
    return;
  }

  // Generate canonical URL
  const canonicalUrl = generateCanonicalUrl(pageData.relativePath, config);
  addCanonicalToHead(pageData, canonicalUrl);
}

/**
 * Add canonical URL to page head
 */
function addCanonicalToHead(pageData: PageData, canonicalUrl: string): void {
  // Initialize head array if it doesn't exist
  pageData.frontmatter.head = pageData.frontmatter.head || [];

  // Check if canonical link already exists
  const hasCanonical = pageData.frontmatter.head.some(
    (item: any) => Array.isArray(item) && item[0] === 'link' && item[1]?.rel === 'canonical'
  );

  // Add canonical link if it doesn't exist
  if (!hasCanonical) {
    pageData.frontmatter.head.push(['link', { rel: 'canonical', href: canonicalUrl }]);
  }
}

/**
 * Utility function to create a custom configuration
 * This can be used to override the default configuration
 */
export function createCanonicalUrlConfig(
  customConfig: Partial<CanonicalUrlConfig>
): CanonicalUrlConfig {
  return {
    ...defaultConfig,
    ...customConfig,
    transformations: {
      ...defaultConfig.transformations,
      ...customConfig.transformations,
      customTransforms: [
        ...(defaultConfig.transformations?.customTransforms || []),
        ...(customConfig.transformations?.customTransforms || []),
      ],
    },
  };
}
