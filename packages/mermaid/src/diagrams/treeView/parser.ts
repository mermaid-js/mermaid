import { parse, type TreeView } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import db from './db.js';
import { resolveIcon } from './icons.js';
import type { NodeType } from './types.js';

interface ParsedNodeContent {
  name: string;
  nodeType: NodeType;
  cssClass?: string;
  iconId?: string;
  description?: string;
}

/**
 * Parse a NODE_CONTENT string into its constituent parts.
 *
 * Supports:
 *  - Quoted labels: "my file" or 'my file'
 *  - Bare labels: index.js, src/, .gitignore
 *  - :::className annotation
 *  - icon(name) annotation
 *  - ## description (visible inline text)
 *
 * Order of annotations after the label does not matter.
 */
export function parseNodeContent(raw: string): ParsedNodeContent {
  let remaining = raw.trim();
  let name: string;

  // Extract quoted label
  if (remaining.startsWith('"') || remaining.startsWith("'")) {
    const quote = remaining[0];
    const endIdx = remaining.indexOf(quote, 1);
    if (endIdx !== -1) {
      name = remaining.substring(1, endIdx);
      remaining = remaining.substring(endIdx + 1).trim();
    } else {
      // Unterminated quote — treat entire content as the name
      name = remaining.substring(1);
      remaining = '';
    }
  } else {
    // Bare label: extract up to first annotation marker
    const markerMatch = /^(.*?)(?=\s+:::|(?:^|\s)icon\(|\s+##|$)/.exec(remaining);
    if (markerMatch?.[1]) {
      name = markerMatch[1].trim();
      remaining = remaining.substring(markerMatch[1].length).trim();
    } else {
      name = remaining;
      remaining = '';
    }
  }

  let cssClass: string | undefined;
  let iconId: string | undefined;
  let description: string | undefined;

  // Extract ## description (must be extracted first since it runs to end-of-line)
  const descMatch = /##\s*(.*)/.exec(remaining);
  if (descMatch) {
    description = descMatch[1].trim() || undefined;
    remaining = remaining.substring(0, descMatch.index).trim();
  }

  // Extract :::className
  const classMatch = /:::\s*([A-Z_a-z][\w-]*)/.exec(remaining);
  if (classMatch) {
    cssClass = classMatch[1];
    remaining = remaining.replace(classMatch[0], '').trim();
  }

  // Extract icon(name)
  const iconMatch = /icon\(([\w-]+)\)/.exec(remaining);
  if (iconMatch) {
    iconId = iconMatch[1];
  }

  // Detect directory: trailing / on the name
  const isDirectory = name.endsWith('/');
  if (isDirectory) {
    name = name.slice(0, -1);
  }
  const nodeType: NodeType = isDirectory ? 'directory' : 'file';

  // Resolve icon if not explicitly set
  if (!iconId) {
    iconId = resolveIcon(isDirectory ? name + '/' : name, nodeType);
  }

  return { name, nodeType, cssClass, iconId, description };
}

const populate = (ast: TreeView) => {
  populateCommonDb(ast, db);
  for (const node of ast.nodes) {
    const level = node.indent ? parseInt(node.indent as unknown as string) : 0;
    const { name, nodeType, cssClass, iconId, description } = parseNodeContent(
      node.nodeContent as unknown as string
    );
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
