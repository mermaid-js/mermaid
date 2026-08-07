import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import {
  appendActorCircle,
  appendActorPath,
  renderUsecaseActor,
  type UsecaseActorNode,
} from './usecaseActor.js';

const HOLLOW_BODY_PATH = [
  'M 0 -10',
  'C -13 -10 -22 -2 -22 10',
  'V 25',
  'H -10',
  'V 8',
  'H 10',
  'V 25',
  'H 22',
  'V 10',
  'C 22 -2 13 -10 0 -10 Z',
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
