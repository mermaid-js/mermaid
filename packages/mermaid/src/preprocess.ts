import { cleanupComments } from './diagram-api/comments.js';
import { extractFrontMatter } from './diagram-api/frontmatter.js';
import type { DiagramCode, DiagramMetadata } from './diagram-api/types.js';
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
 *
 * Returns a {@link DiagramCode} object exposing `raw`, `cleaned`, `withComments`,
 * and `frontmatterLineOffset`. Diagrams that do not opt into inline-position
 * capture continue to use `cleaned` and see no behavioural change.
 *
 * @param code - The code to preprocess.
 * @returns The object containing the preprocessed code, title, and configuration.
 */
export function preprocessDiagram(code: string) {
  const rawCode = code;
  const normalizedCode = cleanupText(code);
  const frontMatterResult = processFrontmatter(normalizedCode);
  const directiveResult = processDirectives(frontMatterResult.text);
  const config = cleanAndMerge(frontMatterResult.config, directiveResult.directive);
  const withComments = directiveResult.text;
  const cleanedCode = cleanupComments(withComments);

  // Compute the number of lines occupied by frontmatter so that Jison @$ positions
  // (which are relative to the post-frontmatter text) can be mapped back to the
  // original source shown in the editor. Compare the normalized code (before
  // frontmatter removal) with the text after frontmatter removal to get the
  // frontmatter block length.
  const frontmatterLineOffset =
    normalizedCode.length > frontMatterResult.text.length
      ? (
          normalizedCode
            .substring(0, normalizedCode.length - frontMatterResult.text.length)
            .match(/\n/g) ?? []
        ).length
      : 0;

  return {
    code: {
      raw: rawCode,
      cleaned: cleanedCode,
      withComments,
      frontmatterLineOffset,
    },
    title: frontMatterResult.title,
    config,
  } satisfies DiagramMetadata & { code: DiagramCode };
}
