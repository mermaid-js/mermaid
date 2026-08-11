/**
 * Regression gate for the DOMUS vertical axis sign.
 *
 * DOMUS's grid space is the paper's space, where the y axis points *up*
 * (LIPIcs.GD.2025.35 §2 defines label `U` on (u,v) by `y(u) < y(v)`, and
 * `buildAuxiliaryGraphGy` follows it). SVG's y axis points *down*. Emitting grid
 * y unchanged conflated the two, and every DOMUS drawing came out vertically
 * mirrored: a `flowchart TD` chain flowed bottom-up, the opposite of what dagre
 * and elk render for the same source. The reflection now happens at exactly one
 * place, `gridToPixelCoordinates`.
 *
 * These assertions deliberately cover the DEFAULT path — `respectFlowDirection`
 * is off, so no direction constraint reaches the SAT solver and the downward
 * flow comes from the shape phase's label preference (`D` before `U`) landing in
 * a correctly-signed axis. That combination is what a user sees, so that is what
 * is pinned here. `domus-tb-direction.ddlt.spec.ts` covers the opt-in
 * constraint path.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import type { LayoutData, Node } from '../../types.js';
import { Diagram } from '../../../Diagram.js';
import { addDiagrams } from '../../../diagram-api/diagram-orchestration.js';
import { preprocessDiagram } from '../../../preprocess.js';
import { setLogLevel } from '../../../logger.js';
import { runRP1OrthogonalPipeline } from './rp1Pipeline.js';

const NODE_WIDTH = 60;
const NODE_HEIGHT = 40;

async function parseSizeAndPlace(diagramText: string): Promise<Map<string, Node>> {
  const { code } = preprocessDiagram(diagramText);
  const diagram = await Diagram.fromText(code);
  const layout = (diagram.db as { getData: () => LayoutData }).getData();
  layout.layoutAlgorithm = 'domus';
  const dirFromDb = (diagram.db as { getDirection?: () => string }).getDirection?.();
  if (dirFromDb) {
    (layout as { direction?: string }).direction = String(dirFromDb).trim();
  }
  for (const node of layout.nodes ?? []) {
    if (!node.isGroup) {
      node.width = NODE_WIDTH;
      node.height = NODE_HEIGHT;
    }
  }

  runRP1OrthogonalPipeline(layout, {
    spacing: 10,
    routingBackend: 'domus',
    useExistingPositions: false,
  });

  const byId = new Map<string, Node>();
  for (const n of layout.nodes ?? []) {
    if (n?.id != null) {
      byId.set(String(n.id), n);
    }
  }
  return byId;
}

describe('DOMUS vertical axis sign', () => {
  beforeAll(() => {
    setLogLevel(process.env.ORTHO_TEST_DEBUG ? 'debug' : 'fatal');
    addDiagrams();
  });

  it('places a TD chain top-to-bottom, not bottom-to-top', async () => {
    const byId = await parseSizeAndPlace('flowchart TD\n  A --> B\n  B --> C\n');

    const a = byId.get('A')!;
    const b = byId.get('B')!;
    const c = byId.get('C')!;
    expect([a, b, c].every((n) => typeof n?.y === 'number')).toBe(true);

    // The whole point: successors sit BELOW their predecessors on screen.
    expect(a.y!).toBeLessThan(b.y!);
    expect(b.y!).toBeLessThan(c.y!);
  });

  it('places a TD chain inside a subgraph top-to-bottom too', async () => {
    const byId = await parseSizeAndPlace('flowchart TD\n  subgraph hello\n    C --> D\n  end\n');

    expect(byId.get('C')!.y!).toBeLessThan(byId.get('D')!.y!);
  });

  it('keeps the drawing in positive y space after the reflection', async () => {
    const byId = await parseSizeAndPlace('flowchart TD\n  A --> B\n  B --> C\n');

    // `runner.ts` reflects about the maximum grid y precisely so the reflected
    // drawing occupies the same positive range the un-reflected one did; a plain
    // negation would push every node to a negative y.
    for (const n of byId.values()) {
      if (!n.isGroup) {
        expect(n.y!).toBeGreaterThan(0);
      }
    }
  });
});
