import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { renderBpmnEvent } from './bpmnEvent.js';

/** An intermediate event: a double ring. */
export async function bpmnIntermediate<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<D3Selection<SVGGElement>> {
  return renderBpmnEvent(parent, node, 'intermediate');
}
