// Regression spec for issue #62 — edge `instruction` metadata (§5.3).
// Edge `instruction` must survive from parse → raw edges → getData() IR →
// semantic model. The IR (`getData().edges`) previously dropped it.
import { describe, it, expect } from 'vitest';
import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';

const INSTRUCTION = 'Pass the distilled question and any relevant context to the next step';

const parse = (text: string) => {
  agentflow.parser.yy = new AgentFlowDB();
  agentflow.parser.yy.clear();
  agentflow.parser.yy.setGen('gen-2');
  agentflow.parser.parse(text);
  return agentflow.parser.yy as AgentFlowDB;
};

describe('issue #62: edge instruction metadata (§5.3)', function () {
  const diagram = `agentflow TB
  a["A"]
  b["B"]
  a e1@--> b
  e1@{ instruction: "${INSTRUCTION}" }`;

  it('surfaces instruction on the raw edge (getEdges)', function () {
    const db = parse(diagram);
    const edge = db.getEdges().find((e) => e.id === 'e1');
    expect(edge?.metadata).toMatchObject({ instruction: INSTRUCTION });
  });

  it('carries instruction into the IR (getData) — issue #62', function () {
    const db = parse(diagram);
    const edge = db.getData().edges.find((e) => e.id === 'e1');
    expect(edge?.metadata).toMatchObject({ instruction: INSTRUCTION });
  });

  it('carries instruction into the semantic model', function () {
    const db = parse(diagram);
    const edge = db.getSemanticModel().edges?.find((e) => e.id === 'e1');
    expect(edge?.metadata).toMatchObject({ instruction: INSTRUCTION });
  });

  it('leaves metadata undefined for edges without it', function () {
    const db = parse(`agentflow TB
  a["A"]
  b["B"]
  a --> b`);
    const edge = db.getData().edges[0];
    expect(edge.metadata).toBeUndefined();
  });
});
