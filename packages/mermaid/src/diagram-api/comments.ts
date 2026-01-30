/**
 * Remove all lines starting with `%%` from the text that don't contain a `%%{`
 * @param text - The text to remove comments from
 * @returns cleaned text
 */
const cleanupLineComments = (text: string): string => {
  return text.replace(/^\s*%%(?!{)[^\n]+\n?/gm, '');
};

/**
 * Remove all lines between `%%*` and `*%%` from the text
 * @param text - The text to remove block comments from
 * @returns cleaned text
 */
const cleanupBlockComments = (text: string): string => {
  return text.replace(/^[\t ]*%%\*[\S\s]*?\*%%[\t ]*\r?\n?/gm, '');
};

/**
 * Remove all lines between `%%*` and `*%%` from the text,
 * then remove all lines starting with `%%` that don't contain a `%%{`
 * @param text - The text to remove block comments from
 * @returns cleaned text
 */
export const cleanupComments = (text: string): string =>
  cleanupLineComments(cleanupBlockComments(text)).trimStart();
