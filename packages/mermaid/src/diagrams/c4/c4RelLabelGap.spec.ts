/**
 * Relationship labels between two elements that the legacy grid puts next to each other on
 * one row. `getBBox` is stubbed so text is 7px per character and every element self-sizes
 * to the `c4.width` floor, which keeps the geometry exact rather than font-dependent.
 */
import { JSDOM } from 'jsdom';
import { describe, beforeAll, it, expect } from 'vitest';
import mermaid from '../../mermaid.js';
import { mermaidAPI } from '../../mermaidAPI.js';

const CHAR_WIDTH = 7;

interface Box {
  left: number;
  right: number;
  y: number;
}

interface Rendered {
  shapes: Record<string, Box>;
  labels: Record<string, Box>;
}

const render = async (code: string, id: string): Promise<Rendered> => {
  const oldWindow = global.window;
  const oldDocument = global.document;
  const oldMutationObserver = global.MutationObserver;
  const availWidth = Object.getOwnPropertyDescriptor(globalThis.screen, 'availWidth');

  try {
    const dom = new JSDOM(`<html lang="en"><body><div id="container"></div></body></html>`, {
      resources: 'usable',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeParse(_window: any) {
        _window.Element.prototype.getBBox = function (this: Element) {
          const isText = this.tagName === 'text' || this.tagName === 'tspan';
          const width = isText ? (this.textContent ?? '').length * CHAR_WIDTH : 100;
          return { x: 0, y: 0, width, height: 16 };
        };
        _window.Element.prototype.getComputedTextLength = function (this: Element) {
          return (this.textContent ?? '').length * CHAR_WIDTH;
        };
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = dom.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).document = dom.window.document;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).MutationObserver = undefined;
    // The legacy grid wraps rows at the display width; give it a typical desktop display.
    Object.defineProperty(globalThis.screen, 'availWidth', { value: 1920, configurable: true });

    const { svg } = await mermaidAPI.render(id, code);
    const holder = dom.window.document.createElement('div');
    holder.innerHTML = svg;

    const shapes: Record<string, Box> = {};
    for (const shape of holder.querySelectorAll('.c4-shape')) {
      const translate = /translate\(\s*([\d.-]+)[\s,]+([\d.-]+)\s*\)/.exec(
        shape.parentElement?.getAttribute('transform') ?? ''
      );
      const rect = shape.querySelector('rect');
      if (!translate || !rect) {
        throw new Error('C4 element is not inside a translated group');
      }
      const left = Number(translate[1]) + Number(rect.getAttribute('x'));
      shapes[shape.id.replace(`${id}-`, '')] = {
        left,
        right: left + Number(rect.getAttribute('width')),
        y: Number(translate[2]),
      };
    }

    // Relationship labels are the middle-anchored texts drawn next to the relationship lines.
    const labels: Record<string, Box> = {};
    for (const line of holder.querySelectorAll('line, path[marker-end]')) {
      for (const text of [...(line.parentElement?.children ?? [])].filter(
        (el) => el.tagName === 'text'
      )) {
        const content = text.textContent ?? '';
        const width = content.length * CHAR_WIDTH;
        const x = Number(text.getAttribute('x'));
        labels[content] = {
          left: x - width / 2,
          right: x + width / 2,
          y: Number(text.getAttribute('y')),
        };
      }
    }
    return { shapes, labels };
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = oldWindow;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).document = oldDocument;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).MutationObserver = oldMutationObserver;
    if (availWidth) {
      Object.defineProperty(globalThis.screen, 'availWidth', availWidth);
    } else {
      delete (globalThis.screen as unknown as { availWidth?: number }).availWidth;
    }
  }
};

const LONG_LABEL = 'enqueue events.digest after a 60s debounce';

describe('C4 relationship labels between same-row elements', () => {
  beforeAll(async () => {
    await mermaid.registerExternalDiagrams([]);
    mermaid.initialize({ deterministicIds: true, deterministicIDSeed: '', logLevel: 5 });
  });

  it('keeps a long label in the gap between two neighbours (#8419)', async () => {
    const { shapes, labels } = await render(
      `C4Component
Container_Boundary(worker, "Worker") {
  Component(group, "Grouping", "events/group", "Turns reports into facts and attaches them to a story")
  Component(digest, "Digest", "events/digest", "Rewrites the story summary after grouping")
}
Rel(group, digest, "${LONG_LABEL}")`,
      'c4-rel-gap-long'
    );
    const { group, digest } = shapes;
    const label = labels[LONG_LABEL];

    // Still one row.
    expect(digest.y).toBe(group.y);
    expect(label).toBeDefined();
    // The label is painted between the two boxes, not through either of them.
    expect(label.left).toBeGreaterThanOrEqual(group.right);
    expect(label.right).toBeLessThanOrEqual(digest.left);
  });

  it('keeps the technology line in the gap as well', async () => {
    const techn = 'HTTPS, JSON, queued for later delivery';
    const { shapes, labels } = await render(
      `C4Context
System(a, "A")
System(b, "B")
BiRel(a, b, "uses", "${techn}")`,
      'c4-rel-gap-techn'
    );
    const label = labels[`[${techn}]`];

    expect(shapes.b.y).toBe(shapes.a.y);
    expect(label.left).toBeGreaterThanOrEqual(shapes.a.right);
    expect(label.right).toBeLessThanOrEqual(shapes.b.left);
  });

  it('leaves the default gap alone for a label that already fits', async () => {
    const { shapes, labels } = await render(
      `C4Context
System(a, "A")
System(b, "B")
Rel(a, b, "uses")`,
      'c4-rel-gap-short'
    );

    // c4ShapeMargin (50) on each side.
    expect(shapes.b.left - shapes.a.right).toBe(100);
    // Centred in that gap.
    const label = labels.uses;
    expect((label.left + label.right) / 2).toBe((shapes.a.right + shapes.b.left) / 2);
  });

  it('works whichever way the relationship points', async () => {
    const { shapes, labels } = await render(
      `C4Context
System(a, "A")
System(b, "B")
Rel_Back(b, a, "${LONG_LABEL}")`,
      'c4-rel-gap-back'
    );
    const label = labels[LONG_LABEL];

    expect(label.left).toBeGreaterThanOrEqual(shapes.a.right);
    expect(label.right).toBeLessThanOrEqual(shapes.b.left);
  });

  it('does not move a label positioned by hand with UpdateRelStyle', async () => {
    const { shapes } = await render(
      `C4Context
System(a, "A")
System(b, "B")
Rel(a, b, "${LONG_LABEL}")
UpdateRelStyle(a, b, $offsetY="-40")`,
      'c4-rel-gap-offset'
    );

    expect(shapes.b.left - shapes.a.right).toBe(100);
  });

  it('does not widen the gap for elements that are not related', async () => {
    const { shapes } = await render(
      `C4Context
System(a, "A")
System(b, "B")
System(c, "C")
Rel(a, c, "${LONG_LABEL}")`,
      'c4-rel-gap-unrelated'
    );

    expect(shapes.b.left - shapes.a.right).toBe(100);
    expect(shapes.c.left - shapes.b.right).toBe(100);
  });
});
