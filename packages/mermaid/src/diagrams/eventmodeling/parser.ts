import type { EventModel } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { db } from './db.js';

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: EventModel = await parse('eventmodeling', input);
    log.debug(ast);
    db.setAst(ast);
    populateCommonDb(ast as any, db);
  },
};

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;
  describe('EventModeling Parser', () => {
    it('should parse simple model', () => {
      const result = parser.parse(`eventmodeling
  tf 01 evt Start

    `);
      expect(result !== undefined);
    });
  });
}
