import DOMPurify from 'dompurify';
import { MermaidConfig } from '../../config.type.js';

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
  let finalResult = '';
  let skipNextSet = false;

  for (let i = 0; i < inputSets.length; i++) {
    const previousIndex = i - 1;
    const nextIndex = i + 1;
    let thisSet = inputSets[i];

    // based on logic below - if we have already combined this set with the previous, we want to skip it
    if (skipNextSet) {
      continue;
    }

    // if the original input included a value such as "~K, V~"", these will be split into
    // an array of ["~K",","," V~"].
    // This means that on each call of processSet, there will only be 1 ~ present
    // To account for this, if we encounter a ",", we are checking the previous and next sets in the array
    // to see if they contain matching ~'s
    // in which case we are assuming that they should be rejoined and sent to be processed
    // we are also removing
    if (thisSet === ',' && previousIndex > -1 && nextIndex <= inputSets.length) {
      const previousSet = inputSets[i - 1];
      const nextSet = inputSets[i + 1];
      if (shouldCombineSets(previousSet, nextSet)) {
        thisSet = previousSet + ',' + nextSet;
        skipNextSet = true;
        // remove previous set
        output.pop();
      }
    } else {
      skipNextSet = false;
    }

    output.push(processSet(thisSet));
  }

  finalResult = output.join('');
  // one last scan to see if any sets were missed
  finalResult = processSet(finalResult);
  return finalResult;
};

const shouldCombineSets = (previousSet: string, nextSet: string): boolean => {
  const prevCount = [...previousSet].reduce((count, char) => (char === '~' ? count + 1 : count), 0);
  const nextCount = [...nextSet].reduce((count, char) => (char === '~' ? count + 1 : count), 0);

  return prevCount === 1 && nextCount === 1;
};

const processSet = (input: string): string => {
  const chars = [...input];
  const tildeCount = chars.reduce((count, char) => (char === '~' ? count + 1 : count), 0);

  // ignoring any
  if (tildeCount <= 1) {
    return input;
  }

  let first = chars.indexOf('~');
  let last = chars.lastIndexOf('~');

  while (first !== -1 && last !== -1 && first !== last) {
    chars[first] = '<';
    chars[last] = '>';

    first = chars.indexOf('~');
    last = chars.lastIndexOf('~');
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
