/**
 * Reference-kind separation (closes #10 — wave-3 PR C).
 *
 * Per AGENTFLOW-SYNTAX.md §6 / §7 / §10.2:
 *   - A `procs` node declares a reference; exactly one of `typeRef`,
 *     `templateRef`, or `src` SHOULD be present. Two or more present at
 *     once is a `REF_KIND_CONFLICT` warning.
 *   - The legacy generic `type` metadata key is deprecated. When a
 *     `procs` node carries it, the validator resolves the value through
 *     the trichotomy:
 *       - exactly one namespace matches  → accept + REF_KIND_LEGACY_DEPRECATED
 *       - both namespaces match           → REF_KIND_LEGACY_AMBIGUOUS
 *       - neither matches                 → REF_KIND_LEGACY_UNRESOLVED
 *   - `templatesGroup` synthesis whenever `template` declarations exist
 *     (mirrors `typesGroup` — already shipped, verified as regression
 *     coverage here).
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow reference-kind separation (§10.2)', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  const diagnosticsFor = (db: AgentFlowDB, id: string) =>
    db.getDiagnostics().filter((d) => d.id === id);

  // ────────────────────────────────────────────────────────────────────
  // A. Valid single-kind usage
  // ────────────────────────────────────────────────────────────────────
  describe('A. single-kind usage is valid', () => {
    it('procs with typeRef only resolves cleanly', () => {
      agentflow.parser.parse(`agentflow TB
  type Report
  r["r"]
  r@{ shape: procs, typeRef: "Report" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REF_KIND_CONFLICT')).toHaveLength(0);
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_DEPRECATED')).toHaveLength(0);
    });

    it('procs with templateRef only resolves cleanly', () => {
      agentflow.parser.parse(`agentflow TB
  template %triage {
    TITLE: String <<description>>
  }
  r["r"]
  r@{ shape: procs, templateRef: "triage" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REF_KIND_CONFLICT')).toHaveLength(0);
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_DEPRECATED')).toHaveLength(0);
    });

    it('procs with src only resolves cleanly', () => {
      agentflow.parser.parse(`agentflow TB
  r["r"]
  r@{ shape: procs, src: "./spec.md" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REF_KIND_CONFLICT')).toHaveLength(0);
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_DEPRECATED')).toHaveLength(0);
    });

    it('non-procs nodes are not subject to the mutual-exclusion rule', () => {
      // A plain vertex happening to carry these metadata keys (author
      // misuse, handled elsewhere) doesn't trigger REF_KIND_CONFLICT —
      // this rule is scoped to `procs` reference nodes per §10.2.
      agentflow.parser.parse(`agentflow TB
  plain["plain"]
  plain@{ typeRef: "X", templateRef: "Y" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REF_KIND_CONFLICT')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // B. Mutual exclusion of typeRef / templateRef / src on procs nodes
  // ────────────────────────────────────────────────────────────────────
  describe('B. REF_KIND_CONFLICT', () => {
    it('typeRef + templateRef on a procs node warns', () => {
      agentflow.parser.parse(`agentflow TB
  type Report
  template %Report {
    TITLE: String <<x>>
  }
  r["r"]
  r@{ shape: procs, typeRef: "Report", templateRef: "Report" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'REF_KIND_CONFLICT');
      expect(warns).toHaveLength(1);
      expect(warns[0].nodeId).toBe('r');
      expect(warns[0].severity).toBe('warning');
    });

    it('typeRef + src on a procs node warns', () => {
      agentflow.parser.parse(`agentflow TB
  type Report
  r["r"]
  r@{ shape: procs, typeRef: "Report", src: "./spec.md" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REF_KIND_CONFLICT')).toHaveLength(1);
    });

    it('templateRef + src on a procs node warns', () => {
      agentflow.parser.parse(`agentflow TB
  template %tri {
    TITLE: String <<x>>
  }
  r["r"]
  r@{ shape: procs, templateRef: "tri", src: "./spec.md" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REF_KIND_CONFLICT')).toHaveLength(1);
    });

    it('all three present → one REF_KIND_CONFLICT (not three)', () => {
      agentflow.parser.parse(`agentflow TB
  type Report
  template %tri {
    TITLE: String <<x>>
  }
  r["r"]
  r@{ shape: procs, typeRef: "Report", templateRef: "tri", src: "./spec.md" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REF_KIND_CONFLICT')).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // C. Legacy `type` trichotomy
  // ────────────────────────────────────────────────────────────────────
  describe('C. legacy `type` on procs nodes', () => {
    it('legacy type resolving to a declared type only → DEPRECATED warning', () => {
      agentflow.parser.parse(`agentflow TB
  type Report
  r["r"]
  r@{ shape: procs, type: "Report" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'REF_KIND_LEGACY_DEPRECATED');
      expect(warns).toHaveLength(1);
      expect(warns[0].nodeId).toBe('r');
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_AMBIGUOUS')).toHaveLength(0);
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_UNRESOLVED')).toHaveLength(0);
    });

    it('legacy type resolving to a declared template only → DEPRECATED warning', () => {
      agentflow.parser.parse(`agentflow TB
  template %triage {
    TITLE: String <<x>>
  }
  r["r"]
  r@{ shape: procs, type: "triage" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_DEPRECATED')).toHaveLength(1);
    });

    it('legacy type resolving to both namespaces → REF_KIND_LEGACY_AMBIGUOUS', () => {
      agentflow.parser.parse(`agentflow TB
  type Report
  template %Report {
    TITLE: String <<x>>
  }
  r["r"]
  r@{ shape: procs, type: "Report" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_AMBIGUOUS')).toHaveLength(1);
    });

    it('legacy type resolving to neither namespace → REF_KIND_LEGACY_UNRESOLVED', () => {
      agentflow.parser.parse(`agentflow TB
  r["r"]
  r@{ shape: procs, type: "Nowhere" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_UNRESOLVED')).toHaveLength(1);
    });

    it('legacy type on a procs node alongside a modern typeRef still warns as deprecated', () => {
      // Author mixing legacy + modern. The modern key wins for
      // resolution, but the legacy key still draws the deprecation.
      agentflow.parser.parse(`agentflow TB
  type Report
  r["r"]
  r@{ shape: procs, typeRef: "Report", type: "Report" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_DEPRECATED')).toHaveLength(1);
      // No ambiguous/unresolved — modern key is authoritative.
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_AMBIGUOUS')).toHaveLength(0);
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_UNRESOLVED')).toHaveLength(0);
    });

    it('legacy `type` on a non-procs node is NOT subject to trichotomy', () => {
      // The generic `type` key only carries the legacy-reference
      // semantics on a `procs` shape node per §10.2. Plain nodes use
      // `type` for other purposes (if any) and are not checked.
      agentflow.parser.parse(`agentflow TB
  plain["plain"]
  plain@{ type: "Nowhere" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_DEPRECATED')).toHaveLength(0);
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_UNRESOLVED')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // D. templatesGroup auto-emission (regression)
  // ────────────────────────────────────────────────────────────────────
  describe('D. templatesGroup emission', () => {
    it('templatesGroup present when templates exist', () => {
      agentflow.parser.parse(`agentflow TB
  template %triage {
    TITLE: String <<description>>
  }
  node["node"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const { nodes } = db.getData();
      expect(nodes.some((n) => n.id === 'agentflow-templates-group')).toBe(true);
    });

    it('templatesGroup absent when no templates are declared', () => {
      agentflow.parser.parse(`agentflow TB
  node["node"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const { nodes } = db.getData();
      expect(nodes.some((n) => n.id === 'agentflow-templates-group')).toBe(false);
    });

    it('typesGroup present when types exist (mirror assertion)', () => {
      agentflow.parser.parse(`agentflow TB
  type Report
  node["node"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      const { nodes } = db.getData();
      expect(nodes.some((n) => n.id === 'agentflow-types-group')).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // E. Cross-cutting invariants
  // ────────────────────────────────────────────────────────────────────
  describe('E. invariants', () => {
    it('src non-existent file does not emit any ref-kind warning', () => {
      agentflow.parser.parse(`agentflow TB
  r["r"]
  r@{ shape: procs, src: "./does-not-exist.md" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REF_KIND_CONFLICT')).toHaveLength(0);
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_DEPRECATED')).toHaveLength(0);
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_AMBIGUOUS')).toHaveLength(0);
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_UNRESOLVED')).toHaveLength(0);
    });

    it('repeated getData() calls are idempotent', () => {
      agentflow.parser.parse(`agentflow TB
  type Report
  r["r"]
  r@{ shape: procs, type: "Report" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      db.getData();
      db.getData();
      expect(diagnosticsFor(db, 'REF_KIND_LEGACY_DEPRECATED')).toHaveLength(1);
    });
  });
});
