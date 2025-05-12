import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import { db } from './db.js';
import type { TreemapNode } from './types.js';
import { buildHierarchy } from './utils.js';

/**
 * Populates the database with data from the Treemap AST
 * @param ast - The Treemap AST
 */
const populate = (ast: any) => {
  populateCommonDb(ast, db);

  const items = [];

  // Extract classes and styles from the treemap
  for (const row of ast.TreemapRows || []) {
    const item = row.item;

    if (row.$type === 'ClassDefStatement') {
      db.addClass(row.className, row.styleText);
    }
  }

  // Extract data from each row in the treemap
  for (const row of ast.TreemapRows || []) {
    const item = row.item;

    if (!item) {
      continue;
    }

    const level = row.indent ? parseInt(row.indent) : 0;
    const name = getItemName(item);

    const itemData = {
      level,
      name,
      type: item.$type,
      value: item.value,
      classSelector: item.classSelector,
      cssCompiledStyles: item.classSelector ? db.getStylesForClass(item.classSelector) : undefined,
    };
    console.debug('itemData', item.$type);
    items.push(itemData);
  }

  // Convert flat structure to hierarchical
  const hierarchyNodes = buildHierarchy(items);

  // Add all nodes to the database
  const addNodesRecursively = (nodes: TreemapNode[], level: number) => {
    for (const node of nodes) {
      db.addNode(node, level);
      if (node.children && node.children.length > 0) {
        addNodesRecursively(node.children, level + 1);
      }
    }
  };

  addNodesRecursively(hierarchyNodes, 0);

  console.debug('ast.ClassDefStatement', ast);
  // Extract data from each classdefintion in the treemap

  log.debug('Processed items:', items);
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
