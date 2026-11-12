import { expect, test } from '@playwright/test';
import { imgSnapshotTest } from '../../../helpers/util';

// #7681: KaTeX in sequence actor names and block titles. Block titles used to be wrapped, which put
// <br/> inside $$...$$ and left raw markup in the label; section titles with math were drawn on top
// of their divider; and math labels ignored the actor/message font.
const diagram = `sequenceDiagram
  participant A as $$\\alpha$$lex
  participant B as Bob
  A->>B: Hello, does $$\\frac{1}{2}+1=2$$?
  loop $$\\frac{1}{2}+1=2$$
    B->>B: Recheck value
  end
  alt $$x > 0$$
    A->>B: Yes
  else $$x \\le 0$$
    A->>B: No
  end
  par $$\\theta$$ branch
    A->>B: one
  and $$\\beta$$ branch
    B->>A: two
  end`;

test.describe('sequence diagram KaTeX labels (#7681)', () => {
  test('renders math in actor and block labels without breaking it', async ({ page }, testInfo) => {
    await imgSnapshotTest(page, testInfo, diagram, { screenshot: false }, false, async (svg) => {
      const layout = await svg.evaluate((element: SVGSVGElement) => {
        const foreignObjects = [...element.querySelectorAll('foreignObject')];
        const foWith = (needle: string) =>
          foreignObjects.find((fo) => (fo.textContent ?? '').includes(needle));
        const fontSize = (node: Element | null | undefined) =>
          node ? getComputedStyle(node).fontSize : undefined;

        // The loop block is the group whose corner label reads "loop"; its title is the
        // foreignObject KaTeX was rendered into.
        const loopGroup = [...element.querySelectorAll('text.labelText')].find(
          (text) => text.textContent === 'loop'
        )?.parentElement;
        const loopTitle = loopGroup?.querySelector('foreignObject');
        const mathActorLabel = foWith('lex')?.querySelector(':scope > div > div');
        const plainActorLabel = [...element.querySelectorAll('text.actor')].find(
          (text) => text.textContent === 'Bob'
        );
        const dividers = [...element.querySelectorAll('line.loopLine')]
          .filter((line) => (line.getAttribute('style') ?? '').includes('dasharray'))
          .map((line) => line.getBoundingClientRect().top)
          .sort((a, b) => a - b);
        const top = (fo: Element | undefined) => fo?.getBoundingClientRect().top;

        return {
          leakedMarkup: foreignObjects
            .map((fo) => fo.textContent ?? '')
            .filter((text) => text.includes('</div>') || text.includes('$$')),
          loopTitleMath: loopTitle?.querySelectorAll('math').length,
          mathActorFontSize: fontSize(mathActorLabel),
          plainActorFontSize: fontSize(plainActorLabel),
          dividers,
          elseTitleTop: top(foWith('≤')),
          andTitleTop: top(foWith('β')),
        };
      });

      // The formula reaches KaTeX in one piece, so nothing is left as raw markup or source.
      expect(layout.leakedMarkup).toEqual([]);
      expect(layout.loopTitleMath).toBe(1);

      // A math actor label uses the same font size as a plain-text actor label.
      expect(layout.mathActorFontSize).toBeDefined();
      expect(layout.mathActorFontSize).toBe(layout.plainActorFontSize);

      // Section titles sit below their dashed divider (else in alt, and in par).
      expect(layout.dividers).toHaveLength(2);
      expect(layout.elseTitleTop).toBeGreaterThanOrEqual(layout.dividers[0]);
      expect(layout.andTitleTop).toBeGreaterThanOrEqual(layout.dividers[1]);
    });
  });
});
