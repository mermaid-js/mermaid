/**
 * Value extraction shared by diagram parsers.
 *
 * The regexes and normalization mirror the langium common value converter
 * (`packages/parser/src/language/common/{matcher,valueConverter}.ts`) so the extracted
 * title / accTitle / accDescr / label values are byte-for-byte identical to the legacy parser.
 */

const titleRegex = /title([\t ][^\n\r]*|)/;
const accTitleRegex = /accTitle[\t ]*:([^\n\r]*)/;
const accDescrRegex = /accDescr(?:[\t ]*:([^\n\r]*)|\s*{([^}]*)})/;

const normalizeSingleLine = (value: string): string => value.trim().replace(/[\t ]{2,}/gm, ' ');

const normalizeMultiLine = (value: string): string =>
  value
    .replace(/^\s*/gm, '')
    .replace(/\s+$/gm, '')
    .replace(/[\t ]{2,}/gm, ' ')
    .replace(/[\n\r]{2,}/gm, '\n');

/** Extract the diagram title from a `Title` token image (empty string if none). */
export const extractTitle = (image: string): string => {
  const match = titleRegex.exec(image);
  return match?.[1] !== undefined ? normalizeSingleLine(match[1]) : '';
};

/** Extract the accessible title from an `AccTitle` token image. */
export const extractAccTitle = (image: string): string => {
  const match = accTitleRegex.exec(image);
  return match?.[1] !== undefined ? normalizeSingleLine(match[1]) : '';
};

/** Extract the accessible description (single- or multi-line) from an `AccDescr` token image. */
export const extractAccDescr = (image: string): string => {
  const match = accDescrRegex.exec(image);
  if (!match) {
    return '';
  }
  if (match[1] !== undefined) {
    return normalizeSingleLine(match[1]);
  }
  if (match[2] !== undefined) {
    return normalizeMultiLine(match[2]);
  }
  return '';
};

const unescape = (char: string): string => {
  switch (char) {
    case 'b':
      return '\b';
    case 'f':
      return '\f';
    case 'n':
      return '\n';
    case 'r':
      return '\r';
    case 't':
      return '\t';
    case 'v':
      return '\v';
    case '0':
      return '\0';
    default:
      return char;
  }
};

/**
 * Convert a quoted string-literal token image to its value, matching langium's
 * `DefaultValueConverter.convertString`: strip the outer quote pair and decode backslash escapes.
 * Note: it does NOT trim — surrounding whitespace inside the quotes is preserved.
 */
export const convertString = (image: string): string => {
  let result = '';
  for (let i = 1; i < image.length - 1; i++) {
    const char = image.charAt(i);
    if (char === '\\') {
      i++;
      result += unescape(image.charAt(i));
    } else {
      result += char;
    }
  }
  return result;
};
