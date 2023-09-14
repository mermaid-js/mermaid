import type { GanttDiagramConfig, MermaidConfig } from '../config.type.js';
import { frontMatterRegex } from './regexes.js';
// The "* as yaml" part is necessary for tree-shaking
import * as yaml from 'js-yaml';

interface FrontMatterMetadata {
  title?: string;
  // Allows custom display modes. Currently used for compact mode in gantt charts.
  displayMode?: GanttDiagramConfig['displayMode'];
  config?: MermaidConfig;
}

export interface FrontMatterResult {
  text: string;
  metadata: FrontMatterMetadata;
}

/**
 * Extract and parse frontmatter from text, if present, and sets appropriate
 * properties in the provided db.
 * @param text - The text that may have a YAML frontmatter.
 * @returns text with frontmatter stripped out
 */
export function extractFrontMatter(text: string): FrontMatterResult {
  const matches = text.match(frontMatterRegex);
  if (!matches) {
    return {
      text,
      metadata: {},
    };
  }

  let parsed: FrontMatterMetadata =
    yaml.load(matches[1], {
      // To support config, we need JSON schema.
      // https://www.yaml.org/spec/1.2/spec.html#id2803231
      schema: yaml.JSON_SCHEMA,
    }) ?? {};

  // To handle runtime data type changes
  parsed = typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};

  const metadata: FrontMatterMetadata = {};

  // Only add properties that are explicitly supported, if they exist
  if (parsed.displayMode) {
    metadata.displayMode = parsed.displayMode.toString() as GanttDiagramConfig['displayMode'];
  }
  if (parsed.title) {
    metadata.title = parsed.title.toString();
  }
  if (parsed.config) {
    metadata.config = parsed.config;
  }

  return {
    text: text.slice(matches[0].length),
    metadata,
  };
}
