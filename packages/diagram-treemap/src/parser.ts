import { parse } from '@mermaid-js/parser';
import type { ParserDefinition } from '../../diagram-api/types.js';
import { log } from '../../logger.js';
import { populateCommonDb } from '../common/populateCommonDb.js';
import type { TreemapNode, TreemapAst, TreemapDB } from './types.js';
import { buildHierarchy } from './utils.js';
import { TreeMapDB } from './db.js';

/**
 * Populates the database with data from the Treemap AST
 * @param ast - The Treemap AST
 */
const populate = (ast: TreemapAst, db: TreemapDB) => {
  // We need to bypass the type checking for populateCommonDb
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  populateCommonDb(ast as any, db);

  const items: {
    level: number;
    name: string;
    type: string;
    value?: number;
    classSelector?: string;
    cssCompiledStyles?: string[];
  }[] = [];

  // Extract classes and styles from the treemap
  for (const row of ast.TreemapRows ?? []) {
    if (row.$type === 'ClassDefStatement') {
      db.addClass(row.className ?? '', row.styleText ?? '');
    }
  }

  // Extract data from each row in the treemap
  for (const row of ast.TreemapRows ?? []) {
    const item = row.item;

    if (!item) {
      continue;
    }

    const level = row.indent ? parseInt(row.indent) : 0;
    const name = getItemName(item);

    // Get styles as a string if they exist
    const styles = item.classSelector ? db.getStylesForClass(item.classSelector) : [];
    const cssCompiledStyles = styles.length > 0 ? styles : undefined;

    const itemData = {
      level,
      name,
      type: item.$type,
      value: item.value,
      classSelector: item.classSelector,
      cssCompiledStyles,
    };

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
};

/**
 * Gets the name of a treemap item
 * @param item - The treemap item
 * @returns The name of the item
 */
const getItemName = (item: { name?: string | number }): string => {
  return item.name ? String(item.name) : '';
};

export const parser: ParserDefinition = {
  // @ts-expect-error - TreeMapDB is not assignable to DiagramDB
  parser: { yy: undefined },
  parse: async (text: string): Promise<void> => {
    try {
      // Use a generic parse that accepts any diagram type

      const parseFunc = parse as (diagramType: string, text: string) => Promise<TreemapAst>;
      const ast = await parseFunc('treemap', text);
      log.debug('Treemap AST:', ast);
      const db = parser.parser?.yy;
      if (!(db instanceof TreeMapDB)) {
        throw new Error(
          'parser.parser?.yy was not a TreemapDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.'
        );
      }
      populate(ast, db);
    } catch (error) {
      log.error('Error parsing treemap:', error);
      throw error;
    }
  },
};
