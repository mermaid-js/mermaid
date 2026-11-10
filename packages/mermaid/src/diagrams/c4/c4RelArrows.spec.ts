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

const markersOf = async (statement: string) => {
  const { svg } = await mermaidAPI.render(
    'c4-rel-arrows',
    `C4Context\nSystem(a, "A")\nSystem(b, "B")\n${statement}`
  );
  const host = document.createElement('div');
  host.innerHTML = svg;
  const path = host.querySelector('path.c4-rel');
  return {
    start: Boolean(path?.getAttribute('marker-start')),
    end: Boolean(path?.getAttribute('marker-end')),
  };
};

describe('C4 relationship arrowheads', () => {
  it.each([
    ['Rel', 'Rel(a, b, "Uses")', { start: false, end: true }],
    ['Rel_Back', 'Rel_Back(a, b, "Uses")', { start: true, end: false }],
    ['BiRel', 'BiRel(a, b, "Uses")', { start: true, end: true }],
  ])(
    'draws %s with the arrowheads the legacy renderer drew',
    async (_kind, statement, expected) => {
      expect(await markersOf(statement)).toEqual(expected);
    }
  );
});
