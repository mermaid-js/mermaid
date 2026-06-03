// Regression spec for issue #63 — inline `@{ ... }` metadata on a flow header.
//
// `flow <id>@{ ... }` (and the labelled `flow <id>["..."]@{ ... }`) attach the
// metadata to the flow's subgraph, identically to the standalone
// `<id>@{ ... }` attachment, including §10 applicability validation.
import { describe, it, expect } from 'vitest';
import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';

const parse = (text: string) => {
  agentflow.parser.yy = new AgentFlowDB();
  agentflow.parser.yy.clear();
  agentflow.parser.yy.setGen('gen-2');
  agentflow.parser.parse(text);
  return agentflow.parser.yy as AgentFlowDB;
};

const flow = (db: AgentFlowDB, id: string) => db.getSubGraphs().find((s) => s.id === id);
const misapplied = (db: AgentFlowDB) =>
  db.getDiagnostics().filter((d) => d.id === 'METADATA_KEY_MISAPPLIED');

describe('issue #63: inline @{ } metadata on flow headers', () => {
  it('attaches multi-line inline metadata to the flow (issue example)', () => {
    const db = parse(`agentflow TB
  flow article_generation@{
         model: "claude-opus-4"
       }
        A --> B
  end`);
    const sg = flow(db, 'article_generation');
    expect(sg).toBeDefined();
    expect(sg?.metadata).toMatchObject({ model: 'claude-opus-4' });
    // The flow body is still parsed.
    expect(sg?.nodes).toEqual(expect.arrayContaining(['A', 'B']));
    expect(db.getEdges()).toHaveLength(1);
  });

  it('attaches single-line inline metadata to the flow', () => {
    const db = parse(`agentflow TB
  flow f@{ model: "claude-opus-4", memory: "shared" }
    a --> b
  end`);
    expect(flow(db, 'f')?.metadata).toMatchObject({
      model: 'claude-opus-4',
      memory: 'shared',
    });
  });

  it('supports the labelled inline form and keeps the title', () => {
    const db = parse(`agentflow TB
  flow f["Article Generation"]@{ model: "claude-opus-4" }
    a --> b
  end`);
    const sg = flow(db, 'f');
    expect(sg?.title).toBe('Article Generation');
    expect(sg?.metadata).toMatchObject({ model: 'claude-opus-4' });
  });

  it('applies §10 metadata validation to inline form (invalid key warns)', () => {
    const db = parse(`agentflow TB
  flow f@{ execution: "parallel" }
    a --> b
  end`);
    db.getData();
    // `execution` is task-only — same warning the standalone form produces.
    expect(misapplied(db)).toHaveLength(1);
  });

  it('valid flow keys on the inline form emit no warning', () => {
    const db = parse(`agentflow TB
  flow f@{ model: "m", memory: "shared", params: "x :: String", returns: "Out" }
    a --> b
  end`);
    db.getData();
    expect(misapplied(db)).toHaveLength(0);
  });
});
