/**
 * Connector reference validator (closes #14 — wave-2 PR 2).
 *
 * Per AGENTFLOW-SYNTAX.md §9 (revision 8), connectors are metadata-based:
 *
 *   - Tools bind via `@{ connectorRef: "<value>" }`.
 *   - A connector-designated node is any node carrying one or more of
 *     `protocol`, `endpoint`, `transport`, `command`, `auth`,
 *     `token_required`. Its own id is the connector identity.
 *
 * Resolution rule for a bare `connectorRef` value (per §9.1):
 *   - no node with that id        → CONNECTOR_REF_UNRESOLVED
 *   - matching node IS connector-designated → no diagnostic
 *   - matching node is NOT connector-designated → CONNECTOR_REF_NOT_A_CONNECTOR
 *
 * Dotted (`<connector>.<operation>`) and URL-like values are opaque and
 * trigger no diagnostic regardless of resolution.
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
    it('resolves cleanly when target is a connector-designated node', () => {
      agentflow.parser.parse(`agentflow TB
  github_mcp["GitHub MCP"]
  github_mcp@{ protocol: "mcp", transport: "stdio", command: "npx -y @mcp/github" }
  create_issue["Create Issue"]
  create_issue@{ shape: subroutine, connectorRef: "github_mcp" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CONNECTOR_REF_NOT_A_CONNECTOR')).toHaveLength(0);
    });

    it('emits CONNECTOR_REF_UNRESOLVED when the bare id matches no node', () => {
      agentflow.parser.parse(`agentflow TB
  create_issue["Create Issue"]
  create_issue@{ shape: subroutine, connectorRef: "missing_node" }`);
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
  create_issue@{ shape: subroutine, connectorRef: "plain" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      const warnings = diagnosticsFor(db, 'CONNECTOR_REF_NOT_A_CONNECTOR');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].nodeId).toBe('create_issue');
      expect(warnings[0].severity).toBe('warning');
      expect(diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED')).toHaveLength(0);
    });

    it('treats any one of the connector configuration fields as designation', () => {
      const fields = ['protocol', 'endpoint', 'transport', 'command', 'auth', 'token_required'];
      for (const field of fields) {
        agentflow.parser.yy = new AgentFlowDB();
        agentflow.parser.yy.clear();
        agentflow.parser.yy.setGen('gen-2');
        agentflow.parser.parse(`agentflow TB
  conn["Connector"]
  conn@{ ${field}: "value" }
  tool1["Tool"]
  tool1@{ shape: subroutine, connectorRef: "conn" }`);
        const db = agentflow.parser.yy as AgentFlowDB;
        db.getData();
        expect(diagnosticsFor(db, 'CONNECTOR_REF_NOT_A_CONNECTOR'), field).toHaveLength(0);
        expect(diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED'), field).toHaveLength(0);
      }
    });
  });

  describe('opaque forms (no diagnostic regardless of resolution)', () => {
    it('dotted form `connector.operation` emits no diagnostic even if the bare connector is missing', () => {
      agentflow.parser.parse(`agentflow TB
  create_issue["Create Issue"]
  create_issue@{ shape: subroutine, connectorRef: "github.create_issue" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CONNECTOR_REF_NOT_A_CONNECTOR')).toHaveLength(0);
    });

    it('URL-like value emits no diagnostic', () => {
      agentflow.parser.parse(`agentflow TB
  call_api["Call API"]
  call_api@{ shape: subroutine, connectorRef: "https://api.example.com/v2/things" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CONNECTOR_REF_NOT_A_CONNECTOR')).toHaveLength(0);
    });
  });

  describe('multi-binding scenarios', () => {
    it('multiple tools binding to the same connector all resolve cleanly', () => {
      agentflow.parser.parse(`agentflow TB
  github_mcp["GitHub MCP"]
  github_mcp@{ protocol: "mcp" }
  create_issue["Create Issue"]
  create_issue@{ shape: subroutine, connectorRef: "github_mcp" }
  close_issue["Close Issue"]
  close_issue@{ shape: subroutine, connectorRef: "github_mcp" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED')).toHaveLength(0);
      expect(diagnosticsFor(db, 'CONNECTOR_REF_NOT_A_CONNECTOR')).toHaveLength(0);
    });

    it('connector node with no bindings emits no diagnostic (connectors are valid standalone)', () => {
      agentflow.parser.parse(`agentflow TB
  unused["Unused Connector"]
  unused@{ protocol: "http", endpoint: "https://nowhere.example" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      expect(db.getDiagnostics()).toHaveLength(0);
    });

    it('mix of valid + invalid bindings emits one warning per offender', () => {
      agentflow.parser.parse(`agentflow TB
  github_mcp["GitHub MCP"]
  github_mcp@{ protocol: "mcp" }
  ok_tool["OK"]
  ok_tool@{ shape: subroutine, connectorRef: "github_mcp" }
  unresolved_tool["Unresolved"]
  unresolved_tool@{ shape: subroutine, connectorRef: "missing" }
  not_connector_tool["NotAConnector"]
  not_connector_tool@{ shape: subroutine, connectorRef: "ok_tool" }`);
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

  describe('idempotency', () => {
    it('warnings do not duplicate across repeated getData() calls', () => {
      agentflow.parser.parse(`agentflow TB
  bad_tool["Bad"]
  bad_tool@{ shape: subroutine, connectorRef: "missing" }`);
      const db = agentflow.parser.yy as AgentFlowDB;
      db.getData();
      db.getData();
      db.getData();
      expect(diagnosticsFor(db, 'CONNECTOR_REF_UNRESOLVED')).toHaveLength(1);
    });
  });
});
