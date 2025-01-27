import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import db from './db.js';
import { parse, type FileTree } from '@mermaid-js/parser';

const populate = (ast: FileTree) => {
  populateCommonDb(ast, db);
  ast.nodes.map((node) => db.addNode(node.indent.length, node.name));
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast = await parse('fileTree', input);
    log.debug(ast);
    populate(ast);
  },
};
