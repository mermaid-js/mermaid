import type { Pie } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import { log } from '@mermaid-js/core/logger.js';
import type { ParserDefinition } from '@mermaid-js/core/diagram-api/types.js';
import { populateCommonDb } from '@mermaid-js/core/diagrams/common/populateCommonDb.js';
import type { PieDB } from './pieTypes.js';
import { db } from './pieDb.js';

const populateDb = (ast: Pie, db: PieDB) => {
  populateCommonDb(ast, db);
  db.setShowData(ast.showData);
  ast.sections.map(db.addSection);
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: Pie = await parse('pie', input);
    log.debug(ast);
    populateDb(ast, db);
  },
};
