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

describe('issue #63: inline @{ } metadata on flow headers', () => {
  it('attaches multi-line inline metadata to the flow (issue example)', () => {
    const db = parse(`agentflow-beta TB
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
    const db = parse(`agentflow-beta TB
  flow f@{ model: "claude-opus-4", memory: "shared" }
    a --> b
  end`);
    expect(flow(db, 'f')?.metadata).toMatchObject({
      model: 'claude-opus-4',
      memory: 'shared',
    });
  });

  it('supports the labelled inline form and keeps the title', () => {
    const db = parse(`agentflow-beta TB
  flow f["Article Generation"]@{ model: "claude-opus-4" }
    a --> b
  end`);
    const sg = flow(db, 'f');
    expect(sg?.title).toBe('Article Generation');
    expect(sg?.metadata).toMatchObject({ model: 'claude-opus-4' });
  });

  it('carries inline metadata verbatim without validating it (issue #64)', () => {
    const db = parse(`agentflow-beta TB
  flow f@{ model: "m", memory: "shared", execution: "parallel", custom: 1 }
    a --> b
  end`);
    db.getData();
    // Parser carries every key as-authored; applicability is a semantic concern.
    expect(flow(db, 'f')?.metadata).toMatchObject({
      model: 'm',
      memory: 'shared',
      execution: 'parallel',
      custom: 1,
    });
    expect(db.getDiagnostics()).toHaveLength(0);
  });
});
