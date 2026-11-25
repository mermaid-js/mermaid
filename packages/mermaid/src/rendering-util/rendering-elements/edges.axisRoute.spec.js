import { describe, it, expect, vi } from 'vitest';
import { select } from 'd3';

vi.mock('../../diagram-api/diagramAPI.js', () => ({
  getConfig: vi.fn(() => ({
    layout: 'dagre',
    flowchart: { curve: 'basis', arrowMarkerAbsolute: false },
    state: { arrowMarkerAbsolute: false },
    handDrawnSeed: 0,
  })),
}));

import { insertEdge } from './edges.js';
import { routePath } from './routePath.ts';

const CORNERED = [
  { x: 0, y: 0, axis: 'v' },
  { x: 0, y: 80, axis: 'v' },
  { x: 90, y: 80, axis: 'h' },
  { x: 90, y: 200, axis: 'v' },
];

const edgeWith = (points, extra = {}) => ({
  id: 'L_a_b_0',
  cssCompiledStyles: {},
  style: [],
  thickness: 'normal',
  pattern: 'solid',
  classes: 'flowchart-link',
  look: 'classic',
  curve: 'basis',
  points,
  ...extra,
});

const passThrough = () => ({ intersect: vi.fn((point) => ({ x: point.x, y: point.y })) });

// A cluster that spans x from -50 to 50 and y from 40 to 100.
const clusterDbOf = () => ({
  get: vi.fn(() => ({ node: { x: 0, y: 70, width: 100, height: 60 } })),
});

const draw = (edge, clusterDb) => {
  document.body.innerHTML = '';
  const svg = select(document.body).append('svg');
  insertEdge(svg, edge, clusterDb, 'flowchart', passThrough(), passThrough(), 'd', false, 'dagre');
  return svg.select('path');
};

describe('insertEdge: an axis-tagged route is never cut at a cluster', () => {
  it('keeps a route whose edge ends at a cluster (toCluster) exactly as the layout drew it', () => {
    const clusterDb = clusterDbOf();
    const path = draw(edgeWith(CORNERED, { toCluster: 'c1' }), clusterDb);

    expect(clusterDb.get).not.toHaveBeenCalled();
    expect(path.attr('d')).toBe(routePath(CORNERED, 'curved', 0, 0).d);
  });

  it('keeps a route whose edge starts at a cluster (fromCluster) exactly as the layout drew it', () => {
    const clusterDb = clusterDbOf();
    const path = draw(edgeWith(CORNERED, { fromCluster: 'c1' }), clusterDb);

    expect(clusterDb.get).not.toHaveBeenCalled();
    expect(path.attr('d')).toBe(routePath(CORNERED, 'curved', 0, 0).d);
  });

  it('cuts an untagged route at the cluster, so the two cases above are told apart by the data', () => {
    const untagged = [
      { x: 0, y: 0 },
      { x: 0, y: 30 },
      { x: 0, y: 70 },
    ];
    const clusterDb = clusterDbOf();
    const UNCUT = 'M0,0L0,30L0,70';

    const to = draw(edgeWith(untagged, { toCluster: 'c1', curve: 'linear' }), clusterDb);
    expect(clusterDb.get).toHaveBeenCalledWith('c1');
    expect(to.attr('d')).not.toBe(UNCUT);

    const fromDb = clusterDbOf();
    const from = draw(
      edgeWith([...untagged].reverse(), { fromCluster: 'c1', curve: 'linear' }),
      fromDb
    );
    expect(fromDb.get).toHaveBeenCalledWith('c1');
    expect(from.attr('d')).not.toBe('M0,70L0,30L0,0');
  });
});

describe('insertEdge: an axis-tagged route is drawn only by routePath', () => {
  it('does not pre-round the corners of a curved route before routePath draws it', () => {
    const path = draw(edgeWith(CORNERED));

    expect(path.attr('d')).toBe(routePath(CORNERED, 'curved', 0, 0).d);
  });

  it.each([
    ['dotted', 'edge-pattern-dotted'],
    ['dashed', 'edge-pattern-dashed'],
    ['solid', 'edge-pattern-solid'],
  ])('keeps the %s line pattern class on a routed edge', (pattern, expected) => {
    const path = draw(edgeWith(CORNERED, { pattern }));

    expect(path.attr('class')).toContain(expected);
  });

  it('trims the route by the markers at both ends', () => {
    const path = draw(
      edgeWith(CORNERED, {
        curve: 'linear',
        arrowTypeStart: 'arrow_point',
        arrowTypeEnd: 'arrow_point',
      })
    );

    expect(path.attr('d')).toBe(routePath(CORNERED, 'linear', 4, 4).d);
  });
});
