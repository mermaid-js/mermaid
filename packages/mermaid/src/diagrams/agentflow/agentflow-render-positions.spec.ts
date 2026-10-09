// Integration spec for the source-position plumbing on the *render* path.
//
// `AgentFlowDB` opts into `preserveCommentsWhenParsing` and consumes
// `setFrontmatterLineOffset`, but both are carried by the `DiagramCode` object
// that `preprocessDiagram()` produces. `mermaidAPI.render()` used to collapse
// that object to `code.cleaned` before constructing the diagram, so on the real
// render path comments were stripped and the frontmatter offset was never
// passed — every reported position was shifted. `parse()` had the same gap, and
// because `getDiagramFromText()` did pass the object, `parse()` and `render()`
// handed the parser different strings for the same input.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';
import { mermaidAPI } from '../../mermaidAPI.js';
import { jsdomIt } from '../../tests/util.js';
import { getDiagram } from '../../diagram-api/diagramAPI.js';
import { detectors } from '../../diagram-api/detectType.js';
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

// Frontmatter occupies lines 1-5, so `alpha` sits on line 8 of the original
// source but on line 3 of the text the parser sees. The `%%` comment on line 7
// only stays a line if `withComments` is the text handed to the parser.
const source = `---
config:
  agentflow:
    nodeSpacing: 40
---
agentflow-beta TB
  %% a comment that occupies a line
  alpha["Alpha"]
  beta["Beta"]
  alpha --> beta`;

describe('agentflow source positions on the public API paths', () => {
  beforeAll(() => {
    addDiagrams();
  });

  jsdomIt('reports original-source positions through mermaidAPI.render()', async () => {
    const dbs = captureDbs();
    await mermaidAPI.render('agentflow-render-positions', source);
    vi.restoreAllMocks();

    const db = dbs.at(-1);
    expect(db).toBeDefined();
    const alpha = db!.getElementById('alpha');
    expect(alpha).toBeDefined();
    // Line 8 in the original source, not line 3 (frontmatter) or line 2 (comment).
    expect(alpha?.position.startLine).toBe(8);
  });

  jsdomIt('reports the same positions through mermaidAPI.parse()', async () => {
    const dbs = captureDbs();
    await mermaidAPI.parse(source);
    vi.restoreAllMocks();

    const db = dbs.at(-1);
    expect(db).toBeDefined();
    expect(db!.getElementById('alpha')?.position.startLine).toBe(8);
  });

  jsdomIt('parse() and render() agree on the reported position', async () => {
    const parsed = captureDbs();
    await mermaidAPI.parse(source);
    vi.restoreAllMocks();

    const rendered = captureDbs();
    await mermaidAPI.render('agentflow-render-positions-2', source);
    vi.restoreAllMocks();

    expect(rendered.at(-1)!.getElementById('beta')?.position).toStrictEqual(
      parsed.at(-1)!.getElementById('beta')?.position
    );
  });

  // The plumbing is opt-in per DB: `Diagram.fromText` only reaches for
  // `withComments`/`frontmatterLineOffset` when the DB declares
  // `preserveCommentsWhenParsing` / `setFrontmatterLineOffset`. Agentflow is
  // the only DB that does, so no other diagram type changes behaviour.
  it('is opt-in — no other registered diagram consumes the source-position hooks', () => {
    const optedIn = Object.keys(detectors).filter((type) => {
      let db;
      try {
        db = getDiagram(type).db;
      } catch {
        return false; // not eagerly registered, nothing to assert
      }
      return db.preserveCommentsWhenParsing === true || db.setFrontmatterLineOffset !== undefined;
    });
    expect(optedIn).toStrictEqual(['agentflow']);
  });
});
