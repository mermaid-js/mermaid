import { MermaidConfig } from '../config.type.js';
import { DiagramDB } from './types.js';
// The "* as yaml" part is necessary for tree-shaking
import * as yaml from 'js-yaml';

// Match Jekyll-style front matter blocks (https://jekyllrb.com/docs/front-matter/).
// Based on regex used by Jekyll: https://github.com/jekyll/jekyll/blob/6dd3cc21c40b98054851846425af06c64f9fb466/lib/jekyll/document.rb#L10
// Note that JS doesn't support the "\A" anchor, which means we can't use
// multiline mode.
// Relevant YAML spec: https://yaml.org/spec/1.2.2/#914-explicit-documents
export const frontMatterRegex = /^-{3}\s*[\n\r](.*?)[\n\r]-{3}\s*[\n\r]+/s;

interface FrontMatterMetadata {
  title?: string;
  // Allows custom display modes. Currently used for compact mode in gantt charts.
  displayMode?: string;
  config?: MermaidConfig;
}

/**
 * Extract and parse frontmatter from text, if present, and sets appropriate
 * properties in the provided db.
 * @param text - The text that may have a YAML frontmatter.
 * @param db - Diagram database, could be of any diagram.
 * @param setDiagramConfig - Optional function to set diagram config.
 * @returns text with frontmatter stripped out
 */
export function extractFrontMatter(
  text: string,
  db: DiagramDB,
  setDiagramConfig?: (config: MermaidConfig) => void
): string {
  const matches = text.match(frontMatterRegex);
  if (!matches) {
    return text;
  }

  const parsed: FrontMatterMetadata = yaml.load(matches[1], {
    // To support config, we need JSON schema.
    // https://www.yaml.org/spec/1.2/spec.html#id2803231
    schema: yaml.JSON_SCHEMA,
  }) as FrontMatterMetadata;

  if (parsed?.title) {
    // toString() is necessary because YAML could parse the title as a number/boolean
    db.setDiagramTitle?.(parsed.title.toString());
  }

  if (parsed?.displayMode) {
    // toString() is necessary because YAML could parse the title as a number/boolean
    db.setDisplayMode?.(parsed.displayMode.toString());
  }

  if (parsed?.config) {
    setDiagramConfig?.(parsed.config);
  }

  return text.slice(matches[0].length);
}
