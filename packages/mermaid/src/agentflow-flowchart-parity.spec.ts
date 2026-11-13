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
import mermaidAPI from '@mermaid-js/core/mermaidAPI.js';

const accepts = async (header: string, body: string) =>
  (await mermaidAPI.parse(`${header}\n${body}\n`, { suppressErrors: true })) !== false;

const AGENTFLOW = 'agentflow-beta TB';
const FLOWCHART = 'flowchart TB';

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
  it('parses both diagram types', async () => {
    // Otherwise a detection failure would make both sides reject everything and still agree.
    expect(await accepts(AGENTFLOW, '  A --> B')).toBe(true);
    expect(await accepts(FLOWCHART, '  A --> B')).toBe(true);
  });

  it.each(SHARED_SYNTAX)('agrees on whether to accept %j', async (body) => {
    expect(await accepts(AGENTFLOW, body)).toBe(await accepts(FLOWCHART, body));
  });

  it('rejects a caret in shape data exactly like flowchart does', async () => {
    // `<shapeData>[^}^"]+` — agentflow briefly used `[^}"]+`, which accepted
    // `A@{ label: a^b }` where flowchart raises a lexical error.
    expect(await accepts(AGENTFLOW, '  A@{ label: a^b }')).toBe(false);
    expect(await accepts(FLOWCHART, '  A@{ label: a^b }')).toBe(false);
  });
});
