import { select } from 'd3';
import { describe, expect, it } from 'vitest';
import { AgentFlowDB } from './agentflowDb.js';
import agentflow from './parser/agentflowParser.js';
import { insertEdge } from '../../rendering-util/rendering-elements/edges.js';

describe('agentflow edge classes', () => {
  const renderedClasses = (text: string): string[][] => {
    const db = new AgentFlowDB();
    agentflow.parser.yy = db;
    db.clear();
    db.setGen('gen-2');
    agentflow.parser.parse(text);

    document.body.innerHTML = '';
    const svg = select(document.body).append('svg');
    const shape = { intersect: (point: { x: number; y: number }) => point };

    return db.getData().edges.map((edge) => {
      edge.points = [
        { x: 0, y: 0 },
        { x: 0, y: 50 },
        { x: 0, y: 100 },
      ];
      insertEdge(svg, edge, null, 'agentflow', shape, shape, 'diagram');
      return svg.select(`path[id="diagram-${edge.id}"]`).attr('class').trim().split(/\s+/);
    });
  };

  // agentflow has no thick edges, so the dotted reference edge is the one that could clash
  it('should give a dotted edge a single thickness and pattern class', () => {
    const [dotted] = renderedClasses('agentflow-beta TB\n  a -.- b');

    expect(dotted.filter((c) => c.startsWith('edge-thickness-'))).toEqual([
      'edge-thickness-normal',
    ]);
    expect(dotted.filter((c) => c.startsWith('edge-pattern-'))).toEqual(['edge-pattern-dotted']);
    expect(dotted).toContain('flowchart-link');
  });
});
