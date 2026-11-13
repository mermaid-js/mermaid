/**
 * Block titles (loop/alt/else/par/and/opt/critical/break) are passed through `wrapLabel` before they
 * are drawn. Wrapping inserts `<br/>` tags, and a `<br/>` inside `$$...$$` splits the expression into
 * fragments KaTeX cannot parse, so the title rendered as raw markup (#7681). Titles containing math
 * must therefore be left unwrapped, while plain-text titles keep wrapping as before.
 *
 * jsdom has no layout, so only the label strings are asserted here; the font and position of the
 * rendered math are covered by the Playwright test in e2e/rendering/sequence.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Diagram } from '../../Diagram.js';
import { addDiagrams } from '../../diagram-api/diagram-orchestration.js';

const originalGetBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getBBox');

beforeAll(() => {
  addDiagrams();
  // jsdom does not implement getBBox, which is how text is measured (and so how wrapLabel decides
  // where to break). Make the width grow with the text so long titles really need wrapping.
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value(this: SVGElement) {
      return { x: 0, y: 0, width: (this.textContent ?? '').length * 8, height: 16 };
    },
  });
});

afterAll(() => {
  if (originalGetBBox) {
    Object.defineProperty(SVGElement.prototype, 'getBBox', originalGetBBox);
  } else {
    Reflect.deleteProperty(SVGElement.prototype, 'getBBox');
  }
});

const LONG_TEXT = 'a fairly long title that is far wider than a narrow loop box';

/** Renders the diagram and returns the block-title messages as the renderer left them. */
const renderedTitles = async (code: string) => {
  document.body.innerHTML = '<svg id="tst" xmlns="http://www.w3.org/2000/svg"></svg>';
  const diagram = await Diagram.fromText(code);
  await diagram.renderer.draw(code, 'tst', '1.2.3', diagram);
  const db = diagram.db as { getMessages: () => { type: number; message: string }[] };
  const { LINETYPE } = diagram.db as unknown as { LINETYPE: Record<string, number> };
  const titleTypes = new Set(
    [
      'LOOP_START',
      'ALT_START',
      'ALT_ELSE',
      'OPT_START',
      'PAR_START',
      'PAR_OVER_START',
      'PAR_AND',
      'CRITICAL_START',
      'CRITICAL_OPTION',
      'BREAK_START',
    ].map((name) => LINETYPE[name])
  );
  return db
    .getMessages()
    .filter((msg) => titleTypes.has(msg.type))
    .map((msg) => msg.message);
};

/** The `$$...$$` expressions in a label. */
const mathIn = (label: string) => label.match(/\$\$(.*?)\$\$/g) ?? [];

describe('sequence block titles with KaTeX (#7681)', () => {
  it('does not insert line breaks into a loop title that contains math', async () => {
    const [title] = await renderedTitles(`%%{init: {"sequence": {"wrap": true, "width": 60}}}%%
sequenceDiagram
  participant A
  participant B
  loop ${LONG_TEXT} $$\\frac{1}{2}+1=2$$
    A->>B: hi
  end`);

    expect(title).not.toMatch(/<br\s*\/?>/i);
    expect(mathIn(title)).toEqual(['$$\\frac{1}{2}+1=2$$']);
  });

  it('keeps math intact in alt and else section titles', async () => {
    const titles = await renderedTitles(`%%{init: {"sequence": {"wrap": true, "width": 60}}}%%
sequenceDiagram
  participant A
  participant B
  alt ${LONG_TEXT} $$x > 0$$
    A->>B: yes
  else ${LONG_TEXT} $$x \\le 0$$
    A->>B: no
  end`);

    expect(titles).toHaveLength(2);
    for (const title of titles) {
      expect(title).not.toMatch(/<br\s*\/?>/i);
      expect(mathIn(title)).toHaveLength(1);
    }
  });

  it('keeps math intact in opt, par, par_over, critical and break titles', async () => {
    const titles = await renderedTitles(`%%{init: {"sequence": {"wrap": true, "width": 60}}}%%
sequenceDiagram
  participant A
  participant B
  rect rgb(200, 220, 255)
    opt ${LONG_TEXT} $$a$$
      A->>B: opt
    end
  end
  par ${LONG_TEXT} $$b$$
    A->>B: one
  and ${LONG_TEXT} $$c$$
    B->>A: two
  end
  par_over ${LONG_TEXT} $$d$$
    A->>B: three
  end
  critical ${LONG_TEXT} $$e$$
    A->>B: four
  option ${LONG_TEXT} $$f$$
    A->>B: five
  end
  rect
    break ${LONG_TEXT} $$g$$
      A->>B: six
    end
  end`);

    expect(titles).toHaveLength(7);
    for (const title of titles) {
      expect(title).not.toMatch(/<br\s*\/?>/i);
      expect(mathIn(title)).toHaveLength(1);
    }
  });

  // Exercises the KaTeX actor-label path in jsdom (no layout, so sizes are 0). That the footer
  // label is actually filled and sized in a browser is asserted by the Playwright test.
  it('draws a math label for both the header and the footer actor', async () => {
    document.body.innerHTML = '<svg id="tst" xmlns="http://www.w3.org/2000/svg"></svg>';
    const code = `sequenceDiagram
  participant A as $$\\alpha$$lex
  participant B
  A->>B: hi`;
    const diagram = await Diagram.fromText(code);
    await diagram.renderer.draw(code, 'tst', '1.2.3', diagram);

    const actorLabels = [...document.querySelectorAll('#tst switch > foreignObject')];
    expect(actorLabels).toHaveLength(2);
    for (const label of actorLabels) {
      expect(label.getAttribute('width')).not.toBeNull();
      expect(label.getAttribute('height')).not.toBeNull();
    }
  });

  it('still wraps a long plain-text loop title', async () => {
    const [title] = await renderedTitles(`%%{init: {"sequence": {"wrap": true, "width": 60}}}%%
sequenceDiagram
  participant A
  participant B
  loop ${LONG_TEXT}
    A->>B: hi
  end`);

    expect(title).toMatch(/<br\s*\/?>/i);
  });
});
