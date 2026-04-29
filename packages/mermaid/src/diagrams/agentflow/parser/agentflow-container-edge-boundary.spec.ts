/**
 * Container edge boundary semantics (closes #7 — wave-3 PR E).
 *
 * Per AGENTFLOW-SYNTAX.md §5.5 an edge that touches a container binds
 * at the container boundary:
 *
 *   - Incoming `-->` (precedence) targets the container's entry
 *     boundary — always valid.
 *   - Outgoing `-->` originates at the container's completion
 *     boundary — always valid.
 *   - Incoming `==>` (data) must bind to a declared `params`. Label
 *     optional when there is exactly one param; required when there
 *     are multiple and MUST match one of them exactly.
 *   - Outgoing `==>` originates from the container's `returns`.
 *
 * Data edges on containers without a declared `params` / `returns`
 * are invalid.
 *
 * Diagnostics:
 *   - CONTAINER_EDGE_NO_CONTRACT — data edge touching a container
 *     that declares no params (incoming) or no returns (outgoing).
 *   - CONTAINER_EDGE_LABEL_REQUIRED — multi-param container incoming
 *     data edge with no label.
 *   - CONTAINER_EDGE_LABEL_UNRESOLVED — label does not match any
 *     declared param name.
 *
 * Warn-only in v0.5.0; the v1.0 strict-flip release promotes severity.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow container edge boundary (§5.5)', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  const diagnosticsFor = (db: AgentFlowDB, id: string) =>
    db.getDiagnostics().filter((d) => d.id === id);

  // ────────────────────────────────────────────────────────────────────
  // A. Precedence edges to/from containers are always valid
  // ────────────────────────────────────────────────────────────────────
  describe('A. precedence edges (`-->`) to/from containers', () => {
    it('incoming precedence to any container is always valid', () => {
      agentflow.parser.parse(`agentflow TB
  starter["start"]
  flow pipeline["P"]
    step["step"]
  end
  starter --> pipeline`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_NO_CONTRACT')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_LABEL_REQUIRED')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_LABEL_UNRESOLVED')).toHaveLength(0);
    });

    it('outgoing precedence from any container is always valid', () => {
      agentflow.parser.parse(`agentflow TB
  finisher["done"]
  flow pipeline["P"]
    step["step"]
  end
  pipeline --> finisher`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_NO_CONTRACT')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // B. Data edge incoming with single `params`
  // ────────────────────────────────────────────────────────────────────
  describe('B. incoming data edge with single-param container', () => {
    it('no label → implicit binding, valid', () => {
      agentflow.parser.parse(`agentflow TB
  caller["c"]
  flow pipeline["P"]
    step["s"]
  end
  pipeline@{ params: ["input"] }
  caller ==> pipeline`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_LABEL_REQUIRED')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_LABEL_UNRESOLVED')).toHaveLength(0);
    });

    it('label matches the single param → valid', () => {
      agentflow.parser.parse(`agentflow TB
  caller["c"]
  flow pipeline["P"]
    step["s"]
  end
  pipeline@{ params: ["input"] }
  caller ==>|input| pipeline`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_LABEL_UNRESOLVED')).toHaveLength(0);
    });

    it('label does NOT match the single param → unresolved', () => {
      agentflow.parser.parse(`agentflow TB
  caller["c"]
  flow pipeline["P"]
    step["s"]
  end
  pipeline@{ params: ["input"] }
  caller ==>|wrongName| pipeline`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'CONTAINER_EDGE_LABEL_UNRESOLVED');
      expect(warns).toHaveLength(1);
      expect(warns[0].severity).toBe('warning');
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // C. Data edge incoming with multi-`params`
  // ────────────────────────────────────────────────────────────────────
  describe('C. incoming data edge with multi-param container', () => {
    it('label matches one of the params → valid', () => {
      agentflow.parser.parse(`agentflow TB
  caller["c"]
  flow pipeline["P"]
    step["s"]
  end
  pipeline@{ params: ["city", "query"] }
  caller ==>|city| pipeline`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_LABEL_REQUIRED')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_LABEL_UNRESOLVED')).toHaveLength(0);
    });

    it('missing label → CONTAINER_EDGE_LABEL_REQUIRED', () => {
      agentflow.parser.parse(`agentflow TB
  caller["c"]
  flow pipeline["P"]
    step["s"]
  end
  pipeline@{ params: ["city", "query"] }
  caller ==> pipeline`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_LABEL_REQUIRED')).toHaveLength(1);
    });

    it('label matches no param → CONTAINER_EDGE_LABEL_UNRESOLVED', () => {
      agentflow.parser.parse(`agentflow TB
  caller["c"]
  flow pipeline["P"]
    step["s"]
  end
  pipeline@{ params: ["city", "query"] }
  caller ==>|unknown| pipeline`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_LABEL_UNRESOLVED')).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // D. CONTAINER_EDGE_NO_CONTRACT
  // ────────────────────────────────────────────────────────────────────
  describe('D. container with no params / returns contract', () => {
    it('incoming data edge to container with no params → NO_CONTRACT', () => {
      agentflow.parser.parse(`agentflow TB
  caller["c"]
  flow pipeline["P"]
    step["s"]
  end
  caller ==> pipeline`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'CONTAINER_EDGE_NO_CONTRACT');
      expect(warns).toHaveLength(1);
      expect(warns[0].severity).toBe('warning');
    });

    it('outgoing data edge from container with no returns → NO_CONTRACT', () => {
      agentflow.parser.parse(`agentflow TB
  downstream["d"]
  flow pipeline["P"]
    step["s"]
  end
  pipeline ==> downstream`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_NO_CONTRACT')).toHaveLength(1);
    });

    it('outgoing data edge from container WITH returns → valid', () => {
      agentflow.parser.parse(`agentflow TB
  downstream["d"]
  flow pipeline["P"]
    step["s"]
  end
  pipeline@{ returns: "Result" }
  pipeline ==> downstream`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_NO_CONTRACT')).toHaveLength(0);
    });

    it('data edge between plain nodes is not subject to boundary rules', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  b["b"]
  a ==> b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_NO_CONTRACT')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // E. Nested containers — each level is checked independently
  // ────────────────────────────────────────────────────────────────────
  describe('E. nested containers', () => {
    it('outer precedence edge, inner data edge — mixed interaction', () => {
      agentflow.parser.parse(`agentflow TB
  start["start"]
  flow outerFlow["O"]
    task innerTask["I"]
      step["s"]
    end
    innerTask@{ params: ["q"] }
    caller2["c2"]
    caller2 ==>|q| innerTask
  end
  start --> outerFlow`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_NO_CONTRACT')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_LABEL_UNRESOLVED')).toHaveLength(0);
    });

    it('inner data edge with wrong label fires independently of outer', () => {
      agentflow.parser.parse(`agentflow TB
  flow outerFlow["O"]
    task innerTask["I"]
      step["s"]
    end
    innerTask@{ params: ["q", "r"] }
    caller["c"]
    caller ==>|wrong| innerTask
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_LABEL_UNRESOLVED')).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // F. Cross-cutting invariants
  // ────────────────────────────────────────────────────────────────────
  describe('F. invariants', () => {
    it('all container-edge warnings are severity: "warning" in v0.5.0', () => {
      agentflow.parser.parse(`agentflow TB
  a["a"]
  flow p1["P1"]
    s1["s"]
  end
  flow p2["P2"]
    s2["s"]
  end
  p2@{ params: ["q", "r"] }
  a ==> p1
  a ==> p2`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const ids = [
        'CONTAINER_EDGE_NO_CONTRACT',
        'CONTAINER_EDGE_LABEL_REQUIRED',
        'CONTAINER_EDGE_LABEL_UNRESOLVED',
      ];
      const warns = db.getDiagnostics().filter((d) => ids.includes(d.id));
      expect(warns.length).toBeGreaterThanOrEqual(2);
      for (const w of warns) {
        expect(w.severity).toBe('warning');
      }
    });

    it('repeated getData() calls are idempotent', () => {
      agentflow.parser.parse(`agentflow TB
  caller["c"]
  flow pipeline["P"]
    step["s"]
  end
  caller ==> pipeline`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      db.getData();
      db.getData();
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_NO_CONTRACT')).toHaveLength(1);
    });

    it('edges whose semantic is not `data` or `control` do not trigger this pass', () => {
      // `-.->` governance, `---` association, `o--o` bidirectional —
      // §5.5 only governs precedence and data edges.
      agentflow.parser.parse(`agentflow TB
  flow pipeline["P"]
    step["s"]
  end
  tool_node["t"]
  tool_node@{ shape: subroutine }
  tool_node -.-> pipeline
  tool_node --- pipeline`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONTAINER_EDGE_NO_CONTRACT')).toHaveLength(0);
    });
  });
});
