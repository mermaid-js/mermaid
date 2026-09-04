import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { renderBpmnEvent } from './bpmnEvent.js';

/**
 * A boundary event: a double ring, as for an intermediate event.
 *
 * What distinguishes it is where it sits - on the border of the activity it interrupts -
 * which is a placement concern, not a drawing one.
 */
export async function bpmnBoundary<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<D3Selection<SVGGElement>> {
  return renderBpmnEvent(parent, node, 'boundary');
}
