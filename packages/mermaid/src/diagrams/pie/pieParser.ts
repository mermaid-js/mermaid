import type { Pie, PieSection } from 'mermaid-parser';
import { parse } from 'mermaid-parser';

import { log } from '../../logger.js';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import type { PieDB } from './pieTypes.js';
import { db } from './pieDb.js';

function populateDb(ast: Pie, db: PieDB) {
  populateCommonDb(ast, db);
  db.setShowData(ast.showData);
  ast.sections.map((section: PieSection) => {
    db.addSection(section);
  });
}

export const parser: ParserDefinition = {
  parse: (input: string): void => {
    const ast: Pie = parse('pie', input);
    log.debug(ast);
    populateDb(ast, db);
  },
};
