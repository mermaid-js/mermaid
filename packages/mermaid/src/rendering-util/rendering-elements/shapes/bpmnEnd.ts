import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { renderBpmnEvent } from './bpmnEvent.js';

/** An end event: a single thick ring. */
export async function bpmnEnd<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<D3Selection<SVGGElement>> {
  return renderBpmnEvent(parent, node, 'end');
}
