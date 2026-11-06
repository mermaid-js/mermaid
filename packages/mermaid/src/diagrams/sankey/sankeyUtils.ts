import type { SourceLines } from '../../diagram-api/sourceLines.js';
import { removeMatches, trackLines } from '../../diagram-api/sourceLines.js';

export const prepareTextForParsing = (text: string): string => {
  const textToParse = text
    .replaceAll(/^[^\S\n\r]+|[^\S\n\r]+$/g, '') // remove all trailing spaces for each row
    .replaceAll(/([\n\r])+/g, '\n') // remove empty lines duplicated
    .trim();

  return textToParse;
};

/** What {@link prepareTextForParsing} removes that moves a line: leading whitespace and blank lines. */
const removedLines = /^\s+|\n(?=\n)/g;

/**
 * The line of `text` that each line of `prepareTextForParsing(text)` comes from, for `text`
 * with `\n` line breaks, as `preprocessDiagram` leaves it.
 */
export const sourceLinesOfPreparedText = (text: string): SourceLines =>
  removeMatches(trackLines(text), removedLines).sourceLines;
