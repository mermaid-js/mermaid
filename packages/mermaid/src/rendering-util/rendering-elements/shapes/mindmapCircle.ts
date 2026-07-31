import { circle } from './circle.js';
import type { Node, MindmapOptions } from '../../types.js';
import type { D3Selection } from '../../../types.js';

export async function mindmapCircle<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
) {
  const options = {
    padding: node.padding ?? 0,
  } as MindmapOptions;
  return circle(parent, node, options);
}
