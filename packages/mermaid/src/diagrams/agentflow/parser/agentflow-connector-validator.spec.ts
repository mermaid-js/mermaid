/**
 * Connector reference validator (v0.8.1).
 *
 * Per AGENTFLOW-SYNTAX.md §8.1, connectors are now declared with the
 * `connector` keyword:
 *
 *   connector github_mcp["GitHub MCP"]
 *   github_mcp@{ protocol: "mcp", transport: "stdio" }
 *
 * Tools / actions bind to connectors via `@{ connectorRef: "<value>" }`.
 *
 * Resolution rule for a bare `connectorRef` value (per §8.1):
 *   - id matches a declared connector            → no diagnostic
 *   - id matches a non-connector node / subgraph → CONNECTOR_REF_NOT_A_CONNECTOR
 *   - id matches nothing                         → CONNECTOR_REF_UNRESOLVED
 *
 * Dotted (`<connector>.<operation>`) values use the prefix-before-first-dot
 * for resolution and are otherwise opaque. URL-like values still split on
 * the first `.`; whether the resulting prefix resolves to a connector
 * determines the diagnostic.
 */

import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow connector reference validator', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  const diagnosticsFor = (db: AgentFlowDB, id: string) =>
    db.getDiagnostics().filter((d) => d.id === id);

  describe('bare-id resolution', () => {
    it('resolves cleanly when target is a declared connector', () => {
      agentflow.parser.parse(`agentflow TB
  connector github_mcp["GitHub MCP"]
  github_mcp@{ protocol: "mcp", transport: "stdio", command: "npx -y @mcp/github" }
  create_issue["Create Issue"]
  create_issue@{ shape: tool, connectorRef: "github_mcp" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CONNECTOR_REF_NOT_A_CONNECTOR')).toHaveLength(0);
    });

    it('emits CONNECTOR_REF_UNRESOLVED when the bare id matches no node', () => {
      agentflow.parser.parse(`agentflow TB
  create_issue["Create Issue"]
  create_issue@{ shape: tool, connectorRef: "missing_node" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warnings = diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].nodeId).toBe('create_issue');
      expect(warnings[0].severity).toBe('warning');
    });

    it('emits CONNECTOR_REF_NOT_A_CONNECTOR when the bare id resolves to a non-connector node', () => {
      agentflow.parser.parse(`agentflow TB
  plain["plain node"]
  create_issue["Create Issue"]
  create_issue@{ shape: tool, connectorRef: "plain" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warnings = diagnosticsFor(db, 'CONNECTOR_REF_NOT_A_CONNECTOR');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].nodeId).toBe('create_issue');
      expect(warnings[0].severity).toBe('warning');
      expect(diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED')).toHaveLength(0);
    });
  });

  describe('dotted form', () => {
    it('resolves the prefix-before-first-dot against connectors', () => {
      agentflow.parser.parse(`agentflow TB
  connector github["GitHub"]
  github@{ protocol: "mcp" }
  create_issue["Create Issue"]
  create_issue@{ shape: tool, connectorRef: "github.create_issue" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CONNECTOR_REF_NOT_A_CONNECTOR')).toHaveLength(0);
    });

    it('emits CONNECTOR_REF_UNRESOLVED when the dotted prefix matches no declared connector', () => {
      agentflow.parser.parse(`agentflow TB
  create_issue["Create Issue"]
  create_issue@{ shape: tool, connectorRef: "github.create_issue" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED')).toHaveLength(1);
    });
  });

  describe('multi-binding scenarios', () => {
    it('multiple tools binding to the same connector all resolve cleanly', () => {
      agentflow.parser.parse(`agentflow TB
  connector github_mcp["GitHub MCP"]
  github_mcp@{ protocol: "mcp" }
  create_issue["Create Issue"]
  create_issue@{ shape: tool, connectorRef: "github_mcp" }
  close_issue["Close Issue"]
  close_issue@{ shape: tool, connectorRef: "github_mcp" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CONNECTOR_REF_NOT_A_CONNECTOR')).toHaveLength(0);
    });

    it('connector with no bindings emits no diagnostic (connectors are valid standalone)', () => {
      agentflow.parser.parse(`agentflow TB
  connector unused["Unused"]
  unused@{ protocol: "http", endpoint: "https://nowhere.example" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CONNECTOR_REF_NOT_A_CONNECTOR')).toHaveLength(0);
    });

    it('mix of valid + invalid bindings emits one warning per offender', () => {
      agentflow.parser.parse(`agentflow TB
  connector github_mcp["GitHub MCP"]
  github_mcp@{ protocol: "mcp" }
  ok_tool["OK"]
  ok_tool@{ shape: tool, connectorRef: "github_mcp" }
  unresolved_tool["Unresolved"]
  unresolved_tool@{ shape: tool, connectorRef: "missing" }
  not_connector_tool["NotAConnector"]
  not_connector_tool@{ shape: tool, connectorRef: "ok_tool" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const unresolved = diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED');
      const notConn = diagnosticsFor(db, 'CONNECTOR_REF_NOT_A_CONNECTOR');
      expect(unresolved).toHaveLength(1);
      expect(unresolved[0].nodeId).toBe('unresolved_tool');
      expect(notConn).toHaveLength(1);
      expect(notConn[0].nodeId).toBe('not_connector_tool');
    });
  });

  describe('getConnectors() collection', () => {
    it('returns one entry per declared connector', () => {
      agentflow.parser.parse(`agentflow TB
  connector github["GitHub"]
  connector slack["Slack"]
  github@{ protocol: "mcp" }
  slack@{ protocol: "http" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const connectors = db.getConnectors();
      const ids = connectors.map((c) => c.id).sort();
      expect(ids).toEqual(['github', 'slack']);
    });
  });

  describe('idempotency', () => {
    it('warnings do not duplicate across repeated getData() calls', () => {
      agentflow.parser.parse(`agentflow TB
  bad_tool["Bad"]
  bad_tool@{ shape: tool, connectorRef: "missing" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      db.getData();
      db.getData();
      expect(diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED')).toHaveLength(1);
    });
  });
});
