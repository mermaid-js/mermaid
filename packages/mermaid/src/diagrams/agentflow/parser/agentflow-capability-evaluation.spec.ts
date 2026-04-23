/**
 * Capability evaluation + executing-agent rule (closes #9 — wave-3 PR G).
 *
 * Per AGENTFLOW-SYNTAX.md §12 each tool invocation is validated against
 * the capability set of the nearest enclosing `agent` container:
 *
 *     requires ⊆ permits  AND  requires ∩ deny = ∅
 *
 * Key rules:
 *   - Invocation sites: edges into a tool vertex, plus `win-pane`
 *     instances whose resolved `def` chain lands on a tool.
 *   - Executing agent: nearest enclosing `agent` subgraph of the
 *     invocation site (structural, not delegation-transferred).
 *   - Delegation (`-->>`) does not transfer capabilities — the invoking
 *     agent's permits apply to its own invocation sites only.
 *   - `permits`, `requires`, `deny`, `fallbacks`, `directives` MUST be
 *     YAML arrays. Comma-separated string form is accepted with the
 *     `CAPABILITY_LIST_LEGACY_STRING` deprecation warning.
 *   - Tool definitions are NOT invocation sites; a tool with no
 *     incoming edge and no instance never triggers capability checks.
 *
 * Diagnostics:
 *   - CAPABILITY_LIST_LEGACY_STRING — list-valued metadata key stored
 *     as a comma-separated string.
 *   - CAPABILITY_MISSING — required cap not in executing agent's
 *     permits.
 *   - CAPABILITY_DENIED — required cap also appears in the tool's
 *     `deny` set.
 *   - CAPABILITY_INVOCATION_NO_AGENT — invocation site has no
 *     enclosing agent.
 *
 * All warnings in v0.5.0; the v1.0 strict-flip release promotes them.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow capability evaluation (§12)', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  const diagnosticsFor = (db: AgentFlowDB, id: string) =>
    db.getDiagnostics().filter((d) => d.id === id);

  // ────────────────────────────────────────────────────────────────────
  // A. Array round-trip — clean YAML arrays, no warnings
  // ────────────────────────────────────────────────────────────────────
  describe('A. YAML array round-trip', () => {
    it('clean invocation inside an agent with matching permits → no warnings', () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["Researcher"]
    search_call["search"]
    search_tool["search_tool"]
    search_tool@{ shape: subroutine, requires: ["net.read"] }
    search_call --> search_tool
  end
  researcher@{ permits: ["net.read", "llm.query"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CAPABILITY_DENIED')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CAPABILITY_INVOCATION_NO_AGENT')).toHaveLength(0);
    });

    it('empty requires and non-empty permits → no warnings', () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["R"]
    caller["c"]
    t["t"]
    t@{ shape: subroutine, requires: [] }
    caller --> t
  end
  researcher@{ permits: ["net.read"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // B. Legacy string-form lists
  // ────────────────────────────────────────────────────────────────────
  describe('B. legacy comma-separated strings warn', () => {
    it('permits as "a, b" string → CAPABILITY_LIST_LEGACY_STRING', () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["R"]
    caller["c"]
    t["t"]
    t@{ shape: subroutine, requires: ["net.read"] }
    caller --> t
  end
  researcher@{ permits: "net.read, llm.query" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'CAPABILITY_LIST_LEGACY_STRING');
      expect(warns.length).toBeGreaterThanOrEqual(1);
      expect(warns[0].severity).toBe('warning');
    });

    it('legacy string permits still participates in the subset check', () => {
      // permits as string splits to ["net.read", "llm.query"]; tool
      // requires ["net.write"] → CAPABILITY_MISSING still fires.
      agentflow.parser.parse(`agentflow TB
  agent researcher["R"]
    caller["c"]
    t["t"]
    t@{ shape: subroutine, requires: ["net.write"] }
    caller --> t
  end
  researcher@{ permits: "net.read, llm.query" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(1);
    });

    it('legacy string requires on a tool warns', () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["R"]
    caller["c"]
    t["t"]
    t@{ shape: subroutine, requires: "net.read, llm.query" }
    caller --> t
  end
  researcher@{ permits: ["net.read", "llm.query"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_LIST_LEGACY_STRING').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // C. CAPABILITY_MISSING — required cap not in agent's permits
  // ────────────────────────────────────────────────────────────────────
  describe('C. CAPABILITY_MISSING', () => {
    it('tool requires [net.write] but agent permits [net.read] → missing', () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["R"]
    caller["c"]
    t["t"]
    t@{ shape: subroutine, requires: ["net.write"] }
    caller --> t
  end
  researcher@{ permits: ["net.read"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'CAPABILITY_MISSING');
      expect(warns).toHaveLength(1);
      expect(warns[0].severity).toBe('warning');
    });

    it('agent permits is empty, tool requires [foo] → missing', () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["R"]
    caller["c"]
    t["t"]
    t@{ shape: subroutine, requires: ["foo"] }
    caller --> t
  end
  researcher@{ permits: [] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(1);
    });

    it('agent has no permits metadata at all → missing for any requires', () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["R"]
    caller["c"]
    t["t"]
    t@{ shape: subroutine, requires: ["net.read"] }
    caller --> t
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(1);
    });

    it('multiple missing caps produce one warning per missing cap', () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["R"]
    caller["c"]
    t["t"]
    t@{ shape: subroutine, requires: ["a", "b", "c"] }
    caller --> t
  end
  researcher@{ permits: ["a"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(2);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // D. CAPABILITY_DENIED — required cap also in tool's deny set
  // ────────────────────────────────────────────────────────────────────
  describe('D. CAPABILITY_DENIED', () => {
    it('tool requires [net.write] AND deny [net.write] → denied', () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["R"]
    caller["c"]
    t["t"]
    t@{ shape: subroutine, requires: ["net.write"], deny: ["net.write"] }
    caller --> t
  end
  researcher@{ permits: ["net.write"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_DENIED')).toHaveLength(1);
    });

    it('partial overlap — required AND denied produces one diagnostic per denied cap', () => {
      agentflow.parser.parse(`agentflow TB
  agent researcher["R"]
    caller["c"]
    t["t"]
    t@{ shape: subroutine, requires: ["a", "b"], deny: ["a", "c"] }
    caller --> t
  end
  researcher@{ permits: ["a", "b"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      // `a` is denied; `b` is fine; `c` denied but not required.
      expect(diagnosticsFor(db, 'CAPABILITY_DENIED')).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // E. CAPABILITY_INVOCATION_NO_AGENT
  // ────────────────────────────────────────────────────────────────────
  describe('E. CAPABILITY_INVOCATION_NO_AGENT', () => {
    it('invocation at top level (no enclosing container) → no-agent warning', () => {
      agentflow.parser.parse(`agentflow TB
  caller["c"]
  t["t"]
  t@{ shape: subroutine, requires: ["net.read"] }
  caller --> t`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_INVOCATION_NO_AGENT')).toHaveLength(1);
    });

    it('invocation inside a flow without an enclosing agent → no-agent warning', () => {
      agentflow.parser.parse(`agentflow TB
  flow pipeline["P"]
    caller["c"]
    t["t"]
    t@{ shape: subroutine, requires: ["net.read"] }
    caller --> t
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_INVOCATION_NO_AGENT')).toHaveLength(1);
    });

    it('tool with NO invocation (definition only) → no warning', () => {
      agentflow.parser.parse(`agentflow TB
  orphan_tool["t"]
  orphan_tool@{ shape: subroutine, requires: ["net.read"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_INVOCATION_NO_AGENT')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // F. Delegation does not transfer capabilities
  // ────────────────────────────────────────────────────────────────────
  describe('F. delegation does not transfer', () => {
    it('agent A permits [X] delegates to agent B with no permits; B invokes tool requiring [X] → MISSING on B', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    ac["ac"]
  end
  a@{ permits: ["net.read"] }

  agent b["B"]
    bc["bc"]
    t["t"]
    t@{ shape: subroutine, requires: ["net.read"] }
    bc --> t
  end

  a -->> b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(1);
    });

    it('invoking agent with matching permits does not confer caps on a delegated agent', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    ac["ac"]
  end
  a@{ permits: ["net.read", "net.write"] }

  agent b["B"]
    bc["bc"]
    t["t"]
    t@{ shape: subroutine, requires: ["net.write"] }
    bc --> t
  end
  b@{ permits: ["net.read"] }

  a -->> b`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      // a has net.write but b doesn't; b's invocation fails even
      // though delegation exists from a.
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // G. Instance-based invocation (wave-2 win-pane resolution)
  // ────────────────────────────────────────────────────────────────────
  describe('G. win-pane instance invocation', () => {
    it('win-pane instance whose def is a tool → treated as invocation', () => {
      agentflow.parser.parse(`agentflow TB
  search_tool["search"]
  search_tool@{ shape: subroutine, requires: ["net.read"] }

  agent researcher["R"]
    inst["cached search"]
    inst@{ shape: win-pane, def: "search_tool" }
  end
  researcher@{ permits: ["net.read"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      // Requires satisfied; no missing warning.
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(0);
    });

    it("win-pane instance whose def needs a cap not in the enclosing agent's permits → MISSING", () => {
      agentflow.parser.parse(`agentflow TB
  search_tool["search"]
  search_tool@{ shape: subroutine, requires: ["net.write"] }

  agent researcher["R"]
    inst["cached search"]
    inst@{ shape: win-pane, def: "search_tool" }
  end
  researcher@{ permits: ["net.read"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // H. Nested structural containment — executing agent is nearest
  // ────────────────────────────────────────────────────────────────────
  describe('H. nested containment — nearest-enclosing agent wins', () => {
    it("agent > flow > task invocation uses the OUTER agent's permits", () => {
      agentflow.parser.parse(`agentflow TB
  agent outer["O"]
    flow inner["F"]
      task deep["T"]
        caller["c"]
        t["t"]
        t@{ shape: subroutine, requires: ["net.read"] }
        caller --> t
      end
    end
  end
  outer@{ permits: ["net.read"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CAPABILITY_INVOCATION_NO_AGENT')).toHaveLength(0);
    });

    it('nested agent inside flow — inner agent is executing', () => {
      agentflow.parser.parse(`agentflow TB
  flow outerFlow["F"]
    agent inner["Inner"]
      caller["c"]
      t["t"]
      t@{ shape: subroutine, requires: ["net.read"] }
      caller --> t
    end
    inner@{ permits: ["net.read"] }
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // I. Invariants
  // ────────────────────────────────────────────────────────────────────
  describe('I. invariants', () => {
    it('tool definition without invocation is silent even with requires set', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    ac["ac"]
  end
  a@{ permits: [] }
  standalone["t"]
  standalone@{ shape: subroutine, requires: ["net.read"] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CAPABILITY_INVOCATION_NO_AGENT')).toHaveLength(0);
    });

    it('all capability warnings are severity: "warning" in v0.5.0', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    caller["c"]
    t["t"]
    t@{ shape: subroutine, requires: ["x"], deny: ["x"] }
    caller --> t
  end
  a@{ permits: ["x"] }

  caller2["c2"]
  t2["t2"]
  t2@{ shape: subroutine, requires: ["y"] }
  caller2 --> t2`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const capIds = [
        'CAPABILITY_LIST_LEGACY_STRING',
        'CAPABILITY_MISSING',
        'CAPABILITY_DENIED',
        'CAPABILITY_INVOCATION_NO_AGENT',
      ];
      const warns = db.getDiagnostics().filter((d) => capIds.includes(d.id));
      expect(warns.length).toBeGreaterThanOrEqual(2);
      for (const w of warns) {
        expect(w.severity).toBe('warning');
      }
    });

    it('repeated getData() calls are idempotent', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    caller["c"]
    t["t"]
    t@{ shape: subroutine, requires: ["x"] }
    caller --> t
  end
  a@{ permits: [] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      db.getData();
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(1);
    });

    it('tool requires without a requires key → no warning (treated as no requirements)', () => {
      agentflow.parser.parse(`agentflow TB
  agent a["A"]
    caller["c"]
    t["t"]
    t@{ shape: subroutine }
    caller --> t
  end
  a@{ permits: [] }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CAPABILITY_MISSING')).toHaveLength(0);
    });
  });
});
