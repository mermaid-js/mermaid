/**
 * `edgeSemantic` field tests (wave-2 PR 0 — wave-1 spillover).
 *
 * Per `AGENTFLOW-SYNTAX.md` §5.1, every edge operator carries a first-class
 * `edgeSemantic` value that downstream tooling reads as the authoritative
 * semantic. Wave-1 added the spec text but never wired the field; this PR
 * does. The mapping table is:
 *
 * | Operator | edgeSemantic   |
 * | -------- | -------------- |
 * | `-->`    | control        |
 * | `==>`    | data           |
 * | `--o`    | conformance    |
 * | `-->>`   | delegation     |
 * | `--x`    | failure        |
 * | `---`    | association    |
 * | `-.->`   | governance     |
 * | `o--o`   | bidirectional  |
 *
 * Operators outside the table (e.g. `<-->`, `x--x`, `-.->>`) leave
 * `edgeSemantic` as `undefined`. Existing `type` / `stroke` / `length`
 * fields are preserved unchanged so rendering is unaffected.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow edge semantic', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  const parseAndGetEdge = (operator: string) => {
    agentflow.parser.parse(`agentflow TB
  a["A"]
  b["B"]
  a ${operator} b`);
    const db = agentflow.parser.yy as AgentFlowDB;
    const edges = db.getEdges();
    expect(edges).toHaveLength(1);
    return { db, edge: edges[0] };
  };

  describe('canonical operator → edgeSemantic mapping', () => {
    it('`-->` maps to control', () => {
      const { edge } = parseAndGetEdge('-->');
      expect(edge.edgeSemantic).toBe('control');
    });

    it('`==>` maps to data', () => {
      const { edge } = parseAndGetEdge('==>');
      expect(edge.edgeSemantic).toBe('data');
    });

    it('`--o` maps to conformance', () => {
      const { edge } = parseAndGetEdge('--o');
      expect(edge.edgeSemantic).toBe('conformance');
    });

    it('`-->>` maps to delegation', () => {
      const { edge } = parseAndGetEdge('-->>');
      expect(edge.edgeSemantic).toBe('delegation');
    });

    it('`--x` maps to failure', () => {
      const { edge } = parseAndGetEdge('--x');
      expect(edge.edgeSemantic).toBe('failure');
    });

    it('`---` maps to association', () => {
      const { edge } = parseAndGetEdge('---');
      expect(edge.edgeSemantic).toBe('association');
    });

    it('`-.->` maps to governance', () => {
      const { edge } = parseAndGetEdge('-.->');
      expect(edge.edgeSemantic).toBe('governance');
    });

    it('`o--o` maps to bidirectional', () => {
      const { edge } = parseAndGetEdge('o--o');
      expect(edge.edgeSemantic).toBe('bidirectional');
    });
  });

  describe('length-extended operators preserve semantic', () => {
    it('`===>` (longer thick) is still data', () => {
      const { edge } = parseAndGetEdge('===>');
      expect(edge.edgeSemantic).toBe('data');
    });

    it('`---->` (longer normal) is still control', () => {
      const { edge } = parseAndGetEdge('---->');
      expect(edge.edgeSemantic).toBe('control');
    });

    it('`-..->` (longer dotted) is still governance', () => {
      const { edge } = parseAndGetEdge('-..->');
      expect(edge.edgeSemantic).toBe('governance');
    });
  });

  describe('off-table operators', () => {
    it('`<-->` (double_arrow_point, normal) leaves edgeSemantic undefined', () => {
      const { edge } = parseAndGetEdge('<-->');
      expect(edge.edgeSemantic).toBeUndefined();
    });

    it('`x--x` (double_arrow_cross, normal) leaves edgeSemantic undefined', () => {
      const { edge } = parseAndGetEdge('x--x');
      expect(edge.edgeSemantic).toBeUndefined();
    });
  });

  describe('regression — type/stroke/length unchanged by the new field', () => {
    it('`-->` keeps {type: arrow_point, stroke: normal}', () => {
      const { edge } = parseAndGetEdge('-->');
      expect(edge.type).toBe('arrow_point');
      expect(edge.stroke).toBe('normal');
    });

    it('`==>` keeps {type: arrow_point, stroke: thick}', () => {
      const { edge } = parseAndGetEdge('==>');
      expect(edge.type).toBe('arrow_point');
      expect(edge.stroke).toBe('thick');
    });

    it('`-.->` keeps {type: arrow_point, stroke: dotted}', () => {
      const { edge } = parseAndGetEdge('-.->');
      expect(edge.type).toBe('arrow_point');
      expect(edge.stroke).toBe('dotted');
    });
  });

  describe('semantic model export', () => {
    it('surfaces edgeSemantic in getSemanticModel().edges', () => {
      agentflow.parser.parse(`agentflow TB
  a["A"]
  b["B"]
  c["C"]
  a --> b
  b ==> c`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const model = db.getSemanticModel();
      expect(model.edges).toHaveLength(2);
      expect(model.edges[0].edgeSemantic).toBe('control');
      expect(model.edges[1].edgeSemantic).toBe('data');
    });

    it('omits edgeSemantic from the semantic edge when source operator is off-table', () => {
      agentflow.parser.parse(`agentflow TB
  a["A"]
  b["B"]
  a <--> b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const model = db.getSemanticModel();
      expect(model.edges).toHaveLength(1);
      expect(model.edges[0].edgeSemantic).toBeUndefined();
    });
  });
});
