import type { WireframeDiagram } from '@mermaid-js/parser';
import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { WireframeDB } from './db.js';

const populateDb = (ast: WireframeDiagram, db: WireframeDB) => {
  populateCommonDb(ast, db);
  db.setWireframe(ast);
};

export const parser: ParserDefinition = {
  parser: {
    // @ts-expect-error - WireframeDB is passed via yy in runtime execution
    yy: undefined,
  },
  parse: async (input: string): Promise<void> => {
    const ast: WireframeDiagram = await parse('wireframe', input);
    log.debug('Wireframe AST:', ast);
    const db = parser.parser?.yy;
    if (!(db instanceof WireframeDB)) {
      throw new Error(
        'parser.parser?.yy was not a WireframeDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.'
      );
    }
    populateDb(ast, db);
  },
};
