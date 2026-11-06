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
