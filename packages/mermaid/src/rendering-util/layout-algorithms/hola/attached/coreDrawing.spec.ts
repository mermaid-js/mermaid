import { describe, expect, it } from 'vitest';
import type { FinalEdge } from '../core/routing/finalRouting.js';
import type { HolaNode } from '../core/model.js';
import { preferOutsideSharedEndpointCorridors } from './coreDrawing.js';

const node = (id: string, x: number, y: number): HolaNode => ({
  id,
  x,
  y,
  width: 80,
  height: 40,
  inputOrder: 0,
  original: null,
});

const edge = (originalEdgeId: string, source: string, target: string): FinalEdge => ({
  originalEdgeId,
  source,
  target,
  mandatoryWaypoints: [],
  parallelIndex: 0,
  parallelCount: 1,
});

describe('shared-sink core routes', () => {
  it('uses the lower outside corridor for a right-hand branch blocked from above', () => {
    // `risk → happy` shares a row. `better → happy` comes from the north and
    // sits between the two, so an upper dogleg from risk would cross its final
    // vertical approach.
    const edges = [edge('risk-happy', 'risk', 'happy'), edge('better-happy', 'better', 'happy')];
    const nodes = new Map([
      ['happy', node('happy', 0, 0)],
      ['better', node('better', 200, -160)],
      ['risk', node('risk', 400, 0)],
    ]);

    preferOutsideSharedEndpointCorridors(edges, nodes);

    expect(edges[0]).toMatchObject({
      preferredOutsideSide: 'bottom',
    });
  });

  it('leaves a sideways branch unconstrained when predecessors occupy both outside lanes', () => {
    const edges = [
      edge('right-happy', 'right', 'happy'),
      edge('north-happy', 'north', 'happy'),
      edge('south-happy', 'south', 'happy'),
    ];
    const nodes = new Map([
      ['happy', node('happy', 0, 0)],
      ['north', node('north', 200, -160)],
      ['south', node('south', 240, 160)],
      ['right', node('right', 400, 0)],
    ]);

    preferOutsideSharedEndpointCorridors(edges, nodes);

    expect(edges[0].preferredOutsideSide).toBeUndefined();
  });

  it('recognises the same geometry when the core has rooted both branches outwards', () => {
    // The rooted core may contain `happy → risk` and `happy → better`, even
    // though Mermaid later writes both original arrows back into happy.
    const edges = [edge('happy-risk', 'happy', 'risk'), edge('happy-better', 'happy', 'better')];
    const nodes = new Map([
      ['happy', node('happy', 0, 0)],
      ['better', node('better', 200, -160)],
      ['risk', node('risk', 400, 0)],
    ]);

    preferOutsideSharedEndpointCorridors(edges, nodes);

    expect(edges[0]).toMatchObject({
      preferredOutsideSide: 'bottom',
    });
  });
});
