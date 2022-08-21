import DOMPurify from 'dompurify';
import { MermaidConfig } from 'types/config';

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

export const removeEscapes = (text: string): string => {
  let newStr = text.replace(/\\u[\dA-F]{4}/gi, function (match) {
    return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  });

  newStr = newStr.replace(/\\x([0-9a-f]{2})/gi, (_, c) => String.fromCharCode(parseInt(c, 16)));
  newStr = newStr.replace(/\\[\d\d\d]{3}/gi, function (match) {
    return String.fromCharCode(parseInt(match.replace(/\\/g, ''), 8));
  });
  newStr = newStr.replace(/\\[\d\d\d]{2}/gi, function (match) {
    return String.fromCharCode(parseInt(match.replace(/\\/g, ''), 8));
  });

  return newStr;
};

/**
 * Removes script tags from a text
 *
 * @param {string} txt The text to sanitize
 * @returns {string} The safer text
 */
export const removeScript = (txt: string): string => {
  var rs = '';
  var idx = 0;

  while (idx >= 0) {
    idx = txt.indexOf('<script');
    if (idx >= 0) {
      rs += txt.substr(0, idx);
      txt = txt.substr(idx + 1);

      idx = txt.indexOf('</script>');
      if (idx >= 0) {
        idx += 9;
        txt = txt.substr(idx);
      }
    } else {
      rs += txt;
      idx = -1;
      break;
    }
  }
  let decodedText = removeEscapes(rs);
  decodedText = decodedText.replaceAll(/script>/gi, '#');
  decodedText = decodedText.replaceAll(/javascript:/gi, '#');
  decodedText = decodedText.replaceAll(/javascript&colon/gi, '#');
  decodedText = decodedText.replaceAll(/onerror=/gi, 'onerror:');
  decodedText = decodedText.replaceAll(/<iframe/gi, '');
  return decodedText;
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
    url = url.replace(/\(/g, '\\(');
    url = url.replace(/\)/g, '\\)');
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
  removeEscapes,
};
