// Regression spec for issue #70 — a task inside a `flow … end` block drawing
// an edge to the flow's own id made the flow a member of its own subgraph.
// `getData()` then emitted the flow node with `parentId === id`, and graphlib's
// `setParent(id, id)` threw "would create a cycle", blanking the whole diagram.
// The construct is semantically questionable (a semantics-layer rule may flag
// it), but the renderer must degrade gracefully: drop the self-parent and still
// draw the flow, its tasks, and the edge.
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

describe('issue #70: edge from a task to its own containing flow', () => {
  const source = `agentflow-beta TB
  flow myFlow["My Flow"]
    a["Task A"]
    a --> myFlow
  end`;

  it('does not make the flow a member of its own subgraph', () => {
    const db = parse(source);
    const sg = db.getSubGraphs().find((s) => s.id === 'myFlow');
    expect(sg).toBeDefined();
    expect(sg?.nodes).toContain('a');
    expect(sg?.nodes).not.toContain('myFlow');
  });

  it('emits the flow node without a self parentId', () => {
    const db = parse(source);
    const { nodes } = db.getData();
    const flowNode = nodes.find((n) => n.id === 'myFlow');
    expect(flowNode).toBeDefined();
    expect(flowNode?.parentId).toBeUndefined();
  });

  it('still emits the task inside the flow and the edge to the flow', () => {
    const db = parse(source);
    const { nodes, edges } = db.getData();
    const task = nodes.find((n) => n.id === 'a');
    expect(task?.parentId).toBe('myFlow');
    expect(edges.some((e) => e.start === 'a' && e.end === 'myFlow')).toBe(true);
  });

  describe('nested subgraphs', () => {
    it('a nested flow referencing its own id degrades the same way', () => {
      const db = parse(`agentflow-beta TB
  flow outer["Outer"]
    flow inner["Inner"]
      b["Task B"]
      b --> inner
    end
  end`);
      const inner = db.getSubGraphs().find((s) => s.id === 'inner');
      expect(inner?.nodes).not.toContain('inner');
      const { nodes } = db.getData();
      const innerNode = nodes.find((n) => n.id === 'inner');
      // `inner` keeps its real parent (`outer`) — only the self-membership is dropped.
      expect(innerNode?.parentId).toBe('outer');
    });

    it('self-reference at the middle of a three-level nesting keeps the chain intact', () => {
      const db = parse(`agentflow-beta TB
  flow top["Top"]
    flow mid["Mid"]
      flow leafFlow["Leaf"]
        c["Task C"]
      end
      m["Task M"]
      m --> mid
    end
  end`);
      const mid = db.getSubGraphs().find((s) => s.id === 'mid');
      expect(mid?.nodes).not.toContain('mid');
      const { nodes } = db.getData();
      // The full parent chain survives: leafFlow → mid → top, top is root.
      expect(nodes.find((n) => n.id === 'leafFlow')?.parentId).toBe('mid');
      expect(nodes.find((n) => n.id === 'mid')?.parentId).toBe('top');
      expect(nodes.find((n) => n.id === 'top')?.parentId).toBeUndefined();
      expect(nodes.find((n) => n.id === 'm')?.parentId).toBe('mid');
      expect(nodes.find((n) => n.id === 'c')?.parentId).toBe('leafFlow');
    });

    it('self-references at two nesting levels at once are both dropped', () => {
      const db = parse(`agentflow-beta TB
  flow outer["Outer"]
    flow inner["Inner"]
      b["Task B"]
      b --> inner
    end
    a["Task A"]
    a --> outer
  end`);
      const subGraphs = db.getSubGraphs();
      expect(subGraphs.find((s) => s.id === 'outer')?.nodes).not.toContain('outer');
      expect(subGraphs.find((s) => s.id === 'inner')?.nodes).not.toContain('inner');
      const { nodes, edges } = db.getData();
      expect(nodes.find((n) => n.id === 'outer')?.parentId).toBeUndefined();
      expect(nodes.find((n) => n.id === 'inner')?.parentId).toBe('outer');
      expect(edges.some((e) => e.start === 'b' && e.end === 'inner')).toBe(true);
      expect(edges.some((e) => e.start === 'a' && e.end === 'outer')).toBe(true);
    });
  });

  it('a normal flow membership is untouched', () => {
    const db = parse(`agentflow-beta TB
  flow f["F"]
    a --> b
  end`);
    const sg = db.getSubGraphs().find((s) => s.id === 'f');
    expect(sg?.nodes).toEqual(expect.arrayContaining(['a', 'b']));
    const { nodes } = db.getData();
    expect(nodes.find((n) => n.id === 'a')?.parentId).toBe('f');
    expect(nodes.find((n) => n.id === 'f')?.parentId).toBeUndefined();
  });
});
