// Spec for issue #80 — the `global … end` block. Nodes declared inside it are
// globally scoped: they keep NO parent even when referenced inside a
// `flow … end` block afterwards. Flow membership is otherwise textual (any id
// referenced inside a flow joins it), which is exactly the "sucking in" the
// global block opts out of. The block renders nothing itself — no container
// is emitted for it.
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

describe('issue #80: global scope block', () => {
  const source = `agentflow-beta

global
  A
end

flow
 A --> B --> C
end`;

  it('excludes a global node from the flow membership', () => {
    const db = parse(source);
    const subGraphs = db.getSubGraphs();
    expect(subGraphs).toHaveLength(1);
    const flow = subGraphs[0];
    expect(flow.nodes).not.toContain('A');
    expect(flow.nodes).toContain('B');
    expect(flow.nodes).toContain('C');
  });

  it('emits the global node without a parentId while flow members keep theirs', () => {
    const db = parse(source);
    const { nodes } = db.getData();
    const flowId = db.getSubGraphs()[0].id;
    expect(nodes.find((n) => n.id === 'A')?.parentId).toBeUndefined();
    expect(nodes.find((n) => n.id === 'B')?.parentId).toBe(flowId);
    expect(nodes.find((n) => n.id === 'C')?.parentId).toBe(flowId);
  });

  it('keeps the edges from the flow intact', () => {
    const db = parse(source);
    const { edges } = db.getData();
    expect(edges.some((e) => e.start === 'A' && e.end === 'B')).toBe(true);
    expect(edges.some((e) => e.start === 'B' && e.end === 'C')).toBe(true);
  });

  it('emits no container node for the global block itself', () => {
    const db = parse(source);
    const { nodes } = db.getData();
    const groups = nodes.filter((n) => n.isGroup);
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe(db.getSubGraphs()[0].id);
  });

  it('is order-independent: a global block after the flow still releases the node', () => {
    const db = parse(`agentflow-beta

flow pipeline["Pipeline"]
  A --> B
end

global
  A
end`);
    const flow = db.getSubGraphs().find((s) => s.id === 'pipeline');
    expect(flow?.nodes).not.toContain('A');
    expect(flow?.nodes).toContain('B');
    const { nodes } = db.getData();
    expect(nodes.find((n) => n.id === 'A')?.parentId).toBeUndefined();
    expect(nodes.find((n) => n.id === 'B')?.parentId).toBe('pipeline');
  });

  it('allows edges inside the global block; both endpoints become global', () => {
    const db = parse(`agentflow-beta

global
  A --> X
end

flow f["Flow"]
  A --> B
  X --> B
end`);
    const flow = db.getSubGraphs().find((s) => s.id === 'f');
    expect(flow?.nodes).toEqual(['B']);
    const { nodes, edges } = db.getData();
    expect(nodes.find((n) => n.id === 'A')?.parentId).toBeUndefined();
    expect(nodes.find((n) => n.id === 'X')?.parentId).toBeUndefined();
    expect(edges.some((e) => e.start === 'A' && e.end === 'X')).toBe(true);
  });

  it('acts as an escape hatch when nested inside a flow', () => {
    const db = parse(`agentflow-beta

flow f["Flow"]
  global
    A
  end
  A --> B
end`);
    const flow = db.getSubGraphs().find((s) => s.id === 'f');
    expect(flow?.nodes).toEqual(['B']);
    const { nodes } = db.getData();
    expect(nodes.find((n) => n.id === 'A')?.parentId).toBeUndefined();
    expect(nodes.find((n) => n.id === 'B')?.parentId).toBe('f');
  });

  it('supports labels and shapes on nodes declared in the global block', () => {
    const db = parse(`agentflow-beta

global
  A["Shared input"]
  D{"Decision"}
end

flow f["Flow"]
  A --> B --> D
end`);
    const { nodes } = db.getData();
    const a = nodes.find((n) => n.id === 'A');
    expect(a?.parentId).toBeUndefined();
    expect(a?.label).toBe('Shared input');
    const d = nodes.find((n) => n.id === 'D');
    expect(d?.parentId).toBeUndefined();
    expect(d?.shape).toBe('diamond');
  });

  it('merges multiple global blocks', () => {
    const db = parse(`agentflow-beta

global
  A
end

global
  B
end

flow f["Flow"]
  A --> B --> C
end`);
    const flow = db.getSubGraphs().find((s) => s.id === 'f');
    expect(flow?.nodes).toEqual(['C']);
  });

  it('keeps "global" usable inside bracketed labels', () => {
    const db = parse(`agentflow-beta

flow f["global settings"]
  a["a global thing"] --> b
end`);
    expect(db.getSubGraphs()[0].title).toBe('global settings');
    const { nodes } = db.getData();
    expect(nodes.find((n) => n.id === 'a')?.label).toBe('a global thing');
  });
});
