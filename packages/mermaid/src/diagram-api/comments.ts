const whitespace = /\s/;
const isLineBreak = (char: string): boolean => /[\n\r\u2028\u2029]/.test(char);

/**
 * Remove whole comment lines while retaining inline text and `%%{` directives.
 *
 * Match the original line-comment expression in linear time. Candidate starts
 * inside one whitespace run all reach the same marker, so examine that run once.
 * @param text - The text to remove comments from
 * @returns cleaned text
 */
export const cleanupComments = (text: string): string => {
  const output: string[] = [];
  let consumed = 0;
  let start = 0;
  while (start < text.length) {
    let marker = start;
    while (marker < text.length && whitespace.test(text[marker])) {
      marker++;
    }
    const afterMarker = text[marker + 2];
    if (
      text.startsWith('%%', marker) &&
      afterMarker !== undefined &&
      afterMarker !== '{' &&
      afterMarker !== '\n'
    ) {
      const newline = text.indexOf('\n', marker + 2);
      output.push(text.slice(consumed, start));
      consumed = newline === -1 ? text.length : newline + 1;
      start = consumed;
    } else {
      // Skip other anchors in the whitespace run; they cannot produce a match.
      start = marker;
      while (start < text.length && !isLineBreak(text[start])) {
        start++;
      }
      start++;
    }
  }
  output.push(text.slice(consumed));
  return output.join('').trimStart();
};
