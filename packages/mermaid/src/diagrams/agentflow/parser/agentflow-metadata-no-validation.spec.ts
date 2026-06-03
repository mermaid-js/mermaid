// Regression spec for issue #64 — the parser no longer performs property-level
// metadata validation or semantic checks. It carries all authored metadata
// faithfully (so the semantics module can validate downstream) and only still
// reacts to `shape` (unknown-shape) and `view` (collapsed). It must NOT emit:
// METADATA_KEY_MISAPPLIED, CONNECTOR_REF_*, CONTAINMENT_VIOLATION,
// DUPLICATE_ID_NODE, RESERVED_SYNTHETIC_ID, FLOW_NO_INPUT, METADATA_KEY_LEGACY_PROMPT.
import { describe, it, expect } from 'vitest';
import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';

const parse = (text: string) => {
  agentflow.parser.yy = new AgentFlowDB();
  agentflow.parser.yy.clear();
  agentflow.parser.yy.setGen('gen-2');
  agentflow.parser.parse(text);
  const db = agentflow.parser.yy as AgentFlowDB;
  db.getData(); // trigger the (now no-op) post-parse hook
  return db;
};

const vertex = (db: AgentFlowDB, id: string) => db.getVertices().get(id);
const flow = (db: AgentFlowDB, id: string) => db.getSubGraphs().find((s) => s.id === id);
const edge = (db: AgentFlowDB, id: string) => db.getEdges().find((e) => e.id === id);
const diags = (db: AgentFlowDB) => db.getDiagnostics();

describe('issue #64: parser does not validate metadata (semantics owns it)', () => {
  describe('metadata is carried, never validated', () => {
    it('keeps an unknown metadata key on a vertex without warning', () => {
      const db = parse(`agentflow TB
  a["A"]
  a@{ myExtension: 42 }`);
      expect(vertex(db, 'a')?.metadata?.myExtension).toBe(42);
      expect(diags(db)).toHaveLength(0);
    });

    it('keeps an unknown metadata key on a flow without warning', () => {
      const db = parse(`agentflow TB
  flow f["F"]
    a --> b
  end
  f@{ totallyCustomKey: "opaque" }`);
      expect(flow(db, 'f')?.metadata?.totallyCustomKey).toBe('opaque');
      expect(diags(db)).toHaveLength(0);
    });

    it('keeps a "misapplied" known key (model on a flow-only? no — execution on a flow) and does not warn', () => {
      const db = parse(`agentflow TB
  flow f["F"]
    a --> b
  end
  f@{ execution: "parallel" }`);
      // `execution` is task-only under the old §10 table — parser no longer cares.
      expect(flow(db, 'f')?.metadata?.execution).toBe('parallel');
      expect(diags(db)).toHaveLength(0);
    });

    it('carries arbitrary edge metadata, not just instruction', () => {
      const db = parse(`agentflow TB
  a e1@--> b
  e1@{ instruction: "hand off", weight: 5 }`);
      expect(edge(db, 'e1')?.metadata).toMatchObject({ instruction: 'hand off', weight: 5 });
      expect(diags(db)).toHaveLength(0);
    });

    it('carries legacy `prompt` as-is (no rename, no warning)', () => {
      const db = parse(`agentflow TB
  a["A"]
  a@{ prompt: "do the thing" }`);
      // Parser no longer renames prompt→instruction; semantics handles the alias.
      expect(vertex(db, 'a')?.metadata?.prompt).toBe('do the thing');
      expect(diags(db)).toHaveLength(0);
    });
  });

  describe('removed semantic checks no longer fire', () => {
    it('does not resolve/validate connectorRef', () => {
      const db = parse(`agentflow TB
  call["call"]@{ shape: action, connectorRef: "nonexistent.op" }
  input["in"]@{ shape: input }
  input --> call`);
      expect(vertex(db, 'call')?.metadata?.connectorRef).toBe('nonexistent.op');
      expect(diags(db)).toHaveLength(0);
    });

    it('does not warn on a flow with no input node', () => {
      const db = parse(`agentflow TB
  flow f["F"]
    a --> b
  end`);
      expect(diags(db)).toHaveLength(0);
    });

    it('does not warn on a duplicate id', () => {
      const db = parse(`agentflow TB
  a["First"]
  a["Second"]
  a --> b`);
      expect(diags(db)).toHaveLength(0);
    });

    it('does not warn on declaring the reserved `connectors` id', () => {
      const db = parse(`agentflow TB
  connectors["My group"]
  connectors --> b`);
      expect(diags(db)).toHaveLength(0);
    });
  });

  describe('kept: shape and view', () => {
    it('still rejects an invalid shape name (unknown-shape error)', () => {
      expect(() =>
        parse(`agentflow TB
  a["A"]
  a@{ shape: NotAShape }`)
      ).toThrow(/No such shape/);
    });

    it('still records view: collapsed on a flow', () => {
      const db = parse(`agentflow TB
  flow f["F"]
    a --> b
  end
  f@{ view: "collapsed" }`);
      expect(flow(db, 'f')?.metadata?.view).toBe('collapsed');
    });
  });
});
