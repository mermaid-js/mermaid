import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { renderBpmnEvent } from './bpmnEvent.js';

/** A start event: a single thin ring. */
export async function bpmnStart<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<D3Selection<SVGGElement>> {
  return renderBpmnEvent(parent, node, 'start');
}
