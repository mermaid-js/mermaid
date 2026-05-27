/**
 * Containment matrix validator (v0.8.1).
 *
 * Per AGENTFLOW-SYNTAX.md §3.3 the only container in v0.8.1 is `flow`.
 * Allowed children: `flow`, `tool`, `action`, `node`. Everything else is
 * a violation.
 *
 *   | Parent | Allowed children          |
 *   | ------ | ------------------------- |
 *   | flow   | flow, tool, action, node  |
 *
 * Violations emit `CONTAINMENT_VIOLATION` at warning severity.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow containment matrix (§3.3)', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  const violations = (db: AgentFlowDB) =>
    db.getDiagnostics().filter((d) => d.id === 'CONTAINMENT_VIOLATION');

  // ────────────────────────────────────────────────────────────────────
  // A. Allowed children
  // ────────────────────────────────────────────────────────────────────
  describe('A. flow accepts flow, tool, action, node', () => {
    it('flow may contain a nested flow', () => {
      agentflow.parser.parse(`agentflow TB
  flow outer["Outer"]
    flow inner["Inner"]
      leaf["leaf"]
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });

    it('flow may contain a tool', () => {
      agentflow.parser.parse(`agentflow TB
  flow outer["Outer"]
    t["t"]
    t@{ shape: tool }
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });

    it('flow may contain an action', () => {
      agentflow.parser.parse(`agentflow TB
  flow outer["Outer"]
    a["a"]
    a@{ shape: action }
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });

    it('flow may contain plain nodes', () => {
      agentflow.parser.parse(`agentflow TB
  flow outer["Outer"]
    a["a"]
    b["b"]
    a --> b
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });

    it('flow with multiple plain children emits no violation', () => {
      agentflow.parser.parse(`agentflow TB
  flow outer["O"]
    a["a"]
    b["b"]
    c["c"]
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // B. Nested structural containment
  // ────────────────────────────────────────────────────────────────────
  describe('B. nested structural containment', () => {
    it('flow > flow > flow > leaf is a valid nesting', () => {
      agentflow.parser.parse(`agentflow TB
  flow outer["O"]
    flow mid["M"]
      flow inner["I"]
        leaf["leaf"]
      end
    end
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // C. Cross-cutting invariants
  // ────────────────────────────────────────────────────────────────────
  describe('C. invariants', () => {
    it('plain vertex as child is always allowed inside a flow', () => {
      agentflow.parser.parse(`agentflow TB
  flow f["F"]
    pf["p"]
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });

    it('repeated getData() calls are idempotent', () => {
      agentflow.parser.parse(`agentflow TB
  flow outer["O"]
    leaf["leaf"]
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      db.getData();
      db.getData();
      expect(violations(db)).toHaveLength(0);
    });
  });
});
