import type { ParserDefinition } from '../../diagram-api/types.js';
import { RailroadDB } from './db.js';

const titleRegex = /^\s*title\s*:??\s*(.*)$/i;
const accTitleRegex = /^\s*acctitle\s*:\s*(.*)$/i;
const accDescrRegex = /^\s*accdescr\s*:\s*(.*)$/i;
const headerRegex = /^\s*railroad(-beta)?\s*$/i;
const commentRegex = /^\s*%%/;

const trimMatchingQuotes = (value: string): string => {
  if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
    return value.slice(1, -1);
  }
  return value;
};

export const parser: ParserDefinition = {
  // Added for the railroad diagram integration request: this parser uses parser.yy to access diagram DB.
  parser: { yy: undefined as unknown as RailroadDB },
  parse: (input: string): Promise<void> => {
    const db = parser.parser?.yy;
    if (!(db instanceof RailroadDB)) {
      throw new Error(
        'parser.parser?.yy was not a RailroadDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.'
      );
    }

    const sourceLines: string[] = [];
    for (const rawLine of input.split(/\r?\n/u)) {
      if (headerRegex.test(rawLine) || commentRegex.test(rawLine)) {
        continue;
      }

      const titleMatch = titleRegex.exec(rawLine);
      if (titleMatch) {
        db.setDiagramTitle?.(trimMatchingQuotes(titleMatch[1]?.trim() ?? ''));
        continue;
      }

      const accTitleMatch = accTitleRegex.exec(rawLine);
      if (accTitleMatch) {
        db.setAccTitle?.(trimMatchingQuotes(accTitleMatch[1]?.trim() ?? ''));
        continue;
      }

      const accDescrMatch = accDescrRegex.exec(rawLine);
      if (accDescrMatch) {
        db.setAccDescription?.(trimMatchingQuotes(accDescrMatch[1]?.trim() ?? ''));
        continue;
      }

      const normalized = rawLine.trim();
      if (!normalized) {
        continue;
      }
      sourceLines.push(normalized);
    }

    db.setSource(sourceLines.join('\n'));
    return Promise.resolve();
  },
};
