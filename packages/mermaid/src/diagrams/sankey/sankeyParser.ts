import type { Sankey, SankeyLink } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';

import { log } from '../../logger.js';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import type { SankeyDB } from './sankeyTypes.js';
import { db } from './sankeyDB.js';

function populateDb(ast: Sankey, db: SankeyDB) {
  populateCommonDb(ast, db);
  ast.links.forEach((link: SankeyLink) => {
    db.addLink(link);
  });
  ast.nodes.forEach((node: string) => {
    db.addNode(node);
  });
}

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: Sankey = await parse('sankey', input);
    log.debug(ast);
    populateDb(ast, db);
  },
};
