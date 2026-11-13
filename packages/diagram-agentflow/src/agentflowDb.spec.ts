import { beforeEach, describe, expect, it } from 'vitest';
import { AgentFlowDB } from './agentflowDb.js';

function addAgentflowVertex(db: AgentFlowDB, id: string) {
  db.addVertex(id, { text: id, type: 'text' } as any, undefined as any, [], [], '', {}, undefined);
}

describe('AgentFlowDB.setDiagramId + lookUpDomId', () => {
  let db: AgentFlowDB;
  beforeEach(() => {
    db = new AgentFlowDB();
    addAgentflowVertex(db, 'A');
    addAgentflowVertex(db, 'B');
  });

  it('always prefixes domId with diagramId', () => {
    db.setDiagramId('mermaid-0');
    expect(db.lookUpDomId('A')).toMatch(/^mermaid-0-agentflow-A-\d+$/);
  });

  it('produces unique domIds for same node across different diagram IDs', () => {
    const db2 = new AgentFlowDB();
    addAgentflowVertex(db2, 'A');

    db.setDiagramId('mermaid-0');
    db2.setDiagramId('mermaid-1');

    expect(db.lookUpDomId('A')).not.toBe(db2.lookUpDomId('A'));
  });

  it('resets diagramId on clear()', () => {
    db.setDiagramId('mermaid-0');
    db.clear();
    addAgentflowVertex(db, 'A');
    expect(db.lookUpDomId('A')).not.toContain('mermaid-0');
  });
});
