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
