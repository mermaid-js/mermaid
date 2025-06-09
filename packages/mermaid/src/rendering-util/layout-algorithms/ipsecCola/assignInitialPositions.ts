import type { LayoutData, Node } from '../../types.js';

/**
 * Assigns initial x and y positions to each node
 * based on its rank and order.
 *
 * @param nodeSpacing - Horizontal spacing between nodes
 * @param layerHeight - Vertical spacing between layers
 * @param data4Layout - Layout data used to update node positions
 */

export function assignInitialPositions(
  nodeSpacing: number,
  layerHeight: number,
  data4Layout: LayoutData
): void {
  data4Layout.nodes.forEach((node: Node) => {
    const layer = node.layer ?? 0;
    const order = node.order ?? 0;

    const x = order * nodeSpacing;
    const y = layer * layerHeight;

    node.x = x;
    node.y = y;
  });
}
