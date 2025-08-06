import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import type { UsecaseAst } from './types.js';
import { UsecaseDiagramDB } from './db.js';

/**
 * Populates the database with data from the Usecase AST
 * @param ast - The Usecase AST
 */
const populate = (ast: UsecaseAst, db: UsecaseDiagramDB) => {
  // We need to bypass the type checking for populateCommonDb
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  populateCommonDb(ast as any, db);
};

export const parser: ParserDefinition = {
  // @ts-expect-error - UsecaseDB is not assignable to DiagramDB
  parser: { yy: undefined },
  parse: async (text: string): Promise<void> => {
    try {
      // Use a generic parse that accepts any diagram type

      const parseFunc = parse as (diagramType: string, text: string) => Promise<UsecaseAst>;
      const ast = await parseFunc('usecase', text);
      log.debug('Usecase AST:', ast);
      const db = parser.parser?.yy;
      if (!(db instanceof UsecaseDiagramDB)) {
        throw new Error(
          'parser.parser?.yy was not a UsecaseDiagramDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.'
        );
      }
      populate(ast, db);
    } catch (error) {
      log.error('Error parsing usecase:', error);
      throw error;
    }
  },
};
