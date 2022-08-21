import DOMPurify from 'dompurify';
import { MermaidConfig } from '../../config.type';

/**
 * Gets the rows of lines in a string
 *
 * @param {string | undefined} s The string to check the lines for
 * @returns {string[]} The rows in that string
 */
export const getRows = (s?: string): string[] => {
  if (!s) return [''];
  const str = breakToPlaceholder(s).replace(/\\n/g, '#br#');
  return str.split('#br#');
};

/**
 * Removes script tags from a text
 *
 * @param {string} txt The text to sanitize
 * @returns {string} The safer text
 */
export const removeScript = (txt: string): string => {
  return DOMPurify.sanitize(txt);
};

const sanitizeMore = (text: string, config: MermaidConfig) => {
  // TODO Q: Should this check really be here? Feels like we should be sanitizing it regardless.
  if (config.flowchart?.htmlLabels !== false) {
    const level = config.securityLevel;
    if (level === 'antiscript' || level === 'strict') {
      text = removeScript(text);
    } else if (level !== 'loose') {
      text = breakToPlaceholder(text);
      text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      text = text.replace(/=/g, '&equals;');
      text = placeholderToBreak(text);
    }
  }
  return text;
};

export const sanitizeText = (text: string, config: MermaidConfig): string => {
  if (!text) return text;
  if (config.dompurifyConfig) {
    text = DOMPurify.sanitize(sanitizeMore(text, config), config.dompurifyConfig).toString();
  } else {
    text = DOMPurify.sanitize(sanitizeMore(text, config));
  }
  return text;
};

export const sanitizeTextOrArray = (
  a: string | string[] | string[][],
  config: MermaidConfig
): string | string[] => {
  if (typeof a === 'string') return sanitizeText(a, config);
  // TODO Q: Do we need flat?
  return a.flat().map((x: string) => sanitizeText(x, config));
};

export const lineBreakRegex = /<br\s*\/?>/gi;

/**
 * Whether or not a text has any linebreaks
 *
 * @param {string} text The text to test
 * @returns {boolean} Whether or not the text has breaks
 */
export const hasBreaks = (text: string): boolean => {
  return lineBreakRegex.test(text);
};

/**
 * Splits on <br> tags
 *
 * @param {string} text Text to split
 * @returns {string[]} List of lines as strings
 */
export const splitBreaks = (text: string): string[] => {
  return text.split(lineBreakRegex);
};

/**
 * Converts placeholders to linebreaks in HTML
 *
 * @param {string} s HTML with placeholders
 * @returns {string} HTML with breaks instead of placeholders
 */
const placeholderToBreak = (s: string): string => {
  return s.replace(/#br#/g, '<br/>');
};

/**
 * Opposite of `placeholderToBreak`, converts breaks to placeholders
 *
 * @param {string} s HTML string
 * @returns {string} String with placeholders
 */
const breakToPlaceholder = (s: string): string => {
  return s.replace(lineBreakRegex, '#br#');
};

/**
 * Gets the current URL
 *
 * @param {boolean} useAbsolute Whether to return the absolute URL or not
 * @returns {string} The current URL
 */
const getUrl = (useAbsolute: boolean): string => {
  let url = '';
  // TODO Q: If useAbsolute if false, empty string is returned. Bug?
  if (useAbsolute) {
    url =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      window.location.search;
    // TODO Q: Why is this necessary?
    url = url.replaceAll(/\(/g, '\\(');
    url = url.replaceAll(/\)/g, '\\)');
  }

  return url;
};

/**
 * Converts a string/boolean into a boolean
 *
 * @param {string | boolean} val String or boolean to convert
 * @returns {boolean} The result from the input
 */
// TODO Q: Should we make this check more specific? 'False', '0', 'null' all will evaluate to true.
export const evaluate = (val: string | boolean): boolean =>
  val === 'false' || val === false ? false : true;

export default {
  getRows,
  sanitizeText,
  sanitizeTextOrArray,
  hasBreaks,
  splitBreaks,
  lineBreakRegex,
  removeScript,
  getUrl,
  evaluate,
};
