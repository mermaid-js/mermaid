import DOMPurify from 'dompurify';

/**
 * Gets the number of lines in a string
 *
 * @param {string | undefined} s The string to check the lines for
 * @returns {number} The number of lines in that string
 */
export const getRows = (s) => {
  if (!s) return 1;
  let str = breakToPlaceholder(s);
  str = str.replace(/\\n/g, '#br#');
  return str.split('#br#');
};

export const removeEscapes = (text) => {
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
export const removeScript = (txt) => {
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
  decodedText = decodedText.replace(/script>/gi, '#');
  decodedText = decodedText.replace(/javascript:/gi, '#');
  decodedText = decodedText.replace(/javascript&colon/gi, '#');
  decodedText = decodedText.replace(/onerror=/gi, 'onerror:');
  decodedText = decodedText.replace(/<iframe/gi, '');
  return decodedText;
};

const sanitizeMore = (text, config) => {
  let txt = text;
  let htmlLabels = true;
  if (
    config.flowchart &&
    (config.flowchart.htmlLabels === false || config.flowchart.htmlLabels === 'false')
  ) {
    htmlLabels = false;
  }

  if (htmlLabels) {
    const level = config.securityLevel;

    if (level === 'antiscript' || level === 'strict') {
      txt = removeScript(txt);
    } else if (level !== 'loose') {
      // eslint-disable-line
      txt = breakToPlaceholder(txt);
      txt = txt.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      txt = txt.replace(/=/g, '&equals;');
      txt = placeholderToBreak(txt);
    }
  }

  return txt;
};

export const sanitizeText = (text, config) => {
  if (!text) return text;
  let txt = '';
  if (config['dompurifyConfig']) {
    txt = DOMPurify.sanitize(sanitizeMore(text, config), config['dompurifyConfig']);
  } else {
    txt = DOMPurify.sanitize(sanitizeMore(text, config));
  }
  return txt;
};

export const sanitizeTextOrArray = (a, config) => {
  if (typeof a === 'string') return sanitizeText(a, config);

  const f = (x) => sanitizeText(x, config);
  return a.flat().map(f);
};

export const lineBreakRegex = /<br\s*\/?>/gi;

/**
 * Whether or not a text has any linebreaks
 *
 * @param {string} text The text to test
 * @returns {boolean} Whether or not the text has breaks
 */
export const hasBreaks = (text) => {
  return lineBreakRegex.test(text);
};

/**
 * Splits on <br> tags
 *
 * @param {string} text Text to split
 * @returns {string[]} List of lines as strings
 */
export const splitBreaks = (text) => {
  return text.split(lineBreakRegex);
};

/**
 * Converts placeholders to linebreaks in HTML
 *
 * @param {string} s HTML with placeholders
 * @returns {string} HTML with breaks instead of placeholders
 */
const placeholderToBreak = (s) => {
  return s.replace(/#br#/g, '<br/>');
};

/**
 * Opposite of `placeholderToBreak`, converts breaks to placeholders
 *
 * @param {string} s HTML string
 * @returns {string} String with placeholders
 */
const breakToPlaceholder = (s) => {
  return s.replace(lineBreakRegex, '#br#');
};

/**
 * Gets the current URL
 *
 * @param {boolean} useAbsolute Whether to return the absolute URL or not
 * @returns {string} The current URL
 */
const getUrl = (useAbsolute) => {
  let url = '';
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
export const evaluate = (val) => (val === 'false' || val === false ? false : true);

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
