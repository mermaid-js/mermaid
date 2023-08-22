import type { DiagramDB } from './types.js';
import { frontMatterRegex } from './regexes.js';
// The "* as yaml" part is necessary for tree-shaking
import * as yaml from 'js-yaml';

type FrontMatterMetadata = {
  title?: string;
  // Allows custom display modes. Currently used for compact mode in gantt charts.
  displayMode?: string;
};

/**
 * Extract and parse frontmatter from text, if present, and sets appropriate
 * properties in the provided db.
 * @param text - The text that may have a YAML frontmatter.
 * @param db - Diagram database, could be of any diagram.
 * @returns text with frontmatter stripped out
 */
export function extractFrontMatter(text: string, db: DiagramDB): string {
  const matches = text.match(frontMatterRegex);
  if (matches) {
    const parsed: FrontMatterMetadata = yaml.load(matches[1], {
      // To keep things simple, only allow strings, arrays, and plain objects.
      // https://www.yaml.org/spec/1.2/spec.html#id2802346
      schema: yaml.FAILSAFE_SCHEMA,
    }) as FrontMatterMetadata;

    if (parsed?.title) {
      db.setDiagramTitle?.(parsed.title);
    }

    if (parsed?.displayMode) {
      db.setDisplayMode?.(parsed.displayMode);
    }

    return text.slice(matches[0].length);
  } else {
    return text;
  }
}
