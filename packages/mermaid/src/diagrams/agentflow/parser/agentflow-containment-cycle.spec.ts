// Regression spec for mutual containment between two `flow` containers.
//
// An edge written inside one container that names another container folds that
// container into the first one's member list — so `a1 --> B` inside `flow A`
// makes `B` a member of `A`, and the mirror edge makes `A` a member of `B`.
// Nothing in the grammar forbids it and no explicit nesting is involved.
//
// Before this guard, `getData()` recursed forever in `collectDescendants` when
// either container was collapsed (`RangeError: Maximum call stack size
// exceeded`, thrown on the unconditional `renderer.ts` call path, so the whole
// diagram blanked), and emitted `{id:'A',parentId:'B'}` together with
// `{id:'B',parentId:'A'}` when neither was — which graphlib rejects with
// "Setting B as parent of A would create a cycle".
//
// Same class as issue #70, which only filtered a container out of its *own*
// member list, not out of a peer's.
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

const mutual = (viewA = '', viewB = '') => `agentflow-beta TB
  flow A["Flow A"]${viewA}
    a1["Task A1"]
    a1 --> B
  end
  flow B["Flow B"]${viewB}
    b1["Task B1"]
    b1 --> A
  end`;

describe('mutual containment between two flow containers', () => {
  describe('neither container collapsed', () => {
    it('does not emit a parent chain that closes a cycle', () => {
      const { nodes } = parse(mutual()).getData();
      const parentOf = new Map(nodes.map((n) => [n.id, n.parentId]));

      // Walk up from every node; a cycle would loop forever.
      for (const node of nodes) {
        const seen = new Set<string>();
        let current = parentOf.get(node.id);
        while (current !== undefined) {
          expect(seen.has(current)).toBe(false);
          seen.add(current);
          current = parentOf.get(current);
        }
      }
    });

    it('keeps the first containment and drops only the one closing the loop', () => {
      const { nodes } = parse(mutual()).getData();
      const parentOf = new Map(nodes.map((n) => [n.id, n.parentId]));
      expect(parentOf.get('A')).toBe('B');
      expect(parentOf.get('B')).toBeUndefined();
      // The tasks keep their real containers.
      expect(parentOf.get('a1')).toBe('A');
      expect(parentOf.get('b1')).toBe('B');
    });

    it('reports the dropped nesting as a containment violation', () => {
      const db = parse(mutual());
      db.getData();
      const diagnostic = db
        .getDiagnostics()
        .find((d) => d.id === 'CONTAINMENT_VIOLATION' && d.nodeId === 'B');
      expect(diagnostic).toBeDefined();
      expect(diagnostic?.severity).toBe('warning');
    });
  });

  describe('one container collapsed', () => {
    it('does not recurse forever', () => {
      expect(() => parse(mutual('@{ view: collapsed }')).getData()).not.toThrow();
    });

    it('still draws the collapsed container it was asked to draw', () => {
      const { nodes } = parse(mutual('@{ view: collapsed }')).getData();
      expect(nodes.map((n) => n.id)).toContain('A');
      const collapsed = nodes.find((n) => n.id === 'A');
      expect(collapsed?.shape).toBe('collapsedGroup');
      expect(collapsed?.parentId).toBeUndefined();
    });
  });

  describe('both containers collapsed', () => {
    it('does not recurse forever', () => {
      expect(() =>
        parse(mutual('@{ view: collapsed }', '@{ view: collapsed }')).getData()
      ).not.toThrow();
    });

    it('draws at least one of the two containers rather than blanking', () => {
      const { nodes } = parse(mutual('@{ view: collapsed }', '@{ view: collapsed }')).getData();
      expect(nodes.length).toBeGreaterThan(0);
    });
  });

  describe('three-container cycle', () => {
    const triangle = `agentflow-beta TB
  flow A["A"]@{ view: collapsed }
    a1["a1"]
    a1 --> B
  end
  flow B["B"]
    b1["b1"]
    b1 --> C
  end
  flow C["C"]
    c1["c1"]
    c1 --> A
  end`;

    it('terminates', () => {
      expect(() => parse(triangle).getData()).not.toThrow();
    });
  });
});
