import { describe, expect, it } from 'vitest';
import { select } from 'd3';
import {
  applyLineJumpsToSvg,
  findEdgeIntersections,
  processEdgesWithJumps,
  type EdgeGeom,
  type LineJumpConfig,
} from './lineJump.js';
import kafkaGeometry from '../layout-algorithms/elk/__tests__/fixtures/kafka-moderation.edge-geometry.json' with { type: 'json' };

const config: LineJumpConfig = { enabled: true, jumpRadius: 6, jumpStyle: 'arc' };
const cramped: EdgeGeom[] = [
  {
    id: 'horizontal',
    curve: 'rounded',
    points: [
      { x: 0, y: 0 },
      { x: 0, y: 50 },
      { x: 100, y: 50 },
    ],
  },
  {
    id: 'vertical',
    points: [
      { x: 10, y: 0 },
      { x: 10, y: 100 },
    ],
  },
];
const arcCount = (paths: Map<string, string>) =>
  [...paths.values()].reduce((count, d) => count + (d.match(/A/g)?.length ?? 0), 0);

describe('line jump fallback', () => {
  it('tries the vertical edge when a rounded bend leaves the horizontal edge too little room', () => {
    const paths = processEdgesWithJumps(cramped, config);
    expect(paths.get('horizontal')).not.toContain('A');
    expect(paths.get('vertical')).toContain('A6,6');
    expect(findEdgeIntersections(cramped)[0].jumpEdgeId).toBe('horizontal');
  });

  it('uses the same fallback for gap style without shrinking the corner clearance', () => {
    const paths = processEdgesWithJumps(cramped, { ...config, jumpStyle: 'gap' });
    expect(paths.get('vertical')).toBe('M10,0 L10,44 M10,56 L10,100');
  });

  it('moves both crowded hops onto separate crossing edges', () => {
    const edges: EdgeGeom[] = [
      {
        id: 'h',
        points: [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      },
      {
        id: 'v1',
        points: [
          { x: 48, y: 0 },
          { x: 48, y: 100 },
        ],
      },
      {
        id: 'v2',
        points: [
          { x: 52, y: 0 },
          { x: 52, y: 100 },
        ],
      },
    ];
    const paths = processEdgesWithJumps(edges, config);
    expect(paths.get('h')).not.toContain('A');
    expect(paths.get('v1')).toContain('A6,6');
    expect(paths.get('v2')).toContain('A6,6');
  });

  it('still omits a hop when neither edge has sufficient clearance', () => {
    const edges: EdgeGeom[] = [
      cramped[0],
      {
        id: 'short',
        points: [
          { x: 10, y: 48 },
          { x: 10, y: 52 },
        ],
      },
    ];
    expect(arcCount(processEdgesWithJumps(edges, config))).toBe(0);
  });

  it('accounts for marker pullback before choosing the hopping edge', () => {
    const edges: EdgeGeom[] = [
      {
        id: 'h',
        arrowTypeEnd: 'arrow_point',
        points: [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      },
      {
        id: 'v',
        points: [
          { x: 91, y: 0 },
          { x: 91, y: 100 },
        ],
      },
    ];
    // Raw t says 9px remain; after marker pullback only 5px remain. The old
    // t * shortenedLength calculation incorrectly gave that crossing a hop.
    const paths = processEdgesWithJumps(edges, config);
    expect(paths.get('h')).not.toContain('A');
    expect(paths.get('v')).toContain('A6,6');
  });

  it('does not mutate input geometry or depend on edge order for an orthogonal fallback', () => {
    const before = JSON.stringify(cramped);
    const forward = processEdgesWithJumps(cramped, config);
    const backward = processEdgesWithJumps([...cramped].reverse(), config);
    expect(backward.get('vertical')).toBe(forward.get('vertical'));
    expect(JSON.stringify(cramped)).toBe(before);
  });

  it('uses the same fallback in the DOM and pure geometry entry points', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const group = select(svg).append('g');
    for (const edge of cramped) {
      group.append('path').attr('data-id', edge.id).attr('d', 'M0,0 L1,1');
    }
    applyLineJumpsToSvg(group, cramped, config);
    expect(group.node()!.querySelector('[data-id="vertical"]')!.getAttribute('d')).toContain(
      'A6,6'
    );
  });
});

describe('Kafka moderation regression geometry', () => {
  // Captured from Chromium rendering e2e/platform/dev-diagrams/layout-tests/flowchart/kafka-moderation.mmd.
  // This pins the line-hop stage independently of fonts and ELK version.
  const edges = kafkaGeometry as EdgeGeom[];

  it('renders all twelve detected crossings (upstream rendered only eight)', () => {
    expect(edges).toHaveLength(24);
    const before = JSON.stringify(edges);
    expect(findEdgeIntersections(edges)).toHaveLength(12);
    expect(arcCount(processEdgesWithJumps(edges, config))).toBe(12);
    expect(JSON.stringify(edges)).toBe(before);
  });

  it('also resolves all twelve with visible gaps', () => {
    const paths = processEdgesWithJumps(edges, { ...config, jumpStyle: 'gap' });
    const gaps = [...paths.values()].reduce(
      (count, d) => count + (d.match(/M/g)?.length ?? 1) - 1,
      0
    );
    expect(gaps).toBe(12);
  });
});

describe('line-hop dash-array ownership', () => {
  const edges: EdgeGeom[] = [
    {
      id: 'h',
      points: [
        { x: 0, y: 50 },
        { x: 100, y: 50 },
      ],
    },
    {
      id: 'v',
      points: [
        { x: 50, y: 0 },
        { x: 50, y: 100 },
      ],
    },
  ];

  it.each([
    'stroke-dasharray: 0 4 2 2 2 2 2 4; stroke: red;',
    'stroke-dasharray: 0 4 80 4; stroke: red;',
    'stroke: red; stroke-dasharray: 8 4;',
  ])('preserves dashed, custom and animated arrays: %s', (style) => {
    const group = select(document.createElementNS('http://www.w3.org/2000/svg', 'svg')).append('g');
    const h = group
      .append('path')
      .attr('data-id', 'h')
      .attr('d', 'M0,50 L100,50')
      .attr('style', style);
    group.append('path').attr('data-id', 'v').attr('d', 'M50,0 L50,100');
    Object.assign(h.node()!, { getTotalLength: () => 106 });
    applyLineJumpsToSvg(group, edges, config);
    expect(h.attr('d')).toContain('A6,6');
    expect(h.attr('style')).toBe(style);
  });

  it('recalculates only the generated solid declaration, preserving subsequent custom styles', () => {
    const group = select(document.createElementNS('http://www.w3.org/2000/svg', 'svg')).append('g');
    const h = group
      .append('path')
      .attr('data-id', 'h')
      .attr('data-line-hop-dasharray', 'true')
      .attr('d', 'M0,50 L100,50')
      .attr('style', 'stroke-dasharray: 0 4 92 4; stroke: red; stroke-dasharray: 8 4;');
    group.append('path').attr('data-id', 'v').attr('d', 'M50,0 L50,100');
    Object.assign(h.node()!, { getTotalLength: () => 106 });
    applyLineJumpsToSvg(group, edges, config);
    expect(h.attr('style')).toBe('stroke-dasharray: 0 4 98 4; stroke: red; stroke-dasharray: 8 4;');
  });
});
