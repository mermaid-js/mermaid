import { DiagramDb } from './types.js';
// The "* as yaml" part is necessary for tree-shaking
import * as yaml from 'js-yaml';

// Match Jekyll-style front matter blocks (https://jekyllrb.com/docs/front-matter/).
// Based on regex used by Jekyll: https://github.com/jekyll/jekyll/blob/6dd3cc21c40b98054851846425af06c64f9fb466/lib/jekyll/document.rb#L10
// Note that JS doesn't support the "\A" anchor, which means we can't use
// multiline mode.
// Relevant YAML spec: https://yaml.org/spec/1.2.2/#914-explicit-documents
export const frontMatterRegex = /^-{3}\s*[\n\r](.*?)[\n\r]-{3}\s*[\n\r]+/s;

type FrontMatterMetadata = {
  title?: string;
};

/**
 * Extract and parse frontmatter from text, if present, and sets appropriate
 * properties in the provided db.
 * @param text - The text that may have a YAML frontmatter.
 * @param db - Diagram database, could be of any diagram.
 * @returns text with frontmatter stripped out
 */
export function extractFrontMatter(text: string, db: DiagramDb): string {
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

    return text.slice(matches[0].length);
  } else {
    return text;
  }
}
