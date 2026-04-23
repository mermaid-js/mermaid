/**
 * Identifier resolution + three namespaces (closes #2 — wave-3 PR B).
 *
 * Per AGENTFLOW-SYNTAX.md §10 the diagram uses three namespaces:
 *   1. Nodes and containers — vertex IDs and container IDs share one.
 *   2. Types — declared by `type`.
 *   3. Templates — declared by `template`.
 *
 * Rules:
 *   - Within each namespace, IDs MUST be unique. Duplicates warn in
 *     v0.5.0 and become errors in v1.0.
 *   - IDs may repeat across namespaces; `typeRef` / `templateRef`
 *     disambiguate at the reference site.
 *   - Forward references are permitted in every namespace.
 *   - Synthetic IDs (`typesGroup`, `templatesGroup`) are reserved.
 *
 * Reference categories (§10.1):
 *   - **Semantic** references (`def`, `typeRef`, `templateRef`) are
 *     resolved against the diagram model. Unresolved → warning
 *     (`REFERENCE_UNRESOLVED`) in v0.5.0 and error in v1.0.
 *   - **Weak** references (`connectorRef` — §9) already have their own
 *     validator from wave 2.
 *   - **External / hygiene** references (`src`, `click`/`href`) are not
 *     validated for existence.
 *
 * Note: `def` is already handled by wave-2 `INSTANCE_DEF_MISSING`.
 * `resolveReferences()` only covers `typeRef` and `templateRef` to avoid
 * double-firing on the same miss.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow identifier resolution (§10)', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  const diagnosticsFor = (db: AgentFlowDB, id: string) =>
    db.getDiagnostics().filter((d) => d.id === id);

  // ────────────────────────────────────────────────────────────────────
  // A. Duplicate IDs within the node-or-container namespace
  // ────────────────────────────────────────────────────────────────────
  describe('A. DUPLICATE_ID_NODE', () => {
    it('duplicate vertex declarations warn', () => {
      agentflow.parser.parse(`agentflow TB
  a["First"]
  a["Second"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'DUPLICATE_ID_NODE');
      expect(warns).toHaveLength(1);
      expect(warns[0].nodeId).toBe('a');
      expect(warns[0].severity).toBe('warning');
    });

    it('a vertex followed by a container with the same id warns', () => {
      agentflow.parser.parse(`agentflow TB
  sharedId["Step"]
  agent sharedId["Reused"]
    step["step"]
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'DUPLICATE_ID_NODE')).toHaveLength(1);
    });

    it('a container followed by a vertex with the same id warns', () => {
      agentflow.parser.parse(`agentflow TB
  agent sharedId["A"]
    step["step"]
  end
  sharedId["Step"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'DUPLICATE_ID_NODE')).toHaveLength(1);
    });

    it('implicit vertices created by edges are NOT duplicates when also declared', () => {
      agentflow.parser.parse(`agentflow TB
  a --> b
  a["Declared A"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'DUPLICATE_ID_NODE')).toHaveLength(0);
    });

    it('metadata-only reattachment is not a duplicate', () => {
      agentflow.parser.parse(`agentflow TB
  a["A"]
  a@{ shape: subroutine }
  a@{ returns: "R" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'DUPLICATE_ID_NODE')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // B. Duplicate type / template declarations
  // ────────────────────────────────────────────────────────────────────
  describe('B. DUPLICATE_ID_TYPE / DUPLICATE_ID_TEMPLATE', () => {
    it('two `type` declarations with the same name warn', () => {
      agentflow.parser.parse(`agentflow TB
  type Report
  type Report
  node["node"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'DUPLICATE_ID_TYPE');
      expect(warns).toHaveLength(1);
      expect(warns[0].severity).toBe('warning');
    });

    it('two `template` declarations with the same name warn', () => {
      agentflow.parser.parse(`agentflow TB
  template %triage {
    TITLE: String <<description>>
  }
  template %triage {
    TITLE: String <<again>>
  }
  node["node"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'DUPLICATE_ID_TEMPLATE');
      expect(warns).toHaveLength(1);
    });

    it('same name used for a type AND a template is valid (different namespaces)', () => {
      agentflow.parser.parse(`agentflow TB
  type Report
  template %Report {
    TITLE: String <<name>>
  }
  node["node"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'DUPLICATE_ID_TYPE')).toHaveLength(0);
      expect(diagnosticsFor(db, 'DUPLICATE_ID_TEMPLATE')).toHaveLength(0);
      expect(diagnosticsFor(db, 'DUPLICATE_ID_NODE')).toHaveLength(0);
    });

    it('a vertex named `Report` does not collide with `type Report`', () => {
      agentflow.parser.parse(`agentflow TB
  type Report
  Report["a node called Report"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      // Node-or-container namespace is separate from type namespace.
      expect(diagnosticsFor(db, 'DUPLICATE_ID_NODE')).toHaveLength(0);
      expect(diagnosticsFor(db, 'DUPLICATE_ID_TYPE')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // C. Reserved synthetic IDs
  // ────────────────────────────────────────────────────────────────────
  describe('C. reserved synthetic IDs', () => {
    it('declaring `typesGroup` as a user vertex warns', () => {
      agentflow.parser.parse(`agentflow TB
  typesGroup["user claim"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'RESERVED_SYNTHETIC_ID');
      expect(warns).toHaveLength(1);
    });

    it('declaring `templatesGroup` as a user vertex warns', () => {
      agentflow.parser.parse(`agentflow TB
  templatesGroup["user claim"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'RESERVED_SYNTHETIC_ID')).toHaveLength(1);
    });

    it('declaring `typesGroup` as a user subgraph warns', () => {
      agentflow.parser.parse(`agentflow TB
  subgraph typesGroup["claim"]
    s["s"]
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'RESERVED_SYNTHETIC_ID')).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // D. Reference resolution
  // ────────────────────────────────────────────────────────────────────
  describe('D. REFERENCE_UNRESOLVED', () => {
    it('unresolved `typeRef` warns', () => {
      agentflow.parser.parse(`agentflow TB
  r["r"]
  r@{ shape: procs, typeRef: "Nonexistent" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'REFERENCE_UNRESOLVED');
      expect(warns).toHaveLength(1);
      expect(warns[0].nodeId).toBe('r');
    });

    it('unresolved `templateRef` warns', () => {
      agentflow.parser.parse(`agentflow TB
  r["r"]
  r@{ shape: procs, templateRef: "NotDeclared" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REFERENCE_UNRESOLVED')).toHaveLength(1);
    });

    it('resolved `typeRef` does not warn', () => {
      agentflow.parser.parse(`agentflow TB
  type Report
  r["r"]
  r@{ shape: procs, typeRef: "Report" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REFERENCE_UNRESOLVED')).toHaveLength(0);
    });

    it('resolved `templateRef` does not warn', () => {
      agentflow.parser.parse(`agentflow TB
  template %triage {
    TITLE: String <<desc>>
  }
  r["r"]
  r@{ shape: procs, templateRef: "triage" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REFERENCE_UNRESOLVED')).toHaveLength(0);
    });

    it('`def` unresolved still fires INSTANCE_DEF_MISSING (not REFERENCE_UNRESOLVED)', () => {
      agentflow.parser.parse(`agentflow TB
  bad["bad"]
  bad@{ shape: win-pane, def: "nowhere" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'INSTANCE_DEF_MISSING')).toHaveLength(1);
      expect(diagnosticsFor(db, 'REFERENCE_UNRESOLVED')).toHaveLength(0);
    });

    it('`src` referencing a non-existent file does not warn (hygiene-only)', () => {
      agentflow.parser.parse(`agentflow TB
  r["r"]
  r@{ shape: procs, src: "./does-not-exist.md" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REFERENCE_UNRESOLVED')).toHaveLength(0);
    });

    it('forward reference across nested containers resolves cleanly', () => {
      agentflow.parser.parse(`agentflow TB
  r["r"]
  r@{ shape: procs, typeRef: "Report" }

  agent orchestrator["O"]
    step["step"]
  end

  type Report`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'REFERENCE_UNRESOLVED')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // E. Cross-cutting invariants
  // ────────────────────────────────────────────────────────────────────
  describe('E. invariants', () => {
    it('repeated getData() calls are idempotent', () => {
      agentflow.parser.parse(`agentflow TB
  a["first"]
  a["second"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      db.getData();
      db.getData();
      expect(diagnosticsFor(db, 'DUPLICATE_ID_NODE')).toHaveLength(1);
    });
  });
});
