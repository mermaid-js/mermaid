import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { setConfig } from '../../../config.js';

setConfig({
  securityLevel: 'strict',
});

describe('agentflow trailing whitespace', () => {
  beforeEach(() => {
    agentflow.parser.yy = new AgentFlowDB();
    agentflow.parser.yy.clear();
    agentflow.parser.yy.setGen('gen-2');
  });

  it.each([
    ['spaces', '  '],
    ['a tab', '\t'],
    ['spaces before CRLF', '  \r'],
  ])('parses lines that end with %s', (_, ws) => {
    const text = [
      'agentflow-beta TB',
      '  flow reviewer["Review Agent"]',
      '    changes["Gather changes"]@{ shape: input }',
      '    lint["run_linter"]@{ shape: tool }',
      '    changes --> lint',
      '  end',
    ]
      .map((line) => line + ws)
      .join('\n');

    expect(() => agentflow.parser.parse(text)).not.toThrow();

    const db: AgentFlowDB = agentflow.parser.yy;
    const vertices = db.getVertices();
    expect(vertices.get('changes')?.text).toBe('Gather changes');
    expect(vertices.get('lint')?.text).toBe('run_linter');
    expect(db.getEdges()).toHaveLength(1);

    const flow = db.getSubGraphs().find((s) => s.id === 'reviewer');
    expect(flow?.title).toBe('Review Agent');
    expect(flow?.nodes).toEqual(expect.arrayContaining(['changes', 'lint']));
  });
});
