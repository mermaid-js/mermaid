import { describe, expect, it } from 'vitest';
import { prepareTextForParsing, sourceLinesOfPreparedText } from './sankeyUtils.js';

describe('sourceLinesOfPreparedText', () => {
  it('skips the blank lines prepareTextForParsing collapses', () => {
    expect(sourceLinesOfPreparedText('sankey-beta\n\na,b,1\n\n\nc d')).toEqual([1, 3, 6]);
  });

  it.each([
    { case: 'blank lines between rows', text: 'sankey-beta\n\na,b,1\n\n\nc d' },
    { case: 'leading blank and indented lines', text: '\n \n  sankey-beta\na,b,1' },
    { case: 'a line of spaces between rows', text: 'sankey-beta\n   \na,b,1\n' },
    { case: 'trailing blank lines', text: 'sankey-beta\na,b,1\n\n  \n' },
  ])('maps every prepared line to the line holding it, with $case', ({ text }) => {
    const source = text.split('\n');
    const sourceLines = sourceLinesOfPreparedText(text);
    const prepared = prepareTextForParsing(text).split('\n');
    expect(prepared.map((_, index) => source[sourceLines[index] - 1].trim())).toEqual(
      prepared.map((line) => line.trim())
    );
  });
});
