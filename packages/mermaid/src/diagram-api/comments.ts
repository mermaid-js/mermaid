import type { TrackedText } from './sourceLines.js';
import { keepSuffix, removeMatches, trackLines } from './sourceLines.js';

const commentLines = /^\s*%%(?!{)[^\n]+\n?/gm;

/**
 * {@link cleanupComments} for a {@link TrackedText}, keeping the source line of each line left.
 * @param code - The text to remove comments from
 * @returns cleaned text and its source lines
 */
export const removeComments = (code: TrackedText): TrackedText => {
  const uncommented = removeMatches(code, commentLines);
  return keepSuffix(uncommented, uncommented.text.trimStart());
};

/**
 * Remove all lines starting with `%%` from the text that don't contain a `%%{`
 * @param text - The text to remove comments from
 * @returns cleaned text
 */
export const cleanupComments = (text: string): string => {
  return removeComments(trackLines(text)).text;
};
