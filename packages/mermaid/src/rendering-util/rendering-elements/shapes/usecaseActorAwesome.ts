import type { D3Selection } from '../../../types.js';
import type { Node } from '../../types.js';
import { appendActorPath, renderUsecaseActor, type UsecaseActorNode } from './usecaseActor.js';

// A bundled user silhouette. Keeping the path local makes this variant independent of icon packs.
const AWESOME_SILHOUETTE_PATH = [
  'M 0 -34',
  'C 7.18 -34 13 -28.18 13 -21',
  'C 13 -13.82 7.18 -8 0 -8',
  'C -7.18 -8 -13 -13.82 -13 -21',
  'C -13 -28.18 -7.18 -34 0 -34 Z',
  'M -24 25',
  'C -24 7 -14 -3 0 -3',
  'C 14 -3 24 7 24 25',
  'C 24 28 21 30 18 30',
  'H -18',
  'C -21 30 -24 28 -24 25 Z',
].join(' ');

export async function usecaseActorAwesome<T extends SVGGraphicsElement>(
  parent: D3Selection<T>,
  node: Node
): Promise<D3Selection<SVGGElement>> {
  return renderUsecaseActor(parent, node as UsecaseActorNode, 'awesome', (group, actorNode) => {
    appendActorPath(group, actorNode, AWESOME_SILHOUETTE_PATH, 'usecase-actor-awesome-silhouette');
  });
}
