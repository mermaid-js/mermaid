import DOMPurify from 'dompurify';
import type { MermaidConfig } from '../../config.type.js';

// Remove and ignore br:s
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

const TEMPORARY_ATTRIBUTE = 'data-temp-href-target';

DOMPurify.addHook('beforeSanitizeAttributes', (node: Element) => {
  if (node.tagName === 'A' && node.hasAttribute('target')) {
    node.setAttribute(TEMPORARY_ATTRIBUTE, node.getAttribute('target') || '');
  }
});

DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
  if (node.tagName === 'A' && node.hasAttribute(TEMPORARY_ATTRIBUTE)) {
    node.setAttribute('target', node.getAttribute(TEMPORARY_ATTRIBUTE) || '');
    node.removeAttribute(TEMPORARY_ATTRIBUTE);
    if (node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener');
    }
  }
});

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
 * Wrapper around Math.max which removes non-numeric values
 * Returns the larger of a set of supplied numeric expressions.
 * @param values - Numeric expressions to be evaluated
 * @returns The smaller value
 */
export const getMax = function (...values: number[]): number {
  const newValues: number[] = values.filter((value) => {
    return !isNaN(value);
  });
  return Math.max(...newValues);
};

/**
 * Wrapper around Math.min which removes non-numeric values
 * Returns the smaller of a set of supplied numeric expressions.
 * @param values - Numeric expressions to be evaluated
 * @returns The smaller value
 */
export const getMin = function (...values: number[]): number {
  const newValues: number[] = values.filter((value) => {
    return !isNaN(value);
  });
  return Math.min(...newValues);
};

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
export const parseGenericTypes = function (input: string): string {
  const inputSets = input.split(/(,)/);
  const output = [];

  for (let i = 0; i < inputSets.length; i++) {
    let thisSet = inputSets[i];

    // if the original input included a value such as "~K, V~"", these will be split into
    // an array of ["~K",","," V~"].
    // This means that on each call of processSet, there will only be 1 ~ present
    // To account for this, if we encounter a ",", we are checking the previous and next sets in the array
    // to see if they contain matching ~'s
    // in which case we are assuming that they should be rejoined and sent to be processed
    if (thisSet === ',' && i > 0 && i + 1 < inputSets.length) {
      const previousSet = inputSets[i - 1];
      const nextSet = inputSets[i + 1];

      if (shouldCombineSets(previousSet, nextSet)) {
        thisSet = previousSet + ',' + nextSet;
        i++; // Move the index forward to skip the next iteration since we're combining sets
        output.pop();
      }
    }

    output.push(processSet(thisSet));
  }

  return output.join('');
};

export const countOccurrence = (string: string, substring: string): number => {
  return Math.max(0, string.split(substring).length - 1);
};

const shouldCombineSets = (previousSet: string, nextSet: string): boolean => {
  const prevCount = countOccurrence(previousSet, '~');
  const nextCount = countOccurrence(nextSet, '~');

  return prevCount === 1 && nextCount === 1;
};

const processSet = (input: string): string => {
  const tildeCount = countOccurrence(input, '~');
  let hasStartingTilde = false;

  if (tildeCount <= 1) {
    return input;
  }

  // If there is an odd number of tildes, and the input starts with a tilde, we need to remove it and add it back in later
  if (tildeCount % 2 !== 0 && input.startsWith('~')) {
    input = input.substring(1);
    hasStartingTilde = true;
  }

  const chars = [...input];

  let first = chars.indexOf('~');
  let last = chars.lastIndexOf('~');

  while (first !== -1 && last !== -1 && first !== last) {
    chars[first] = '<';
    chars[last] = '>';

    first = chars.indexOf('~');
    last = chars.lastIndexOf('~');
  }

  // Add the starting tilde back in if we removed it
  if (hasStartingTilde) {
    chars.unshift('~');
  }

  return chars.join('');
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
  getMax,
  getMin,
};
