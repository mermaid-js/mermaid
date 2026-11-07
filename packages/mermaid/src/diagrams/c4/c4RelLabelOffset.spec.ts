import { mermaidAPI } from '../../mermaidAPI.js';

// jsdom measures no text; a fixed width keeps layout deterministic.
const STUB_TEXT_WIDTH = 40;
const STUB_TEXT_HEIGHT = 20;

beforeAll(() => {
  Object.assign(SVGElement.prototype, {
    getComputedTextLength: () => STUB_TEXT_WIDTH,
    getBBox: () => ({ x: 0, y: 0, width: STUB_TEXT_WIDTH, height: STUB_TEXT_HEIGHT }),
  });
});

const LABEL_OFFSET_X = 5;
const LABEL_OFFSET_Y = -10;

const source = (offsets: string) => `---
config:
  layout: dagre
  htmlLabels: false
---
C4Context
System(a, "A")
System(b, "B")
Rel(a, b, "Uses")
${offsets}`;

const labelTranslate = async (text: string) => {
  const { svg } = await mermaidAPI.render('c4-rel-offset', text);
  const host = document.createElement('div');
  host.innerHTML = svg;
  const group = host.querySelector('g.edgeLabel');
  const match = /translate\(\s*([\d.-]+)[ ,]+([\d.-]+)/.exec(
    group?.getAttribute('transform') ?? ''
  );
  return { x: Number(match?.[1]), y: Number(match?.[2]) };
};

describe('UpdateRelStyle label offsets in the unified renderer', () => {
  it('moves the edge label group by $offsetX and $offsetY', async () => {
    const plain = await labelTranslate(source(''));
    const nudged = await labelTranslate(
      source(`UpdateRelStyle(a, b, $offsetX="${LABEL_OFFSET_X}", $offsetY="${LABEL_OFFSET_Y}")`)
    );

    expect(nudged.x - plain.x).toBe(LABEL_OFFSET_X);
    expect(nudged.y - plain.y).toBe(LABEL_OFFSET_Y);
  });
});
