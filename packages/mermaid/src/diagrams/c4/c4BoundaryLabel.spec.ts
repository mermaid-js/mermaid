import { mermaidAPI } from '../../mermaidAPI.js';

// jsdom measures no text; a fixed size keeps the render deterministic.
const STUB_TEXT_WIDTH = 40;
const STUB_TEXT_HEIGHT = 20;

beforeAll(() => {
  Object.assign(SVGElement.prototype, {
    getComputedTextLength: () => STUB_TEXT_WIDTH,
    getBBox: () => ({ x: 0, y: 0, width: STUB_TEXT_WIDTH, height: STUB_TEXT_HEIGHT }),
  });
});

const FONT_COLOR = 'green';

const titleStyle = async (htmlLabels: boolean, styleStatement: string) => {
  const { svg } = await mermaidAPI.render(
    'c4-boundary-label',
    `---
config:
  layout: dagre
  htmlLabels: ${htmlLabels}
---
C4Context
System_Boundary(sb, "Shop") {
System(a, "A")
}
${styleStatement}`
  );
  const host = document.createElement('div');
  host.innerHTML = svg;
  const label = host.querySelector('.cluster.c4-boundary .cluster-label');
  return [...(label?.querySelectorAll('[style]') ?? [])]
    .map((element) => element.getAttribute('style'))
    .join(';');
};

describe('a boundary title with UpdateElementStyle($fontColor)', () => {
  it.each([
    ['an SVG title', false],
    ['an HTML title', true],
  ])('colours %s', async (_kind, htmlLabels) => {
    const style = await titleStyle(
      htmlLabels,
      `UpdateElementStyle(sb, $fontColor="${FONT_COLOR}")`
    );
    expect(style).toMatch(new RegExp(`(fill|color):\\s*${FONT_COLOR}`));
  });

  it('leaves an SVG title to the stylesheet without one', async () => {
    expect(await titleStyle(false, '')).not.toMatch(new RegExp(FONT_COLOR));
  });
});

describe('a boundary whose title is wider than its contents', () => {
  const CHAR_WIDTH = 7;
  const TITLE = 'A very long boundary title that is wider than its only element';

  beforeAll(() => {
    Object.assign(SVGElement.prototype, {
      getComputedTextLength(this: SVGElement) {
        return (this.textContent ?? '').length * CHAR_WIDTH;
      },
      getBBox(this: SVGElement) {
        const width = (this.textContent ?? '').length * CHAR_WIDTH;
        return { x: 0, y: 0, width, height: STUB_TEXT_HEIGHT };
      },
    });
  });

  it.each(['dagre', 'elk'])('grows to fit the title under %s', async (layout) => {
    const { svg } = await mermaidAPI.render(
      'c4-boundary-wide-title',
      `---
config:
  layout: ${layout}
  htmlLabels: false
---
C4Context
System_Boundary(sb, "${TITLE}") {
System(a, "A")
}`
    );
    const host = document.createElement('div');
    host.innerHTML = svg;
    const width = Number(host.querySelector('.cluster.c4-boundary > rect')?.getAttribute('width'));

    expect(width).toBeGreaterThanOrEqual(TITLE.length * CHAR_WIDTH);
  });
});
