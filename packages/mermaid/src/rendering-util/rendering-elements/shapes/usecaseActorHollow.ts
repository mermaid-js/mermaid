import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import {
  appendActorCircle,
  appendActorPath,
  renderUsecaseActor,
  type UsecaseActorNode,
} from './usecaseActor.js';

const HOLLOW_BODY_PATH = [
  'M -22 -10',
  'H 22',
  'V 0',
  'H 6',
  'L 22 17',
  'L 13 28',
  'L 0 13',
  'L -13 28',
  'L -22 17',
  'L -6 0',
  'H -22',
  'Z',
].join(' ');

export async function usecaseActorHollow<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<D3Selection<SVGGElement>> {
  return renderUsecaseActor(parent, node as UsecaseActorNode, 'hollow', (group, actorNode) => {
    appendActorCircle(group, actorNode, 0, -23, 9, 'usecase-actor-hollow-head', true);
    appendActorPath(group, actorNode, HOLLOW_BODY_PATH, 'usecase-actor-hollow-body', true);
  });
}
