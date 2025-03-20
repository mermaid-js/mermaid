import type { EventModel } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { db } from './db.js';


const populate = (ast: EventModel) => {
  populateCommonDb(ast, db);
  // TODO finish populate appropriately
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: EventModel = await parse('eventModel', input);
    log.debug(ast);
    populate(ast);
  },
};
