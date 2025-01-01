import { select } from 'd3';
import type { SVG } from '../diagram-api/types.js';
import { getConfig } from '../diagram-api/diagramAPI.js';
import type { LayoutData, NonClusterNode } from './types.js';
import type { SVGGroup } from '../diagram-api/types.js';
import { insertNode } from './rendering-elements/nodes.js';

type Node = LayoutData['nodes'][number];

interface LabelData {
  width: number;
  height: number;
  wrappingWidth?: number;
  labelNode?: SVGGElement | null;
}

interface NodeWithVertex extends Omit<Node, 'domId'> {
  children?: unknown[];
  labelData?: LabelData;
  domId?: Node['domId'] | SVGGroup | d3.Selection<SVGAElement, unknown, Element | null, unknown>;
}


// export function insertElementsForSize(el: SVGElement, data: LayoutData): void {
/**
 *
 * @param el
 * @param data
 */
export function insertElementsForSize(el: SVG, data: LayoutData) {
  const nodesElem = el.insert('g').attr('class', 'nodes');
  el.insert('g').attr('class', 'edges');
  data.nodes.forEach(async (item) => {
    if (!item.isGroup) {
      const node = item as NonClusterNode;
      const config = getConfig();
      const newNode = await insertNode(nodesElem, node, { config, dir: node.dir });

      const boundingBox = newNode.node()!.getBBox();
      item.domId = newNode.attr('id');
      item.width = boundingBox.width;
      item.height = boundingBox.height;
    }
  });
}
