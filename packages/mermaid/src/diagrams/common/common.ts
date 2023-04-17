import DOMPurify from 'dompurify';
import { MermaidConfig } from '../../config.type.js';

export const lineBreakRegex = /<br\s*\/?>/gi;

/**
 * Gets the rows of lines in a string
 *
 * @param s - The string to check the lines for
 * @returns The rows in that string
 */
export const getRows = (s?: string): string[] => {
  if (!s) {
    return [''];
  }
  const str = breakToPlaceholder(s).replace(/\\n/g, '#br#');
  return str.split('#br#');
};

/**
 * Removes script tags from a text
 *
 * @param txt - The text to sanitize
 * @returns The safer text
 */
export const removeScript = (txt: string): string => {
  return DOMPurify.sanitize(txt);
};

const sanitizeMore = (text: string, config: MermaidConfig) => {
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
  if (!text) {
    return text;
  }
  if (config.dompurifyConfig) {
    text = DOMPurify.sanitize(sanitizeMore(text, config), config.dompurifyConfig).toString();
  } else {
    text = DOMPurify.sanitize(sanitizeMore(text, config), {
      FORBID_TAGS: ['style'],
    }).toString();
  }
  return text;
};

export const sanitizeTextOrArray = (
  a: string | string[] | string[][],
  config: MermaidConfig
): string | string[] => {
  if (typeof a === 'string') {
    return sanitizeText(a, config);
  }
  // TODO: Refactor to avoid flat.
  return a.flat().map((x: string) => sanitizeText(x, config));
};

/**
 * Whether or not a text has any line breaks
 *
 * @param text - The text to test
 * @returns Whether or not the text has breaks
 */
export const hasBreaks = (text: string): boolean => {
  return lineBreakRegex.test(text);
};

/**
 * Splits on <br> tags
 *
 * @param text - Text to split
 * @returns List of lines as strings
 */
export const splitBreaks = (text: string): string[] => {
  return text.split(lineBreakRegex);
};

/**
 * Converts placeholders to line breaks in HTML
 *
 * @param s - HTML with placeholders
 * @returns HTML with breaks instead of placeholders
 */
const placeholderToBreak = (s: string): string => {
  return s.replace(/#br#/g, '<br/>');
};

/**
 * Opposite of `placeholderToBreak`, converts breaks to placeholders
 *
 * @param s - HTML string
 * @returns String with placeholders
 */
const breakToPlaceholder = (s: string): string => {
  return s.replace(lineBreakRegex, '#br#');
};

/**
 * Gets the current URL
 *
 * @param useAbsolute - Whether to return the absolute URL or not
 * @returns The current URL
 */
const getUrl = (useAbsolute: boolean): string => {
  let url = '';
  if (useAbsolute) {
    url =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      window.location.search;
    url = url.replaceAll(/\(/g, '\\(');
    url = url.replaceAll(/\)/g, '\\)');
  }

  return url;
};

/**
 * Converts a string/boolean into a boolean
 *
 * @param val - String or boolean to convert
 * @returns The result from the input
 */
export const evaluate = (val?: string | boolean): boolean =>
  val === false || ['false', 'null', '0'].includes(String(val).trim().toLowerCase()) ? false : true;

/**
 * Makes generics in typescript syntax
 *
 * @example
 * Array of array of strings in typescript syntax
 *
 * ```js
 * // returns "Array<Array<string>>"
 * parseGenericTypes('Array~Array~string~~');
 * ```
 * @param text - The text to convert
 * @returns The converted string
 */
export const parseGenericTypes = function (text: string): string {
  let cleanedText = text;

  if (text.split('~').length - 1 >= 2) {
    let newCleanedText = cleanedText;

    // use a do...while loop instead of replaceAll to detect recursion
    // e.g. Array~Array~T~~
    do {
      cleanedText = newCleanedText;
      newCleanedText = cleanedText.replace(/~([^\s,:;]+)~/, '<$1>');
    } while (newCleanedText != cleanedText);

    return parseGenericTypes(newCleanedText);
  } else {
    return cleanedText;
  }
};

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
