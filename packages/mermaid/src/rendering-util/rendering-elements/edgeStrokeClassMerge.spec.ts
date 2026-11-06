import { select, type Selection } from 'd3';
import { AgentFlowDB } from '../../diagrams/agentflow/agentflowDb.js';
import agentflow from '../../diagrams/agentflow/parser/agentflowParser.js';
import { FlowDB } from '../../diagrams/flowchart/flowDb.js';
import flow from '../../diagrams/flowchart/parser/flowParser.js';
import { insertEdge } from './edges.js';

const shape = {
  intersect: (point: { x: number; y: number }) => point,
};

const fixturePoints = [
  { x: 0, y: 0 },
  { x: 40, y: 40 },
  { x: 80, y: 0 },
];

const classTokens = (
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  edgeId: string
): string[] => {
  const value = svg.select(`path[id="diagram-${edgeId}"]`).attr('class');
  return (value ?? '').trim().split(/\s+/);
};

const draw = <T extends { id: string }>(edges: readonly T[]) => {
  document.body.innerHTML = '';
  const svg = select(document.body).append('svg');
  for (const edge of edges) {
    const existing = (edge as { points?: { x: number; y: number }[] }).points;
    insertEdge(
      svg,
      {
        cssCompiledStyles: {},
        style: [],
        look: 'classic',
        curve: 'linear',
        arrowTypeEnd: 'arrow_point',
        ...edge,
        points: existing ?? fixturePoints,
      },
      null,
      'flowchart',
      shape,
      shape,
      'diagram'
    );
  }
  return svg;
};

describe('insertEdge merges stroke classes without a conflicting default', () => {
  it('drops edge-thickness-normal from a thick edge and keeps flowchart-link', () => {
    const svg = draw([
      {
        id: 'thick',
        thickness: 'thick',
        pattern: 'solid',
        classes: 'edge-thickness-normal edge-pattern-solid flowchart-link',
      },
    ]);

    const classes = classTokens(svg, 'thick');
    expect(classes.filter((token) => token.startsWith('edge-thickness-'))).toEqual([
      'edge-thickness-thick',
    ]);
    expect(classes).toContain('edge-pattern-solid');
    expect(classes).toContain('flowchart-link');
  });

  it('drops edge-pattern-solid from a dotted edge and keeps flowchart-link', () => {
    const svg = draw([
      {
        id: 'dotted',
        thickness: 'normal',
        pattern: 'dotted',
        classes: 'edge-thickness-normal edge-pattern-solid flowchart-link',
      },
    ]);

    const classes = classTokens(svg, 'dotted');
    expect(classes.filter((token) => token.startsWith('edge-pattern-'))).toEqual([
      'edge-pattern-dotted',
    ]);
    expect(classes).toContain('edge-thickness-normal');
    expect(classes).toContain('flowchart-link');
  });

  it('drops a conflicting pattern class from a dashed edge and keeps unrelated classes', () => {
    const svg = draw([
      {
        id: 'dashed',
        thickness: 'normal',
        pattern: 'dashed',
        classes: 'edge-pattern-solid relation',
      },
    ]);

    const classes = classTokens(svg, 'dashed');
    expect(classes).toContain('edge-pattern-dashed');
    expect(classes).toContain('relation');
    expect(classes).not.toContain('edge-pattern-solid');
  });

  it('keeps a thickness or pattern class that exists only on edge.classes', () => {
    const svg = draw([
      {
        id: 'from-classes',
        classes: 'edge-thickness-thick edge-pattern-dashed flowchart-link',
      },
    ]);

    const classes = classTokens(svg, 'from-classes');
    expect(classes).toContain('edge-thickness-thick');
    expect(classes).toContain('edge-pattern-dashed');
    expect(classes).toContain('flowchart-link');
  });

  it('does not give an invisible edge the normal thickness class', () => {
    const svg = draw([
      {
        id: 'invisible',
        thickness: 'invisible',
        pattern: 'invisible',
        classes: '',
      },
    ]);

    const classes = classTokens(svg, 'invisible');
    expect(classes).toContain('edge-thickness-invisible');
    expect(classes).not.toContain('edge-thickness-normal');
    expect(classes).not.toContain('flowchart-link');
  });

  it('renders flowchart thick, dotted, and invisible edges through the database', () => {
    const flowDb = new FlowDB();
    flowDb.setGen('gen-2');
    flow.parser.yy = flowDb;
    flow.parser.parse('flowchart LR\nA ==> B\nC -.-> D\nE ~~~ F');

    const edges = flowDb.getData().edges;
    const svg = draw(edges);
    const thick = edges.find((edge) => edge.thickness === 'thick');
    const dotted = edges.find((edge) => edge.pattern === 'dotted');
    const invisible = edges.find((edge) => edge.thickness === 'invisible');
    if (!thick || !dotted || !invisible) {
      throw new Error('flowchart fixture did not produce thick, dotted, and invisible edges');
    }

    const thickClasses = classTokens(svg, thick.id);
    expect(thickClasses).toContain('edge-thickness-thick');
    expect(thickClasses).not.toContain('edge-thickness-normal');
    expect(thickClasses).toContain('flowchart-link');

    const dottedClasses = classTokens(svg, dotted.id);
    expect(dottedClasses).toContain('edge-pattern-dotted');
    expect(dottedClasses).not.toContain('edge-pattern-solid');
    expect(dottedClasses).toContain('flowchart-link');
    expect(dottedClasses).toContain('edge-thickness-normal');

    const invisibleClasses = classTokens(svg, invisible.id);
    expect(invisibleClasses).toContain('edge-thickness-invisible');
    expect(invisibleClasses).not.toContain('edge-thickness-normal');
    expect(invisibleClasses).not.toContain('flowchart-link');
  });

  it('renders an agentflow dotted reference edge without a solid pattern class', () => {
    const db = new AgentFlowDB();
    agentflow.parser.yy = db;
    db.clear();
    db.setGen('gen-2');
    agentflow.parser.parse(`agentflow-beta TB
  a -.- b
  c --> d`);

    const edges = db.getData().edges;
    const svg = draw(edges);
    const dotted = edges.find((edge) => edge.pattern === 'dotted');
    const sequence = edges.find((edge) => edge.pattern === 'normal');
    if (!dotted || !sequence) {
      throw new Error('agentflow fixture did not produce a dotted edge and a normal edge');
    }

    const dottedClasses = classTokens(svg, dotted.id);
    expect(dottedClasses).toContain('edge-pattern-dotted');
    expect(dottedClasses).not.toContain('edge-pattern-solid');
    expect(dottedClasses).toContain('flowchart-link');

    const sequenceClasses = classTokens(svg, sequence.id);
    expect(sequenceClasses).toContain('flowchart-link');
    expect(sequenceClasses).toContain('edge-thickness-normal');
    expect(sequenceClasses).toContain('edge-pattern-solid');
  });
});
