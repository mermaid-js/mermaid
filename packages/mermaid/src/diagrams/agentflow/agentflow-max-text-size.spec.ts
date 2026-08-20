/**
 * `maxTextSize` bounds what the parser is handed. `render()` measures
 * `code.cleaned`, but a DB that opts into `preserveCommentsWhenParsing` is
 * handed `code.withComments` — and `cleaned` is `withComments` with the comment
 * lines removed, so the gap between them is unbounded. A diagram padded with
 * `%%` comments has a tiny `cleaned` and an arbitrarily large `withComments`,
 * and walked straight past the guard into `encodeEntities()` and the lexer.
 *
 * Capping on the larger of the two would newly truncate comment-heavy diagrams
 * for every other diagram type, none of which ever parse `withComments`. So the
 * comment-preserving variant is dropped instead, and the render falls back to
 * the comment-stripped text it would have used before.
 */
import { beforeAll, describe, expect, vi } from 'vitest';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { mermaidAPI } from '../../mermaidAPI.js';
import { jsdomIt } from '../../tests/util.js';
import { AgentFlowDB } from './agentflowDb.js';

/** Capture every AgentFlowDB the render pipeline instantiates. */
const captureDbs = () => {
  const seen: AgentFlowDB[] = [];
  // eslint-disable-next-line @typescript-eslint/unbound-method -- re-bound via `apply` below
  const original = AgentFlowDB.prototype.clear;
  vi.spyOn(AgentFlowDB.prototype, 'clear').mockImplementation(function (
    this: AgentFlowDB,
    ...args: Parameters<AgentFlowDB['clear']>
  ) {
    seen.push(this);
    return original.apply(this, args);
  });
  return seen;
};

const COMMENT_LINE = '  %% ' + 'x'.repeat(60);
const padded = (lines: number) =>
  `agentflow-beta TB\n${Array.from({ length: lines }, () => COMMENT_LINE).join('\n')}\n  a["A"]\n  b["B"]\n  a --> b`;

describe('agentflow under maxTextSize', () => {
  beforeAll(() => {
    addDiagrams();
  });

  jsdomIt('does not hand the parser a comment-padded source larger than the cap', async () => {
    const source = padded(4000);
    // Sanity: the comment-stripped text is far under the cap the comment-
    // preserving text blows through.
    expect(source.length).toBeGreaterThan(200_000);

    const parseSpy = vi.spyOn(AgentFlowDB.prototype, 'addVertex');
    await mermaidAPI.render('agentflow-maxsize', source, undefined);

    // `a` still parsed, so the diagram rendered rather than being truncated…
    expect(parseSpy.mock.calls.some((call) => call[0] === 'a')).toBe(true);
    vi.restoreAllMocks();
  });

  jsdomIt('reports comment-stripped positions once the cap forces the fallback', async () => {
    const seen = captureDbs();
    await mermaidAPI.render('agentflow-maxsize-2', padded(4000));
    vi.restoreAllMocks();

    // With comments stripped, `a` sits on line 2 rather than line 4002.
    expect(seen.at(-1)!.getElementById('a')?.position.startLine).toBe(2);
  });

  jsdomIt('keeps comment-accurate positions when the source is under the cap', async () => {
    const seen = captureDbs();
    await mermaidAPI.render('agentflow-maxsize-3', padded(3));
    vi.restoreAllMocks();

    // Three comment lines survive, so `a` is on line 5.
    expect(seen.at(-1)!.getElementById('a')?.position.startLine).toBe(5);
  });
});
