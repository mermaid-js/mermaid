import type { Architecture } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import { log } from '../../logger.js';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import type { ArchitectureDB } from './architectureTypes.js';
import { db } from './architectureDb.js';

const populateDb = (ast: Architecture, db: ArchitectureDB) => {
  populateCommonDb(ast, db);
  ast.groups.map(db.addGroup);
  ast.services.map((service) => db.addService({ ...service, type: 'service' }));
  ast.junctions.map((service) => db.addJunction({ ...service, type: 'junction' }));
  // @ts-ignore TODO our parser guarantees the type is L/R/T/B and not string. How to change to union type?
  ast.edges.map(db.addEdge);
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: Architecture = await parse('architecture', input);
    log.debug(ast);
    populateDb(ast, db);
  },
};
