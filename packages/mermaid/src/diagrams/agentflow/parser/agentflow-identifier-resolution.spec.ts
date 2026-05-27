/**
 * Identifier resolution (v0.8.1).
 *
 * Per AGENTFLOW-SYNTAX.md §9 the diagram uses a single id namespace
 * shared by vertices, containers, and connectors. The type / template
 * namespaces were removed in v0.8.1.
 *
 * Rules:
 *   - Within the namespace, IDs MUST be unique. Duplicates warn.
 *   - Forward references are permitted.
 *   - Synthetic IDs (`connectors`) remain reserved for forward compat.
 *
 * Reference categories (§8.1):
 *   - `connectorRef` is the only semantic reference; resolution is
 *     handled by `validateConnectorReferences()`.
 *   - External / hygiene references (`href`, `click`) are not validated.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow identifier resolution (§9)', () => {
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

    it('a vertex followed by a flow container with the same id warns', () => {
      agentflow.parser.parse(`agentflow TB
  sharedId["Step"]
  flow sharedId["Reused"]
    step["step"]
  end`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'DUPLICATE_ID_NODE')).toHaveLength(1);
    });

    it('a flow container followed by a vertex with the same id warns', () => {
      agentflow.parser.parse(`agentflow TB
  flow sharedId["A"]
    step["step"]
  end
  sharedId["Step"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'DUPLICATE_ID_NODE')).toHaveLength(1);
    });

    it('a connector followed by a vertex with the same id warns', () => {
      agentflow.parser.parse(`agentflow TB
  connector shared["c"]
  shared["step"]`);
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
  a@{ shape: tool }
  a@{ returns: "R" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'DUPLICATE_ID_NODE')).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // B. Reserved synthetic IDs
  // ────────────────────────────────────────────────────────────────────
  describe('B. reserved synthetic IDs', () => {
    it('declaring `connectors` as a user vertex warns', () => {
      agentflow.parser.parse(`agentflow TB
  connectors["user claim"]`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warns = diagnosticsFor(db, 'RESERVED_SYNTHETIC_ID');
      expect(warns).toHaveLength(1);
    });
  });

  // ────────────────────────────────────────────────────────────────────
  // C. Cross-cutting invariants
  // ────────────────────────────────────────────────────────────────────
  describe('C. invariants', () => {
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
