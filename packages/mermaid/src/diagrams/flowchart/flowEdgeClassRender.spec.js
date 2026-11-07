import { describe, it, expect } from 'vitest';
import { select } from 'd3';
import { FlowDB } from './flowDb.js';
import flow from './parser/flowParser.ts';
import { insertEdge } from '../../rendering-util/rendering-elements/edges.js';

const DIAGRAM_ID = 'd';

/** A shape whose boundary is the point it is asked about, so clipping keeps every point. */
const shape = () => ({ intersect: (point) => point });

/** Parses a flowchart and draws its first edge the way each layout engine's renderer does. */
function drawFirstEdge(text, layout) {
  const db = new FlowDB();
  flow.parser.yy = db;
  flow.parser.yy.clear();
  flow.parser.parse(text);
  const [edge] = db.getData().edges;
  document.body.innerHTML = '';
  const svg = select(document.body).append('svg');
  insertEdge(
    svg,
    {
      ...edge,
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 50 },
        { x: 0, y: 100 },
      ],
    },
    null,
    'flowchart',
    shape(),
    shape(),
    DIAGRAM_ID,
    false,
    layout
  );
  return svg.select('path').attr('style');
}

describe.each(['dagre', 'elk'])('a class on an edge reaches the %s path', (layout) => {
  it('styles the path with the classDef of A -->:::hot B', () => {
    const style = drawFirstEdge(
      'flowchart TD;\nA -->:::hot B;\nclassDef hot stroke:#f66,stroke-width:3px;',
      layout
    );
    expect(style).toContain('stroke:#f66');
    expect(style).toContain('stroke-width:3px');
  });

  it('leaves the path unstyled without the suffix', () => {
    const style = drawFirstEdge(
      'flowchart TD;\nA --> B;\nclassDef hot stroke:#f66,stroke-width:3px;',
      layout
    );
    expect(style).not.toContain('stroke:#f66');
  });

  it('keeps the colour of a label that merely reads ":::hot"', () => {
    const style = drawFirstEdge(
      'flowchart TD;\nA --:::hot--> B;\nclassDef hot stroke:#f66,stroke-width:3px;',
      layout
    );
    expect(style).not.toContain('stroke:#f66');
  });
});

/** Parses a flowchart, builds its edges the way the renderer does and returns the first path's class. */
function firstEdgeClassAttribute(text) {
  const db = new FlowDB();
  flow.parser.yy = db;
  flow.parser.yy.clear();
  flow.parser.parse(text);
  const [edge] = db.getData().edges;
  return edge.classes.split(' ');
}

describe('a class on an edge is named on the edge element', () => {
  it('adds the class as written next to the built-in edge classes', () => {
    expect(firstEdgeClassAttribute('flowchart TD;\nA -->:::hot B;')).toEqual([
      'edge-thickness-normal',
      'edge-pattern-solid',
      'flowchart-link',
      'hot',
    ]);
  });

  it('adds the class of an edge that is given an ID', () => {
    expect(firstEdgeClassAttribute('flowchart TD;\nA e1@-->:::hot B;')).toContain('hot');
  });

  it('adds the class that `class e1 hot` gives an edge, the same way', () => {
    expect(firstEdgeClassAttribute('flowchart TD;\nA e1@--> B;\nclass e1 hot;')).toContain('hot');
  });

  it('leaves the classes as they were without the suffix', () => {
    expect(firstEdgeClassAttribute('flowchart TD;\nA --> B;')).toEqual([
      'edge-thickness-normal',
      'edge-pattern-solid',
      'flowchart-link',
    ]);
  });

  it('reaches the drawn path', () => {
    const classes = firstEdgeClassAttribute('flowchart TD;\nA -->:::hot B;');
    document.body.innerHTML = '<svg></svg>';
    const svg = select(document.body).select('svg');
    insertEdge(
      svg,
      {
        id: 'L1',
        classes: classes.join(' '),
        points: [
          { x: 0, y: 0 },
          { x: 0, y: 50 },
          { x: 0, y: 100 },
        ],
      },
      null,
      'flowchart',
      shape(),
      shape(),
      DIAGRAM_ID,
      false,
      'dagre'
    );
    expect(svg.select('path').classed('hot')).toBe(true);
  });
});
