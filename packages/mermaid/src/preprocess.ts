import { cleanupComments } from './diagram-api/comments.js';
import { extractFrontMatter } from './diagram-api/frontmatter.js';
import type { DiagramMetadata } from './diagram-api/types.js';
import utils, { cleanAndMerge, removeDirectives } from './utils.js';

const cleanupText = (code: string) => {
  return (
    code
      // parser problems on CRLF ignore all CR and leave LF;;
      .replace(/\r\n?/g, '\n')
      // clean up html tags so that all attributes use single quotes, parser throws error on double quotes
      .replace(
        /<(\w+)([^>]*)>/g,
        (match, tag, attributes) => '<' + tag + attributes.replace(/="([^"]*)"/g, "='$1'") + '>'
      )
  );
};

const processFrontmatter = (code: string) => {
  const { text, metadata } = extractFrontMatter(code);
  const { displayMode, title, config = {} } = metadata;
  if (displayMode) {
    // Needs to be supported for legacy reasons
    if (!config.gantt) {
      config.gantt = {};
    }
    config.gantt.displayMode = displayMode;
  }
  return { title, config, text };
};

const processDirectives = (code: string) => {
  const initDirective = utils.detectInit(code) ?? {};
  const wrapDirectives = utils.detectDirective(code, 'wrap');
  if (Array.isArray(wrapDirectives)) {
    initDirective.wrap = wrapDirectives.some(({ type }) => type === 'wrap');
  } else if (wrapDirectives?.type === 'wrap') {
    initDirective.wrap = true;
  }
  return {
    text: removeDirectives(code),
    directive: initDirective,
  };
};

/**
 * Preprocess the given code by cleaning it up, extracting front matter and directives,
 * cleaning and merging configuration, and removing comments.
 * @param code - The code to preprocess.
 * @returns The object containing the preprocessed code, title, and configuration.
 */
export function preprocessDiagram(code: string) {
  const cleanedCode = cleanupText(code);
  const frontMatterResult = processFrontmatter(cleanedCode);
  const directiveResult = processDirectives(frontMatterResult.text);
  const config = cleanAndMerge(frontMatterResult.config, directiveResult.directive);
  code = cleanupComments(directiveResult.text);
  return {
    code,
    title: frontMatterResult.title,
    config,
  } satisfies DiagramMetadata & { code: string };
}
