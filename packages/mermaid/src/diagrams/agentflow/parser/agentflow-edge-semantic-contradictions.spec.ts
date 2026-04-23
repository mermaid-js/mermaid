/**
 * Edge-semantic contradictions (closes #3 — wave-3 PR D).
 *
 * Per AGENTFLOW-SYNTAX.md §5.1 each edge operator has a primary
 * semantic. When the semantic is incompatible with the kinds of its
 * endpoints, the edge is a contradiction. This PR adds a post-parse
 * `validateEdgeEndpointKinds()` pass that emits
 * `EDGE_SEMANTIC_CONTRADICTION` for three specific mismatch cases:
 *
 *   1. `-->>` (delegation) whose source is not an agent container.
 *   2. `--x`  (failure)    whose source is not an agent container.
 *   3. `--o`  (conformance) whose target is not a reference node
 *      (`shape: procs`).
 *
 * The four non-directive operators (`-->`, `==>`, `---`, `-.->`,
 * `o--o`) accept any endpoint kinds and never fire here. Container-
 * edge boundary violations for `==>` (data into a container without a
 * `params`/`returns` contract) are handled separately by PR E.
 *
 * Warn-only in v0.5.0; the future v1.0 strict-flip release promotes
 * the severity (no config flag in this PR — flags land together at
 * release time).
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow edge-semantic contradictions (§5.1)', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  const diagnosticsFor = (db: AgentFlowDB, id: string) =>
    db.getDiagnostics().filter((d) => d.id === id);

  // ────────────────────────────────────────────────────────────────────
  // A. Happy path — each operator's canonical valid form never warns
  // ────────────────────────────────────────────────────────────────────
  describe('A. happy-path operators emit no contradictions', () => {
    it('`-->` control: any endpoints are valid', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  b["b"]
  a --> b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(0);
    });

    it('`==>` data between plain nodes is valid', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  b["b"]
  a ==> b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(0);
    });

    it('`--o` conformance: tool to procs reference node is valid', () => {
      agentflow.parser.parse(`agentflow TB
  type Report
  do_work["do_work"]
  do_work@{ shape: subroutine }
  type_ref["Report"]
  type_ref@{ shape: procs, typeRef: "Report" }
  do_work --o type_ref`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(0);
    });

    it('`-->>` delegation: agent to agent is valid', () => {
      agentflow.parser.parse(`agentflow TB
  agent primary["Primary"]
    ap["p"]
  end
  agent secondary["Secondary"]
    as["s"]
  end
  primary -->> secondary`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(0);
    });

    it('`--x` failure: agent to agent is valid (fallback pattern §19.7)', () => {
      agentflow.parser.parse(`agentflow TB
  agent primary["Primary"]
    a1["a"]
  end
  agent fallback["Fallback"]
    a2["a"]
  end
  primary --x fallback`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(0);
    });

    it('`---` association: any endpoints are valid', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  b["b"]
  a --- b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(0);
    });

    it('`-.->` governance: any endpoints are valid', () => {
      agentflow.parser.parse(`agentflow TB
  tool_node["tool"]
  tool_node@{ shape: subroutine }
  directive d["D"]
    dn["d"]
  end
  tool_node -.-> d`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(0);
    });

    it('`o--o` bidirectional: any endpoints are valid', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  b["b"]
  a o--o b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // B. Delegation source must be an agent
  // ────────────────────────────────────────────────────────────────────
  describe('B. delegation (`-->>`) source-kind contradictions', () => {
    it('plain vertex source → contradiction', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  agent target["T"]
    an["n"]
  end
  a -->> target`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION');
      expect(warns).toHaveLength(1);
      expect(warns[0].severity).toBe('warning');
    });

    it('flow container source → contradiction', () => {
      agentflow.parser.parse(`agentflow TB
  flow pipeline["Pipeline"]
    p1["p"]
  end
  agent target["T"]
    an["n"]
  end
  pipeline -->> target`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(1);
    });

    it('tool source → contradiction', () => {
      agentflow.parser.parse(`agentflow TB
  tool_node["tool"]
  tool_node@{ shape: subroutine }
  agent target["T"]
    an["n"]
  end
  tool_node -->> target`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(1);
    });

    it('agent source → valid (regression)', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    an["n"]
  end
  agent b["B"]
    bn["n"]
  end
  a -->> b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // C. Failure source must be an agent
  // ────────────────────────────────────────────────────────────────────
  describe('C. failure (`--x`) source-kind contradictions', () => {
    it('plain vertex source → contradiction', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  agent fb["Fallback"]
    fbn["n"]
  end
  a --x fb`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(1);
    });

    it('task container source → contradiction', () => {
      agentflow.parser.parse(`agentflow TB
  task t["T"]
    tn["n"]
  end
  agent fb["Fallback"]
    fbn["n"]
  end
  t --x fb`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(1);
    });

    it('agent source → valid (regression)', () => {
      agentflow.parser.parse(`agentflow TB
  agent primary["Primary"]
    p["p"]
  end
  agent fallback["Fallback"]
    f["f"]
  end
  primary --x fallback`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // D. Conformance target must be a reference node (shape: procs)
  // ────────────────────────────────────────────────────────────────────
  describe('D. conformance (`--o`) target-kind contradictions', () => {
    it('plain vertex target → contradiction', () => {
      agentflow.parser.parse(`agentflow TB
  tool_node["tool"]
  tool_node@{ shape: subroutine }
  plain["plain"]
  tool_node --o plain`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(1);
    });

    it('agent container target → contradiction', () => {
      agentflow.parser.parse(`agentflow TB
  tool_node["tool"]
  tool_node@{ shape: subroutine }
  agent t["T"]
    tn["n"]
  end
  tool_node --o t`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(1);
    });

    it('doc-artifact target → contradiction', () => {
      agentflow.parser.parse(`agentflow TB
  tool_node["tool"]
  tool_node@{ shape: subroutine }
  doc_node["doc"]
  doc_node@{ shape: doc }
  tool_node --o doc_node`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(1);
    });

    it('procs reference node target → valid (regression)', () => {
      agentflow.parser.parse(`agentflow TB
  type Report
  tool_node["tool"]
  tool_node@{ shape: subroutine }
  ref["Report"]
  ref@{ shape: procs, typeRef: "Report" }
  tool_node --o ref`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // E. Cross-cutting invariants
  // ────────────────────────────────────────────────────────────────────
  describe('E. invariants', () => {
    it('all contradictions are severity: "warning" in v0.5.0', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  b["b"]
  a -->> b
  a --x b
  a --o b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION');
      expect(warns.length).toBeGreaterThanOrEqual(3);
      for (const w of warns) {
        expect(w.severity).toBe('warning');
      }
    });

    it('repeated getData() calls are idempotent', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  agent target["T"]
    an["n"]
  end
  a -->> target`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      db.getData();
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(1);
    });

    it('edges whose operator has no edgeSemantic mapping never warn', () => {
      // `<-->` and `x--x` are outside the §5.1 table; they leave
      // `edgeSemantic` undefined and are thus not subject to the rule.
      agentflow.parser.parse(`agentflow TB
  a["a"]
  b["b"]
  a <--> b
  a x--x b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION')).toHaveLength(0);
    });

    it('multiple contradictions on the same diagram all surface', () => {
      // Three distinct violations: delegation from plain, failure from
      // plain, conformance to plain. One warning per edge.
      agentflow.parser.parse(`agentflow TB
  a["a"]
  b["b"]
  c["c"]
  d["d"]
  a -->> b
  c --x d
  a --o b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'EDGE_SEMANTIC_CONTRADICTION');
      expect(warns).toHaveLength(3);
    });
  });
});
