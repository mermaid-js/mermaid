// Regression spec for issue #75 — standalone attachment mappings.
//
// A standalone `id@{ ... }` metadata block annotates an element declared
// elsewhere; it previously emitted a plain `vertex` mapping spanning the
// whole block, indistinguishable from a declaration. It must now map as
// `attachment` so downstream consumers (e.g. agentflow-semantics'
// ID_DUPLICATE rule) can tell annotations apart from redeclarations.
// The inline form `id["..."]@{ ... }` keeps its single widened `vertex`
// mapping (issue #60).
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

describe('issue #75: standalone `id@{ ... }` attachment mappings', () => {
  it('a standalone task attachment maps as `attachment`, not a second `vertex`', () => {
    // The reproduction from the issue.
    const db = parse(`agentflow-beta TB

flow demo
  helper["Helper"]
end

helper@{ instruction: "Answer precisely." }`);
    const helper = db.getElementMappings().filter((m) => m.id === 'helper');
    expect(helper.map((m) => m.type).sort()).toEqual(['attachment', 'vertex']);
    const decl = helper.find((m) => m.type === 'vertex');
    const attach = helper.find((m) => m.type === 'attachment');
    expect(decl?.position.startLine).toBe(4);
    // The attachment spans the whole statement, id through closing `}`.
    expect(attach?.position.startLine).toBe(7);
    expect(attach?.position.startColumn).toBe(0);
    expect(attach?.position.endLine).toBe(7);
  });

  it('a flow attachment maps as `attachment`, so the flow id owns no vertex mapping', () => {
    const db = parse(`agentflow-beta TB
  flow pipeline["Pipeline"]
    a --> b
  end
  pipeline@{ view: "collapsed" }`);
    const pipeline = db.getElementMappings().filter((m) => m.id === 'pipeline');
    expect(pipeline.map((m) => m.type).sort()).toEqual(['attachment', 'subgraph']);
  });

  it('a connector attachment maps as `attachment`', () => {
    const db = parse(`agentflow-beta TB
  connector github["GitHub"]
  github@{ protocol: "mcp", transport: "stdio" }`);
    const github = db.getElementMappings().filter((m) => m.id === 'github');
    expect(github.map((m) => m.type).sort()).toEqual(['attachment', 'connector']);
  });

  it('an edge-metadata attachment (`e1@{ ... }` after `a e1@--> b`) maps as `attachment`', () => {
    const db = parse(`agentflow-beta TB
  a["A"]
  b["B"]
  a e1@--> b
  e1@{ instruction: "hand off" }`);
    const e1 = db.getElementMappings().filter((m) => m.id === 'e1' && m.type !== 'edge');
    expect(e1.map((m) => m.type)).toEqual(['attachment']);
  });

  it('a multiline standalone block spans through the closing brace and is hit-testable', () => {
    const db = parse(`agentflow-beta TB
  a["Alpha"]
  a@{
    instruction: "do the thing"
  }`);
    const attach = db.getElementMappings().find((m) => m.id === 'a' && m.type === 'attachment');
    expect(attach).toBeDefined();
    expect(attach!.position.startLine).toBe(3);
    expect(attach!.position.endLine).toBe(5);
    // A cursor inside the block resolves to the attachment, not the flow.
    const hit = db.getElementAtPosition(4, 8);
    expect(hit?.id).toBe('a');
    expect(hit?.type).toBe('attachment');
  });

  it('inline id["..."]@{ ... } keeps its single widened `vertex` mapping (issue #60)', () => {
    const db = parse(`agentflow-beta TB
  a["A"]
  b["B"]@{ shape: rect }
  a --> b`);
    // Edge mappings reuse the destination id, so exclude them.
    const b = db.getElementMappings().filter((m) => m.id === 'b' && m.type !== 'edge');
    expect(b.every((m) => m.type === 'vertex')).toBe(true);
  });

  it('a bare reference without a block stays a `vertex` mapping', () => {
    const db = parse(`agentflow-beta TB
  a --> b`);
    const a = db.getElementById('a');
    expect(a?.type).toBe('vertex');
  });

  it('getMappingStats counts attachments separately', () => {
    const db = parse(`agentflow-beta TB
  flow p["P"]
    a --> b
  end
  p@{ view: "collapsed" }`);
    const stats = db.getMappingStats();
    expect(stats.attachments).toBe(1);
    expect(stats.totalElements).toBe(
      stats.vertices + stats.edges + stats.subgraphs + stats.connectors + stats.attachments
    );
  });
});
