/**
 * The diagram header is `agentflow`; `agentflow-beta` is kept as an alias so
 * diagrams written while the diagram was in beta keep parsing. Outside the
 * header, `agentflow` is an ordinary word and must stay usable in node ids.
 */
import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

const parse = (text: string) => {
  agentflow.parser.parse(text);
  return agentflow.parser.yy as AgentFlowDB;
};

describe('agentflow header keyword', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  describe.each(['agentflow', 'agentflow-beta'])('%s', (keyword) => {
    it('parses with a direction', () => {
      const db = parse(`${keyword} LR\n  a --> b`);
      expect([...db.getVertices().keys()]).toEqual(['a', 'b']);
      expect(db.getDirection()).toBe('LR');
    });

    it('parses without a direction', () => {
      const db = parse(`${keyword}\n  a --> b`);
      expect([...db.getVertices().keys()]).toEqual(['a', 'b']);
    });

    it('parses after a leading comment', () => {
      const db = parse(`%% leading comment\n${keyword} TB\n  a --> b`);
      expect([...db.getVertices().keys()]).toEqual(['a', 'b']);
    });

    it('parses flows, connectors and metadata', () => {
      const db = parse(`${keyword} TB
  connector github["GitHub"]
  flow triage["Issue triage"]
    read["Read new issues"]@{ instruction: "List the issues." }
    read -.- github
  end`);
      expect(db.getVertices().has('read')).toBe(true);
      expect(db.getVertices().has('github')).toBe(true);
    });

    it.each(['agentflow', 'agentflow_runner', 'agentflows', 'my_agentflow'])(
      'keeps %s usable as a node id',
      (id) => {
        const db = parse(`${keyword} TB\n  ${id} --> b\n  b --> ${id}`);
        expect([...db.getVertices().keys()]).toEqual([id, 'b']);
      }
    );

    it('keeps agentflow usable as a labelled node id', () => {
      const db = parse(`${keyword} TB\n  agentflow["An agentflow"] --> b`);
      expect(db.getVertices().get('agentflow')?.text).toBe('An agentflow');
    });
  });
});
