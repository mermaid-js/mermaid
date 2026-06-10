import type { Pie } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import { log } from '../../logger.js';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { PieDB } from './pieDb.js';

const populateDb = (ast: Pie, db: PieDB) => {
  populateCommonDb(ast, db);
  db.setShowData(ast.showData);
  ast.sections.map(db.addSection);
};

export const parser: ParserDefinition = {
  // @ts-expect-error - PieDB is not assignable to DiagramDB
  parser: { yy: undefined },
  parse: async (input: string): Promise<void> => {
    // Capture the db before the first `await`, since `yy` may be reassigned
    // by a concurrent parse before the AST parsing finishes.
    const db = parser.parser?.yy;
    if (!(db instanceof PieDB)) {
      throw new Error(
        'parser.parser?.yy was not a PieDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.'
      );
    }
    const ast: Pie = await parse('pie', input);
    log.debug(ast);
    populateDb(ast, db);
  },
};
