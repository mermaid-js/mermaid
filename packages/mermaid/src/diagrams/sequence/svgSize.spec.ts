/**
 * With `useMaxWidth` off, the svg's `height` attribute is the height it is drawn at, so it has to
 * match the viewBox. A shorter attribute makes the browser scale the whole diagram down to fit.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import mermaid from '../../mermaid.js';

beforeAll(() => {
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value(this: SVGElement) {
      return { x: 0, y: 0, width: (this.textContent ?? '').length * 7, height: 19 };
    },
  });
  Object.defineProperty(SVGElement.prototype, 'getComputedTextLength', {
    configurable: true,
    value(this: SVGElement) {
      return (this.textContent ?? '').length * 7;
    },
  });
});

const render = async (
  id: string,
  look: 'classic' | 'neo',
  useMaxWidth: boolean,
  source: string
) => {
  mermaid.initialize({ look, startOnLoad: false, sequence: { useMaxWidth } });
  const { svg } = await mermaid.render(id, source);
  return new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
};

const WITHOUT_TITLE = `sequenceDiagram
  Alice ->> Bob: Hello
`;

const WITH_TITLE = `---
title: Greeting
---
sequenceDiagram
  Alice ->> Bob: Hello
`;

describe('sequence diagram svg size', () => {
  for (const look of ['classic', 'neo'] as const) {
    for (const [name, source] of [
      ['without a title', WITHOUT_TITLE],
      ['with a title', WITH_TITLE],
    ]) {
      it(`gives the svg the viewBox height in the ${look} look, ${name}`, async () => {
        const svg = await render(`size-${look}-${name.length}`, look, false, source);
        const viewBoxHeight = Number(svg.getAttribute('viewBox')!.split(/\s+/)[3]);

        expect(Number(svg.getAttribute('height'))).toBe(viewBoxHeight);
      });
    }
  }

  it('leaves the height to the viewBox when useMaxWidth is on', async () => {
    const svg = await render('size-max-width', 'neo', true, WITH_TITLE);

    expect(svg.hasAttribute('height')).toBe(false);
    expect(svg.getAttribute('width')).toBe('100%');
  });
});
