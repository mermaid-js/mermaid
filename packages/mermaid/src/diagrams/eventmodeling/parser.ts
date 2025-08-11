import type { EventModeling } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
// import { populateCommonDb } from '../common/populateCommonDb.js';
import { db } from './db.js';
// import { commitType } from './types.js';

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: EventModeling = await parse('eventmodeling', input);
    log.debug(ast);
    db.setAst(ast);
    // TODO:
    // populate(ast, db);
  },
};

// const populate = (ast: EventModeling, db: GitGraphDBParseProvider) => {
//   populateCommonDb(ast, db);
//   // @ts-ignore: this wont exist if the direction is not specified
//   if (ast.dir) {
//     // @ts-ignore: this wont exist if the direction is not specified
//     db.setDirection(ast.dir);
//   }
//   for (const statement of ast.statements) {
//     parseStatement(statement, db);
//   }
// };

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;
  describe('EventModeling Parser', () => {
    it('should parse simple model', () => {
      const result = parser.parse(`eventmodeling
  tf 01 evt Start

    `);
      // console.error('Eventmodeling', result.value);
      expect(result !== undefined);
    });
  });
}
