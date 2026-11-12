/**
 * Remove all lines starting with `%%` from the text that don't contain a `%%{`.
 * Lines that are inside a double-quoted string (e.g. a multi-line node label) are kept,
 * as they are part of the text and not comments.
 * @param text - The text to remove comments from
 * @returns cleaned text
 */
export const cleanupComments = (text: string): string => {
  let inString = false;
  let lastIndex = 0;
  const trackQuotes = (segment: string) => {
    for (const char of segment) {
      if (char === '"') {
        inString = !inString;
      }
    }
  };

  return text
    .replace(/^\s*%%(?!{)[^\n]+\n?/gm, (match: string, offset: number) => {
      trackQuotes(text.slice(lastIndex, offset));
      lastIndex = offset + match.length;
      if (inString) {
        trackQuotes(match);
        return match;
      }
      // Quotes inside a removed comment must not affect the string state.
      return '';
    })
    .trimStart();
};
