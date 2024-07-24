import type { GitGraph } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import db from './gitGraphAst.js';

const populate = (ast: any) => {
  populateCommonDb(ast, db);
  for (const statement of ast.statements) {
    log.debug(statement);
  }
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: GitGraph = await parse('gitGraph', input);
    log.debug(ast);
    populate(ast);
  },
};
