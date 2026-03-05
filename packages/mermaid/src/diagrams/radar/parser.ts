import type { Radar } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { db } from './db.js';

const populate = (ast: Radar) => {
  populateCommonDb(ast, db);
  const { axes, curves, options } = ast;
  // Here we can add specific logic between the AST and the DB
  db.setAxes(axes);
  db.setCurves(curves);
  db.setOptions(options);
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast: Radar = await parse('radar', input);
    log.debug(ast);
    populate(ast);
  },
};
