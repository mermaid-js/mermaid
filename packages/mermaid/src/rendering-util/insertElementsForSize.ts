import type { SVG } from '../diagram-api/types.js';
import { getConfig } from '../diagram-api/diagramAPI.js';
import type { LayoutData } from './types.js';
import { insertNode } from './rendering-elements/nodes.js';

export async function insertElementsForSize(el: SVG, data: LayoutData) {
  const nodesElem = el.insert('g').attr('class', 'nodes');
  el.insert('g').attr('class', 'edges');
  for (const item of data.nodes) {
    if (!item.isGroup) {
      const node = item;
      const config = getConfig();
      const newNode = await insertNode(nodesElem, node, { config, dir: node.dir });
      const boundingBox = newNode.node()!.getBBox();
      item.domId = newNode.attr('id');
      item.width = boundingBox.width;
      item.height = boundingBox.height;
    }
  }
}
