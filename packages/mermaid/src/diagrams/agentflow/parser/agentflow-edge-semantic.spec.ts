/**
 * `edgeSemantic` field tests (v0.8.1).
 *
 * Per the agentflow syntax specification §5.1, every edge operator carries a first-class
 * `edgeSemantic` value that downstream tooling reads as the authoritative
 * semantic. The v0.8.1 mapping table is:
 *
 * | Operator | edgeSemantic |
 * | -------- | ------------ |
 * | `-->`    | sequence     |
 * | `-.-`    | reference    |
 * | `--x`    | failure      |
 *
 * Operators outside the table leave `edgeSemantic` as `undefined` (or are
 * outright rejected by the grammar). Existing `type` / `stroke` / `length`
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
    agentflow.parser.parse(`agentflow-beta TB
  a["A"]
  b["B"]
  a ${operator} b`);
    const db = agentflow.parser.yy as AgentFlowDB;
    const edges = db.getEdges();
    expect(edges).toHaveLength(1);
    return { db, edge: edges[0] };
  };

  describe('canonical operator → edgeSemantic mapping', () => {
    it('`-->` maps to sequence', () => {
      const { edge } = parseAndGetEdge('-->');
      expect(edge.edgeSemantic).toBe('sequence');
    });

    it('`-.-` maps to reference', () => {
      const { edge } = parseAndGetEdge('-.-');
      expect(edge.edgeSemantic).toBe('reference');
    });

    it('`--x` maps to failure', () => {
      const { edge } = parseAndGetEdge('--x');
      expect(edge.edgeSemantic).toBe('failure');
    });
  });

  describe('length-extended operators preserve semantic', () => {
    it('`---->` (longer normal) is still sequence', () => {
      const { edge } = parseAndGetEdge('---->');
      expect(edge.edgeSemantic).toBe('sequence');
    });
  });

  describe('regression — type/stroke unchanged by the new field', () => {
    it('`-->` keeps {type: arrow_point, stroke: normal}', () => {
      const { edge } = parseAndGetEdge('-->');
      expect(edge.type).toBe('arrow_point');
      expect(edge.stroke).toBe('normal');
    });

    it('`-.-` keeps {stroke: dotted}', () => {
      const { edge } = parseAndGetEdge('-.-');
      expect(edge.stroke).toBe('dotted');
    });

    it('`--x` keeps {type: arrow_cross, stroke: normal}', () => {
      const { edge } = parseAndGetEdge('--x');
      expect(edge.type).toBe('arrow_cross');
      expect(edge.stroke).toBe('normal');
    });
  });

  describe('semantic model export', () => {
    it('surfaces edgeSemantic in getSemanticModel().edges', () => {
      agentflow.parser.parse(`agentflow-beta TB
  a["A"]
  b["B"]
  c["C"]
  a --> b
  b --x c`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const model = db.getSemanticModel();
      expect(model.edges).toHaveLength(2);
      expect(model.edges[0].edgeSemantic).toBe('sequence');
      expect(model.edges[1].edgeSemantic).toBe('failure');
    });
  });
});
