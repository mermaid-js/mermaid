/**
 * Hexagon branching-warning tests (closes #4).
 *
 * Exercises the post-parse validator wired into `AgentFlowDB.getData()`:
 * a `hexagon` (or alias `hex`) with two-or-more branch-labelled outgoing
 * edges emits the `HEXAGON_MULTI_BRANCH` warning. Other shapes and
 * single-branch hexagons do not.
 *
 * Per `AGENTFLOW-SYNTAX.md` §4.2 — `diamond` is the canonical branching
 * vertex; `hexagon` is a condition/classification source.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow hexagon branching warning', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  const diagnosticsFor = (db: AgentFlowDB, id: string) =>
    db.getDiagnostics().filter((d) => d.id === id);

  it('does not warn when a hexagon has only one branch-labelled outgoing edge', () => {
    agentflow.parser.parse(`agentflow TB
  h{{"classify"}}
  out["out"]
  h -- yes --> out`);
    const db = agentflow.parser.yy as AgentFlowDB;
    db.getData();
    expect(diagnosticsFor(db, 'HEXAGON_MULTI_BRANCH')).toHaveLength(0);
  });

  it('warns when a hexagon has two or more branch-labelled outgoing edges', () => {
    agentflow.parser.parse(`agentflow TB
  h{{"classify"}}
  yes["yes"]
  no["no"]
  h -- yes --> yes
  h -- no --> no`);
    const db = agentflow.parser.yy as AgentFlowDB;
    db.getData();
    const warnings = diagnosticsFor(db, 'HEXAGON_MULTI_BRANCH');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].severity).toBe('warning');
    expect(warnings[0].nodeId).toBe('h');
    expect(warnings[0].message).toContain('diamond');
    // Position was resolved from the element mapping.
    expect(warnings[0].position?.startLine).toBe(2);
  });

  it('does not warn for diamond with multiple branch labels (diamond is the canonical branching vertex)', () => {
    agentflow.parser.parse(`agentflow TB
  d{"approved?"}
  ok["ok"]
  reject["reject"]
  d -- yes --> ok
  d -- no --> reject`);
    const db = agentflow.parser.yy as AgentFlowDB;
    db.getData();
    expect(diagnosticsFor(db, 'HEXAGON_MULTI_BRANCH')).toHaveLength(0);
  });

  it('does not warn when a hexagon has unlabelled outgoing edges (no branches)', () => {
    agentflow.parser.parse(`agentflow TB
  h{{"classify"}}
  a["a"]
  b["b"]
  h --> a
  h --> b`);
    const db = agentflow.parser.yy as AgentFlowDB;
    db.getData();
    expect(diagnosticsFor(db, 'HEXAGON_MULTI_BRANCH')).toHaveLength(0);
  });

  it('treats `@{ shape: hex }` alias the same as hexagon', () => {
    agentflow.parser.parse(`agentflow TB
  h["classify"]
  h@{ shape: hex }
  a["a"]
  b["b"]
  h -- yes --> a
  h -- no --> b`);
    const db = agentflow.parser.yy as AgentFlowDB;
    db.getData();
    expect(diagnosticsFor(db, 'HEXAGON_MULTI_BRANCH')).toHaveLength(1);
  });

  it('emits one warning per offending hexagon when multiple are present', () => {
    agentflow.parser.parse(`agentflow TB
  h1{{"c1"}}
  h2{{"c2"}}
  a["a"]
  b["b"]
  c["c"]
  d["d"]
  h1 -- yes --> a
  h1 -- no --> b
  h2 -- lo --> c
  h2 -- hi --> d`);
    const db = agentflow.parser.yy as AgentFlowDB;
    db.getData();
    const warnings = diagnosticsFor(db, 'HEXAGON_MULTI_BRANCH');
    expect(warnings).toHaveLength(2);
    expect(warnings.map((w) => w.nodeId).sort()).toEqual(['h1', 'h2']);
  });

  it('validator is idempotent across repeated getData() calls', () => {
    agentflow.parser.parse(`agentflow TB
  h{{"classify"}}
  a["a"]
  b["b"]
  h -- yes --> a
  h -- no --> b`);
    const db = agentflow.parser.yy as AgentFlowDB;
    db.getData();
    db.getData();
    db.getData();
    expect(diagnosticsFor(db, 'HEXAGON_MULTI_BRANCH')).toHaveLength(1);
  });

  it('clear() allows the validator to re-run on the next parse', () => {
    agentflow.parser.parse(`agentflow TB
  h{{"classify"}}
  a["a"]
  b["b"]
  h -- yes --> a
  h -- no --> b`);
    const db = agentflow.parser.yy as AgentFlowDB;
    db.getData();
    expect(diagnosticsFor(db, 'HEXAGON_MULTI_BRANCH')).toHaveLength(1);

    db.clear();
    expect(db.getDiagnostics()).toHaveLength(0);

    agentflow.parser.parse(`agentflow TB
  h2{{"c2"}}
  x["x"]
  y["y"]
  h2 -- yes --> x
  h2 -- no --> y`);
    db.getData();
    const after = diagnosticsFor(db, 'HEXAGON_MULTI_BRANCH');
    expect(after).toHaveLength(1);
    expect(after[0].nodeId).toBe('h2');
  });
});
