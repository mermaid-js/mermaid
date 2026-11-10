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

/**
 * Control characters, the Unicode line breaks and the bidirectional format controls
 * (U+202A-202E, U+2066-2069), which would split a log line or reorder the text around them.
 */
const CONTROL_CHARACTER = /[\p{Cc}\u2028\u2029\u202A-\u202E\u2066-\u2069]/u;

/** `char`, one code point, or its backslash escape when it is a control character. */
const escapeControl = (char: string): string =>
  CONTROL_CHARACTER.test(char)
    ? (SHORT_ESCAPES.get(char) ??
      `\\u${char.charCodeAt(0).toString(HEX_RADIX).padStart(UNICODE_ESCAPE_DIGITS, '0')}`)
    : char;

/** `char`, one code point, as it is written inside a double-quoted YAML string. */
const escapeQuoted = (char: string): string =>
  char === '"' || char === '\\' ? `\\${char}` : escapeControl(char);

/**
 * `text` with each code point written by `escape`, cut after the last whole escape that fits
 * the limit. A cut never splits an escape or a surrogate pair, so a quoted key stays valid YAML.
 */
const shownWith = (text: string, escape: (char: string) => string): string => {
  let kept = '';
  for (const char of text) {
    const written = escape(char);
    if (kept.length + written.length > MAX_SHOWN_LENGTH) {
      return `${kept}...`;
    }
    kept += written;
  }
  return kept;
};

/** Escaped before it is cut, so the shown text is one line of at most the limit. */
const shown = (text: string): string => shownWith(text, escapeControl);

/** A part that YAML reads back as the same key without quotes. */
const PLAIN_YAML_KEY = /^[\w-]+$/;

/**
 * Shows one part of the suggested nested form. A part that is not a plain word is written as a
 * double-quoted YAML string, whose `\n` and `\uXXXX` escapes are the ones `escapeControl` makes,
 * so the suggestion means the key the author wrote.
 */
const suggestedKey = (segment: string): string =>
  PLAIN_YAML_KEY.test(segment) ? shown(segment) : `"${shownWith(segment, escapeQuoted)}"`;

/** Writes `['elk', 'mergeEdges']` as `elk: { mergeEdges: ... }`. */
const nestedForm = (path: string[]): string =>
  path
    .slice(0, -1)
    .reduceRight(
      (inner, segment) => `${suggestedKey(segment)}: { ${inner} }`,
      `${suggestedKey(path.at(-1) ?? '')}: ...`
    );

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
      const nested = nestedForm(path.slice(0, MAX_SHOWN_SEGMENTS));
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
