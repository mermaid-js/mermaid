import type { GanttDiagramConfig, MermaidConfig } from '../config.type.js';
import defaultConfig from '../defaultConfig.js';
import { log } from '../logger.js';
import { matchFrontMatter } from './regexes.js';
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

/** Top-level config keys that hold a section of options, such as `elk` or `flowchart`. */
const CONFIG_SECTIONS = new Set(
  Object.entries(defaultConfig)
    .filter(([, value]) => typeof value === 'object' && value !== null && !Array.isArray(value))
    .map(([key]) => key)
);

/**
 * The deepest option in the default configuration, `c4.flowchart.subGraphTitleMargin.top`,
 * has four segments.
 */
const MAX_SHOWN_SEGMENTS = 4;

/** One terminal line. A longer key is cut, so a key the author controls cannot flood the log. */
export const MAX_SHOWN_LENGTH = 80;

const HEX_RADIX = 16;
const UNICODE_ESCAPE_DIGITS = 4;
const SHORT_ESCAPES = new Map([
  ['\n', '\\n'],
  ['\r', '\\r'],
  ['\t', '\\t'],
]);

/** Control characters and the Unicode line breaks, which would split or restyle a log line. */
const escapeControls = (text: string): string =>
  text.replace(
    /[\p{Cc}\u2028\u2029]/gu,
    (char) =>
      SHORT_ESCAPES.get(char) ??
      `\\u${char.charCodeAt(0).toString(HEX_RADIX).padStart(UNICODE_ESCAPE_DIGITS, '0')}`
  );

const clip = (text: string): string =>
  text.length > MAX_SHOWN_LENGTH ? `${text.slice(0, MAX_SHOWN_LENGTH)}...` : text;

/** Escaped before it is cut, so the shown text is one line of at most the limit. */
const shown = (text: string): string => clip(escapeControls(text));

/** Writes `['elk', 'mergeEdges']` as `elk: { mergeEdges: ... }`. */
const nestedForm = (path: string[]): string =>
  path
    .slice(0, -1)
    .reduceRight((inner, segment) => `${segment}: { ${inner} }`, `${path.at(-1)}: ...`);

/**
 * The YAML is parsed without expanding dots, so `elk.mergeEdges: true` is one key that no
 * section owns, and the sanitiser drops it. Only the first segment is checked against the
 * sections, so a dotted key of any other shape stays silent. The key is the author's text, so
 * it is shown cut short and with its control characters escaped.
 */
const warnAboutDottedKeys = (config: MermaidConfig): void => {
  for (const key of Object.keys(config)) {
    const path = key.split('.');
    if (path.length > 1 && path.every(Boolean) && CONFIG_SECTIONS.has(path[0])) {
      const nested = nestedForm(path.slice(0, MAX_SHOWN_SEGMENTS).map(shown));
      log.warn(`config key '${shown(key)}' is ignored; write it nested: ${nested}`);
    }
  }
};

/**
 * Extract and parse frontmatter from text, if present, and sets appropriate
 * properties in the provided db.
 * @param text - The text that may have a YAML frontmatter.
 * @returns text with frontmatter stripped out
 */
export function extractFrontMatter(text: string): FrontMatterResult {
  const match = matchFrontMatter(text);
  if (!match) {
    return {
      text,
      metadata: {},
    };
  }

  // Dedent by the captured indent — js-yaml rejects tab-indented documents.
  const indent = match.indent;
  const yamlBody = indent
    ? match.body
        .split('\n')
        .map((line) => (line.startsWith(indent) ? line.slice(indent.length) : line))
        .join('\n')
    : match.body;

  let parsed: FrontMatterMetadata =
    yaml.load(yamlBody, {
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
    warnAboutDottedKeys(parsed.config);
    metadata.config = parsed.config;
  }

  return {
    text: text.slice(match.length),
    metadata,
  };
}
