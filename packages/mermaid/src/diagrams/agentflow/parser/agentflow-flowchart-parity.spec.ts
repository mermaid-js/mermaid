/**
 * The agentflow lexer is a deliberate near-copy of flowchart's (see the header
 * of `agentflow.jison`). The design rule stated there is that agentflow must
 * never accept something flowchart rejects — a divergence would surface as a
 * diagram that parses in one diagram type and not the other.
 *
 * `NOTES.md` lists the divergences that *are* intended (agentflow drops the
 * thick/dotted edge families and adds `%%` handling inside label states). This
 * spec pins the parts that must stay identical, so the next flowchart grammar
 * change gets diffed against this file rather than silently drifting.
 */
import { describe, expect, it } from 'vitest';
import { AgentFlowDB } from '../agentflowDb.js';
import agentflow from './agentflowParser.js';
import { FlowDB } from '../../flowchart/flowDb.js';
// @ts-ignore JISON parser has no types
import flow from '../../flowchart/parser/flowParser.ts';

const parseAgentflow = (body: string) => {
  agentflow.parser.yy = new AgentFlowDB();
  agentflow.parser.yy.clear();
  agentflow.parser.yy.setGen('gen-2');
  agentflow.parser.parse(`agentflow-beta TB\n${body}\n`);
};

const parseFlowchart = (body: string) => {
  flow.parser.yy = new FlowDB();
  flow.parser.yy.clear();
  flow.parser.parse(`flowchart TB\n${body}\n`);
};

const accepts = (parse: (body: string) => void, body: string) => {
  try {
    parse(body);
    return true;
  } catch {
    return false;
  }
};

// Bodies that use only syntax both grammars share.
const SHARED_SYNTAX = [
  '  A@{ label: "hello" }',
  '  A@{ shape: rect }',
  '  A@{ label: a^b }',
  '  A@{\n    label: "multi"\n  }',
  '  A["Label"] --> B["Other"]',
  '  A -- text --> B',
  '  A["a (paren) b"]',
];

describe('agentflow / flowchart lexer parity', () => {
  it.each(SHARED_SYNTAX)('agrees on whether to accept %j', (body) => {
    expect(accepts(parseAgentflow, body)).toBe(accepts(parseFlowchart, body));
  });

  it('rejects a caret in shape data exactly like flowchart does', () => {
    // `<shapeData>[^}^"]+` — agentflow briefly used `[^}"]+`, which accepted
    // `A@{ label: a^b }` where flowchart raises a lexical error.
    expect(accepts(parseAgentflow, '  A@{ label: a^b }')).toBe(false);
    expect(accepts(parseFlowchart, '  A@{ label: a^b }')).toBe(false);
  });
});
