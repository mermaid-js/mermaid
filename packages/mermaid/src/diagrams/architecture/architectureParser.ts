import type { Architecture } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { ArchitectureDB } from './architectureDb.js';

const populateDb = (ast: Architecture, db: ArchitectureDB) => {
  populateCommonDb(ast, db);
  ast.groups.map((group) => db.addGroup(group));
  ast.services.map((service) => db.addService({ ...service, type: 'service' }));
  ast.junctions.map((service) => db.addJunction({ ...service, type: 'junction' }));
  // @ts-ignore ToDo our parser guarantees the type is L/R/T/B and not string. How to change to union type?
  ast.edges.map((edge) => db.addEdge(edge));
};

export const parser: ParserDefinition = {
  parser: {
    // @ts-expect-error - ArchitectureDB is not assignable to DiagramDB
    yy: undefined,
  },
  parse: async (input: string): Promise<void> => {
    const ast: Architecture = await parse('architecture', input);
    log.debug(ast);
    const db = parser.parser?.yy;
    if (!(db instanceof ArchitectureDB)) {
      throw new Error(
        'parser.parser?.yy was not a ArchitectureDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.'
      );
    }
    populateDb(ast, db);
  },
};
