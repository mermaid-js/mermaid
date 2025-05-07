import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { db } from './db.js';
import type { TreemapNode } from './types.js';

/**
 * Populates the database with data from the Treemap AST
 * @param ast - The Treemap AST
 */
const populate = (ast: any) => {
  populateCommonDb(ast, db);

  // Process rows
  let lastLevel = 0;
  let lastNode: TreemapNode | undefined;

  // Process each row in the treemap, building the node hierarchy
  for (const row of ast.TreemapRows || []) {
    const item = row.item;
    if (!item) {
      continue;
    }

    const level = row.indent ? parseInt(row.indent) : 0;
    const name = getItemName(item);

    // Create the node
    const node: TreemapNode = {
      name,
      children: [],
    };

    // If it's a leaf node, add the value
    if (item.$type === 'Leaf') {
      node.value = item.value;
    }

    // Add to the right place in hierarchy
    if (level === 0) {
      // Root node
      db.addNode(node, level);
    } else if (level > lastLevel) {
      // Child of the last node
      if (lastNode) {
        lastNode.children = lastNode.children || [];
        lastNode.children.push(node);
        node.parent = lastNode;
      }
      db.addNode(node, level);
    } else if (level === lastLevel) {
      // Sibling of the last node
      if (lastNode?.parent) {
        lastNode.parent.children = lastNode.parent.children || [];
        lastNode.parent.children.push(node);
        node.parent = lastNode.parent;
      }
      db.addNode(node, level);
    } else if (level < lastLevel) {
      // Go up in the hierarchy
      let parent = lastNode ? lastNode.parent : undefined;
      for (let i = lastLevel; i > level; i--) {
        if (parent) {
          parent = parent.parent;
        }
      }
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
        node.parent = parent;
      }
      db.addNode(node, level);
    }

    lastLevel = level;
    lastNode = node;
  }
};

/**
 * Gets the name of a treemap item
 * @param item - The treemap item
 * @returns The name of the item
 */
const getItemName = (item: any): string => {
  return item.name ? String(item.name) : '';
};

export const parser: ParserDefinition = {
  parse: async (text: string): Promise<void> => {
    try {
      // Use a generic parse that accepts any diagram type
      const parseFunc = parse as (diagramType: string, text: string) => Promise<any>;
      const ast = await parseFunc('treemap', text);
      log.debug('Treemap AST:', ast);
      populate(ast);
    } catch (error) {
      log.error('Error parsing treemap:', error);
      throw error;
    }
  },
};
