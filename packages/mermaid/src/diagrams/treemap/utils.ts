import type { TreemapNode } from './types.js';

/**
 * Converts a flat array of treemap items into a hierarchical structure
 * @param items - Array of flat treemap items with level, name, type, and optional value
 * @returns A hierarchical tree structure
 */
export function buildHierarchy(
  items: {
    level: number;
    name: string;
    type: string;
    value?: number;
    classSelector?: string;
    cssCompiledStyles?: string[];
  }[]
): TreemapNode[] {
  if (!items.length) {
    return [];
  }

  const root: TreemapNode[] = [];
  const stack: { node: TreemapNode; level: number }[] = [];

  items.forEach((item) => {
    const node: TreemapNode = {
      name: item.name,
      children: item.type === 'Leaf' ? undefined : [],
    };
    node.classSelector = item?.classSelector;
    if (item?.cssCompiledStyles) {
      node.cssCompiledStyles = item.cssCompiledStyles;
    }

    if (item.type === 'Leaf' && item.value !== undefined) {
      node.value = item.value;
    }

    // Find the right parent for this node
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // This is a root node
      root.push(node);
    } else {
      // Add as child to the parent
      const parent = stack[stack.length - 1].node;
      if (parent.children) {
        parent.children.push(node);
      } else {
        parent.children = [node];
      }
    }

    // Only add to stack if it can have children
    if (item.type !== 'Leaf') {
      stack.push({ node, level: item.level });
    }
  });

  return root;
}
