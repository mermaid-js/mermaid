import { describe, expect, it } from 'vitest';
import { prepareLayoutForElk } from '../render.js';

const log = {
  debug: () => undefined,
  error: () => undefined,
  info: () => undefined,
  warn: () => undefined,
};

const elkRenderContext = {
  helpers: {
    common: { lineBreakRegex: /<br\s*\/?>/gi },
    getConfig: () => ({ flowchart: { wrappingWidth: 200 }, curve: undefined }),
    interpolateToCurve: (curve: unknown) => curve,
    log,
  },
  options: { algorithm: 'elk.layered' },
} as any;

const prepare = (edge: Record<string, unknown>) => {
  const data = { config: {}, nodes: [], edges: [edge] } as any;
  prepareLayoutForElk(data, elkRenderContext);
  return data.edges[0];
};

/**
 * `addEdgeMarker` recognises `none` (and empty) as "deliberately no arrowhead"
 * and warns `Unknown arrow type: …` for anything else it has no marker for.
 * ELK's arrow table used to put the edge *type* `arrow_open` in the arrow-type
 * slot, which warned once per edge on any diagram whose db leaves
 * `arrowTypeStart` unset — state diagrams, for instance.
 */
describe('elk arrow type mapping', () => {
  it('leaves the start of a one-directional arrow as none, not arrow_open', () => {
    expect(prepare({ id: 'e', start: 'A', end: 'B', type: 'arrow_point' })).toMatchObject({
      arrowTypeStart: 'none',
      arrowTypeEnd: 'arrow_point',
    });
  });

  it('uses none at both ends for an open arrow', () => {
    expect(prepare({ id: 'e', start: 'A', end: 'B', type: 'arrow_open' })).toMatchObject({
      arrowTypeStart: 'none',
      arrowTypeEnd: 'none',
    });
  });

  it('defaults an edge with no type to none at both ends', () => {
    expect(prepare({ id: 'e', start: 'A', end: 'B' })).toMatchObject({
      arrowTypeStart: 'none',
      arrowTypeEnd: 'none',
    });
  });

  it('keeps real markers on both ends of a double arrow', () => {
    expect(prepare({ id: 'e', start: 'A', end: 'B', type: 'double_arrow_point' })).toMatchObject({
      arrowTypeStart: 'arrow_point',
      arrowTypeEnd: 'arrow_point',
    });
  });

  it('never emits arrow_open as an arrow type for any known edge type', () => {
    const types = [
      'arrow_open',
      'arrow_cross',
      'double_arrow_cross',
      'arrow_point',
      'double_arrow_point',
      'arrow_circle',
      'double_arrow_circle',
      undefined,
    ];
    for (const type of types) {
      const edge = prepare({ id: 'e', start: 'A', end: 'B', type });
      expect([edge.arrowTypeStart, edge.arrowTypeEnd], `edge type ${type}`).not.toContain(
        'arrow_open'
      );
    }
  });

  it('still honours an arrowTypeStart the diagram set itself', () => {
    expect(
      prepare({ id: 'e', start: 'A', end: 'B', type: 'arrow_point', arrowTypeStart: 'arrow_cross' })
    ).toMatchObject({ arrowTypeStart: 'arrow_cross' });
  });
});
