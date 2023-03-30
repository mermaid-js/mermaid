/**
 * Remove all lines starting with `%%` from the text that don't contain a `%%{`
 * @param text - The text to remove comments from
 * @returns cleaned text
 */
export const cleanupComments = (text: string): string => {
  return text.trimStart().replace(/^\s*%%(?!{)[^\n]+\n?/gm, '');
};
