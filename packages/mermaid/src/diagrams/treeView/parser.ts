import { parse, type TreeView } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import db from './db.js';
import { resolveIcon } from './icons.js';
import type { NodeType } from './types.js';

const populate = (ast: TreeView) => {
  populateCommonDb(ast, db);
  for (const node of ast.nodes) {
    const level = node.indent ? parseInt(node.indent as unknown as string) : 0;

    // Name comes pre-cleaned from value converter (quotes stripped, etc.)
    let name = node.name as unknown as string;

    // Detect directory: trailing / on the name
    const isDirectory = name.endsWith('/');
    if (isDirectory) {
      name = name.slice(0, -1);
    }
    const nodeType: NodeType = isDirectory ? 'directory' : 'file';

    // Read annotations directly from AST fields (cleaned by value converter)
    const cssClass = (node.classAnnotation as unknown as string) || undefined;

    // Icon: value converter extracts the name from icon(name)
    // Empty string from icon() means suppress icon
    const rawIcon = node.iconAnnotation as unknown as string | undefined;
    let iconId: string | undefined;
    if (rawIcon !== undefined) {
      iconId = rawIcon || 'none'; // empty string → 'none' (suppress)
    } else {
      iconId = resolveIcon(isDirectory ? name + '/' : name, nodeType);
    }

    // Description comes pre-trimmed from value converter
    const description = (node.descAnnotation as unknown as string) || undefined;

    db.addNode(level, name, nodeType, cssClass, iconId, description);
  }
};

export const parser: ParserDefinition = {
  parse: async (input: string): Promise<void> => {
    const ast = await parse('treeView', input);
    log.debug(ast);
    populate(ast);
  },
};
