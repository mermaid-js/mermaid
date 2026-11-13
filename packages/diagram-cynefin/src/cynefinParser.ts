import type { Cynefin } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '@mermaid-js/core/diagram-api/types.js';
import { log } from '@mermaid-js/core/logger.js';
import { populateCommonDb } from '@mermaid-js/core/diagrams/common/populateCommonDb.js';
import { db } from './cynefinDb.js';

const populate = (ast: Cynefin) => {
  populateCommonDb(ast, db);
  db.setDomains(ast.domains);
  db.setTransitions(ast.transitions);
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: Cynefin = await parse('cynefin', input);
    log.debug(ast);
    populate(ast);
  },
};
